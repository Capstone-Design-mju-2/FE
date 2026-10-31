import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      // 개발 서버에서 상품 목록·리뷰는 catalog-service, 주문 생성은 order-service,
      // 나머지(채팅)는 agent-service로 넘긴다.
      proxy: {
        '^/api/v1/products(?:[/?]|$)': env.CATALOG_SERVICE_URL || 'http://127.0.0.1:8081',
        '^/api/v1/orders(?:[/?]|$)': env.ORDER_SERVICE_URL || 'http://127.0.0.1:8082',
        '^/api/v1/inventories(?:[/?]|$)': env.ORDER_SERVICE_URL || 'http://127.0.0.1:8082',
        '/api': env.AGENT_SERVICE_URL || 'http://127.0.0.1:8000',
      },
    },
  }
})
