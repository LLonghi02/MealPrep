// components/DayTabs.tsx
// Tab Mon-Sun nella schermata Weekly Meal Plan.
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';
import type { DayPlan } from '../lib/types';

interface DayTabsProps {
  days: DayPlan['day'][];
  selectedDay: DayPlan['day'];
  onSelect: (day: DayPlan['day']) => void;
}

export function DayTabs({ days, selectedDay, onSelect }: DayTabsProps) {
  return (
    <View style={styles.row}>
      {days.map((day) => {
        const isSelected = day === selectedDay;
        return (
          <Pressable
            key={day}
            onPress={() => onSelect(day)}
            style={[styles.tab, isSelected && styles.tabSelected]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {day}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginHorizontal: 2,
    borderRadius: radii.sm,
  },
  tabSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  labelSelected: {
    color: colors.textOnPrimary,
    fontFamily: fonts.semiBold,
  },
});
