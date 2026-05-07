import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
// 경로 별칭 + 개발 서버 포트
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3001,
        host: true,
    },
});
