import type { Ingredient } from './types';

function amountAndUnit(label: string): { amount: number; unit: string } {
  const match = label.toLowerCase().replace(',', '.').match(/([0-9]+(?:\.[0-9]+)?)\s*(kg|g|l|ml|cl|pieces?|pcs?|pz|slices?|fillets?)?/);
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
  if (!ingredient.product.netContent) return ingredient.product.price.amount;
  const used = amountAndUnit(ingredient.quantityLabel);
  const pack = toBaseUnit(ingredient.product.netContent.value, ingredient.product.netContent.unit.toLowerCase());
  const requested = toBaseUnit(used.amount, used.unit);
  let fraction = 1;
  if (requested.unit === pack.unit && pack.amount > 0) fraction = requested.amount / pack.amount;
  else if (requested.unit === 'unknown' && pack.unit === 'count' && pack.amount > 0) fraction = requested.amount / pack.amount;
  return Math.max(0, Math.min(ingredient.product.price.amount, ingredient.product.price.amount * fraction));
}

export function mealCost(ingredients: Ingredient[]): number {
  return Number(ingredients.reduce((total, ingredient) => total + ingredientCost(ingredient), 0).toFixed(2));
}
