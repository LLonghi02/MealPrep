import type { MealPlan } from './types';
import type { GenerateMealPlanInput } from './resolveMealPlan';

export async function generateMealPlan(input: GenerateMealPlanInput): Promise<MealPlan> {
  // Expo Router resolves this URL to the development server on native and web.
  const response = await fetch('/api/meal-plan', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ budget: input.budget, dietaryNeeds: input.dietaryNeeds,
      nutritionalGoals: input.nutritionalGoals ?? [input.nutritionalGoal ?? 'none'], favoriteRecipes: input.favoriteRecipes || [],
      excludedProductIds: input.excludedProductIds || [], recipePreferences: input.recipePreferences || '' }),
    signal: AbortSignal.timeout(600000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Impossibile cercare le ricette. Riprova.');
  return result.plan;
}
