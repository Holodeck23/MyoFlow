// Austrian Medical Design Token System
// Premium healthcare interface design tokens for Austrian therapy practice management

// Color generation utilities
const generateColorScale = (baseColor: string, name: string) => {
  // For Austrian Medical Blue (#1565C0) and Austrian Red (#C8102E)
  const scales: Record<string, Record<string, string>> = {
    'medical-blue': {
      '50': '#EFF6FF',
      '100': '#DBEAFE',
      '200': '#BFDBFE',
      '300': '#93C5FD',
      '400': '#60A5FA',
      '500': '#3B82F6',
      '600': '#1565C0', // Austrian Medical Blue
      '700': '#1D4ED8',
      '800': '#1E40AF',
      '900': '#1E3A8A',
      '950': '#172554',
    },
    'austrian-red': {
      '50': '#FEF2F2',
      '100': '#FEE2E2',
      '200': '#FECACA',
      '300': '#FCA5A5',
      '400': '#F87171',
      '500': '#EF4444',
      '600': '#C8102E', // Austrian Red
      '700': '#B91C1C',
      '800': '#991B1B',
      '900': '#7F1D1D',
      '950': '#450A0A',
    }
  }

  return scales[name] || scales['medical-blue']
}

// Austrian Medical Color Palette
export const austrianMedicalColors = {
  // Primary Austrian Medical Blue - professional, trustworthy
  primary: {
    DEFAULT: '#1565C0', // Austrian Medical Blue
    ...generateColorScale('#1565C0', 'medical-blue')
  },

  // Accent Austrian Red - cultural identity, calls-to-action
  accent: {
    DEFAULT: '#C8102E', // Austrian Red
    ...generateColorScale('#C8102E', 'austrian-red')
  },

  // Medical semantic colors - healthcare appropriate
  success: {
    DEFAULT: '#059669', // Medical green for positive states
    '50': '#ECFDF5',
    '100': '#D1FAE5',
    '200': '#A7F3D0',
    '300': '#6EE7B7',
    '400': '#34D399',
    '500': '#10B981',
    '600': '#059669',
    '700': '#047857',
    '800': '#065F46',
    '900': '#064E3B'
  },

  warning: {
    DEFAULT: '#D97706', // Medical amber for caution
    '50': '#FFFBEB',
    '100': '#FEF3C7',
    '200': '#FDE68A',
    '300': '#FCD34D',
    '400': '#FBBF24',
    '500': '#F59E0B',
    '600': '#D97706',
    '700': '#B45309',
    '800': '#92400E',
    '900': '#78350F'
  },

  danger: {
    DEFAULT: '#DC2626', // Medical red for errors
    '50': '#FEF2F2',
    '100': '#FEE2E2',
    '200': '#FECACA',
    '300': '#FCA5A5',
    '400': '#F87171',
    '500': '#EF4444',
    '600': '#DC2626',
    '700': '#B91C1C',
    '800': '#991B1B',
    '900': '#7F1D1D'
  },

  info: {
    DEFAULT: '#0369A1', // Medical blue for information
    '50': '#F0F9FF',
    '100': '#E0F2FE',
    '200': '#BAE6FD',
    '300': '#7DD3FC',
    '400': '#38BDF8',
    '500': '#0EA5E9',
    '600': '#0284C7',
    '700': '#0369A1',
    '800': '#075985',
    '900': '#0C4A6E'
  },

  // Professional neutral grays - medical interface friendly
  neutral: {
    '50': '#FAFAFA',   // Almost white backgrounds
    '100': '#F5F5F5',  // Card backgrounds
    '200': '#E5E5E5',  // Border light
    '300': '#D4D4D4',  // Border default
    '400': '#A3A3A3',  // Text disabled
    '500': '#737373',  // Text secondary
    '600': '#525252',  // Text primary
    '700': '#404040',  // Text emphasis
    '800': '#262626',  // Text strong
    '900': '#171717',  // Text strongest
    '950': '#0A0A0A'   // Pure contrast
  },

  // GDPR compliance visual indicators
  gdpr: {
    encrypted: '#16A34A',    // Green for encrypted health data
    sensitive: '#DC2626',    // Red for sensitive data indicators
    audit: '#7C3AED',        // Purple for audit trail
    compliant: '#059669'     // Success green for compliant state
  },

  // Austrian cultural elements
  cultural: {
    flagRed: '#ED2939',      // Austrian flag red
    flagWhite: '#FFFFFF',    // Austrian flag white
    alpine: '#2563EB',       // Alpine blue
    mozart: '#F59E0B'        // Golden like Salzburg
  },

  // Kleinunternehmer specific colors
  kleinunternehmer: {
    progress: '#16A34A',     // Green for revenue tracking
    threshold: '#D97706',    // Warning orange approaching €35,000
    warning: '#DC2626',      // Red when near threshold
    safe: '#059669'          // Safe green under threshold
  }
} as const

// Professional Medical Typography Scale
export const austrianTypography = {
  // Inter font family - modern, readable, professional
  fontFamily: {
    sans: [
      'Inter',
      'ui-sans-serif',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      '"Noto Sans"',
      'sans-serif'
    ],
    mono: [
      'ui-monospace',
      'SFMono-Regular',
      '"SF Mono"',
      'Consolas',
      '"Liberation Mono"',
      'Menlo',
      'monospace'
    ]
  },

  // Medical-appropriate font sizes
  fontSize: {
    'xs': '0.75rem',     // 12px - Fine print, legal text
    'sm': '0.875rem',    // 14px - Secondary text
    'base': '1rem',      // 16px - Body text, forms
    'lg': '1.125rem',    // 18px - Emphasized text
    'xl': '1.25rem',     // 20px - Subheadings
    '2xl': '1.5rem',     // 24px - Page headings
    '3xl': '1.875rem',   // 30px - Section headings
    '4xl': '2.25rem',    // 36px - Hero headings
    '5xl': '3rem',       // 48px - Display headings
  },

  // Healthcare-optimized line heights
  lineHeight: {
    tight: '1.25',       // Headings
    normal: '1.5',       // Body text
    relaxed: '1.625',    // Long-form content
    loose: '2'           // Spacious content
  },

  // Professional font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800'
  }
} as const

// Healthcare Interface Spacing
export const austrianSpacing = {
  '0': '0px',
  'px': '1px',
  '0.5': '0.125rem',    // 2px
  '1': '0.25rem',       // 4px - Base unit
  '1.5': '0.375rem',    // 6px
  '2': '0.5rem',        // 8px
  '2.5': '0.625rem',    // 10px
  '3': '0.75rem',       // 12px
  '3.5': '0.875rem',    // 14px
  '4': '1rem',          // 16px - Standard spacing
  '5': '1.25rem',       // 20px
  '6': '1.5rem',        // 24px
  '7': '1.75rem',       // 28px
  '8': '2rem',          // 32px
  '9': '2.25rem',       // 36px
  '10': '2.5rem',       // 40px
  '11': '2.75rem',      // 44px
  '12': '3rem',         // 48px
  '14': '3.5rem',       // 56px
  '16': '4rem',         // 64px
  '20': '5rem',         // 80px - Large sections
  '24': '6rem',         // 96px
  '28': '7rem',         // 112px
  '32': '8rem',         // 128px
  '36': '9rem',         // 144px
  '40': '10rem',        // 160px
  '44': '11rem',        // 176px
  '48': '12rem',        // 192px
  '52': '13rem',        // 208px
  '56': '14rem',        // 224px
  '60': '15rem',        // 240px
  '64': '16rem',        // 256px
  '72': '18rem',        // 288px
  '80': '20rem',        // 320px
  '96': '24rem'         // 384px
} as const

// Medical Interface Border Radius
export const austrianRadius = {
  none: '0px',
  sm: '0.125rem',       // 2px - Subtle rounding
  DEFAULT: '0.25rem',   // 4px - Standard rounding
  md: '0.375rem',       // 6px - Medium rounding
  lg: '0.5rem',         // 8px - Large rounding
  xl: '0.75rem',        // 12px - Extra large
  '2xl': '1rem',        // 16px - Very large
  '3xl': '1.5rem',      // 24px - Huge

  // Healthcare specific radius
  card: '0.5rem',       // 8px - Card components
  form: '0.375rem',     // 6px - Form inputs
  button: '0.375rem',   // 6px - Buttons
  modal: '0.75rem',     // 12px - Modal dialogs

  full: '9999px'        // Fully rounded
} as const

// Professional Medical Shadows
export const austrianShadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

  // Healthcare specific shadows
  card: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  modal: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  gdpr: '0 0 0 2px rgb(22 163 74 / 0.2)', // Green outline for GDPR compliance

  none: '0 0 #0000'
} as const

// Responsive Breakpoints - Mobile-first for Austrian therapists
export const austrianBreakpoints = {
  // Standard breakpoints
  sm: '640px',          // Small devices
  md: '768px',          // Medium devices (tablets)
  lg: '1024px',         // Large devices (laptops)
  xl: '1280px',         // Extra large devices (desktops)
  '2xl': '1536px',      // 2X large devices

  // Therapy practice specific
  mobile: '375px',      // Mobile phones
  tablet: '768px',      // Tablets
  desktop: '1024px',    // Desktop computers

  // Print layouts for Austrian invoices
  print: '210mm'        // A4 paper width
} as const

// TypeScript type definitions for type safety
export type AustrianColorPalette = typeof austrianMedicalColors
export type AustrianTypographyScale = typeof austrianTypography
export type AustrianSpacingScale = typeof austrianSpacing
export type AustrianRadiusScale = typeof austrianRadius
export type AustrianShadowScale = typeof austrianShadows
export type AustrianBreakpointScale = typeof austrianBreakpoints

// Utility functions for design token usage
export const getAustrianColor = (path: string): string => {
  const keys = path.split('.')
  let value: any = austrianMedicalColors

  for (const key of keys) {
    value = value?.[key]
  }

  return typeof value === 'string' ? value : '#1565C0' // Fallback to Austrian Medical Blue
}

export const getAustrianSpacing = (size: keyof typeof austrianSpacing): string => {
  return austrianSpacing[size] || austrianSpacing['4']
}

// Default export with all design tokens
export const austrianMedicalDesignSystem = {
  colors: austrianMedicalColors,
  typography: austrianTypography,
  spacing: austrianSpacing,
  radius: austrianRadius,
  shadows: austrianShadows,
  breakpoints: austrianBreakpoints
} as const

export default austrianMedicalDesignSystem