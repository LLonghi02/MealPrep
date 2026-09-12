import type { MealPlan, ShoppingItem } from './types';
import { getAllProducts } from './filterProducts';
import { ingredientPackFraction } from './cost';

export function aggregateQuantities(quantities: string[]): string {
  const groups = new Map<string, { amount: number; unit: string }>();
  const unmatched = new Map<string, number>();
  for (const quantity of quantities) {
    const match = quantity.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/);
    if (!match) { unmatched.set(quantity, (unmatched.get(quantity) || 0) + 1); continue; }
    let amount = Number(match[1].replace(',', '.'));
    let unit = match[2].trim().toLowerCase();
    if (unit === 'kg') { amount *= 1000; unit = 'g'; }
    if (unit === 'l') { amount *= 1000; unit = 'ml'; }
    const key = unit.replace(/s$/, '');
    const current = groups.get(key);
    if (current) current.amount += amount;
    else groups.set(key, { amount, unit });
  }
  return [...groups.values()].map(({ amount, unit }) => {
    const singular = unit.replace(/s$/, '');
    const countUnit = /^(piece|clove|slice|fillet|wedge|handful|small pack|thumb-sized piece)$/.test(singular);
    const label = countUnit ? `${singular}${amount === 1 ? '' : 's'}` : unit;
    return `${Number(amount.toFixed(2))}${label ? ` ${label}` : ''}`;
  })
    .concat([...unmatched].map(([label, count]) => count > 1 ? `${label} (${count} recipes)` : label)).join(' + ');
}

export function buildShoppingList(plan: MealPlan): { items: ShoppingItem[]; total: number } {
  const map = new Map<string, ShoppingItem>();
  const unspecifiedProducts = new Set<string>();
  const productsById = new Map([
    ...getAllProducts(),
    ...plan.days.flatMap((day) => day.meals).flatMap((meal) => meal.ingredients.map((ingredient) => ingredient.product)),
  ].map((product) => [product.id, product]));
  for (const ingredient of plan.days.flatMap((day) => day.meals).flatMap((meal) => meal.ingredients)) {
    const product = productsById.get(ingredient.product?.id);
    if (!product || !Number.isFinite(product.price?.amount)) throw new Error('Shopping list ingredients must belong to the product catalog.');
    const current = map.get(product.id);
    const fraction = ingredient.quantityUnspecified ? 0 : ingredientPackFraction({ ...ingredient, product });
    if (ingredient.quantityUnspecified) unspecifiedProducts.add(product.id);
    if (current) { current.quantities.push(ingredient.quantityLabel); current.packs! += fraction; }
    else map.set(product.id, { id: product.id, name: product.name, product, quantities: [ingredient.quantityLabel], packs: fraction });
  }
  const items = [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  for (const item of items) {
    item.packs = Math.max(1, Math.ceil(item.packs! - 0.000001) + (unspecifiedProducts.has(item.id) ? 1 : 0));
    item.totalPrice = Number((item.packs * item.product.price.amount).toFixed(2));
  }
  return {
    items,
    total: Number(items.reduce((sum, item) => sum + item.totalPrice!, 0).toFixed(2)),
  };
}
