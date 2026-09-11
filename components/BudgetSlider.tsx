import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from './SliderControl';
import { colors, fonts } from '../theme';

export function BudgetSlider({ value, onChange, min = 25, max = 180, step = 1 }: {
  value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number;
}) {
  const [width, setWidth] = useState(0);
  const progress = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return <View style={s.container}>
    <Text nativeID="budget-amount" style={s.amount}>€{Math.round(value)}</Text>
    <Text style={s.caption}>per week</Text>
    <View style={s.sliderArea} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      <View pointerEvents="none" style={s.track} />
      <View pointerEvents="none" style={[s.thumb, { left: progress * Math.max(0, width - 64) }]} />
      <Slider accessibilityLabel="Weekly budget" accessibilityValue={{ min, max, now: value, text: `€${value} per week` }}
        style={s.input} minimumValue={min} maximumValue={max} step={step} value={value}
        onValueChange={onChange} minimumTrackTintColor="transparent" maximumTrackTintColor="transparent" thumbTintColor="transparent" />
    </View>
  </View>;
}
const s = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 4, transform: [{ translateY: -6 }] },
  amount: { fontFamily: fonts.semiBold, fontSize: 96, lineHeight: 110, height: 134, color: '#1A1A1A' },
  caption: { fontFamily: fonts.medium, fontSize: 20, lineHeight: 18, height: 28, color: colors.textMuted, marginTop: -19 },
  sliderArea: { width: '100%', height: 64, marginTop: 58 },
  track: { position: 'absolute', top: 24, left: 0, right: 0, height: 16, borderRadius: 99, backgroundColor: colors.chipBackground },
  thumb: { position: 'absolute', top: 0, width: 64, height: 64, borderRadius: 99, backgroundColor: colors.chipBackground },
  input: { width: '100%', height: 64 },
});

