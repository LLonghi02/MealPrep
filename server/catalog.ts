import { getAllProducts } from '../lib/filterProducts';
import { recipes as legacyRecipes } from '../data/recipes';
import type { GenerateMealPlanInput } from '../lib/resolveMealPlan';
import type { Product } from '../lib/types';

export function eligibleProducts(input: GenerateMealPlanInput): Product[] {
  const excluded = new Set(input.excludedProductIds || []);
  for (const recipe of legacyRecipes) for (const ingredient of recipe.ingredients) {
    if (excluded.has(ingredient.id)) ingredient.productIds.forEach((id) => excluded.add(id));
  }
  return getAllProducts().filter((product) => {
    if (excluded.has(product.id) || !Number.isFinite(product.price?.amount) || product.price.amount <= 0) return false;
    const allergens = product.allergens.map((a) => `${a.id} ${a.name}`.toLowerCase()).join(' ');
    const department = product.department.name;
    if (['vegan', 'veggie', 'pescatarian'].includes(input.dietaryNeeds)
      && ['Meat', 'Deli Meats & Delicatessen'].includes(department)) return false;
    if (['vegan', 'veggie'].includes(input.dietaryNeeds) && (department === 'Fish' || /fish|pesce|crustace|mollusc/.test(allergens))) return false;
    if (['vegan', 'dairy_free'].includes(input.dietaryNeeds) && /milk|latte|dairy|lactose/.test(allergens)) return false;
    if (input.dietaryNeeds === 'vegan' && (department === 'Dairy & Eggs' || /egg|uova/.test(allergens))) return false;
    if (input.dietaryNeeds === 'gluten_free' && /gluten|glutine/.test(allergens)) return false;
    return true;
  });
}

const aliases: Record<string, string> = {
  spaghetti: 'pasta', penne: 'pasta', macaroni: 'pasta', linguine: 'pasta',
  chickpeas: 'chickpea', ceci: 'chickpea', garbanzo: 'chickpea',
  pomodori: 'tomato', pomodoro: 'tomato', tomatoes: 'tomato',
  parmigiano: 'parmesan', parmigiana: 'parmesan', spinaci: 'spinach',
  melanzane: 'eggplant', aubergine: 'eggplant', courgette: 'zucchini',
  fagioli: 'bean', beans: 'bean', piselli: 'pea', peas: 'pea',
  tonno: 'tuna', salmone: 'salmon', uova: 'egg', eggs: 'egg',
  burro: 'butter', latte: 'milk', riso: 'rice', pollo: 'chicken',
};
const stop = new Set(['g', 'kg', 'ml', 'l', 'cup', 'cups', 'tbsp', 'tsp', 'of', 'and', 'or', 'a', 'the', 'to', 'for', 'with', 'di', 'e', 'con', 'fresh', 'organic', 'optional', 'chopped', 'grated', 'large', 'small', 'pack']);
function tokens(value: string): string[] {
  return value.toLowerCase().replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter((word) => word.length > 1 && !stop.has(word)).map((word) => aliases[word] || word);
}

export function productCandidates(line: string, products: Product[], limit = 12): Product[] {
  const terms = new Set(tokens(line));
  return products.map((product) => {
    const words = tokens(product.name);
    const matches = words.filter((word) => terms.has(word)).length;
    const extra = words.filter((word) => !terms.has(word)).length;
    return { product, score: matches ? matches * 10 - extra : -1000 };
  }).filter((row) => row.score > 0).sort((a, b) => b.score - a.score || a.product.price.amount - b.product.price.amount)
    .slice(0, limit).map((row) => row.product);
}

// Names are spread across the full catalog, never the first 300 sorted rows.
export function discoveryInventory(products: Product[]): string {
  const groups = new Map<string, Set<string>>();
  for (const product of products) {
    const group = groups.get(product.department.name) || new Set<string>();
    group.add(product.name); groups.set(product.department.name, group);
  }
  return [...groups].map(([department, names]) => `${department}: ${[...names].join('; ')}`).join('\n');
}
