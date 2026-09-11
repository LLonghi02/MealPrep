// lib/generateMealPlan.ts
// Costruisce il prompt, chiama l'LLM e valida/parsa la risposta
// in un oggetto MealPlan tipizzato.

import Constants from 'expo-constants';
import { filterProducts } from './filterProducts';
import type { DietaryNeed, NutritionalGoal, MealPlan, Product } from './types';

const OPENAI_API_KEY =
  (Constants.expoConfig?.extra?.openaiApiKey as string | undefined) ??
  process.env.EXPO_PUBLIC_OPENAI_API_KEY;

interface GenerateMealPlanInput {
  budget: number;
  dietaryNeeds: DietaryNeed;
  nutritionalGoal: NutritionalGoal;
}

function buildProductSummary(products: Product[]): string {
  // Riduciamo il catalogo a un formato compatto per non esplodere i token.
  return products
    .slice(0, 300)
    .map(
      (p) =>
        `${p.id}|${p.name}|${p.brand}|€${p.price.amount}|${p.nutrition.energyKcal100g}kcal/100g`
    )
    .join('\n');
}

function buildPrompt(input: GenerateMealPlanInput, products: Product[]): string {
  return `Sei un nutrizionista che crea piani alimentari settimanali.

Vincoli utente:
- Budget settimanale: €${input.budget}
- Esigenze dietetiche: ${input.dietaryNeeds}
- Obiettivo nutrizionale: ${input.nutritionalGoal}

Prodotti disponibili (id|nome|marca|prezzo|kcal per 100g):
${buildProductSummary(products)}

Genera un piano pasti di 7 giorni (Mon-Sun), almeno 1 pasto al giorno,
usando SOLO prodotti dalla lista sopra (riferisciti a loro tramite id).
Rispondi SOLO con un JSON valido in questo formato, senza testo aggiuntivo:

{
  "weeklyCost": number,
  "days": [
    {
      "day": "Mon",
      "meals": [
        {
          "id": "string",
          "name": "string",
          "prepTimeMinutes": number,
          "servings": number,
          "price": number,
          "ingredientIds": ["productId", ...],
          "steps": ["step 1", "step 2"]
        }
      ]
    }
  ]
}`;
}

/**
 * Chiama l'API Anthropic/OpenAI e trasforma la risposta in un MealPlan
 * completo, risolvendo gli ingredientIds sui prodotti reali del catalogo.
 */
export async function generateMealPlan(
  input: GenerateMealPlanInput
): Promise<MealPlan> {
  if (!OPENAI_API_KEY) {
    throw new Error('Meal generation is not configured yet. Please contact the app administrator.');
  }
  const candidateProducts = filterProducts({
    dietaryNeeds: input.dietaryNeeds,
    nutritionalGoal: input.nutritionalGoal,
  });

  const prompt = buildPrompt(input, candidateProducts);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status}`);
  }

  const data = await response.json();
  const raw: string = data.choices?.[0]?.message?.content ?? '';
  const cleaned = raw.replace(/```json|```/g, '').trim();

  const parsed = JSON.parse(cleaned) as {
    weeklyCost: number;
    days: {
      day: MealPlan['days'][number]['day'];
      meals: {
        id: string;
        name: string;
        prepTimeMinutes: number;
        servings: number;
        price: number;
        ingredientIds: string[];
        steps: string[];
      }[];
    }[];
  };

  const productById = new Map(candidateProducts.map((p) => [p.id, p]));

  const mealPlan: MealPlan = {
    weeklyCost: parsed.weeklyCost,
    days: parsed.days.map((d) => ({
      day: d.day,
      meals: d.meals.map((m) => ({
        id: m.id,
        name: m.name,
        prepTimeMinutes: m.prepTimeMinutes,
        servings: m.servings,
        price: m.price,
        steps: m.steps,
        ingredients: m.ingredientIds
          .map((id) => productById.get(id))
          .filter((p): p is Product => Boolean(p))
          .map((product) => ({ product, quantityLabel: product.quantity })),
      })),
    })),
  };

  return mealPlan;
}
