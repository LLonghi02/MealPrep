import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { BudgetSlider } from '../components/BudgetSlider';
import { useAppStore } from '../lib/store';
export default function BudgetScreen() {
  const router = useRouter();
  const budget = useAppStore(s => s.budget);
  const setBudget = useAppStore(s => s.setBudget);
  return <OnboardingScreen title="What’s your budget?" step={1} onContinue={() => router.push('/dietary-needs')}>
    <BudgetSlider value={budget} onChange={setBudget} />
  </OnboardingScreen>;
}

