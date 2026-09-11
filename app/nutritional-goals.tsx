// app/nutritional-goals.tsx — 04 Nutritional Goals Selection
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ProgressHeader } from '../components/ProgressHeader';
import { OptionChip } from '../components/OptionChip';
import { Button } from '../components/Button';
import { useAppStore } from '../lib/store';
import { generateMealPlan } from '../lib/generateMealPlan';
import { colors, fonts, spacing } from '../theme';
import type { NutritionalGoal } from '../lib/types';

const OPTIONS: { value: NutritionalGoal; label: string; icon: string }[] = [
  { value: 'none', label: 'None', icon: '⬜️' },
  { value: 'high_protein', label: 'High protein', icon: '🍗' },
  { value: 'low_sugar', label: 'Low sugar', icon: '🍬' },
  { value: 'low_fat', label: 'Low fat', icon: '🥑' },
  { value: 'low_carbs', label: 'Low carbs', icon: '🍞' },
  { value: 'low_salt', label: 'Low salt', icon: '🧂' },
];

export default function NutritionalGoalsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { budget, dietaryNeeds, nutritionalGoal, setNutritionalGoal } =
    useAppStore((s) => ({
      budget: s.budget,
      dietaryNeeds: s.dietaryNeeds,
      nutritionalGoal: s.nutritionalGoal,
      setNutritionalGoal: s.setNutritionalGoal,
    }));
  const setMealPlan = useAppStore((s) => s.setMealPlan);
  const setGenerationError = useAppStore((s) => s.setGenerationError);

  const handleContinue = async () => {
    setIsLoading(true);
    setGenerationError(null);
    try {
      const plan = await generateMealPlan({ budget, dietaryNeeds, nutritionalGoal });
      setMealPlan(plan);
      router.push('/meal-plan');
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProgressHeader step={3} totalSteps={3} />

      <View style={styles.content}>
        <Text style={styles.title}>Any nutritional goals?</Text>

        <View style={styles.grid}>
          {OPTIONS.map((opt) => (
            <OptionChip
              key={opt.value}
              label={opt.label}
              icon={opt.icon}
              selected={nutritionalGoal === opt.value}
              onPress={() => setNutritionalGoal(opt.value)}
            />
          ))}
        </View>
      </View>

      <Button
        title="Continue"
        onPress={handleContinue}
        loading={isLoading}
        style={styles.button}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
});
