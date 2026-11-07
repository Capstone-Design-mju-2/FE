import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // 팀 서버(HTTPS, Basic 인증)를 쓸 때는 .env.development.local에 BE_BASIC_AUTH=team:<비밀번호>를 넣는다.
  // changeOrigin: 원격 서버가 Host 헤더로 사이트를 고르므로 요청 Host를 대상 주소로 바꾼다.
  const backend = (url: string | undefined, fallback: string) => ({
    target: url || fallback,
    changeOrigin: true,
    auth: env.BE_BASIC_AUTH || undefined,
  })

  return {
    plugins: [react()],
    server: {
      // 개발 서버에서 상품 목록·리뷰는 catalog-service, 주문·재고는 order-service,
      // 나머지(채팅)는 agent-service로 넘긴다. 팀 서버는 세 주소를 모두 같은 서버로 둔다.
      proxy: {
        '^/api/v1/products(?:[/?]|$)': backend(env.CATALOG_SERVICE_URL, 'http://127.0.0.1:8081'),
        '^/api/v1/orders(?:[/?]|$)': backend(env.ORDER_SERVICE_URL, 'http://127.0.0.1:8082'),
        '^/api/v1/inventories(?:[/?]|$)': backend(env.ORDER_SERVICE_URL, 'http://127.0.0.1:8082'),
        '/api': backend(env.AGENT_SERVICE_URL, 'http://127.0.0.1:8000'),
      },
    },
  }
})
