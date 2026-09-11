// app/_layout.tsx
// Root layout: carica i font e definisce lo stack di navigazione.
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { fontFiles } from "../theme";

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontFiles);

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
