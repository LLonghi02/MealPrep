// app/dietary-needs.tsx — 03 Dietary Needs Selection
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ProgressHeader } from '../components/ProgressHeader';
import { OptionChip } from '../components/OptionChip';
import { Button } from '../components/Button';
import { useAppStore } from '../lib/store';
import { colors, fonts, spacing } from '../theme';
import type { DietaryNeed } from '../lib/types';

const OPTIONS: { value: DietaryNeed; label: string; icon: string }[] = [
  { value: 'none', label: 'None', icon: '⬜️' },
  { value: 'veggie', label: 'Veggie', icon: '🥦' },
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
  { value: 'pescatarian', label: 'Pescatarian', icon: '🐟' },
  { value: 'gluten_free', label: 'Gluten free', icon: '🌾' },
  { value: 'dairy_free', label: 'Dairy free', icon: '🥛' },
];

export default function DietaryNeedsScreen() {
  const router = useRouter();
  const dietaryNeeds = useAppStore((s) => s.dietaryNeeds);
  const setDietaryNeeds = useAppStore((s) => s.setDietaryNeeds);

  return (
    <SafeAreaView style={styles.container}>
      <ProgressHeader step={2} totalSteps={3} />

      <View style={styles.content}>
        <Text style={styles.title}>Any dietary needs?</Text>

        <View style={styles.grid}>
          {OPTIONS.map((opt) => (
            <OptionChip
              key={opt.value}
              label={opt.label}
              icon={opt.icon}
              selected={dietaryNeeds === opt.value}
              onPress={() => setDietaryNeeds(opt.value)}
            />
          ))}
        </View>
      </View>

      <Button
        title="Continue"
        onPress={() => router.push('/nutritional-goals')}
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
