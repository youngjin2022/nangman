import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 술집 분위기에 맞는 다크 + 앰버 액센트
        bg: {
          DEFAULT: '#0F0F12',
          card: '#1A1A20',
          elevated: '#22222B',
        },
        accent: {
          DEFAULT: '#F5A623',
          dark: '#D48A12',
        },
        line: '#2A2A33',
        muted: '#7A7A85',
      },
      fontFamily: {
        // 시스템 폰트 우선 (한글 가독성)
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Apple SD Gothic Neo"', '"Pretendard"', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.25s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
