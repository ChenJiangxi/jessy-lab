import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'sans-serif'],
        serif: ['"Fraunces"', 'ui-serif', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        zh: ['"Noto Sans SC"', '"PingFang SC"', 'sans-serif'],
        zhSerif: ['"Noto Serif SC"', '"Songti SC"', 'serif'],
      },
      colors: {
        // Pale-lavender cyber palette
        paper: {
          DEFAULT: '#eeeaf2',
          warm: '#efeaf3',
          cool: '#e4dfea',
        },
        ink: {
          DEFAULT: '#0c0810',
          soft: '#3a2f45',
          mute: '#6d5a78',
          faint: '#a496ad',
          ghost: '#c8bbce',
        },
        neon: {
          magenta: '#d946ef',
          cyan: '#6ea8e5',
          gold: '#fbbf24',
          // Chromatic-aberration tints
          r: '#ff3aa8',
          g: '#3affd4',
        },
        status: {
          on: '#1ce26e',
          speak: '#d946ef',
        },
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      animation: {
        breathe: 'breathe 6s ease-in-out infinite',
        shimmer: 'shimmer 8s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
