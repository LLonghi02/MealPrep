import React, { useEffect } from 'react';
import { useAppStore } from '../lib/store';
import MealPlanScreen from './meal-plan';
import catalog from '../data/product_catalog_en.json';
import type { DayPlan, Product } from '../lib/types';

export default function VisualCheck() {
  useEffect(() => {
    const products = (Array.isArray(catalog) ? catalog : Object.values(catalog)[0]) as Product[];
    useAppStore.getState().setMealPlan({
      weeklyCost: 80,
      days: (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as DayPlan['day'][]).map((day, i) => ({
        day,
        meals: [{
          id: day, name: i === 0 ? 'BBQ Chicken Loaded Jackets' : 'Roasted vegetables with rice',
          prepTimeMinutes: 25 + i, servings: 2, price: 4.18,
          ingredients: products.slice(0, 4).map(product => ({ product, quantityLabel: '200 g' })),
          steps: ['Prepare and chop the ingredients.', 'Preheat the oven to 200°C.', 'Cook until tender, then season to taste.', 'Divide between two plates and serve.'],
        }],
      })),
    });
  }, []);
  return <MealPlanScreen />;
}
