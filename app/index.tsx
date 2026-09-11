import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { GroceryEntrance } from '../components/GroceryEntrance';
import { colors, fonts } from '../theme';

export default function LanderScreen() {
  const router = useRouter();
  return <Screen>
    <Text style={s.title} accessibilityRole="header">MealPrep</Text>
    <View style={s.art}><GroceryEntrance /></View>
    <Button title="Create your meal plan" onPress={() => router.push('/budget')} />
  </Screen>;
}
const s = StyleSheet.create({
  title: { fontFamily: fonts.semiBold, fontSize: 48, lineHeight: 55, minHeight: 67, color: colors.text, textAlign: 'center' },
  art: { flex: 1, minHeight: 450, justifyContent: 'center', alignItems: 'center', paddingBottom: 28 },
});

