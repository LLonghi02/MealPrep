import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from './Screen';
import { ProgressHeader } from './ProgressHeader';
import { Button } from './Button';
import { colors, fonts } from '../theme';

export function OnboardingScreen({ title, step, children, onContinue, disabled, loading, error }: {
  title: string; step: number; children: ReactNode; onContinue: () => void;
  disabled?: boolean; loading?: boolean; error?: string | null;
}) {
  return <Screen>
    <ProgressHeader step={step} totalSteps={4} />
    <Text style={s.title} accessibilityRole="header">{title}</Text>
    <View style={s.body}>{children}</View>
    {error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Button title="Continue" onPress={onContinue} disabled={disabled} loading={loading} />
  </Screen>;
}
export const optionLayout = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  cell: { flexGrow: 1, flexBasis: '45%' },
});
const s = StyleSheet.create({
  title: { fontFamily: fonts.semiBold, fontSize: 32, lineHeight: 37, minHeight: 45, marginTop: 20, color: colors.text },
  body: { flex: 1, minHeight: 0, justifyContent: 'center', paddingVertical: 24, marginBottom: 24 },
  error: { color: '#A3312B', fontFamily: fonts.regular, fontSize: 14, marginBottom: 16 },
});
