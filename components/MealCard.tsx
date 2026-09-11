import React from 'react';
import { Image, ImageSourcePropType, View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';
import { assets } from '../assets/figma';
import type { Meal } from '../lib/types';

function Metadata({ source, children }: { source: ImageSourcePropType; children: React.ReactNode }) {
  return <View style={s.metaItem}><Image source={source} style={s.icon} /><Text style={s.meta}>{children}</Text></View>;
}

export function MealCard({ meal }: { meal: Meal }) {
  return <View style={s.card}>
    <View style={s.header}>
      <Text style={s.title}>{meal.name}</Text>
      <Text style={s.price}>€{meal.price.toFixed(2)}</Text>
    </View>
    <View style={s.metaRow}>
      <Metadata source={assets.clock}>{meal.prepTimeMinutes} min</Metadata>
      <Metadata source={assets.user}>{meal.servings} servings</Metadata>
      <Metadata source={assets.cash}>€{meal.price.toFixed(2)} total</Metadata>
    </View>

    <View style={s.section}>
      <Text style={s.sectionTitle}>Ingredients</Text>
      <View style={s.ingredientList}>
        {meal.ingredients.map((ingredient, i) => <View key={`${ingredient.product.id}-${i}`} style={s.ingredientRow}>
          <View style={s.dot} />
          <Text style={s.body}><Text style={s.quantity}>{ingredient.quantityLabel}</Text> {ingredient.product.name}</Text>
        </View>)}
      </View>
    </View>

    <View style={s.section}>
      <Text style={s.sectionTitle}>Recipe</Text>
      <View style={s.steps}>
        {meal.steps.map((step, i) => <View key={`${meal.id}-step-${i}`} style={s.step}>
          <Text style={s.number}>{i + 1}</Text>
          <Text style={[s.body, s.stepText]}>{step}</Text>
        </View>)}
      </View>
    </View>
  </View>;
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, gap: 4, shadowColor: '#16351D', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1, fontFamily: fonts.semiBold, fontSize: 18, lineHeight: 24, color: colors.text },
  price: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 22, color: colors.primaryDark },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  icon: { width: 15, height: 15 },
  meta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textMuted },
  section: { gap: 10, marginTop: 22 },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 19, color: colors.text },
  ingredientList: { gap: 7 },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 8 },
  body: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textMuted },
  quantity: { fontFamily: fonts.medium, color: colors.text },
  steps: { gap: 12 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  number: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.chipBackgroundSelected, color: colors.primaryDark, fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 22, textAlign: 'center' },
  stepText: { paddingTop: 1 },
});
