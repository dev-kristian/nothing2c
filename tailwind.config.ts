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
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
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
