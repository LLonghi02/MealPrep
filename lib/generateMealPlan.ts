import { filterProducts } from './filterProducts';
import type { DietaryNeed, MealPlan, NutritionalGoal, Product } from './types';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim();
const DAYS: MealPlan['days'][number]['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface GenerateMealPlanInput {
  budget: number;
  dietaryNeeds: DietaryNeed;
  nutritionalGoal: NutritionalGoal;
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
};

type RawPlan = {
  weeklyCost: number;
  days: { day: MealPlan['days'][number]['day']; meals: RawMeal[] }[];
};

function buildProductSummary(products: Product[]): string {
  return products
    .slice(0, 300)
    .map((p) => `${p.id}|${p.name}|${p.brand}|€${p.price.amount}|${p.nutrition.energyKcal100g}kcal/100g`)
    .join('\n');
}

function buildPrompt(input: GenerateMealPlanInput, products: Product[]): string {
  return `You are a practical nutritionist and recipe developer.

Create a realistic weekly meal plan from the user's preferences and the available grocery catalog.
User preferences:
- Weekly budget: €${input.budget}
- Dietary needs: ${input.dietaryNeeds}
- Nutritional goal: ${input.nutritionalGoal}

Available products (id|name|brand|price|kcal per 100g):
${buildProductSummary(products)}

Rules:
- Return exactly 7 days in this order: Mon, Tue, Wed, Thu, Fri, Sat, Sun.
- Each day must contain at least 1 meal. Prefer 2 meals when budget allows.
- Every meal must have a clear name, prep time, servings, price, 3-8 ingredients, and 3-6 concise cooking steps.
- Use only product IDs from the catalog for ingredientIds. Never invent IDs.
- ingredientQuantities must align by index with ingredientIds and use human-readable quantities such as "200 g" or "2 pieces".
- Keep the weekly cost at or below the user's budget where possible.
- Respond with JSON only. No markdown or commentary.`;
}

const mealPlanSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['weeklyCost', 'days'],
  properties: {
    weeklyCost: { type: 'number' },
    days: {
      type: 'array',
      minItems: 7,
      maxItems: 7,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['day', 'meals'],
        properties: {
          day: { type: 'string', enum: DAYS },
          meals: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['id', 'name', 'prepTimeMinutes', 'servings', 'price', 'ingredientIds', 'ingredientQuantities', 'steps'],
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                prepTimeMinutes: { type: 'number' },
                servings: { type: 'number' },
                price: { type: 'number' },
                ingredientIds: { type: 'array', minItems: 3, maxItems: 8, items: { type: 'string' } },
                ingredientQuantities: { type: 'array', minItems: 3, maxItems: 8, items: { type: 'string' } },
                steps: { type: 'array', minItems: 3, maxItems: 6, items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  },
} as const;

function parseAndValidate(raw: unknown, products: Product[]): MealPlan {
  if (!raw || typeof raw !== 'object') throw new Error('The meal plan response was not valid JSON.');
  const plan = raw as RawPlan;
  if (!Array.isArray(plan.days) || plan.days.length !== 7) throw new Error('The meal plan did not include all 7 days.');
  if (plan.days.map((day) => day.day).join('|') !== DAYS.join('|')) throw new Error('The meal plan days were returned in an unexpected order.');

  const productById = new Map(products.map((product) => [product.id, product]));
  const days = plan.days.map((day) => {
    if (!Array.isArray(day.meals) || day.meals.length === 0) throw new Error(`${day.day} is missing a meal.`);
    return {
      day: day.day,
      meals: day.meals.map((meal) => {
        if (!meal.name || !Array.isArray(meal.steps) || meal.steps.length < 3) throw new Error(`The recipe for ${day.day} is incomplete.`);
        const ingredients = meal.ingredientIds
          .map((id, index) => {
            const product = productById.get(id);
            return product ? { product, quantityLabel: meal.ingredientQuantities?.[index] || product.quantity } : null;
          })
          .filter((ingredient): ingredient is NonNullable<typeof ingredient> => Boolean(ingredient));
        if (ingredients.length < 3) throw new Error(`The recipe for ${meal.name} uses unavailable ingredients.`);
        return {
          id: meal.id,
          name: meal.name,
          prepTimeMinutes: Math.max(1, Math.round(meal.prepTimeMinutes)),
          servings: Math.max(1, Math.round(meal.servings)),
          price: Math.max(0, Number(meal.price)),
          steps: meal.steps,
          ingredients,
        };
      }),
    };
  });

  return { weeklyCost: Math.max(0, Number(plan.weeklyCost)), days };
}

export async function generateMealPlan(input: GenerateMealPlanInput): Promise<MealPlan> {
  if (!OPENAI_API_KEY) {
    throw new Error('Meal generation is not configured. Add EXPO_PUBLIC_OPENAI_API_KEY to your .env file and restart Expo.');
  }

  const candidateProducts = filterProducts({ dietaryNeeds: input.dietaryNeeds, nutritionalGoal: input.nutritionalGoal });
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: buildPrompt(input, candidateProducts) }],
      temperature: 0.7,
      response_format: { type: 'json_schema', json_schema: { name: 'weekly_meal_plan', strict: true, schema: mealPlanSchema } },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Meal generation failed (${response.status}). ${detail.slice(0, 120)}`);
  }
  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('The meal generator returned an empty plan. Please try again.');
  return parseAndValidate(JSON.parse(raw), candidateProducts);
}
