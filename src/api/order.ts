import mockOptions from '../mocks/product-options.example.json'
import { resolveProductOptions } from '../lib/order'
import type { ProductOptions } from '../types/order'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

// null이면 옵션 정보가 없는 상품이다. 옵션 계약이 생기면 실제 조회로 바꾼다.
export function getProductOptions(productId: number): ProductOptions | null {
  return resolveProductOptions(productId, useMock, mockOptions as Record<string, ProductOptions>)
}
