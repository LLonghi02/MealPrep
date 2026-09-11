import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { OnboardingScreen, optionLayout } from "../components/OnboardingScreen";
import { OptionChip } from "../components/OptionChip";
import { generateMealPlan } from "../lib/generateMealPlan";
import { useAppStore } from "../lib/store";
import type { NutritionalGoal } from "../lib/types";

/*const OPTIONS: { value: NutritionalGoal; label: string; icon?: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'high_protein', label: 'High protein', icon: '🥩' },
  { value: 'low_sugar', label: 'Low sugar', icon: '🍯' },
  { value: 'low_fat', label: 'Low fat', icon: '🫑' },
  { value: 'low_carbs', label: 'Low carbs', icon: '🍝' },
  { value: 'low_salt', label: 'Low salt', icon: '🧂' },
];*/
import { assets } from "@/assets/figma";
import { ImageSourcePropType } from "react-native";

const OPTIONS: {
  value: NutritionalGoal;
  label: string;
  image?: ImageSourcePropType;
}[] = [
  {
    value: "none",
    label: "None",
  },
  {
    value: "high_protein",
    label: "High protein",
    image: assets.steak,
  },
  {
    value: "low_sugar",
    label: "Low sugar",
    image: assets.honey,
  },
  {
    value: "low_fat",
    label: "Low fat",
    image: assets.pepper,
  },
  {
    value: "low_carbs",
    label: "Low carbs",
    image: assets.pasta,
  },
  {
    value: "low_salt",
    label: "Low salt",
    image: assets.salt,
  },
];

export default function NutritionalGoalsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const selected = useAppStore((s) => s.nutritionalGoals);
  const confirmed = useAppStore((s) => s.nutritionConfirmed);
  const toggle = useAppStore((s) => s.toggleNutritionalGoal);
  const error = useAppStore((s) => s.generationError);
  const handleContinue = async () => {
    if (loading || !confirmed) return;
    setLoading(true);
    const state = useAppStore.getState();
    state.setGenerationError(null);
    try {
      const plan = await generateMealPlan(state);
      state.setMealPlan(plan);
      router.push("/meal-plan");
    } catch (err) {
      state.setGenerationError(
        err instanceof Error
          ? err.message
          : "Unable to generate your plan. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <OnboardingScreen
      title="Any nutritional goals?"
      step={3}
      disabled={!confirmed}
      loading={loading}
      error={error}
      onContinue={handleContinue}
    >
      <View style={optionLayout.grid}>
        {OPTIONS.map((option) => (
          <View key={option.value} style={optionLayout.cell}>
            <OptionChip
              {...option}
              selected={confirmed && selected.includes(option.value)}
              accessibilityRole="checkbox"
              onPress={() => toggle(option.value)}
            />
          </View>
        ))}
      </View>
    </OnboardingScreen>
  );
}
