import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  base: './',      // 상대 경로로 빌드하여 HTML에서 파일 참조가 올바르게 되도록 설정
  build: {
    outDir: '../dist', 
    emptyOutDir: true, // 이전 빌드 결과물을 지웁니다.
  },
  server: {
    // Vite 개발 서버의 포트 설정 (Express 서버와 포트 충돌 방지)
    port: 5173, 
    // Proxy 설정 (선택 사항: Express 서버의 API나 Socket.io를 Vite 서버에서 프록시)
    proxy: {
      // 모든 API 요청 및 Socket.io 요청을 Express 서버로 포워딩
      // (현재 Express 서버가 3000번 포트라고 가정)
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      // @shared를 사용하면 client/../shared/ 로 매핑되도록 설정
      '@shared': path.resolve(__dirname, '../shared'),
    },
  }
});