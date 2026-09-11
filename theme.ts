// theme.ts
// Design tokens centralizzati: colori, font, spacing.
// I valori dei colori sono stimati dallo screenshot del template
// e vanno confermati/aggiustati con il file Figma originale.

export const colors = {
  primary: '#3DBA57',       // verde brand (bottoni, header schermata Meal Plan)
  primaryDark: '#2E9E45',
  background: '#FBFBF9',    // sfondo generale, quasi bianco
  card: '#FFFFFF',
  chipBackground: '#F1F1EF',
  chipBackgroundSelected: '#E4F6E8',
  border: '#E5E5E2',
  text: '#111111',
  textMuted: '#8A8A85',
  textOnPrimary: '#FFFFFF',
  disabled: '#D9D9D6',
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
