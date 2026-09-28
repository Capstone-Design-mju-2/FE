import mockResponse from '../mocks/chat-response.example.json'
import type { ChatRequest, ChatResponse } from '../types/api'
import { postJson } from './client'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export async function sendChat(message: string): Promise<ChatResponse> {
  if (useMock) {
    // 로딩 화면을 확인할 수 있게 조금 기다린다.
    await new Promise((resolve) => setTimeout(resolve, 600))
    return mockResponse as ChatResponse
  }
  return postJson<ChatResponse>('/api/v1/chat', { message } satisfies ChatRequest)
}
