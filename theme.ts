// theme.ts
// Design tokens centralizzati: colori, font, spacing.
// Matched to mealprep_design, Figma page 0:1.

export const colors = {
  primary: '#34C759',
  primaryDark: '#2E9E45',
  background: '#FDFFFB',
  card: '#FFFFFF',
  chipBackground: '#F2F2F7',
  chipBackgroundSelected: '#E4F6E8',
  border: '#E5E5E2',
  text: '#000000',
  textMuted: 'rgba(60,60,67,0.6)',
  textOnPrimary: '#FFFFFF',
  disabled: '#F2F2F7',
  disabledText: 'rgba(60,60,67,0.18)',
} as const;

export const fonts = {
  light: 'Promo-Light',
  regular: 'Promo-Regular',
  medium: 'Promo-Medium',
  semiBold: 'Promo-SemiBold',
  bold: 'Promo-Bold',
} as const;

export const fontFiles = {
  'Promo-Light': require('./assets/fonts/Promo-Light.ttf'),
  'Promo-Regular': require('./assets/fonts/Promo-Regular.ttf'),
  'Promo-Medium': require('./assets/fonts/Promo-Medium.ttf'),
  'Promo-SemiBold': require('./assets/fonts/Promo-SemiBold.ttf'),
  'Promo-Bold': require('./assets/fonts/Promo-Bold.ttf'),
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const typography = {
  h1: { fontFamily: fonts.bold, fontSize: 28 },
  h2: { fontFamily: fonts.semiBold, fontSize: 20 },
  body: { fontFamily: fonts.regular, fontSize: 16 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 16 },
  caption: { fontFamily: fonts.regular, fontSize: 13 },
} as const;
