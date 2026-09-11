import { recipes, type Recipe } from '../data/recipes';
import { getAllProducts } from './filterProducts';
import { mealCost } from './cost';
import { buildShoppingList } from './shopping';
import type { DietaryNeed, Meal, MealPlan, NutritionalGoal } from './types';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim();
const DAYS: MealPlan['days'][number]['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface GenerateMealPlanInput {
  budget: number;
  dietaryNeeds: DietaryNeed;
  nutritionalGoal: NutritionalGoal;
  favoriteRecipes?: string[];
  excludedProductIds?: string[];
}

export function availableRecipes(input: GenerateMealPlanInput): Recipe[] {
  const excluded = new Set(input.excludedProductIds || []);
  return recipes.filter((recipe) => recipe.dietaryNeeds.includes(input.dietaryNeeds)
    && !recipe.ingredients.some((ingredient) => excluded.has(ingredient.id)
      || ingredient.productIds.some((id) => excluded.has(id))));
}

function makeMeal(recipe: Recipe, id: string): Meal {
  const products = new Map(getAllProducts().map((product) => [product.id, product]));
  const ingredients = recipe.ingredients.map((ingredient) => ({
    id: ingredient.id, name: ingredient.name, quantityLabel: ingredient.quantityLabel,
    product: ingredient.productIds.map((productId) => products.get(productId)).find(Boolean),
  }));
  return {
    id, recipeId: recipe.id, name: recipe.name, sourceName: recipe.sourceName,
    prepTimeMinutes: recipe.prepTimeMinutes, servings: recipe.servings,
    calories: recipe.calories, ingredients, steps: [...recipe.steps],
    imageUrl: recipe.imageUrl, recipeUrl: recipe.recipeUrl,
    price: mealCost(ingredients), priceIsPartial: ingredients.some((ingredient) => !ingredient.product?.netContent),
  };
}

// AI schedules verified IDs. All recipe details come from the same source
// record, so invented URLs, photos and ingredients cannot enter the plan.
export function parseAndValidate(raw: unknown, candidates: Recipe[], source: MealPlan['source'] = 'llm'): MealPlan {
  if (!raw || typeof raw !== 'object' || !('days' in raw) || !Array.isArray(raw.days) || raw.days.length !== DAYS.length) {
    throw new Error('The meal plan did not include all 7 days.');
  }
  const byId = new Map(candidates.map((recipe) => [recipe.id, recipe]));
  const days = raw.days.map((day: unknown, index: number) => {
    if (!day || typeof day !== 'object' || !('day' in day) || day.day !== DAYS[index]
      || !('recipeIds' in day) || !Array.isArray(day.recipeIds) || day.recipeIds.length !== 2) {
      throw new Error('Each day must contain exactly two recipes in the expected order.');
    }
    return { day: DAYS[index], meals: day.recipeIds.map((recipeId: unknown, mealIndex: number) => {
      const recipe = typeof recipeId === 'string' ? byId.get(recipeId) : undefined;
      if (!recipe) throw new Error('The plan contains an unavailable or unverified recipe.');
      return makeMeal(recipe, `${source}-${DAYS[index]}-${mealIndex}-${recipe.id}`);
    }) };
  });
  const plan: MealPlan = { days, weeklyCost: 0, source };
  plan.weeklyCost = buildShoppingList(plan).total;
  return plan;
}

export async function generateMealPlan(input: GenerateMealPlanInput): Promise<MealPlan> {
  const candidates = availableRecipes(input);
  if (!candidates.length) throw new Error('Non ci sono ricette verificate compatibili. Modifica le preferenze o le esclusioni.');
  if (!OPENAI_API_KEY) {
    const score = (recipe: Recipe) => Number(recipe.preferredGoals.includes(input.nutritionalGoal)) * 2
      + Number(input.favoriteRecipes?.includes(recipe.name));
    const ordered = [...candidates].sort((a, b) => score(b) - score(a));
    return parseAndValidate({ days: DAYS.map((day, index) => ({
      day, recipeIds: [ordered[index % ordered.length].id, ordered[(index + 1) % ordered.length].id],
    })) }, candidates, 'demo');
  }

  const schema = {
    type: 'object', additionalProperties: false, required: ['days'],
    properties: { days: { type: 'array', minItems: 7, maxItems: 7, items: {
      type: 'object', additionalProperties: false, required: ['day', 'recipeIds'],
      properties: {
        day: { type: 'string', enum: DAYS },
        recipeIds: { type: 'array', minItems: 2, maxItems: 2, items: { type: 'string', enum: candidates.map((recipe) => recipe.id) } },
      },
    } } },
  };
  const prompt = `Schedule lunch and dinner for Mon, Tue, Wed, Thu, Fri, Sat, Sun, in that order.
Select only the verified recipe IDs below. Do not invent recipes or change their contents.
Weekly budget: EUR ${input.budget}. Nutritional preference: ${input.nutritionalGoal}.
Favor these previously liked recipes: ${JSON.stringify(input.favoriteRecipes || [])}.
Prefer variety and recipes matching the nutritional preference. Cost estimates may be partial;
never claim that missing prices are zero or that the budget is guaranteed.
Recipes: ${JSON.stringify(candidates.map((recipe) => ({ id: recipe.id, name: recipe.name, preferredGoals: recipe.preferredGoals, servings: recipe.servings, knownCost: makeMeal(recipe, recipe.id).price, partialCost: makeMeal(recipe, recipe.id).priceIsPartial })))}.
Return JSON with days, each containing day and recipeIds (exactly two IDs).`;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: prompt }], temperature: 0.7,
      response_format: { type: 'json_schema', json_schema: { name: 'weekly_meal_plan', strict: true, schema } } }),
  });
  if (!response.ok) throw new Error(`Meal generation failed (${response.status}). Please try again.`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('The meal generator returned an empty plan. Please try again.');
  return parseAndValidate(JSON.parse(content), candidates);
}
