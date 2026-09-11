// app/meal-plan.tsx — 05 Weekly Meal Plan
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { DayTabs } from '../components/DayTabs';
import { MealCard } from '../components/MealCard';
import { useAppStore } from '../lib/store';
import { colors, fonts, radii, spacing } from '../theme';
import type { DayPlan } from '../lib/types';

const ALL_DAYS: DayPlan['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MealPlanScreen() {
  const mealPlan = useAppStore((s) => s.mealPlan);
  const generationError = useAppStore((s) => s.generationError);
  const [selectedDay, setSelectedDay] = useState<DayPlan['day']>('Mon');

  if (generationError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            Something went wrong generating your plan: {generationError}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!mealPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>No meal plan yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dayPlan = mealPlan.days.find((d) => d.day === selectedDay);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bon appetit!</Text>
        <View style={styles.costPill}>
          <Text style={styles.costText}>
            Est. cost €{mealPlan.weeklyCost} / week
          </Text>
        </View>
        <DayTabs
          days={ALL_DAYS}
          selectedDay={selectedDay}
          onSelect={setSelectedDay}
        />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Text style={styles.dayLabel}>{selectedDay}</Text>
        {dayPlan?.meals.map((meal) => (
          <MealCard key={meal.id} meal={meal} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.textOnPrimary,
    marginBottom: spacing.sm,
  },
  costPill: {
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  costText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  body: { flex: 1 },
  dayLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.text,
    marginTop: spacing.lg,
    marginLeft: spacing.lg,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
});
