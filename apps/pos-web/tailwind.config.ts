import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // POS는 가독성 우선 - 라이트 베이스 + 진한 액센트
        bg: {
          DEFAULT: '#F4F5F7',
          panel: '#FFFFFF',
          subtle: '#EEF0F4',
        },
        line: '#E2E5EB',
        ink: {
          DEFAULT: '#1A1D23',
          muted: '#6B7280',
        },
        accent: {
          DEFAULT: '#2563EB',
          dark: '#1E40AF',
        },
        // 테이블 상태 색상 매핑
        status: {
          available: '#9CA3AF',
          occupied: '#10B981',
          pending: '#F59E0B', // 신규 미확인 주문 있음
          paying: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Apple SD Gothic Neo"', '"Pretendard"', 'sans-serif'],
      },
      animation: {
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
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
