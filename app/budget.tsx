// app/budget.tsx — 02 Budget Selection
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ProgressHeader } from '../components/ProgressHeader';
import { BudgetSlider } from '../components/BudgetSlider';
import { Button } from '../components/Button';
import { useAppStore } from '../lib/store';
import { colors, fonts, spacing } from '../theme';

export default function BudgetScreen() {
  const router = useRouter();
  const budget = useAppStore((s) => s.budget);
  const setBudget = useAppStore((s) => s.setBudget);

  return (
    <SafeAreaView style={styles.container}>
      <ProgressHeader step={1} totalSteps={3} />

      <View style={styles.content}>
        <Text style={styles.title}>What's your budget?</Text>
        <BudgetSlider value={budget} onChange={setBudget} />
      </View>

      <Button
        title="Continue"
        onPress={() => router.push('/dietary-needs')}
        style={styles.button}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  title: { fontFamily: fonts.semiBold, fontSize: 20, color: colors.text },
  button: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
});
