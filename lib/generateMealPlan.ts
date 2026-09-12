import type { MealPlan } from './types';
import type { GenerateMealPlanInput } from './resolveMealPlan';

export async function generateMealPlan(input: GenerateMealPlanInput): Promise<MealPlan> {
  // Expo Router resolves this URL to the development server on native and web.
  const response = await fetch('/api/meal-plan', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ budget: input.budget, dietaryNeeds: input.dietaryNeeds,
      nutritionalGoals: input.nutritionalGoals ?? [input.nutritionalGoal ?? 'none'], favoriteRecipes: input.favoriteRecipes || [],
      excludedProductIds: input.excludedProductIds || [], recipePreferences: input.recipePreferences || '' }),
    signal: AbortSignal.timeout(90000),
  });
  const contentType = response.headers.get('content-type') || '';
  if (!/\bapplication\/(?:[\w.-]+\+)?json\b/i.test(contentType)) {
    throw new Error('The recipe server returned a page instead of recipe data. Restart Expo from the MealPrep folder and reload the app.');
  }
  const result = await response.json().catch(() => {
    throw new Error('The recipe server returned invalid data. Please try again shortly.');
  });
  if (!response.ok) throw new Error(typeof result?.error === 'string' ? result.error : 'Unable to search for recipes. Please try again.');
  if (!result?.plan || !Array.isArray(result.plan.days) || result.plan.days.length !== 7 || !Number.isFinite(result.plan.weeklyCost)) {
    throw new Error('The server did not return a complete meal plan. Please try again.');
  }
  return result.plan;
}
