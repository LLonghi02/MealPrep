import { ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, spacing } from "../theme";
import { Button } from "./Button";
import { ProgressHeader } from "./ProgressHeader";

export function OnboardingScreen({
  title,
  step,
  children,
  onContinue,
  disabled,
  loading,
  error,
  loadingMessage,
}: {
  title: string;
  step: number;
  children: ReactNode;
  onContinue: () => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  loadingMessage?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={s.outer}>
      <View
        style={[
          s.canvas,
          {
            paddingTop: insets.top + 8,
            paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 23,
          },
        ]}
      >
        <ProgressHeader step={step} totalSteps={4} />
        <Text style={s.title} accessibilityRole="header">
          {title}
        </Text>

        {/* Only this middle region scrolls/centers; header and footer never move. */}
        <ScrollView
          style={s.body}
          contentContainerStyle={s.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {error ? (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        ) : null}
        {loadingMessage}
        <Button
          title="Continue"
          onPress={onContinue}
          disabled={disabled}
          loading={loading}
        />
      </View>
    </View>
  );
}

export const optionLayout = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  cell: { flexGrow: 1, flexBasis: "45%" },
});

const s = StyleSheet.create({
  outer: { flex: 1, backgroundColor: colors.background },
  canvas: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 32,
    lineHeight: 37,
    minHeight: 45,
    marginTop: 20,
    color: colors.text,
  },
  body: { flex: 1 },
  bodyContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: spacing.lg,
  },
  error: {
    color: "#A3312B",
    fontFamily: fonts.regular,
    fontSize: 14,
    marginBottom: 16,
  },
});
