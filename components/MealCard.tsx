import React from 'react';
import { Image, ImageSourcePropType, View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';
import { assets } from '../assets/figma';
import type { Meal } from '../lib/types';

function Metadata({ source, children }: { source: ImageSourcePropType; children: React.ReactNode }) {
  return <View style={s.metaItem}><Image source={source} style={s.icon} /><Text style={s.meta}>{children}</Text></View>;
}
export function MealCard({ meal }: { meal: Meal }) {
  return <View style={s.card}>
    <Text style={s.title}>{meal.name}</Text>
    <View style={s.metaRow}>
      <Metadata source={assets.clock}>{meal.prepTimeMinutes} min</Metadata>
      <Metadata source={assets.user}>{meal.servings} servings</Metadata>
      <Metadata source={assets.cash}>€{meal.price.toFixed(2)} / serving</Metadata>
    </View>
    <View style={s.section}>
      <Text style={s.sectionTitle}>Ingredients</Text>
      {meal.ingredients.map((ingredient, i) => <Text key={`${ingredient.product.id}-${i}`} style={s.body}>
        {ingredient.quantityLabel} · {ingredient.product.name}
      </Text>)}
    </View>
    <View style={s.section}>
      <Text style={s.sectionTitle}>Recipe</Text>
      {meal.steps.map((step, i) => <View key={i} style={s.step}><Text style={s.number}>{i + 1}.</Text><Text style={[s.body, s.stepText]}>{step}</Text></View>)}
    </View>
  </View>;
}
const s = StyleSheet.create({
  card: { gap: 4 },
  title: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 22, color: colors.text },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  icon: { width: 16, height: 16 },
  meta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textMuted },
  section: { gap: 12, marginTop: 24 },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 19, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textMuted },
  step: { flexDirection: 'row', gap: 8 },
  stepText: { flex: 1 },
  number: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 21, color: colors.text },
});

