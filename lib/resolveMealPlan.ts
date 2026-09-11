import { recipes, type Recipe } from '../data/recipes';
import { getAllProducts } from './filterProducts';
import { mealCost } from './cost';
import { buildShoppingList } from './shopping';
import type { DietaryNeed, Meal, MealPlan, NutritionalGoal } from './types';

const DAYS: MealPlan['days'][number]['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface GenerateMealPlanInput {
  budget: number;
  dietaryNeeds: DietaryNeed[] | DietaryNeed;
  nutritionalGoals?: NutritionalGoal[];
  nutritionalGoal?: NutritionalGoal;
  favoriteRecipes?: string[];
  excludedProductIds?: string[];
  recipePreferences?: string;
}

export function availableRecipes(input: GenerateMealPlanInput): Recipe[] {
  const excluded = new Set(input.excludedProductIds || []);
  const products = new Map(getAllProducts().map((product) => [product.id, product]));
  const dietaryNeeds = (Array.isArray(input.dietaryNeeds) ? input.dietaryNeeds : [input.dietaryNeeds]).filter((need) => need !== 'none');
  const nutritionalGoals = (input.nutritionalGoals || (input.nutritionalGoal ? [input.nutritionalGoal] : [])).filter((goal) => goal !== 'none');
  return recipes.filter((recipe) => dietaryNeeds.every((need) => recipe.dietaryNeeds.includes(need))
    && nutritionalGoals.every((goal) => recipe.preferredGoals.includes(goal))
    && recipe.ingredients.every((ingredient) => ingredient.productIds.some((id) => {
      const product = products.get(id);
      return product && Number.isFinite(product.price?.amount) && product.price.amount >= 0;
    }))
    && !recipe.ingredients.some((ingredient) => excluded.has(ingredient.id)
      || ingredient.productIds.some((id) => excluded.has(id))));
}

function makeMeal(recipe: Recipe, id: string): Meal {
  const products = new Map(getAllProducts().map((product) => [product.id, product]));
  const ingredients = recipe.ingredients.map((ingredient) => {
    const product = ingredient.productIds.map((productId) => products.get(productId))
      .find((product) => product && Number.isFinite(product.price?.amount) && product.price.amount >= 0);
    if (!product) throw new Error(`Ingrediente non disponibile nel catalogo: ${ingredient.name}.`);
    return { id: ingredient.id, name: product.name, quantityLabel: ingredient.quantityLabel, product };
  });
  return {
    id, recipeId: recipe.id, name: recipe.name, sourceName: recipe.sourceName,
    prepTimeMinutes: recipe.prepTimeMinutes, servings: recipe.servings,
    calories: recipe.calories, ingredients, steps: [...recipe.steps],
    imageUrl: recipe.imageUrl, recipeUrl: recipe.recipeUrl,
    price: mealCost(ingredients),
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
