import { useRouter } from "expo-router";
import { View } from "react-native";
import { OnboardingScreen, optionLayout } from "../components/OnboardingScreen";
import { OptionChip } from "../components/OptionChip";
import { useAppStore } from "../lib/store";
import type { DietaryNeed } from "../lib/types";

import { assets } from "@/assets/figma";
import { ImageSourcePropType } from "react-native";
const OPTIONS: {
  value: DietaryNeed;
  label: string;
  image?: ImageSourcePropType;
}[] = [
  {
    value: "none",
    label: "None",
  },
  {
    value: "veggie",
    label: "Veggie",
    image: assets.carrot,
  },
  {
    value: "vegan",
    label: "Vegan",
    image: assets.vegan,
  },
  {
    value: "pescatarian",
    label: "Pescatarian",
    image: assets.fish,
  },
  {
    value: "gluten_free",
    label: "Gluten free",
    image: assets.glutenFree,
  },
  {
    value: "dairy_free",
    label: "Dairy free",
    image: assets.dairyFree,
  },
];

export default function DietaryNeedsScreen() {
  const router = useRouter();
  const selected = useAppStore((s) => s.dietaryNeeds);
  const confirmed = useAppStore((s) => s.dietaryConfirmed);
  const select = useAppStore((s) => s.setDietaryNeeds);
  return (
    <OnboardingScreen
      title="Any dietary needs?"
      step={2}
      disabled={!confirmed}
      onContinue={() => router.push("/nutritional-goals")}
    >
      <View style={optionLayout.grid} accessibilityRole="radiogroup">
        {OPTIONS.map((option) => (
          <View key={option.value} style={optionLayout.cell}>
            <OptionChip
              {...option}
              selected={confirmed && selected === option.value}
              onPress={() => select(option.value)}
            />
          </View>
        ))}
      </View>
    </OnboardingScreen>
  );
}
