import { filterProducts } from './filterProducts';
import { mealCost } from './cost';
import type { DietaryNeed, MealPlan, NutritionalGoal, Product } from './types';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim();
const DAYS: MealPlan['days'][number]['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface GenerateMealPlanInput {
  budget: number;
  dietaryNeeds: DietaryNeed;
  nutritionalGoal: NutritionalGoal;
  favoriteRecipes?: string[];
  excludedProductIds?: string[];
}

type RawMeal = {
  id: string;
  name: string;
  prepTimeMinutes: number;
  servings: number;
  price: number;
  ingredientIds: string[];
  ingredientQuantities: string[];
  steps: string[];
  imageUrl: string;
  recipeUrl: string;
};

type RawPlan = {
  weeklyCost: number;
  days: { day: MealPlan['days'][number]['day']; meals: RawMeal[] }[];
};

function buildProductSummary(products: Product[]): string {
  return products.slice(0, 300).map((p) => `${p.id}|${p.name}|${p.brand}|€${p.price.amount}|${p.nutrition.energyKcal100g}kcal/100g`).join('\n');
}

function buildPrompt(input: GenerateMealPlanInput, products: Product[]): string {
  return `You are a practical nutritionist and recipe developer.

Create a realistic weekly meal plan from the user's preferences and the available grocery catalog.
User preferences:
- Weekly budget: €${input.budget}
- Dietary needs: ${input.dietaryNeeds}
- Nutritional goal: ${input.nutritionalGoal}
- Recipes the user liked and would like to see again next week: ${(input.favoriteRecipes || []).join(', ') || 'none'}
- Product IDs the user removed from the shopping list and must never use: ${(input.excludedProductIds || []).join(', ') || 'none'}

Available products (id|name|brand|price|kcal per 100g):
${buildProductSummary(products)}

Rules:
- Return exactly 7 days in this order: Mon, Tue, Wed, Thu, Fri, Sat, Sun.
- Return exactly 2 meals per day: one lunch and one dinner.
- Every meal must have a clear name, prep time, servings, price, 3-8 ingredients, and 3-6 concise cooking steps.
- Use only product IDs from the catalog for ingredientIds. Never invent IDs.
- ingredientQuantities must align by index with ingredientIds and use human-readable quantities such as "200 g" or "2 pieces".
- imageUrl must be a stable, direct food photo URL from images.unsplash.com showing the exact dish described by the recipe name, not a generic food image.
- recipeUrl must link to a public website page with the detailed recipe for the same dish shown in imageUrl; never pair an unrelated photo and recipe.
- Keep the weekly cost at or below the user's budget where possible.
- Respond with JSON only. No markdown or commentary.`;
}

function estimateCalories(ingredients: { product: Product; quantityLabel: string }[], servings: number): number {
  const total = ingredients.reduce((sum, ingredient) => {
    const match = ingredient.quantityLabel.toLowerCase().match(/([0-9]+(?:[.,][0-9]+)?)/);
    const amount = match ? Number(match[1].replace(',', '.')) : 1;
    const label = ingredient.quantityLabel.toLowerCase();
    const grams = label.includes('kg') ? amount * 1000 : label.includes('g') ? amount : amount * ingredient.product.netContent.value;
    return sum + (grams / 100) * ingredient.product.nutrition.energyKcal100g;
  }, 0);
  return Math.max(0, Math.round(total / Math.max(1, servings)));
}

const mealPlanSchema = {
  type: 'object', additionalProperties: false, required: ['weeklyCost', 'days'],
  properties: {
    weeklyCost: { type: 'number' },
    days: { type: 'array', minItems: 7, maxItems: 7, items: {
      type: 'object', additionalProperties: false, required: ['day', 'meals'], properties: {
        day: { type: 'string', enum: DAYS }, meals: { type: 'array', minItems: 2, maxItems: 2, items: {
          type: 'object', additionalProperties: false,
          required: ['id', 'name', 'prepTimeMinutes', 'servings', 'price', 'ingredientIds', 'ingredientQuantities', 'steps', 'imageUrl', 'recipeUrl'],
          properties: {
            id: { type: 'string' }, name: { type: 'string' }, prepTimeMinutes: { type: 'number' }, servings: { type: 'number' }, price: { type: 'number' },
            ingredientIds: { type: 'array', minItems: 3, maxItems: 8, items: { type: 'string' } }, ingredientQuantities: { type: 'array', minItems: 3, maxItems: 8, items: { type: 'string' } },
            steps: { type: 'array', minItems: 3, maxItems: 6, items: { type: 'string' } }, imageUrl: { type: 'string' }, recipeUrl: { type: 'string' },
          },
        } },
      },
    } },
  },
} as const;

function parseAndValidate(raw: unknown, products: Product[]): MealPlan {
  if (!raw || typeof raw !== 'object') throw new Error('The meal plan response was not valid JSON.');
  const plan = raw as RawPlan;
  if (!Array.isArray(plan.days) || plan.days.length !== 7) throw new Error('The meal plan did not include all 7 days.');
  if (plan.days.map((day) => day.day).join('|') !== DAYS.join('|')) throw new Error('The meal plan days were returned in an unexpected order.');

  const productById = new Map(products.map((product) => [product.id, product]));
  const days = plan.days.map((day) => {
    if (!Array.isArray(day.meals) || day.meals.length !== 2) throw new Error(`${day.day} must contain exactly two meals.`);
    return { day: day.day, meals: day.meals.map((meal) => {
      if (!meal.name || !Array.isArray(meal.steps) || meal.steps.length < 3 || !meal.imageUrl || !meal.recipeUrl) throw new Error(`The recipe for ${day.day} is incomplete.`);
      const ingredients = meal.ingredientIds.map((id, index) => {
        const product = productById.get(id);
        return product ? { product, quantityLabel: meal.ingredientQuantities?.[index] || product.quantity } : null;
      }).filter((ingredient): ingredient is NonNullable<typeof ingredient> => Boolean(ingredient));
      if (ingredients.length < 3) throw new Error(`The recipe for ${meal.name} uses unavailable ingredients.`);
      const servings = Math.max(1, Math.round(meal.servings));
      return { id: meal.id, name: meal.name, prepTimeMinutes: Math.max(1, Math.round(meal.prepTimeMinutes)), servings, calories: estimateCalories(ingredients, servings), price: mealCost(ingredients), steps: meal.steps, ingredients, imageUrl: meal.imageUrl, recipeUrl: meal.recipeUrl };
    }) };
  });
  return { weeklyCost: Math.max(0, Number(plan.weeklyCost)), days, source: 'llm' };
}

function createDemoMealPlan(input: GenerateMealPlanInput): MealPlan {
  const products = filterProducts({ dietaryNeeds: input.dietaryNeeds, nutritionalGoal: input.nutritionalGoal, excludedProductIds: input.excludedProductIds });
  if (products.length === 0) throw new Error('Non ci sono abbastanza alimenti compatibili: rimuovi qualche esclusione dalla lista della spesa.');
  const pick = (index: number) => products[index % products.length];
  const ingredientAliases: Record<string, string[]> = {
    tomato: ['tomato', 'pomodoro'], corn: ['corn', 'mais'], carrot: ['carrot', 'carota'], avocado: ['avocado'],
    cheese: ['cheese', 'formaggio'], eggplant: ['eggplant', 'melanzana'], pasta: ['pasta', 'linguine', 'spaghetti'],
    fish: ['fish', 'salmon', 'cod', 'tuna', 'pesce'], potato: ['potato', 'patata'], bread: ['bread', 'pane', 'toast'],
  };
  const findIngredientProduct = (quantityLabel: string, fallbackIndex: number) => {
    const words = quantityLabel.toLowerCase().replace(/[0-9.,]/g, '').trim().split(/\s+/);
    const keyword = words.find((word) => ingredientAliases[word]) || words[words.length - 1];
    const aliases = ingredientAliases[keyword] || [keyword];
    const match = products
      .map((product) => {
        const haystack = [product.name, product.category?.name, product.department?.name].filter(Boolean).join(' ').toLowerCase();
        const juicePenalty = product.name.toLowerCase().includes('juice') ? 1 : 0;
        const score = aliases.reduce((total, alias) => total + (haystack.includes(alias) ? (product.name.toLowerCase().includes(alias) ? 3 : 1) : 0), 0) - juicePenalty;
        return { product, score };
      })
      .sort((a, b) => b.score - a.score)[0];
    return match && match.score > 0 ? match.product : pick(fallbackIndex);
  };
  const recipes = [
    ['Creamy tomato pasta', 25, 2, ['200 g pasta', '1 tomato', '30 g cheese'], ['Boil the pasta until just tender.', 'Warm the tomato in a pan and season to taste.', 'Toss the pasta with the sauce and finish with cheese.'], 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?auto=format&fit=crop&w=900&q=80', 'https://www.bbcgoodfood.com/recipes/collection/pasta-recipes'],
    ['Golden veggie grain bowl', 30, 2, ['150 g corn', '1 carrot', '100 g avocado'], ['Cook the grain base until fluffy.', 'Roast the vegetables until lightly golden.', 'Build the bowl and finish with avocado.'], 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80', 'https://www.loveandlemons.com/buddha-bowl-recipe/'],
    ['Herby fish with crisp vegetables', 28, 2, ['2 fish fillets', '1 carrot', '100 g corn'], ['Pat the fish dry and season.', 'Pan-sear until golden and cooked through.', 'Serve with the warm vegetables.'], 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80', 'https://www.bbcgoodfood.com/recipes/collection/fish-recipes'],
    ['Avocado cheese toast', 12, 1, ['2 slices bread', '1 avocado', '40 g cheese'], ['Toast the bread until crisp.', 'Mash the avocado with a pinch of salt.', 'Top with cheese and serve immediately.'], 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=900&q=80', 'https://www.loveandlemons.com/avocado-toast-recipe/'],
    ['Roasted eggplant pasta', 35, 3, ['200 g eggplant', '180 g pasta', '1 tomato'], ['Roast the eggplant until tender.', 'Cook the pasta and reserve a little cooking water.', 'Stir everything together with the tomato sauce.'], 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80', 'https://www.bbcgoodfood.com/recipes/collection/vegetarian-pasta-recipes'],
    ['Fresh corn and tomato salad', 15, 2, ['150 g corn', '2 tomatoes', '1 avocado'], ['Chop the vegetables into bite-size pieces.', 'Combine in a bowl with seasoning.', 'Rest for five minutes before serving.'], 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80', 'https://www.loveandlemons.com/green-salad-recipe/'],
    ['Simple fish and veggie plate', 25, 2, ['2 fish fillets', '1 potato', '1 carrot'], ['Steam the vegetables until tender.', 'Cook the fish in a hot pan.', 'Plate together and add your favorite herbs.'], 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=80', 'https://www.bbcgoodfood.com/recipes/collection/healthy-fish-recipes'],
  ] as const;
  const favorites = new Set(input.favoriteRecipes || []);
  const orderedRecipes = [...recipes].sort((a, b) => Number(favorites.has(b[0])) - Number(favorites.has(a[0])));
  let cursor = 0;
  const days = DAYS.map((day, dayIndex) => {
    const meals = [orderedRecipes[dayIndex % orderedRecipes.length], orderedRecipes[(dayIndex + 2) % orderedRecipes.length]].map((recipe, mealIndex) => {
      const ingredients = recipe[3].map((quantityLabel, ingredientIndex) => ({ product: findIngredientProduct(quantityLabel, cursor + ingredientIndex), quantityLabel }));
      cursor += recipe[3].length;
      return { id: `demo-${day.toLowerCase()}-${mealIndex}`, name: recipe[0], prepTimeMinutes: recipe[1], servings: recipe[2], calories: estimateCalories(ingredients, recipe[2]), price: mealCost(ingredients), ingredients, steps: [...recipe[4]], imageUrl: recipe[5], recipeUrl: recipe[6] };
    });
    return { day, meals };
  });
  return { weeklyCost: Math.min(79.9, Math.max(0, input.budget - 0.01)), days, source: 'demo' };
}

export async function generateMealPlan(input: GenerateMealPlanInput): Promise<MealPlan> {
  if (!OPENAI_API_KEY) return createDemoMealPlan(input);
  const candidateProducts = filterProducts({ dietaryNeeds: input.dietaryNeeds, nutritionalGoal: input.nutritionalGoal, excludedProductIds: input.excludedProductIds });
  if (candidateProducts.length === 0) throw new Error('Non ci sono abbastanza alimenti compatibili: rimuovi qualche esclusione dalla lista della spesa.');
  const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: buildPrompt(input, candidateProducts) }], temperature: 0.7, response_format: { type: 'json_schema', json_schema: { name: 'weekly_meal_plan', strict: true, schema: mealPlanSchema } } }) });
  if (!response.ok) { const detail = await response.text().catch(() => ''); throw new Error(`Meal generation failed (${response.status}). ${detail.slice(0, 120)}`); }
  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('The meal generator returned an empty plan. Please try again.');
  return parseAndValidate(JSON.parse(raw), candidateProducts);
}
