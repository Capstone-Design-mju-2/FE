import exampleResponse from '../mocks/chat-response.example.json'
import type { ChatRequest, ChatResponse } from '../types/api'
import { ApiRequestError, postJson } from './client'
import { isChatResponse } from './validateChat'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export async function sendChat(message: string): Promise<ChatResponse> {
  if (useMock) return mockChat()
  const response = await postJson<unknown>('/api/v1/chat', { message } satisfies ChatRequest)
  if (!isChatResponse(response)) {
    throw new ApiRequestError(200, {
      code: 'INVALID_RESPONSE',
      message: '서버 응답 형식이 올바르지 않아요. 다시 시도해 주세요.',
    })
  }
  return response
}

// 목업 모드에서 주소 뒤에 ?mock=<상황>을 붙이면 상태 화면을 BE 없이 확인할 수 있다.
//   (없음)    목업 응답 그대로
//   empty     결과 0개 (BE: 검색어를 못 뽑았거나 검색 결과가 없을 때)
//   unknown   order-service 장애 (재고 전부 UNKNOWN)
//   error     catalog-service 장애 (502 PRODUCT_SEARCH_FAILED)
async function mockChat(): Promise<ChatResponse> {
  // 로딩 화면을 확인할 수 있게 조금 기다린다.
  await new Promise((resolve) => setTimeout(resolve, 800))
  const base = exampleResponse as ChatResponse

  switch (new URLSearchParams(window.location.search).get('mock')) {
    case 'stage1a':
      return { ...base, products: base.products.map((p) => ({ ...p, reason: null })) }
    case 'stage1c': {
      // 시연용 날짜만 상대 날짜로 만든다. 원본 계약 fixture와 실제 API 값은 유지한다.
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
      return {
        ...base,
        products: base.products.map((p) => ({
          ...p,
          inventory: p.inventory.status === 'IN_STOCK'
            ? { ...p.inventory, estimatedDeliveryDate: date }
            : { ...p.inventory },
        })),
      }
    }
    case 'empty':
      return { answer: '조건에 맞는 상품을 찾지 못했습니다.', products: [] }
    case 'unknown':
      return {
        ...base,
        products: base.products.map((p) => ({
          ...p,
          inventory: { status: 'UNKNOWN', quantity: null, estimatedDeliveryDate: null },
        })),
      }
    case 'error':
      throw new ApiRequestError(502, {
        code: 'PRODUCT_SEARCH_FAILED',
        message: '상품 검색에 실패했습니다.',
      })
    default:
      return base
  }
}
