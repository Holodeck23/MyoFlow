// Austrian Medical Design System Tailwind Configuration
// Temporarily using direct colors to avoid import issues during CSS processing

/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Austrian Medical Color System - Direct implementation
      colors: {
        // Austrian Medical colors moved to CSS variables below

        // Medical semantic colors
        success: {
          DEFAULT: '#059669',
          '50': '#ECFDF5',
          '600': '#059669',
        },
        warning: {
          DEFAULT: '#D97706',
          '50': '#FFFBEB',
          '600': '#D97706',
        },
        danger: {
          DEFAULT: '#DC2626',
          '50': '#FEF2F2',
          '600': '#DC2626',
        },
        info: {
          DEFAULT: '#0369A1',
          '50': '#F0F9FF',
          '600': '#0284C7',
        },

        // Professional neutral grays
        neutral: {
          '50': '#FAFAFA',
          '100': '#F5F5F5',
          '200': '#E5E5E5',
          '300': '#D4D4D4',
          '400': '#A3A3A3',
          '500': '#737373',
          '600': '#525252',
          '700': '#404040',
          '800': '#262626',
          '900': '#171717',
          '950': '#0A0A0A'
        },

        // GDPR compliance colors
        gdpr: {
          encrypted: '#16A34A',
          sensitive: '#DC2626',
          audit: '#7C3AED',
          compliant: '#059669'
        },

        // Austrian cultural elements
        cultural: {
          flagRed: '#ED2939',
          flagWhite: '#FFFFFF',
          alpine: '#2563EB',
          mozart: '#F59E0B'
        },

        // Kleinunternehmer specific colors
        kleinunternehmer: {
          progress: '#16A34A',
          threshold: '#D97706',
          warning: '#DC2626',
          safe: '#059669'
        },

        // Legacy color mappings for existing components
        'medical-blue': {
          DEFAULT: '#1565C0',
          '50': '#EFF6FF',
          '100': '#DBEAFE',
          '200': '#BFDBFE',
          '300': '#93C5FD',
          '400': '#60A5FA',
          '500': '#3B82F6',
          '600': '#1565C0',
          '700': '#1D4ED8',
          '800': '#1E40AF',
          '900': '#1E3A8A',
        },
        'austrian-red': {
          DEFAULT: '#C8102E',
          '50': '#FEF2F2',
          '100': '#FEE2E2',
          '200': '#FECACA',
          '300': '#FCA5A5',
          '400': '#F87171',
          '500': '#EF4444',
          '600': '#C8102E',
          '700': '#B91C1C',
          '800': '#991B1B',
          '900': '#7F1D1D',
        },
        'neutral-gray': {
          DEFAULT: '#525252',
          '50': '#FAFAFA',
          '100': '#F5F5F5',
          '200': '#E5E5E5',
          '300': '#D4D4D4',
          '400': '#A3A3A3',
          '500': '#737373',
          '600': '#525252',
          '700': '#404040',
          '800': '#262626',
          '900': '#171717',
        },

        // shadcn/ui CSS variables integration
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Background and border colors (legacy)
        'background-legacy': {
          DEFAULT: '#FAFAFA',
          dark: '#0A0A0A',
        },
        'border-legacy': {
          DEFAULT: '#E5E5E5',
          dark: '#404040',
        }
      },

      // Austrian Medical Typography - Direct implementation
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
        ]
      },

      // Animation for professional medical interactions
      transitionProperty: {
        'professional': 'all',
      },
      transitionDuration: {
        'professional': '200ms',
      },
      transitionTimingFunction: {
        'professional': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
