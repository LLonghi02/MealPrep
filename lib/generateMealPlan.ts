import type { MealPlan } from './types';
import type { GenerateMealPlanInput } from './resolveMealPlan';

export async function generateMealPlan(input: GenerateMealPlanInput): Promise<MealPlan> {
  // Expo Router resolves this URL to the development server on native and web.
  const response = await fetch('/api/meal-plan', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ budget: input.budget, dietaryNeeds: input.dietaryNeeds,
      nutritionalGoals: input.nutritionalGoals ?? [input.nutritionalGoal ?? 'none'], favoriteRecipes: input.favoriteRecipes || [],
      excludedProductIds: input.excludedProductIds || [], recipePreferences: input.recipePreferences || '' }),
    signal: AbortSignal.timeout(600000),
  });
  const contentType = response.headers.get('content-type') || '';
  if (!/\bapplication\/(?:[\w.-]+\+)?json\b/i.test(contentType)) {
    throw new Error('Il server delle ricette non è disponibile: ha restituito una pagina invece dei dati. Riavvia Expo dalla cartella MealPrep e ricarica l’app.');
  }
  const result = await response.json().catch(() => {
    throw new Error('Il server delle ricette ha restituito dati non validi. Riprova tra poco.');
  });
  if (!response.ok) throw new Error(typeof result?.error === 'string' ? result.error : 'Impossibile cercare le ricette. Riprova.');
  if (!result?.plan || !Array.isArray(result.plan.days) || result.plan.days.length !== 7 || !Number.isFinite(result.plan.weeklyCost)) {
    throw new Error('Il server non ha restituito un piano completo. Riprova.');
  }
  return result.plan;
}
