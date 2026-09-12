import type { Ingredient } from './types';

function amountAndUnit(label: string): { amount: number; unit: string } {
  const match = label.toLowerCase().replace(',', '.').match(/([0-9]+(?:\.[0-9]+)?)\s*(kg|g|ml|cl|l|pieces?|pcs?|pz|slices?|fillets?)?/);
  return { amount: match ? Number(match[1]) : 1, unit: match?.[2] || '' };
}

function toBaseUnit(amount: number, unit: string): { amount: number; unit: 'mass' | 'volume' | 'count' | 'unknown' } {
  if (unit === 'kg') return { amount: amount * 1000, unit: 'mass' };
  if (unit === 'g') return { amount, unit: 'mass' };
  if (unit === 'l') return { amount: amount * 1000, unit: 'volume' };
  if (unit === 'cl') return { amount: amount * 10, unit: 'volume' };
  if (unit === 'ml') return { amount, unit: 'volume' };
  if (unit) return { amount, unit: 'count' };
  return { amount, unit: 'unknown' };
}

export function ingredientCost(ingredient: Ingredient): number {
  if (!ingredient.product || !Number.isFinite(ingredient.product.price?.amount)) throw new Error('Ingredient must have a catalog price.');
  return Number((ingredientPackFraction(ingredient) * ingredient.product.price.amount).toFixed(4));
}

export function ingredientPackFraction(ingredient: Ingredient): number {
  const used = ingredient.amount && ingredient.unit ? { amount: ingredient.amount, unit: ingredient.unit } : amountAndUnit(ingredient.quantityLabel);
  const content = ingredient.product.netContent;
  const parsedPack = content ? { amount: content.value, unit: content.unit.toLowerCase() } : amountAndUnit(ingredient.product.quantity || '');
  const pack = toBaseUnit(parsedPack.amount, parsedPack.unit);
  const requested = toBaseUnit(used.amount, used.unit);
  // Egg packs often declare their count in the name while netContent is grams.
  // Read that explicit count instead of charging one entire box per egg.
  if (requested.unit === 'count' && /\beggs?\b|\buova\b/i.test(ingredient.product.name)) {
    const label = `${ingredient.product.quantity || ''} ${ingredient.product.name}`;
    const count = label.match(/\b(\d+)\s*(?:(?:fresh|organic|medium|large|small|barn)\s+)*(?:eggs?\b|uova\b|pcs\b|pieces?\b|labels\.piece)/i);
    if (count && Number(count[1]) > 0) return requested.amount / Number(count[1]);
  }
  if (requested.unit !== 'unknown' && requested.unit === pack.unit && pack.amount > 0) return requested.amount / pack.amount;
  // Use the declared unit price when the catalog omits pack weight/volume.
  const unitPrice = ingredient.product.unitPrice;
  if (unitPrice?.amount > 0 && ingredient.product.price.amount > 0) {
    const priced = toBaseUnit(1, unitPrice.unit.toLowerCase());
    if (priced.unit === requested.unit && requested.unit !== 'unknown') return requested.amount / priced.amount * unitPrice.amount / ingredient.product.price.amount;
  }
  // Unknown conversion: reserve whole packs rather than understate the cost.
  return requested.unit === 'count' ? Math.max(1, requested.amount) : 1;
}

export function mealCost(ingredients: Ingredient[]): number {
  return Number(ingredients.reduce((total, ingredient) => total + ingredientCost(ingredient), 0).toFixed(2));
}
