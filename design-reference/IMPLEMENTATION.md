# Figma implementation

Source: https://www.figma.com/design/O8K1ITc5UmIqV59cAVnAdo/mealprep_design?node-id=0-1

Design context retrieved for: 1:2 (Lander), 1:3 (Budget), 1:309 (Dietary needs),
14:126 (Nutritional goals), 15:181 (Weekly meal plan).
Adapted to Expo 57, React Native, Expo Router, StyleSheet and the existing Zustand store.

## Files changed during this implementation

- app/index.tsx: Figma landing layout and existing entrance animation.
- app/budget.tsx: shared onboarding layout and working budget control.
- app/dietary-needs.tsx: option grid, explicit selection and disabled Continue.
- app/nutritional-goals.tsx: matching grid, loading and visible generation errors.
- app/meal-plan.tsx: estimated cost, weekday tabs, responsive swipeable day cards and empty state.
- components/Button.tsx: 72-point buttons and disabled text styling.
- components/BudgetSlider.tsx: large amount and 64-point thumb presentation.
- components/ProgressHeader.tsx: exported back icon and Figma progress fills.
- components/OptionChip.tsx: centered 104-point option tiles with selection semantics.
- components/DayTabs.tsx: black selected day, white unselected days and accessible selection.
- components/MealCard.tsx: exported metadata icons, real ingredients and recipe steps.
- components/GroceryEntrance.tsx: Figma bag and food positions, retained jump/launch sequence, decorative accessibility.
- components/Screen.tsx (new): shared safe areas, scroll support and maximum desktop width.
- components/OnboardingScreen.tsx (new): shared title, progress, body, error and action layout.
- components/SliderControl.tsx (new): existing native slider adapter.
- components/SliderControl.web.tsx (new): keyboard-accessible HTML range and budget highlight.
- theme.ts: verified Figma colors and disabled text token.
- lib/store.ts: initial budget 82 and explicit confirmation flags.
- lib/generateMealPlan.ts: readable error when generation credentials are absent.
- assets/figma/index.ts and assets/figma/README.md: local asset references and provenance.

Five exact Figma PNG exports were added: bag.png, back.png, clock.png, user.png, cash.png.
Separately added food PNGs were preserved. No new dependency was introduced.

The temporary app/visual-check.tsx route used for visual QA was removed.

## Validation

- TypeScript: node node_modules/typescript/bin/tsc --noEmit
- Web build: node node_modules/expo/bin/cli export --platform web --output-dir dist
- Whitespace: git diff --check
- Browser: 393x852 mobile and 1280x800 desktop.
- Budget mouse and keyboard interaction; explicit option selection; disabled/enabled actions;
  back navigation with preserved choices; visible configuration error; weekday switching and
  card positioning after viewport resize.
- Weekly plan was checked with temporary fixture data, not a live AI response.
- No lint or test script is configured in package.json.
- Native-device rendering and OS reduced-motion settings were not exercised on a physical device.

## Differences and runtime requirements

- Figma's iPhone status bar/Dynamic Island are not drawn as app UI.
- Desktop uses a centered canvas with a 480-point maximum width; Figma only specifies mobile frames.
- Weekdays use chronological order (Figma swaps Wednesday and Thursday).
- Ingredients and recipes are real plan content rather than the gray empty bars in Figma.
- Selection, loading and error states are functional extensions where Figma provides only the initial state.
- Option emoji rendering follows the operating system. Some emoji PNG exports were empty.
- Landing uses the food PNGs subsequently added to the project, including tomato and avocado;
  those differ from the original seven Figma emoji layers.
- The budget highlight uses CSS on web; native keeps legible solid text.
- Live meal generation requires the existing generation service configuration, which is absent
  in this environment. The UI reports that state; no production dummy plan is supplied.

Animation tuning remains in ENTRANCE in components/GroceryEntrance.tsx:
jumpHeight controls lift; foodDuration controls flight duration; stagger controls launch spacing.
