import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../theme";
import Slider from "./SliderControl";

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 8;
const SLIDER_HEIGHT = 64;

function budgetNote(value: number) {
  if (value < 55) return "Big flavour, clever staples";
  if (value < 100) return "Fresh variety, week after week";
  return "More choice for every plate";
}

export function BudgetSlider({
  value,
  onChange,
  min = 25,
  max = 150,
  step = 1,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [width, setWidth] = useState(0);
  const progress = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const travel = Math.max(0, width - THUMB_SIZE);
  const thumbLeft = progress * travel;
  const fillWidth = thumbLeft + THUMB_SIZE / 2;

  return (
    <View style={s.container}>
      <Text nativeID="budget-amount" style={s.amount}>
        €{Math.round(value)}
      </Text>
      <Text style={s.caption}>per week</Text>

      <View
        style={s.sliderArea}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        <View pointerEvents="none" style={s.track} />
        <View
          pointerEvents="none"
          style={[s.trackFill, { width: fillWidth }]}
        />
        <View pointerEvents="none" style={[s.thumb, { left: thumbLeft }]} />
        <Slider
          accessibilityLabel="Weekly budget"
          accessibilityValue={{
            min,
            max,
            now: value,
            text: `€${value} per week`,
          }}
          style={s.input}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={value}
          onValueChange={onChange}
          minimumTrackTintColor="transparent"
          maximumTrackTintColor="transparent"
          thumbTintColor="transparent"
        />
      </View>

      <View style={s.rangeRow}>
        <Text style={s.rangeLabel}>€{min}</Text>
        <Text style={s.rangeLabel}>€{max}</Text>
      </View>
      <View style={s.hintRow}>
        <Text style={s.hintLabel}>Drag to fine-tune</Text>
        <Text style={s.hintNote}>{budgetNote(value)}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: "center",
    //paddingHorizontal: 4,
    //transform: [{ translateY: -6 }],
  },
  amount: {
    fontFamily: fonts.semiBold,
    fontSize: 96,
    lineHeight: 110,
    height: 134,
    color: "#1A1A1A",
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 20,
    lineHeight: 18,
    height: 28,
    color: colors.textMuted,
    marginTop: -19,
  },
  sliderArea: { width: "100%", height: SLIDER_HEIGHT, marginTop: 58 },
  track: {
    position: "absolute",
    top: (SLIDER_HEIGHT - TRACK_HEIGHT) / 2,
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.chipBackground,
  },
  trackFill: {
    position: "absolute",
    top: (SLIDER_HEIGHT - TRACK_HEIGHT) / 2,
    left: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: "absolute",
    top: (SLIDER_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 4,
    borderColor: colors.primary,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  input: { width: "100%", height: SLIDER_HEIGHT },
  rangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  rangeLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  hintRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 6,
  },
  hintLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  hintNote: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primary,
  },
});
