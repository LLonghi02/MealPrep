import React from 'react';
import { Image, ImageSourcePropType, Pressable, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

export function OptionChip({ label, icon, image, selected, onPress }: {
  label: string;
  icon?: string;
  image?: ImageSourcePropType;
  selected: boolean;
  onPress: () => void;
}) {
  return <Pressable accessibilityRole="radio" aria-checked={selected} accessibilityState={{ checked: selected }} accessibilityLabel={label}
    onPress={onPress} style={({ pressed }) => [s.chip, selected && s.selected, pressed && s.pressed]}>
    {image ? <Image source={image} style={s.image} resizeMode="contain" /> : icon ? <Text style={s.icon}>{icon}</Text> : null}
    <Text style={s.label}>{label}</Text>
  </Pressable>;
}

const s = StyleSheet.create({
  chip: { width: '100%', height: 104, borderRadius: 20, backgroundColor: colors.chipBackground,
    alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderWidth: 2, borderColor: 'transparent' },
  selected: { borderColor: colors.primary, backgroundColor: colors.chipBackgroundSelected },
  pressed: { opacity: 0.8 },
  image: { width: 48, height: 48 },
  icon: { fontSize: 32, lineHeight: 36 },
  label: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22, color: colors.text, textAlign: 'center' },
});
