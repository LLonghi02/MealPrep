// lib/filterProducts.ts
// Filtra il catalogo prodotti in base a budget, esigenze dietetiche
// e obiettivi nutrizionali selezionati dall'utente.

import catalog from '../data/product_catalog_en.json';
import type { Product, DietaryNeed, NutritionalGoal } from './types';

const products = catalog as Product[];

function normalizedAllergens(product: Product): string[] {
  return product.allergens.flatMap((allergen) => [allergen.name, allergen.id]).map((value) => value.toLowerCase());
}

function hasAllergen(product: Product, ...terms: string[]): boolean {
  const allergens = normalizedAllergens(product);
  return allergens.some((allergen) => terms.some((term) => allergen.includes(term)));
}

function hasLabel(product: Product, label: string): boolean {
  return product.labels.some((item) => item.name.toLowerCase() === label.toLowerCase() || item.id.toLowerCase().includes(label.toLowerCase()));
}

function matchesDietaryNeed(product: Product, need: DietaryNeed): boolean {
  switch (need) {
    case 'veggie':
      return hasLabel(product, 'vegetarian') || hasLabel(product, 'vegan');
    case 'vegan':
      return hasLabel(product, 'vegan');
    case 'pescatarian':
      // Niente carne: accettiamo pesce, vegetariano o vegano.
      return product.department.name === 'Fish' || hasLabel(product, 'vegetarian') || hasLabel(product, 'vegan');
    case 'gluten_free':
      return !hasAllergen(product, 'gluten', 'glutine', 'cereals containing gluten');
    case 'dairy_free':
      return !hasAllergen(product, 'milk', 'latte', 'dairy', 'lactose');
    case 'none':
    default:
      return true;
  }
}

function matchesNutritionalGoal(product: Product, goal: NutritionalGoal): boolean {
  const n = product.nutrition;
  switch (goal) {
    case 'high_protein':
      return n.proteins100g >= 8;
    case 'low_sugar':
      return n.sugars100g <= 5;
    case 'low_fat':
      return n.fat100g <= 3;
    case 'low_carbs':
      return n.carbohydrates100g <= 10;
    case 'low_salt':
      return n.salt100g <= 0.3;
    case 'none':
    default:
      return true;
  }
}

export interface FilterOptions {
  dietaryNeeds: DietaryNeed[];
  nutritionalGoals: NutritionalGoal[];
  maxWeeklyBudget?: number;
  excludedProductIds?: string[];
}

/**
 * Ritorna solo prodotti compatibili con entrambe le scelte dell'utente.
 * Il generatore usa questo sottoinsieme sia per le ricette demo sia come
 * catalogo vincolato per il modello AI: nessun ingrediente escluso può entrare nel piano.
 */
export function filterProducts(options: FilterOptions): Product[] {
  const excluded = new Set(options.excludedProductIds || []);
  const dietaryNeeds = options.dietaryNeeds.filter((need) => need !== 'none');
  const nutritionalGoals = options.nutritionalGoals.filter((goal) => goal !== 'none');
  return products.filter((product) => !excluded.has(product.id)
    && dietaryNeeds.every((need) => matchesDietaryNeed(product, need))
    && nutritionalGoals.every((goal) => matchesNutritionalGoal(product, goal)));
}

export function getAllProducts(): Product[] {
  return products;
}
