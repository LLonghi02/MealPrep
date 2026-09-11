// components/BudgetSlider.tsx
// Slider per la selezione del budget settimanale (schermata 02).
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, fonts, spacing } from '../theme';

interface BudgetSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function BudgetSlider({
  value,
  onChange,
  min = 25,
  max = 150,
  step = 1,
}: BudgetSliderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.amount}>€{Math.round(value)}</Text>
      <Text style={styles.caption}>per week</Text>

      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.chipBackground}
        thumbTintColor={colors.card}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  amount: {
    fontFamily: fonts.bold,
    fontSize: 48,
    color: colors.text,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
