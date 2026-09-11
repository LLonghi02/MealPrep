// components/MealCard.tsx
// Card di un pasto con ingredienti e ricetta (schermata 05).
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';
import type { Meal } from '../lib/types';

interface MealCardProps {
  meal: Meal;
}

export function MealCard({ meal }: MealCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{meal.name}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>⏱ {meal.prepTimeMinutes} min</Text>
        <Text style={styles.meta}>🍽 {meal.servings} servings</Text>
        <Text style={styles.meta}>€{meal.price.toFixed(2)} / serving</Text>
      </View>

      <Text style={styles.sectionTitle}>Ingredients</Text>
      {meal.ingredients.map((ing) => (
        <Text key={ing.product.id} style={styles.ingredient}>
          • {ing.product.name} — {ing.quantityLabel}
        </Text>
      ))}

      <Text style={styles.sectionTitle}>Recipe</Text>
      {meal.steps.map((step, idx) => (
        <Text key={idx} style={styles.step}>
          {idx + 1}. {step}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  ingredient: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  step: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
});
