import type { ChatResponse } from '../types/api'

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null
const finiteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

// TypeScript 타입만으로는 서버에서 받은 JSON을 검증할 수 없다.
// 계약 위반 카드가 하나라도 있으면 전체 응답을 거부한다.
// 일부 카드를 제외하면 answer의 상품 수·추천 내용과 실제 표시가 달라질 수 있다.
export function isChatResponse(value: unknown): value is ChatResponse {
  return record(value) && typeof value.answer === 'string' &&
    Array.isArray(value.products) && value.products.every((product: unknown) => {
      if (!record(product) || !record(product.inventory)) return false
      const inventory = product.inventory
      return finiteNumber(product.productId) && typeof product.name === 'string' &&
        typeof product.brand === 'string' && finiteNumber(product.price) &&
        (product.reason === null || typeof product.reason === 'string') &&
        Array.isArray(product.evidence) && product.evidence.every((review: unknown) =>
          record(review) && finiteNumber(review.reviewId) &&
          finiteNumber(review.rating) && typeof review.excerpt === 'string') &&
        ['IN_STOCK', 'OUT_OF_STOCK', 'UNKNOWN'].includes(String(inventory.status)) &&
        (inventory.quantity === null || finiteNumber(inventory.quantity)) &&
        (inventory.estimatedDeliveryDate === null ||
          typeof inventory.estimatedDeliveryDate === 'string')
    })
}
