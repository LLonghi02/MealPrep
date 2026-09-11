// lib/store.ts
// Unico store globale (Zustand) per tutto il flusso di onboarding
// e per il piano pasti generato.

import { create } from 'zustand';
import type { DietaryNeed, NutritionalGoal, MealPlan } from './types';

interface AppState {
  // Onboarding
  budget: number;
  dietaryNeeds: DietaryNeed;
  nutritionalGoal: NutritionalGoal;
  favoriteRecipes: string[];
  excludedProductIds: string[];
  dietaryConfirmed: boolean;
  nutritionConfirmed: boolean;
  setBudget: (value: number) => void;
  setDietaryNeeds: (value: DietaryNeed) => void;
  setNutritionalGoal: (value: NutritionalGoal) => void;
  toggleFavoriteRecipe: (name: string) => void;
  excludeProduct: (id: string) => void;

  // Meal plan generato
  mealPlan: MealPlan | null;
  isGenerating: boolean;
  generationError: string | null;
  setMealPlan: (plan: MealPlan) => void;
  setGenerating: (value: boolean) => void;
  setGenerationError: (value: string | null) => void;

  reset: () => void;
}

const initialState = {
  budget: 82,
  dietaryConfirmed: false,
  nutritionConfirmed: false,
  dietaryNeeds: 'none' as DietaryNeed,
  nutritionalGoal: 'none' as NutritionalGoal,
  favoriteRecipes: [],
  excludedProductIds: [],
  mealPlan: null,
  isGenerating: false,
  generationError: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setBudget: (value) => set({ budget: value }),
  setDietaryNeeds: (value) => set({ dietaryNeeds: value, dietaryConfirmed: true }),
  setNutritionalGoal: (value) => set({ nutritionalGoal: value, nutritionConfirmed: true }),
  toggleFavoriteRecipe: (name) => set((state) => ({ favoriteRecipes: state.favoriteRecipes.includes(name) ? state.favoriteRecipes.filter((item) => item !== name) : [...state.favoriteRecipes, name] })),
  excludeProduct: (id) => set((state) => ({ excludedProductIds: state.excludedProductIds.includes(id) ? state.excludedProductIds : [...state.excludedProductIds, id] })),

  setMealPlan: (plan) => set({ mealPlan: plan }),
  setGenerating: (value) => set({ isGenerating: value }),
  setGenerationError: (value) => set({ generationError: value }),

  reset: () => set(initialState),
}));
