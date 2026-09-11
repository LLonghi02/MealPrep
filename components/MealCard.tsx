import React, { useState } from 'react';
import { Image, ImageSourcePropType, Linking, Pressable, View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';
import { assets } from '../assets/figma';
import type { Meal } from '../lib/types';
import { useAppStore } from '../lib/store';

function Metadata({ source, children }: { source: ImageSourcePropType; children: React.ReactNode }) {
  return <View style={s.metaItem}><Image source={source} style={s.icon} /><Text style={s.meta}>{children}</Text></View>;
}

export function MealCard({ meal }: { meal: Meal }) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [linkError, setLinkError] = useState(false);
  const openRecipe = async () => {
    setLinkError(false);
    try { await Linking.openURL(meal.recipeUrl); } catch { setLinkError(true); }
  };
  const liked = useAppStore((state) => state.favoriteRecipes.includes(meal.name));
  const toggleFavorite = useAppStore((state) => state.toggleFavoriteRecipe);
  return <View style={s.card}>
    {failedImageUrl === meal.imageUrl || !meal.imageUrl.startsWith('https://')
      ? <View style={[s.photo, { alignItems: 'center', justifyContent: 'center' }]}><Text style={s.meta}>Recipe photo unavailable</Text></View>
      : <Image source={{ uri: meal.imageUrl }} onError={() => setFailedImageUrl(meal.imageUrl)} style={s.photo} accessibilityLabel={`Recipe photo for ${meal.name} from ${meal.sourceName}`} />}
    <View style={s.content}>
      <View style={s.header}>
        <Text style={s.title}>{meal.name}</Text>
        <View style={s.headerActions}>
          <Text style={s.price}>{meal.price > 0 ? `€${meal.price.toFixed(2)}${meal.priceIsPartial ? '*' : ''}` : '—'}</Text>
          <Pressable onPress={() => toggleFavorite(meal.name)} style={[s.likeButton, liked && s.likeButtonActive]} accessibilityRole="button" accessibilityLabel={liked ? 'Remove from favorites' : 'Add to favorites'}>
            <Text style={[s.likeText, liked && s.likeTextActive]}>{liked ? '♥' : '♡'}</Text>
          </Pressable>
        </View>
      </View>
      <View style={s.metaRow}>
        <Metadata source={assets.clock}>{meal.prepTimeMinutes} min</Metadata>
        <Metadata source={assets.user}>{meal.servings} servings</Metadata>
        {meal.calories !== null && <Text style={s.calories}>{meal.calories} kcal / serving (source)</Text>}
        {meal.price > 0 && <Metadata source={assets.cash}>Estimated ingredients{meal.priceIsPartial ? ' (partial)' : ''}</Metadata>}
      </View>
      <Text style={s.meta}>Recipe and photo: {meal.sourceName}</Text>
      {meal.priceIsPartial && <Text style={s.meta}>Some ingredient prices are unavailable.</Text>}

      <View style={s.section}>
        <Text style={s.sectionTitle}>Ingredients</Text>
        <View style={s.ingredientList}>
          {meal.ingredients.map((ingredient, i) => <View key={`${ingredient.id}-${i}`} style={s.ingredientRow}>
            <View style={s.dot} />
            <Text style={s.body}>{ingredient.name} <Text style={s.quantity}>· {ingredient.quantityLabel}</Text></Text>
          </View>)}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Preparation</Text>
        <View style={s.steps}>
          {meal.steps.map((step, i) => <View key={`${meal.id}-step-${i}`} style={s.step}>
            <Text style={s.number}>{i + 1}</Text>
            <Text style={[s.body, s.stepText]}>{step}</Text>
          </View>)}
        </View>
      </View>

      <Pressable onPress={openRecipe} style={({ pressed }) => [s.recipeButton, pressed && s.pressed]} accessibilityRole="link">
        <Text style={s.recipeButtonText}>View full recipe ↗</Text>
      </Pressable>
      {linkError && <Text accessibilityRole="alert" style={s.meta}>Unable to open the recipe. Please try again.</Text>}
    </View>
  </View>;
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.lg, overflow: 'hidden', shadowColor: '#16351D', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  photo: { width: '100%', height: 170, backgroundColor: colors.chipBackground },
  content: { padding: spacing.md, gap: 4 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }, headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: fonts.semiBold, fontSize: 18, lineHeight: 24, color: colors.text },
  price: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 22, color: colors.primaryDark },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 }, icon: { width: 15, height: 15 }, meta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textMuted },
  calories: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 17, color: colors.primaryDark },
  likeButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.chipBackground, alignItems: 'center', justifyContent: 'center' }, likeButtonActive: { backgroundColor: colors.chipBackgroundSelected }, likeText: { fontSize: 21, lineHeight: 23, color: colors.textMuted }, likeTextActive: { color: colors.primaryDark },
  section: { gap: 10, marginTop: 22 }, sectionTitle: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 19, color: colors.text }, ingredientList: { gap: 7 },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 8 },
  body: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textMuted }, quantity: { fontFamily: fonts.medium, color: colors.text }, steps: { gap: 12 }, step: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  number: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.chipBackgroundSelected, color: colors.primaryDark, fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 22, textAlign: 'center' }, stepText: { paddingTop: 1 },
  recipeButton: { marginTop: 22, minHeight: 44, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, recipeButtonText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.textOnPrimary }, pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
