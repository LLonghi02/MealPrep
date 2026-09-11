import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { assets } from "../assets/figma";

// Distances in illustration points, durations in milliseconds.
export const ENTRANCE = {
  jumpHeight: 30,
  delay: 180,
  foodDuration: 780,
  stagger: 40,
};
const FOODS = [
  { key: "apple", image: assets.apple, x: -104, y: -110, angle: -12 },
  { key: "cheese", image: assets.cheese, x: -147, y: 10, angle: -16 },
  { key: "corn", image: assets.corn, x: -99, y: 148, angle: -14 },
  { key: "eggplant", image: assets.eggplant, x: 22, y: 185, angle: 12 },
  { key: "tomato", image: assets.tomato, x: 132, y: 128, angle: 16 },
  { key: "carrot", image: assets.carrot, x: 140, y: -23, angle: 18 },
  { key: "steak", image: assets.steak, x: 62, y: -127, angle: 10 },
  { key: "avocado", image: assets.avocado, x: -22, y: -148, angle: -2 },
] as const;
const driver = { useNativeDriver: Platform.OS !== "web", isInteraction: false };

export function GroceryEntrance() {
  const jump = useRef(new Animated.Value(0)).current;
  const squash = useRef(new Animated.Value(0)).current;
  const tilt = useRef(new Animated.Value(0)).current;
  const food = useRef(FOODS.map(() => new Animated.Value(0))).current;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let preferenceChanged = false;
      let animation: Animated.CompositeAnimation | undefined;
      const timing = (
        value: Animated.Value,
        toValue: number,
        duration: number,
        easing = Easing.inOut(Easing.cubic),
      ) => Animated.timing(value, { toValue, duration, easing, ...driver });
      const rest = () => {
        animation?.stop();
        jump.setValue(0);
        squash.setValue(0);
        tilt.setValue(0);
        food.forEach((value) => value.setValue(1));
      };
      jump.setValue(0);
      squash.setValue(0);
      tilt.setValue(0);
      food.forEach((value) => value.setValue(0));
      const start = (reduced: boolean) => {
        if (!active) return;
        if (reduced) {
          rest();
          return;
        }
        animation = Animated.sequence([
          Animated.delay(ENTRANCE.delay),
          Animated.parallel([timing(squash, 1, 115), timing(tilt, -1, 115)]),
          Animated.parallel([
            timing(jump, 1, 190, Easing.out(Easing.quad)),
            timing(squash, -0.5, 190),
            timing(tilt, 1, 190),
          ]),
          Animated.parallel([
            timing(jump, 0, 165, Easing.in(Easing.quad)),
            timing(squash, 0.8, 165),
            timing(tilt, -0.35, 165),
          ]),
          // Launch only on impact. The opaque bag front occludes the starting positions.
          Animated.parallel([
            Animated.spring(squash, {
              toValue: 0,
              stiffness: 240,
              damping: 13,
              mass: 0.7,
              ...driver,
            }),
            Animated.spring(tilt, {
              toValue: 0,
              stiffness: 180,
              damping: 12,
              ...driver,
            }),
            Animated.stagger(
              ENTRANCE.stagger,
              food.map((value) =>
                timing(value, 1, ENTRANCE.foodDuration, Easing.linear),
              ),
            ),
          ]),
        ]);
        animation.start();
      };
      // Web listens directly to the media query; native uses the OS accessibility setting.
      const media =
        Platform.OS === "web" && typeof window !== "undefined"
          ? window.matchMedia("(prefers-reduced-motion: reduce)")
          : null;
      const onPreference = (reduced: boolean) => {
        preferenceChanged = true;
        if (active && reduced) rest();
      };
      const onMedia = (event: MediaQueryListEvent) =>
        onPreference(event.matches);
      const subscription = media
        ? null
        : AccessibilityInfo.addEventListener(
            "reduceMotionChanged",
            onPreference,
          );
      media?.addEventListener("change", onMedia);
      if (media) start(media.matches);
      else
        AccessibilityInfo.isReduceMotionEnabled()
          .then((value) => {
            if (!preferenceChanged) start(value);
          })
          .catch(() => {
            if (active) rest();
          });
      return () => {
        active = false;
        animation?.stop();
        subscription?.remove();
        media?.removeEventListener("change", onMedia);
      };
    }, [jump, squash, tilt, food]),
  );

  const { width } = useWindowDimensions();
  const scale = Math.min(1, Math.max(0.5, (width - 40) / 353));
  return (
    <View
      style={{ width: 353 * scale, height: 400 * scale }}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={[
          s.scene,
          { transform: [{ scale }], transformOrigin: "top left" },
        ]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                {
                  translateY: jump.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -ENTRANCE.jumpHeight],
                  }),
                },
                {
                  rotate: tilt.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ["-3deg", "3deg"],
                  }),
                },
                {
                  scaleX: squash.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [0.97, 1, 1.04],
                  }),
                },
                {
                  scaleY: squash.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [1.04, 1, 0.96],
                  }),
                },
              ],
              transformOrigin: "176px 290px",
            },
          ]}
        >
          <Image source={assets.bag} style={s.bag} />
          {FOODS.map((item, index) => {
            const progress = food[index];
            const inputRange = Array.from({ length: 41 }, (_, i) => i / 40);
            const horizontal = inputRange.map((t) => {
              const u = Math.max(0, (t - 0.16) / 0.84);
              return item.x * (1 - Math.pow(1 - u, 3));
            });
            // Cubic flight rises out of the mouth before fanning out to the Figma positions.
            const vertical = inputRange.map((t) => {
              const u = 1 - Math.pow(1 - t, 2);
              return (
                -210 * 3 * (1 - u) ** 2 * u +
                (item.y - 60) * 3 * (1 - u) * u ** 2 +
                item.y * u ** 3
              );
            });
            return (
              <Animated.View
                key={item.key}
                style={[
                  s.food,
                  {
                    transform: [
                      {
                        translateX: progress.interpolate({
                          inputRange,
                          outputRange: horizontal,
                        }),
                      },
                      {
                        translateY: progress.interpolate({
                          inputRange,
                          outputRange: vertical,
                        }),
                      },
                      {
                        rotate: progress.interpolate({
                          inputRange: [0, 0.55, 1],
                          outputRange: ["0deg", `${item.angle}deg`, "0deg"],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Image
                  source={item.image}
                  style={s.foodImage}
                  resizeMode="contain"
                />
              </Animated.View>
            );
          })}
          {/* Repeat the exact exported image below the opening as an occlusion layer. */}
          <View style={s.front}>
            <Image source={assets.bag} style={s.frontImage} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  scene: { width: 353, height: 400 },
  bag: { position: "absolute", left: 77, top: 90, width: 200, height: 200 },
  food: { position: "absolute", left: 154, top: 158, width: 44, height: 44 },
  foodImage: { width: 44, height: 44 },
  front: {
    position: "absolute",
    left: 77,
    top: 145,
    width: 200,
    height: 145,
    overflow: "hidden",
  },
  frontImage: { position: "absolute", width: 200, height: 200, top: -55 },
});
