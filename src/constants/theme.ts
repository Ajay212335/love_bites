export const Colors = {
  light: {
    primary: '#FF204E', // Vivid Crimson Red
    primaryDark: '#D60D34',
    primaryLight: '#FFE8ED', // Soft Romantic Rose/Red tint
    secondary: '#FF4D6D',
    accent: '#FF758F',
    background: '#FAFAFC', // Crisp clean light background
    surface: '#FFFFFF', // Pure white card surfaces
    surfaceSubtle: '#FFF0F3', // Soft romantic blush for inputs & chips
    card: '#FFFFFF', // Clean white cards
    text: '#111827', // Rich dark text for optimal readability
    textSecondary: '#64748B', // Slate gray
    textMuted: '#94A3B8',
    border: '#EAECEF', // Soft light border
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    star: '#FFD60A',
    overlay: 'rgba(0, 0, 0, 0.5)',
    tint: '#FF204E',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#FF204E',
  },
  dark: {
    primary: '#FF204E', // Vivid Neon Crimson Red
    primaryDark: '#D60D34',
    primaryLight: 'rgba(255, 32, 78, 0.16)',
    secondary: '#FF4D6D',
    accent: '#FF758F',
    background: '#09090C', // Ultra-deep pitch black
    surface: '#131319',
    surfaceSubtle: '#1C1C24',
    card: '#131319',
    text: '#FFFFFF',
    textSecondary: '#9CA3AF',
    textMuted: '#606072',
    border: '#23232F',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    star: '#FFD60A',
    overlay: 'rgba(0, 0, 0, 0.85)',
    tint: '#FF204E',
    tabIconDefault: '#606072',
    tabIconSelected: '#FF204E',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
