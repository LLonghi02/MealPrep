import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

/** Figma's food symbols are text emoji layers, not vector icons. */
export function OptionChip({ label, icon, selected, onPress }: {
  label: string; icon?: string; selected: boolean; onPress: () => void;
}) {
  return <Pressable accessibilityRole="radio" aria-checked={selected} accessibilityState={{ checked: selected }} accessibilityLabel={label}
    onPress={onPress} style={({ pressed }) => [s.chip, selected && s.selected, pressed && s.pressed]}>
    {icon && <Text style={s.icon}>{icon}</Text>}
    <Text style={s.label}>{label}</Text>
  </Pressable>;
}
const s = StyleSheet.create({
  chip: { width: '100%', minHeight: 104, borderRadius: 20, backgroundColor: colors.chipBackground,
    alignItems: 'center', justifyContent: 'center', gap: 4, padding: 12, borderWidth: 2, borderColor: 'transparent' },
  selected: { borderColor: colors.primary, backgroundColor: colors.chipBackgroundSelected },
  pressed: { opacity: 0.8 },
  icon: { fontSize: 32, lineHeight: 36 },
  label: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22, color: colors.text, textAlign: 'center' },
});

