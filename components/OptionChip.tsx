// components/OptionChip.tsx
// Chip selezionabile riutilizzata in Dietary Needs (03) e Nutritional Goals (04).
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';

interface OptionChipProps {
  label: string;
  icon?: string;       // emoji o carattere semplice come placeholder icona
  selected: boolean;
  onPress: () => void;
}

export function OptionChip({ label, icon, selected, onPress }: OptionChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexBasis: '48%',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chipBackground,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.chipBackgroundSelected,
    borderColor: colors.primary,
  },
  icon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  labelSelected: {
    color: colors.primaryDark,
  },
});
