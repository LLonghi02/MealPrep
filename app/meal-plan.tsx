import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { DayTabs } from '../components/DayTabs';
import { MealCard } from '../components/MealCard';
import { useAppStore } from '../lib/store';
import { generateMealPlan } from '../lib/generateMealPlan';
import { colors, fonts, radii, spacing } from '../theme';
import type { DayPlan, ShoppingItem } from '../lib/types';

const DAYS: DayPlan['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

function ShoppingList({ items, total, onRemove, refreshing }: { items: ShoppingItem[]; total: number; onRemove: (id: string) => void; refreshing: boolean }) {
  return <View style={s.shoppingCard}>
    <View style={s.shoppingHeader}>
      <View>
        <Text style={s.cardKicker}>DISPENSA DELLA SETTIMANA</Text>
        <Text style={s.shoppingTitle}>Lista della spesa</Text>
      </View>
      <View style={s.totalBadge}><Text style={s.totalLabel}>TOTALE</Text><Text style={s.totalValue}>€{total.toFixed(2)}</Text></View>
    </View>
    <Text style={s.shoppingHint}>{refreshing ? 'Aggiornamento del piano in corso…' : 'Quantità aggregate per tutte le 14 ricette. Rimuovi ciò che non ti piace.'}</Text>
    <View style={s.shoppingItems}>
      {items.map((item) => <View key={item.product.id} style={s.shoppingRow}>
        <View style={s.shoppingDot} />
        <Text style={s.shoppingProduct}>{item.product.name}</Text>
        <Text style={s.shoppingQuantity}>{item.quantities.join(' + ')}</Text>
        <Text style={s.shoppingPrice}>€{item.product.price.amount.toFixed(2)}</Text>
        <Pressable onPress={() => onRemove(item.product.id)} style={s.removeButton} accessibilityRole="button" accessibilityLabel={`Rimuovi ${item.product.name}`}><Text style={s.removeText}>×</Text></Pressable>
      </View>)}
    </View>
    <View style={s.totalRow}><Text style={s.totalRowLabel}>Totale stimato della spesa</Text><Text style={s.totalRowValue}>€{total.toFixed(2)}</Text></View>
  </View>;
}

export default function MealPlanScreen() {
  const router = useRouter();
  const plan = useAppStore((s) => s.mealPlan);
  const error = useAppStore((s) => s.generationError);
  const setMealPlan = useAppStore((s) => s.setMealPlan);
  const setGenerating = useAppStore((s) => s.setGenerating);
  const setGenerationError = useAppStore((s) => s.setGenerationError);
  const [index, setIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const selectedDay = DAYS[index];
  const selectedPlan = useMemo(() => plan?.days.find((day) => day.day === selectedDay), [plan, selectedDay]);
  const shopping = useMemo(() => {
    if (!plan) return { items: [], total: 0 };
    const map = new Map<string, ShoppingItem>();
    plan.days.flatMap((day) => day.meals).flatMap((meal) => meal.ingredients).forEach(({ product, quantityLabel }) => {
      const current = map.get(product.id);
      if (current) current.quantities.push(quantityLabel);
      else map.set(product.id, { product, quantities: [quantityLabel] });
    });
    const items = [...map.values()].sort((a, b) => a.product.name.localeCompare(b.product.name));
    return { items, total: items.reduce((sum, item) => sum + item.product.price.amount, 0) };
  }, [plan]);

  const removeFromShoppingList = async (productId: string) => {
    useAppStore.getState().excludeProduct(productId);
    setRefreshing(true);
    setGenerating(true);
    setGenerationError(null);
    try {
      setMealPlan(await generateMealPlan(useAppStore.getState()));
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Impossibile aggiornare il piano.');
    } finally {
      setGenerating(false);
      setRefreshing(false);
    }
  };

  if (!plan) return <Screen><View style={s.empty}>
    <Text style={s.emptyEyebrow}>IL TUO MENU SETTIMANALE</Text><Text style={s.emptyTitle}>Il tuo piano ti aspetta.</Text>
    <Text style={s.emptyText}>{error || 'Completa la configurazione per ricevere ricette adatte alle tue preferenze.'}</Text>
    <Button title="Crea il mio piano" onPress={() => router.replace('/budget')} />
  </View></Screen>;

  const selectIndex = (next: number) => setIndex(Math.max(0, Math.min(DAYS.length - 1, next)));
  const select = (day: DayPlan['day']) => selectIndex(DAYS.indexOf(day));

  return <Screen green>
    <View style={s.page}>
      <View style={s.hero}>
        <View style={s.eyebrowRow}><Text style={s.eyebrow}>IL TUO MENU SETTIMANALE</Text><Text style={s.weekCost}>€{plan.weeklyCost.toFixed(0)} <Text style={s.weekCostUnit}>/ settimana</Text></Text></View>
        <Text style={s.title}>Buon appetito!</Text><Text style={s.subtitle}>Due pasti al giorno, con ricette complete e ingredienti pronti da comprare.</Text>
        {plan.source === 'demo' && <View style={s.demoBadge}><Text style={s.demoBadgeText}>PIANO DEMO · RICETTE DI ESEMPIO</Text></View>}
      </View>

      <View style={s.plannerCard}>
        <View style={s.cardHeader}><View><Text style={s.cardKicker}>PIANO DEL GIORNO</Text><Text style={s.cardTitle}>{NAMES[index]}</Text></View><View style={s.dayBadge}><Text style={s.dayBadgeText}>{index + 1} / 7</Text></View></View>
        <DayTabs days={DAYS} selectedDay={selectedDay} onSelect={select} />
        <View style={s.daySummary}><Text style={s.mealCount}>2 pasti programmati</Text><Text style={s.dayHint}>Pranzo + cena</Text></View>
        <View style={s.meals}>{selectedPlan?.meals.map((meal) => <MealCard key={meal.id} meal={meal} />)}</View>
        <View style={s.navigation}>
          <Pressable disabled={index === 0} onPress={() => selectIndex(index - 1)} style={[s.navButton, index === 0 && s.navDisabled]} accessibilityRole="button" accessibilityLabel="Giorno precedente"><Text style={[s.navArrow, index === 0 && s.navDisabledText]}>‹</Text><Text style={[s.navLabel, index === 0 && s.navDisabledText]}>Precedente</Text></Pressable>
          <Pressable disabled={index === DAYS.length - 1} onPress={() => selectIndex(index + 1)} style={[s.navButton, s.nextButton, index === DAYS.length - 1 && s.navDisabled]} accessibilityRole="button" accessibilityLabel="Giorno successivo"><Text style={[s.navLabel, s.nextLabel, index === DAYS.length - 1 && s.navDisabledText]}>Successivo</Text><Text style={[s.navArrow, s.nextLabel, index === DAYS.length - 1 && s.navDisabledText]}>›</Text></Pressable>
        </View>
      </View>
      <ShoppingList items={shopping.items} total={shopping.total} onRemove={removeFromShoppingList} refreshing={refreshing} />
    </View>
  </Screen>;
}

const s = StyleSheet.create({
  page: { width: '100%' }, hero: { paddingBottom: 26 }, eyebrowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, eyebrow: { fontFamily: fonts.semiBold, fontSize: 11, letterSpacing: 1.2, color: 'rgba(255,255,255,0.75)' }, weekCost: { fontFamily: fonts.semiBold, fontSize: 17, color: colors.textOnPrimary }, weekCostUnit: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.75)' }, title: { marginTop: 12, fontFamily: fonts.semiBold, fontSize: 40, lineHeight: 48, color: colors.textOnPrimary }, subtitle: { marginTop: 4, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: 'rgba(255,255,255,0.8)' }, demoBadge: { alignSelf: 'flex-start', marginTop: 14, borderRadius: radii.pill, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6 }, demoBadgeText: { fontFamily: fonts.semiBold, fontSize: 10, letterSpacing: 0.8, color: colors.textOnPrimary }, plannerCard: { backgroundColor: colors.card, borderRadius: 32, padding: spacing.lg, paddingBottom: 20, minHeight: 580 }, cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, cardKicker: { fontFamily: fonts.semiBold, fontSize: 11, letterSpacing: 1, color: colors.primaryDark }, cardTitle: { marginTop: 5, fontFamily: fonts.semiBold, fontSize: 28, lineHeight: 34, color: colors.text }, dayBadge: { backgroundColor: colors.chipBackgroundSelected, borderRadius: radii.pill, paddingHorizontal: 11, paddingVertical: 7 }, dayBadgeText: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primaryDark }, daySummary: { marginTop: 22, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }, mealCount: { fontFamily: fonts.medium, fontSize: 14, color: colors.text }, dayHint: { flex: 1, textAlign: 'right', fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted }, meals: { gap: 16, paddingTop: 2 }, navigation: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 28 }, navButton: { flex: 1, minHeight: 44, borderRadius: radii.md, backgroundColor: colors.chipBackground, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, nextButton: { backgroundColor: colors.text }, navArrow: { fontFamily: fonts.regular, fontSize: 26, lineHeight: 28, color: colors.text }, navLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.text }, nextLabel: { color: colors.textOnPrimary }, navDisabled: { opacity: 0.45 }, navDisabledText: { color: colors.textMuted }, empty: { flex: 1, justifyContent: 'center', gap: 14 }, emptyEyebrow: { fontFamily: fonts.semiBold, fontSize: 11, letterSpacing: 1.2, color: colors.primaryDark, textAlign: 'center' }, emptyTitle: { fontFamily: fonts.semiBold, fontSize: 32, lineHeight: 40, color: colors.text, textAlign: 'center' }, emptyText: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 23, color: colors.textMuted, textAlign: 'center', marginBottom: 10 },
  shoppingCard: { marginTop: 18, backgroundColor: colors.card, borderRadius: 32, padding: spacing.lg, marginBottom: 20 }, shoppingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }, shoppingTitle: { marginTop: 5, fontFamily: fonts.semiBold, fontSize: 28, lineHeight: 34, color: colors.text }, shoppingHint: { marginTop: 10, fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted }, totalBadge: { alignItems: 'flex-end', backgroundColor: colors.chipBackgroundSelected, borderRadius: radii.md, paddingHorizontal: 10, paddingVertical: 8 }, totalLabel: { fontFamily: fonts.semiBold, fontSize: 9, letterSpacing: 1, color: colors.primaryDark }, totalValue: { marginTop: 2, fontFamily: fonts.semiBold, fontSize: 17, color: colors.primaryDark }, shoppingItems: { marginTop: 18, gap: 12 }, shoppingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, shoppingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }, shoppingProduct: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: colors.text }, shoppingQuantity: { maxWidth: 110, fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, textAlign: 'right' }, shoppingPrice: { width: 48, fontFamily: fonts.semiBold, fontSize: 12, color: colors.primaryDark, textAlign: 'right' }, removeButton: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.chipBackground, alignItems: 'center', justifyContent: 'center' }, removeText: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 20, color: colors.textMuted }, totalRow: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' }, totalRowLabel: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.text }, totalRowValue: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.primaryDark },
});
