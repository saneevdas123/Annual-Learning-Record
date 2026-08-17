import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FF4B3E',
          dark: '#E03A2E',
          light: '#FFE8E6',
        },
        ink: '#141414',
        cream: '#FDF8F0',
        accent: {
          DEFAULT: '#F9CA24',
          yellow: '#FCF6BD',
          mint: '#D0F4DE',
          peach: '#FFD7BA',
          pink: '#F8A5C2',
        },
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        hard: '4px 4px 0 0 #141414',
        'hard-lg': '6px 6px 0 0 #141414',
        'hard-sm': '2px 2px 0 0 #141414',
      },
      borderRadius: {
        neo: '1rem',
      },
    },
  },
  plugins: [],
};

export default config;
