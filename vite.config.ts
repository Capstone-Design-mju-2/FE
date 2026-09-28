import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      // agent-service에 CORS 설정이 없어서 개발 서버가 /api 요청을 대신 넘긴다.
      proxy: {
        '/api': env.AGENT_SERVICE_URL || 'http://127.0.0.1:8000',
      },
    },
  }
})
