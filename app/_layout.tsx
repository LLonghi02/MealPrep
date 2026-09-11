// app/_layout.tsx
// Root layout: carica i font e definisce lo stack di navigazione.
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { fontFiles } from '../theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontFiles);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="budget" />
      <Stack.Screen name="dietary-needs" />
      <Stack.Screen name="nutritional-goals" />
      <Stack.Screen name="meal-plan" />
    </Stack>
  );
}
