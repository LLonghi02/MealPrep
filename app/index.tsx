// app/index.tsx — 01 Lander
import React from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../components/Button';
import { colors, fonts, spacing } from '../theme';

export default function LanderScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>MealPrep</Text>

        {/* Sostituisci con l'illustrazione reale (borsa + frutta/verdura) */}
        <Image
          source={require('../assets/images/lander-illustration.png')}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      <Button
        title="Create your meal plan"
        onPress={() => router.push('/budget')}
        style={styles.button}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  illustration: {
    width: 240,
    height: 240,
  },
  button: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
});
