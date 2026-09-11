import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { OptionChip } from '../components/OptionChip';
import { OnboardingScreen, optionLayout } from '../components/OnboardingScreen';
import { useAppStore } from '../lib/store';
import type { DietaryNeed } from '../lib/types';

const OPTIONS: { value: DietaryNeed; label: string; icon?: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'veggie', label: 'Veggie', icon: '🥕' },
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
  { value: 'pescatarian', label: 'Pescatarian', icon: '🐟' },
  { value: 'gluten_free', label: 'Gluten free', icon: '🌾' },
  { value: 'dairy_free', label: 'Dairy free', icon: '🥛' },
];
export default function DietaryNeedsScreen() {
  const router = useRouter();
  const selected = useAppStore(s => s.dietaryNeeds);
  const confirmed = useAppStore(s => s.dietaryConfirmed);
  const select = useAppStore(s => s.setDietaryNeeds);
  return <OnboardingScreen title="Any dietary needs?" step={2} disabled={!confirmed} onContinue={() => router.push('/nutritional-goals')}>
    <View style={optionLayout.grid} accessibilityRole="radiogroup">
      {OPTIONS.map(option => <View key={option.value} style={optionLayout.cell}>
        <OptionChip {...option} selected={confirmed && selected === option.value} onPress={() => select(option.value)} />
      </View>)}
    </View>
  </OnboardingScreen>;
}

