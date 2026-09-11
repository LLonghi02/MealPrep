// components/ProgressHeader.tsx
// Barra di progresso + back button usata nelle schermate 02-04.
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radii, spacing } from '../theme';

interface ProgressHeaderProps {
  step: number;   // 1-based
  totalSteps: number;
  onBack?: () => void;
}

export function ProgressHeader({ step, totalSteps, onBack }: ProgressHeaderProps) {
  const router = useRouter();
  const progress = step / totalSteps;

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack ?? (() => router.back())} hitSlop={12}>
        <View style={styles.backChevron} />
      </Pressable>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backChevron: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.text,
    transform: [{ rotate: '45deg' }],
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.chipBackground,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
});
