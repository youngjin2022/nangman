import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#F4F5F7', panel: '#FFFFFF', subtle: '#EEF0F4' },
        line: '#E2E5EB',
        ink: { DEFAULT: '#1A1D23', muted: '#6B7280' },
        accent: { DEFAULT: '#2563EB', dark: '#1E40AF' },
        good: '#10B981',
        warn: '#F59E0B',
        bad: '#EF4444',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Apple SD Gothic Neo"', '"Pretendard"', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
      },
      keyframes: {
        slideUp: { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
    },
  },
  plugins: [],
};

export default config;
