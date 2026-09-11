// lib/filterProducts.ts
// Filtra il catalogo prodotti in base a budget, esigenze dietetiche
// e obiettivi nutrizionali selezionati dall'utente.

import catalog from '../data/product_catalog_en.json';
import type { Product, DietaryNeed, NutritionalGoal } from './types';

const products = catalog as Product[];

function matchesDietaryNeed(product: Product, need: DietaryNeed): boolean {
  const labelNames = product.labels.map((l) => l.name);
  const allergens = product.allergens.map((a) => a.toLowerCase());

  switch (need) {
    case 'veggie':
      return labelNames.includes('Vegetarian') || labelNames.includes('Vegan');
    case 'vegan':
      return labelNames.includes('Vegan');
    case 'pescatarian':
      // Niente carne: accettiamo pesce, vegetariano o vegano
      return (
        product.department.name === 'Fish' ||
        labelNames.includes('Vegetarian') ||
        labelNames.includes('Vegan')
      );
    case 'gluten_free':
      return !allergens.includes('glutine');
    case 'dairy_free':
      return !allergens.includes('latte');
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
  dietaryNeeds: DietaryNeed;
  nutritionalGoal: NutritionalGoal;
  maxWeeklyBudget?: number;
}

/**
 * Ritorna il sottoinsieme di prodotti compatibili con le scelte utente.
 * Il budget non filtra i singoli prodotti (serve al momento della
 * generazione del piano, per limitare il costo totale settimanale).
 */
export function filterProducts(options: FilterOptions): Product[] {
  return products.filter(
    (p) =>
      matchesDietaryNeed(p, options.dietaryNeeds) &&
      matchesNutritionalGoal(p, options.nutritionalGoal)
  );
}

export function getAllProducts(): Product[] {
  return products;
}
