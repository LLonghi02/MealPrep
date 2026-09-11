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
  setBudget: (value: number) => void;
  setDietaryNeeds: (value: DietaryNeed) => void;
  setNutritionalGoal: (value: NutritionalGoal) => void;

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
  budget: 80,
  dietaryNeeds: 'none' as DietaryNeed,
  nutritionalGoal: 'none' as NutritionalGoal,
  mealPlan: null,
  isGenerating: false,
  generationError: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setBudget: (value) => set({ budget: value }),
  setDietaryNeeds: (value) => set({ dietaryNeeds: value }),
  setNutritionalGoal: (value) => set({ nutritionalGoal: value }),

  setMealPlan: (plan) => set({ mealPlan: plan }),
  setGenerating: (value) => set({ isGenerating: value }),
  setGenerationError: (value) => set({ generationError: value }),

  reset: () => set(initialState),
}));
