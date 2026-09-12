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
    const dietaryNeeds = (Array.isArray(input.dietaryNeeds) ? input.dietaryNeeds : [input.dietaryNeeds]).filter((need) => need !== 'none');
    if (dietaryNeeds.some((need) => ['vegan', 'veggie', 'pescatarian'].includes(need))
      && ['Meat', 'Deli Meats & Delicatessen'].includes(department)) return false;
    if (dietaryNeeds.includes('veggie') || dietaryNeeds.includes('vegan')) {
      if (department === 'Fish' || /fish|pesce|crustace|mollusc/.test(allergens)) return false;
    }
    if (dietaryNeeds.includes('vegan') || dietaryNeeds.includes('dairy_free')) {
      if (/milk|latte|dairy|lactose/.test(allergens)) return false;
    }
    if ((dietaryNeeds.includes('vegan') || dietaryNeeds.includes('dairy_free')) && department === 'Dairy & Eggs') return false;
    if (dietaryNeeds.includes('vegan') && /egg|uova/.test(allergens)) return false;
    if (dietaryNeeds.includes('gluten_free') && /gluten|glutine/.test(allergens)) return false;
    return true;
  });
}

const aliases: Record<string, string> = {
  spaghetti: 'pasta', penne: 'pasta', macaroni: 'pasta', linguine: 'pasta', tubetti: 'pasta',
  chickpeas: 'chickpea', ceci: 'chickpea', garbanzo: 'chickpea',
  pomodori: 'tomato', pomodoro: 'tomato', tomatoes: 'tomato',
  parmigiano: 'parmesan', parmigiana: 'parmesan', spinaci: 'spinach',
  melanzane: 'eggplant', aubergine: 'eggplant', courgette: 'zucchini',
  fagioli: 'bean', beans: 'bean', piselli: 'pea', peas: 'pea',
  tonno: 'tuna', salmone: 'salmon', uova: 'egg', eggs: 'egg',
  burro: 'butter', latte: 'milk', riso: 'rice', pollo: 'chicken',
  olio: 'oil', oliva: 'olive', extravergine: 'virgin', basilico: 'basil',
  farina: 'flour', zucchero: 'sugar', sale: 'salt', pepe: 'pepper',
  aglio: 'garlic', cipolla: 'onion', cipolle: 'onion', patate: 'potato',
  patata: 'potato', zucchine: 'zucchini', formaggio: 'cheese',
  panna: 'cream', lenticchie: 'lentil', lentils: 'lentil', fagiolini: 'bean',
  carote: 'carrot', carota: 'carrot', limone: 'lemon', limoni: 'lemon',
  mandorle: 'almond', almonds: 'almond', noci: 'walnut', walnuts: 'walnut',
  funghi: 'mushroom', mushrooms: 'mushroom', pane: 'bread',
  pangrattato: 'breadcrumb', prezzemolo: 'parsley', rosmarino: 'rosemary',
  pelati: 'tomato', passata: 'tomato', mais: 'corn', brodo: 'stock',
  pinoli: 'pine', pomodorini: 'tomato', ciliegino: 'cherry', ciliegini: 'cherry',
  lenticchia: 'lentil', zucchina: 'zucchini', melanzana: 'eggplant',
  courgettes: 'zucchini', aubergines: 'eggplant', potatoes: 'potato',
  peppercorns: 'pepper', scallions: 'onion', onions: 'onion',
  lemons: 'lemon',
  uovo: 'egg', peperoni: 'pepper', peperone: 'pepper', peperoncino: 'chili', chilli: 'chili', chili: 'chili', rossi: 'red', rosso: 'red',
  orzo: 'barley', farro: 'spelt', sedano: 'celery', celery: 'celery', gambo: 'celery', salvia: 'sage',
  timo: 'thyme', alloro: 'bay', menta: 'mint', origano: 'oregano',
  sweetcorn: 'corn', senape: 'mustard',
  capers: 'caper', capperi: 'caper', zucca: 'pumpkin', mozzarelle: 'mozzarella',
  basil: 'basil', dill: 'dill', dills: 'dill', tarragon: 'tarragon', radishes: 'radish',
  radish: 'radish', olives: 'olive', olive: 'olive', kalamata: 'olive',
  squash: 'pumpkin', butternut: 'pumpkin', sunflower: 'oil', vegetable: 'oil', bicarbonate: 'soda', bicarbonato: 'soda', soda: 'soda',
  cheddar: 'cheddar', breadcrumbs: 'breadcrumb', breadcrumb: 'breadcrumb',
  parmesan: 'parmesan', parmigiano: 'parmesan', grana: 'parmesan',
};
const stop = new Set(['g', 'kg', 'ml', 'l', 'cup', 'cups', 'tbsp', 'tsp', 'of', 'and', 'or', 'a', 'the', 'to', 'for', 'with', 'di', 'e', 'con', 'fresh', 'organic', 'optional', 'chopped', 'grated', 'large', 'small', 'pack', 'sliced', 'diced', 'peeled', 'ripe', 'medium', 'finely', 'roughly', 'cubed', 'leaves', 'stem', 'stalk', 'gambo', 'divided', 'shaved', 'shave', 'serve', 'serving', 'garnish', 'garnished', 'alternative', 'vegetarian', 'vegan', 'free', 'style', 'blend', 'pinch', 'pizzico', 'to taste', 'a piacere']);
// A processed food containing an ingredient must not crowd out the ingredient itself.
const forms = new Set(['ketchup', 'juice', 'sauce', 'puree', 'pesto', 'soup', 'burger', 'gnocchi', 'smoked', 'flavoured', 'flavored', 'stuffed', 'spread', 'jam', 'powder', 'dried', 'concentrate', 'pickled']);
function tokens(value: string): string[] {
  return value.toLowerCase().replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter((word) => word.length > 1 && !stop.has(word)).map((word) => {
    const normalized = aliases[word] || word;
    if (aliases[word]) return normalized;
    if (normalized.endsWith('ies') && normalized.length > 4) return `${normalized.slice(0, -3)}y`;
    if (normalized.endsWith('s') && !normalized.endsWith('ss') && normalized.length > 3) return normalized.slice(0, -1);
    return normalized;
  });
}

export function productCandidates(line: string, products: Product[], limit = 12): Product[] {
  const terms = new Set(tokens(line));
  return products.map((product) => {
    const words = [...new Set(tokens(product.name))];
    const matches = words.filter((word) => terms.has(word)).length;
    const extra = words.filter((word) => !terms.has(word)).length;
    const unexpectedForms = words.filter((word) => forms.has(word) && !terms.has(word)).length;
    return { product, score: matches ? matches * 10 - extra - unexpectedForms * 8 : -1000 };
  }).filter((row) => row.score > 0).sort((a, b) => b.score - a.score || a.product.price.amount - b.product.price.amount)
    .filter((row, index, rows) => rows.findIndex((other) => other.product.name.toLowerCase().trim() === row.product.name.toLowerCase().trim()) === index)
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
