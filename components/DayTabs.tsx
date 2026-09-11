import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';
import type { DayPlan } from '../lib/types';
export function DayTabs({ days, selectedDay, onSelect }: {
  days: DayPlan['day'][]; selectedDay: DayPlan['day']; onSelect: (day: DayPlan['day']) => void;
}) {
  return <View style={s.row} accessibilityRole="tablist">
    {days.map(day => <Pressable key={day} accessibilityRole="tab" aria-selected={day === selectedDay} accessibilityState={{ selected: day === selectedDay }}
      onPress={() => onSelect(day)} style={[s.tab, day === selectedDay && s.selected]}>
      <Text style={[s.label, day === selectedDay && s.selectedLabel]}>{day}</Text>
    </Pressable>)}
  </View>;
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, marginTop: 12 },
  tab: { flex: 1, minHeight: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: colors.card },
  selected: { backgroundColor: colors.text },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  selectedLabel: { color: colors.textOnPrimary },
});

