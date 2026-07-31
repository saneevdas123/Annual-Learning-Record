import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // "The Registrar's Ledger" — authoritative indigo base, parchment surface,
        // vermilion seal for official actions, brass for marks/credits.
        ink: {
          DEFAULT: '#1a1c33',
          soft: '#33374f',
          muted: '#6b7089',
        },
        indigo: {
          50: '#eef0f7',
          100: '#dadeee',
          200: '#b7bede',
          300: '#8b96c6',
          400: '#5f6ea8',
          500: '#414f89',
          600: '#313c6d',
          700: '#282f56',
          800: '#20223f',
          900: '#161829',
        },
        seal: {
          50: '#fbecea',
          100: '#f6d5d0',
          300: '#e39a90',
          500: '#b23a2e',
          600: '#983026',
          700: '#7c271f',
        },
        brass: {
          50: '#f7f1e2',
          100: '#ecdfbf',
          400: '#c2a15a',
          500: '#a17c3a',
          600: '#856330',
        },
        parchment: '#f5f2ea',
        surface: '#fbfaf6',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(26,28,51,0.04), 0 4px 16px rgba(26,28,51,0.06)',
        lift: '0 8px 30px rgba(26,28,51,0.12)',
      },
      borderRadius: {
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
};

export default config;
