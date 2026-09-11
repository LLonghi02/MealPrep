import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { OptionChip } from '../components/OptionChip';
import { OnboardingScreen, optionLayout } from '../components/OnboardingScreen';
import { useAppStore } from '../lib/store';
import { generateMealPlan } from '../lib/generateMealPlan';
import type { NutritionalGoal } from '../lib/types';

const OPTIONS: { value: NutritionalGoal; label: string; icon?: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'high_protein', label: 'High protein', icon: '🥩' },
  { value: 'low_sugar', label: 'Low sugar', icon: '🍯' },
  { value: 'low_fat', label: 'Low fat', icon: '🫑' },
  { value: 'low_carbs', label: 'Low carbs', icon: '🍝' },
  { value: 'low_salt', label: 'Low salt', icon: '🧂' },
];
export default function NutritionalGoalsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const selected = useAppStore(s => s.nutritionalGoal);
  const confirmed = useAppStore(s => s.nutritionConfirmed);
  const select = useAppStore(s => s.setNutritionalGoal);
  const error = useAppStore(s => s.generationError);
  const handleContinue = async () => {
    if (loading || !confirmed) return;
    setLoading(true);
    const state = useAppStore.getState();
    state.setGenerationError(null);
    try {
      const plan = await generateMealPlan(state);
      state.setMealPlan(plan);
      router.push('/meal-plan');
    } catch (err) {
      state.setGenerationError(err instanceof Error ? err.message : 'Unable to generate your plan. Please try again.');
    } finally { setLoading(false); }
  };
  return <OnboardingScreen title="Any nutritional goals?" step={3} disabled={!confirmed} loading={loading} error={error} onContinue={handleContinue}>
    <View style={optionLayout.grid} accessibilityRole="radiogroup">
      {OPTIONS.map(option => <View key={option.value} style={optionLayout.cell}>
        <OptionChip {...option} selected={confirmed && selected === option.value} onPress={() => select(option.value)} />
      </View>)}
    </View>
  </OnboardingScreen>;
}

