import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { DayTabs } from '../components/DayTabs';
import { MealCard } from '../components/MealCard';
import { useAppStore } from '../lib/store';
import { colors, fonts, radii, spacing } from '../theme';
import type { DayPlan } from '../lib/types';

const DAYS: DayPlan['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function MealPlanScreen() {
  const router = useRouter();
  const plan = useAppStore((s) => s.mealPlan);
  const error = useAppStore((s) => s.generationError);
  const [index, setIndex] = useState(0);
  const selectedDay = DAYS[index];
  const selectedPlan = useMemo(() => plan?.days.find((day) => day.day === selectedDay), [plan, selectedDay]);

  if (!plan) return <Screen><View style={s.empty}>
    <Text style={s.emptyEyebrow}>YOUR WEEK AHEAD</Text>
    <Text style={s.emptyTitle}>Your plan is waiting.</Text>
    <Text style={s.emptyText}>{error || 'Complete the quick setup to get recipes matched to your preferences.'}</Text>
    <Button title="Create your meal plan" onPress={() => router.replace('/budget')} />
  </View></Screen>;

  const selectIndex = (next: number) => setIndex(Math.max(0, Math.min(DAYS.length - 1, next)));
  const select = (day: DayPlan['day']) => selectIndex(DAYS.indexOf(day));

  return <Screen green>
    <View style={s.page}>
      <View style={s.hero}>
        <View style={s.eyebrowRow}>
          <Text style={s.eyebrow}>YOUR WEEK AHEAD</Text>
          <Text style={s.weekCost}>€{plan.weeklyCost.toFixed(0)} <Text style={s.weekCostUnit}>/ week</Text></Text>
        </View>
        <Text style={s.title}>Bon appetit!</Text>
        <Text style={s.subtitle}>Seven days of recipes, shaped around your choices.</Text>
        {plan.source === 'demo' && <View style={s.demoBadge}><Text style={s.demoBadgeText}>DEMO PLAN · SAMPLE RECIPES</Text></View>}
      </View>

      <View style={s.plannerCard}>
        <View style={s.cardHeader}>
          <View>
            <Text style={s.cardKicker}>WEEKLY MEAL PLAN</Text>
            <Text style={s.cardTitle}>{NAMES[index]}</Text>
          </View>
          <View style={s.dayBadge}><Text style={s.dayBadgeText}>{index + 1} / 7</Text></View>
        </View>
        <DayTabs days={DAYS} selectedDay={selectedDay} onSelect={select} />

        <View style={s.daySummary}>
          <Text style={s.mealCount}>{selectedPlan?.meals.length || 0} {selectedPlan?.meals.length === 1 ? 'meal' : 'meals'} planned</Text>
          <Text style={s.dayHint}>Swipe the tabs to explore your week</Text>
        </View>

        <View style={s.meals}>
          {selectedPlan?.meals.map((meal) => <MealCard key={meal.id} meal={meal} />)}
        </View>

        <View style={s.navigation}>
          <Pressable disabled={index === 0} onPress={() => selectIndex(index - 1)} style={[s.navButton, index === 0 && s.navDisabled]} accessibilityRole="button" accessibilityLabel="Previous day">
            <Text style={[s.navArrow, index === 0 && s.navDisabledText]}>‹</Text><Text style={[s.navLabel, index === 0 && s.navDisabledText]}>Previous</Text>
          </Pressable>
          <Pressable disabled={index === DAYS.length - 1} onPress={() => selectIndex(index + 1)} style={[s.navButton, s.nextButton, index === DAYS.length - 1 && s.navDisabled]} accessibilityRole="button" accessibilityLabel="Next day">
            <Text style={[s.navLabel, s.nextLabel, index === DAYS.length - 1 && s.navDisabledText]}>Next</Text><Text style={[s.navArrow, s.nextLabel, index === DAYS.length - 1 && s.navDisabledText]}>›</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Screen>;
}

const s = StyleSheet.create({
  page: { width: '100%' },
  hero: { paddingBottom: 26 },
  eyebrowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontFamily: fonts.semiBold, fontSize: 11, letterSpacing: 1.2, color: 'rgba(255,255,255,0.75)' },
  weekCost: { fontFamily: fonts.semiBold, fontSize: 17, color: colors.textOnPrimary },
  weekCostUnit: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  title: { marginTop: 12, fontFamily: fonts.semiBold, fontSize: 40, lineHeight: 48, color: colors.textOnPrimary },
  subtitle: { marginTop: 4, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: 'rgba(255,255,255,0.8)' },
  demoBadge: { alignSelf: 'flex-start', marginTop: 14, borderRadius: radii.pill, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6 },
  demoBadgeText: { fontFamily: fonts.semiBold, fontSize: 10, letterSpacing: 0.8, color: colors.textOnPrimary },
  plannerCard: { backgroundColor: colors.card, borderRadius: 32, padding: spacing.lg, paddingBottom: 20, minHeight: 580 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardKicker: { fontFamily: fonts.semiBold, fontSize: 11, letterSpacing: 1, color: colors.primaryDark },
  cardTitle: { marginTop: 5, fontFamily: fonts.semiBold, fontSize: 28, lineHeight: 34, color: colors.text },
  dayBadge: { backgroundColor: colors.chipBackgroundSelected, borderRadius: radii.pill, paddingHorizontal: 11, paddingVertical: 7 },
  dayBadgeText: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primaryDark },
  daySummary: { marginTop: 22, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  mealCount: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  dayHint: { flex: 1, textAlign: 'right', fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  meals: { gap: 16, paddingTop: 2 },
  navigation: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 28 },
  navButton: { flex: 1, minHeight: 44, borderRadius: radii.md, backgroundColor: colors.chipBackground, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  nextButton: { backgroundColor: colors.text },
  navArrow: { fontFamily: fonts.regular, fontSize: 26, lineHeight: 28, color: colors.text },
  navLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  nextLabel: { color: colors.textOnPrimary },
  navDisabled: { opacity: 0.45 },
  navDisabledText: { color: colors.textMuted },
  empty: { flex: 1, justifyContent: 'center', gap: 14 },
  emptyEyebrow: { fontFamily: fonts.semiBold, fontSize: 11, letterSpacing: 1.2, color: colors.primaryDark, textAlign: 'center' },
  emptyTitle: { fontFamily: fonts.semiBold, fontSize: 32, lineHeight: 40, color: colors.text, textAlign: 'center' },
  emptyText: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 23, color: colors.textMuted, textAlign: 'center', marginBottom: 10 },
});
