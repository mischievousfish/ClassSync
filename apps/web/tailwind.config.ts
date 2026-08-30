import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Maitree"', 'serif'],
        body: ['"Maitree"', 'serif'],
        heading: ['"Cormorant Unicase"', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
