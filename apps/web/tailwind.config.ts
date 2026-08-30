import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Cormorant Unicase"', 'serif'],
        serif: ['"Cormorant Unicase"', 'serif'],
        mono: ['"Cormorant Unicase"', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
