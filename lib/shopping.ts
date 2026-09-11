import type { MealPlan, ShoppingItem } from './types';
import { getAllProducts } from './filterProducts';

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
  const productsById = new Map(getAllProducts().map((product) => [product.id, product]));
  for (const ingredient of plan.days.flatMap((day) => day.meals).flatMap((meal) => meal.ingredients)) {
    const product = productsById.get(ingredient.product?.id);
    if (!product || !Number.isFinite(product.price?.amount)) throw new Error('Shopping list ingredients must belong to the product catalog.');
    const current = map.get(ingredient.id);
    if (current) current.quantities.push(ingredient.quantityLabel);
    else map.set(ingredient.id, { id: ingredient.id, name: product.name, product, quantities: [ingredient.quantityLabel] });
  }
  const items = [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  const products = new Map(items.map((item) => [item.product.id, item.product]));
  return {
    items,
    // Reference pack subtotal, not a guarantee that one pack covers the week.
    total: Number([...products.values()].reduce((sum, product) => sum + product.price.amount, 0).toFixed(2)),
  };
}
