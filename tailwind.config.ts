import { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'hsl(var(--background))',
          light: 'hsl(var(--background-light))',
        },
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          hover: 'hsl(var(--primary-hover))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          hover: 'hsl(var(--secondary-hover))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        red: {
          DEFAULT: '#FF3B30',
          dark: '#FF453A',
        },
        orange: {
          DEFAULT: '#FF9500',
          dark: '#FF9F0A',
        },
        yellow: {
          DEFAULT: '#FFCC00',
          dark: '#FFD60A',
        },
        green: {
          DEFAULT: '#34C759',
          dark: '#30D158',
        },
        pink: {
          DEFAULT: '#FF2D55',
          dark: '#FF375F',
          },
        gray: {
          DEFAULT: '#8E8E93',
          dark: '#8E8E93',
          '2': '#AEAEB2',
          '2-dark': '#636366',
          '3': '#C7C7CC',
          '3-dark': '#48484A',
          '4': '#D1D1D6',
          '4-dark': '#3A3A3C',
          '5': '#E5E5EA',
          '5-dark': '#2C2C2E',
          '6': '#F2F2F7',
          '6-dark': '#1C1C1E',
        },
        'system-orange': {
          DEFAULT: '#FF9500',
          dark: '#FF9F0A'
        },
        'system-pink': {
          DEFAULT: '#FF2D55',
          dark: '#FF375F'
        },
        'system-red': {
          DEFAULT: '#FF3B30',
          dark: '#FF453A'
        },

        'system-yellow': {
          DEFAULT: '#FFCC00',
          dark: '#FFD60A'
        },
        'system-background': {
          DEFAULT: '#FFFFFF',
          dark: '#000000',
          secondary: '#F2F2F7',
          'secondary-dark': '#1C1C1E',
          tertiary: '#FFFFFF',
          'tertiary-dark': '#2C2C2E',
        },
        'system-grouped-background': {
          DEFAULT: '#F2F2F7',
          dark: '#000000',
          secondary: '#FFFFFF',
          'secondary-dark': '#1C1C1E',
          tertiary: '#F2F2F7',
          'tertiary-dark': '#2C2C2E',
        },
        
        // Label Colors
        'label': {
          DEFAULT: '#000000',
          dark: '#FFFFFF',
          secondary: 'rgba(60, 60, 67, 0.6)',
          'secondary-dark': 'rgba(235, 235, 245, 0.6)',
          tertiary: 'rgba(60, 60, 67, 0.3)',
          'tertiary-dark': 'rgba(235, 235, 245, 0.3)',
          quaternary: 'rgba(60, 60, 67, 0.18)',
          'quaternary-dark': 'rgba(235, 235, 245, 0.16)',
        },
        
        // Separator Colors
        'separator': {
          DEFAULT: 'rgba(60, 60, 67, 0.29)',
          dark: 'rgba(84, 84, 88, 0.6)',
          opaque: '#C6C6C8',
          'opaque-dark': '#38383A',
        },
      },
      borderRadius: {
        '2xl': 'calc(var(--radius) + 2px)',
        xl: 'var(--radius)',
        lg: 'calc(var(--radius) - 2px)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 6px)'
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'shine': 'shine 5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shine: {
          'to': { backgroundPosition: '200% center' },
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'San Francisco',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      boxShadow: {
        'apple-sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'apple': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'apple-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'apple-xl': '0 20px 50px rgba(0, 0, 0, 0.15)',
        'apple-inner': 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
        'apple-dark-sm': '0 1px 3px rgba(0, 0, 0, 0.25)',
        'apple-dark': '0 4px 12px rgba(0, 0, 0, 0.3)',
        'apple-dark-lg': '0 8px 24px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        'apple': '20px',
      },
    }
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.text-shadow-sm': {
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow': {
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow-lg': {
          textShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
        },
        '.text-shadow-none': {
          textShadow: 'none',
        },
        '.backdrop-saturate-150': {
          backdropFilter: 'saturate(150%)',
        },
        '.backdrop-saturate-180': {
          backdropFilter: 'saturate(180%)',
        },
        '.font-smoothing-auto': {
          WebkitFontSmoothing: 'auto',
          MozOsxFontSmoothing: 'auto',
        },
        '.font-smoothing-antialiased': {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '.font-smoothing-subpixel': {
          WebkitFontSmoothing: 'subpixel-antialiased',
          MozOsxFontSmoothing: 'auto',
        },
      });
    }),
  ]
};

export default config;
