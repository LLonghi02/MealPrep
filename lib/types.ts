// lib/types.ts
// Tipi di dominio condivisi in tutta l'app.

export type DietaryNeed =
  | 'none'
  | 'veggie'
  | 'vegan'
  | 'pescatarian'
  | 'gluten_free'
  | 'dairy_free';

export type NutritionalGoal =
  | 'none'
  | 'high_protein'
  | 'low_sugar'
  | 'low_fat'
  | 'low_carbs'
  | 'low_salt';

export type DietaryNeeds = DietaryNeed[];
export type NutritionalGoals = NutritionalGoal[];

export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  department: { id: string; name: string };
  category: { id: string; name: string };
  quantity: string;
  netContent: { value: number; unit: string } | null;
  price: { amount: number; currency: string };
  unitPrice: { amount: number; unit: string };
  nutrition: {
    energyKcal100g: number;
    fat100g: number;
    saturatedFat100g: number;
    carbohydrates100g: number;
    sugars100g: number;
    fiber100g: number;
    proteins100g: number;
    salt100g: number;
  };
  nutriScore: string;
  novaGroup: number;
  labels: { id: string; name: string }[];
  allergens: { id: string; name: string }[];
}

export interface Ingredient {
  id: string;
  name: string;
  product: Product;
  quantityLabel: string; // es. "200 g", "2 pz"
}

export interface Meal {
  id: string;
  recipeId: string;
  sourceName: string;
  name: string;
  prepTimeMinutes: number;
  servings: number;
  calories: number | null;
  price: number;
  ingredients: Ingredient[];
  steps: string[];
  imageUrl: string;
  recipeUrl: string;
}

export interface DayPlan {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  meals: Meal[];
}

export interface MealPlan {
  weeklyCost: number;
  days: DayPlan[];
  source?: 'demo' | 'llm';
}

export interface OnboardingState {
  budget: number;
  dietaryNeeds: DietaryNeeds;
  nutritionalGoals: NutritionalGoals;
  favoriteRecipes?: string[];
  excludedProductIds?: string[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  product: Product;
  quantities: string[];
}
