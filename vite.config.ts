import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      // Gateway가 채팅·피부 분석·상품·재고·주문을 경로별 서비스로 나눈다.
      // 팀 서버에서는 Caddy의 HTTPS/Basic 인증을 거쳐 같은 Gateway로 간다.
      proxy: {
        '/api': {
          target: env.GATEWAY_SERVICE_URL || 'http://127.0.0.1:8080',
          changeOrigin: true,
          auth: env.BE_BASIC_AUTH || undefined,
        },
      },
    },
  }
})
