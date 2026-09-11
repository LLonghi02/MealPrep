import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { DayTabs } from '../components/DayTabs';
import { MealCard } from '../components/MealCard';
import { useAppStore } from '../lib/store';
import { colors, fonts } from '../theme';
import type { DayPlan } from '../lib/types';

const DAYS: DayPlan['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export default function MealPlanScreen() {
  const router = useRouter();
  const plan = useAppStore(s => s.mealPlan);
  const error = useAppStore(s => s.generationError);
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const pager = useRef<ScrollView>(null);
  if (!plan) return <Screen><View style={s.empty}>
    <Text style={s.emptyText}>{error || 'Create your meal plan to see your week here.'}</Text>
    <Button title="Create your meal plan" onPress={() => router.replace('/budget')} />
  </View></Screen>;

  const select = (day: DayPlan['day']) => {
    const next = DAYS.indexOf(day);
    setIndex(next);
    pager.current?.scrollTo({ x: next * width, animated: false });
  };
  return <Screen green>
    <Text style={s.title}>Bon appetit!</Text>
    <View style={s.cost}><Text style={s.costLabel}>Est. cost</Text>
      <View style={s.costRow}><Text style={s.costAmount}>€{plan.weeklyCost.toFixed(0)}</Text><Text style={s.costUnit}>/ week</Text></View>
    </View>
    <DayTabs days={DAYS} selectedDay={DAYS[index]} onSelect={select} />
    <View style={s.carousel} onLayout={event => {
      const nextWidth = event.nativeEvent.layout.width;
      setWidth(nextWidth);
      pager.current?.scrollTo({ x: index * nextWidth, animated: false });
    }}>
      {width > 0 && <ScrollView ref={pager} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={event => setIndex(Math.max(0, Math.min(6, Math.round(event.nativeEvent.contentOffset.x / width))))}>
        {DAYS.map((day, i) => <View key={day} style={{ width, paddingHorizontal: 8 }}>
          <View style={s.dayCard}>
            <Text style={s.dayTitle}>{NAMES[i]}</Text>
            {plan.days.find(d => d.day === day)?.meals.map(meal => <MealCard key={meal.id} meal={meal} />)}
          </View>
        </View>)}
      </ScrollView>}
    </View>
  </Screen>;
}
const s = StyleSheet.create({
  title: { fontFamily: fonts.semiBold, fontSize: 40, lineHeight: 56, color: colors.textOnPrimary, textAlign: 'center' },
  cost: { backgroundColor: colors.card, borderRadius: 16, minHeight: 72, marginTop: 12, padding: 8, alignItems: 'center', justifyContent: 'center' },
  costLabel: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22, color: colors.textMuted },
  costRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  costAmount: { fontFamily: fonts.medium, fontSize: 24, lineHeight: 34 },
  costUnit: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  carousel: { marginTop: 32, flexGrow: 1 },
  dayCard: { flex: 1, minHeight: 546, backgroundColor: colors.card, borderRadius: 32, padding: 24, gap: 28 },
  dayTitle: { fontFamily: fonts.semiBold, fontSize: 24, lineHeight: 33 },
  empty: { flex: 1, justifyContent: 'center', gap: 24 },
  emptyText: { fontFamily: fonts.medium, fontSize: 20, textAlign: 'center' },
});

