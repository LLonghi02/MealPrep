import React from 'react';
import { Image, View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme';
import { assets } from '../assets/figma';

export function ProgressHeader({ step, totalSteps, onBack }: { step: number; totalSteps: number; onBack?: () => void }) {
  const router = useRouter();
  // Figma's 86/172/258-point fills sit in a 315-point track.
  const progress = Math.min(1, Math.max(0, (step / totalSteps) * (345 / 315)));
  return <View style={s.row}>
    <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8}
      onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.replace('/'))} style={s.back}>
      <Image source={assets.back} style={s.icon} />
    </Pressable>
    <View style={s.track} accessibilityRole="progressbar" aria-label="Meal plan setup" aria-valuemin={0} aria-valuemax={totalSteps} aria-valuenow={step} accessibilityValue={{ min: 0, max: totalSteps, now: step }}>
      <View style={[s.fill, { width: `${progress * 100}%` }]}><View style={s.shine} /></View>
    </View>
  </View>;
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { width: 28, height: 28, borderRadius: 99, backgroundColor: colors.chipBackground, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 28, height: 28 },
  track: { flex: 1, height: 20, borderRadius: 99, backgroundColor: colors.chipBackground, overflow: 'hidden' },
  fill: { height: 20, borderRadius: 99, backgroundColor: colors.primary },
  shine: { height: 6, marginTop: 3, marginHorizontal: 12, borderRadius: 99, backgroundColor: '#FFFFFF55' },
});

