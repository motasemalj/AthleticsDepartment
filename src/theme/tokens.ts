/**
 * Athletics Department design tokens.
 * Premium dark theme with a volt accent — high contrast, WCAG AA on all text pairings.
 */

export const palette = {
  // Base
  ink950: '#07080A',
  ink900: '#0B0D10',
  ink850: '#101318',
  ink800: '#14171D',
  ink750: '#191D24',
  ink700: '#1F242C',
  ink600: '#2A303A',
  ink500: '#3A414D',
  ink400: '#59626F',
  ink300: '#8B939F',
  ink200: '#B7BDC7',
  ink100: '#DDE1E6',
  ink50: '#F4F6F8',
  white: '#FFFFFF',

  // Accent — volt
  volt300: '#E3FF8F',
  volt400: '#D3F95E',
  volt500: '#C6F33B',
  volt600: '#A8D426',
  volt700: '#7EA317',

  // Secondary — electric violet (used sparingly for coach/analytics accents)
  violet300: '#C4B5FD',
  violet400: '#A78BFA',
  violet500: '#8B5CF6',
  violet600: '#7C3AED',

  // Semantic
  green400: '#4ADE80',
  green500: '#22C55E',
  amber400: '#FBBF24',
  amber500: '#F59E0B',
  red400: '#F87171',
  red500: '#EF4444',
  blue400: '#60A5FA',
  blue500: '#3B82F6',
  cyan400: '#22D3EE',
  orange400: '#FB923C',
  pink400: '#F472B6',
} as const;

export const colors = {
  // Surfaces
  background: palette.ink900,
  backgroundDeep: palette.ink950,
  surface: palette.ink800,
  surfaceRaised: palette.ink750,
  surfaceHigh: palette.ink700,
  surfaceOverlay: 'rgba(11, 13, 16, 0.88)',

  // Borders / dividers
  border: palette.ink700,
  borderStrong: palette.ink600,
  borderFaint: 'rgba(255,255,255,0.06)',

  // Text
  text: palette.ink50,
  textSecondary: palette.ink300,
  textTertiary: palette.ink400,
  textInverse: palette.ink950,
  textOnAccent: palette.ink950,

  // Accent
  accent: palette.volt500,
  accentBright: palette.volt400,
  accentMuted: 'rgba(198, 243, 59, 0.14)',
  accentBorder: 'rgba(198, 243, 59, 0.32)',

  violet: palette.violet400,
  violetMuted: 'rgba(139, 92, 246, 0.16)',

  // Semantic
  success: palette.green400,
  successMuted: 'rgba(74, 222, 128, 0.14)',
  warning: palette.amber400,
  warningMuted: 'rgba(251, 191, 36, 0.14)',
  danger: palette.red400,
  dangerMuted: 'rgba(248, 113, 113, 0.14)',
  info: palette.blue400,
  infoMuted: 'rgba(96, 165, 250, 0.14)',

  // Charts
  chart: [
    palette.volt500,
    palette.violet400,
    palette.cyan400,
    palette.orange400,
    palette.pink400,
    palette.blue400,
  ],

  // Misc
  skeleton: palette.ink700,
  scrim: 'rgba(0,0,0,0.6)',
  tabBar: 'rgba(16, 19, 24, 0.94)',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 56,
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const fonts = {
  display: 'Sora_700Bold',
  displaySemi: 'Sora_600SemiBold',
  heading: 'Sora_600SemiBold',
  bodyBold: 'Inter_700Bold',
  bodySemi: 'Inter_600SemiBold',
  bodyMedium: 'Inter_500Medium',
  body: 'Inter_400Regular',
} as const;

export const type = {
  hero: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, letterSpacing: -0.8 },
  display: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  title: { fontFamily: fonts.displaySemi, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  headline: { fontFamily: fonts.displaySemi, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  bodySemi: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 21 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  subhead: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 19 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 17 },
  captionRegular: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: fonts.bodySemi, fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },
  stat: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, letterSpacing: -0.5 },
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  accentGlow: {
    shadowColor: palette.volt500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
} as const;

export const motion = {
  fast: 160,
  base: 240,
  slow: 380,
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;
