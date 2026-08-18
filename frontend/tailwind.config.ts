import type { Config } from 'tailwindcss';
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C2B33',
        paper: '#F6F0E4',
        marigold: '#E8A33D',
        rosewood: '#8C4A44',
        sage: '#5C7267',
        ash: '#8A8478',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: { ticket: '0 18px 50px rgba(28,43,51,.12)' },
    },
  },
  plugins: [],
} satisfies Config;
