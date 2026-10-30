import mockOptions from '../mocks/product-options.example.json'
import { createMockOrderReceipt, resolveProductOptions } from '../lib/order'
import type { Product } from '../types/api'
import type { ProductOptions } from '../types/order'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

// null이면 옵션 정보가 없는 상품이다. 옵션 계약이 생기면 실제 조회로 바꾼다.
export function getProductOptions(productId: number): ProductOptions | null {
  return resolveProductOptions(productId, useMock, mockOptions as Record<string, ProductOptions>)
}

// 실제 옵션 조회 경로는 BE 계약 확정 후 연결한다. 호출자는 로딩·실패 상태를 처리한다.
export async function loadProductOptions(productId: number): Promise<ProductOptions | null> {
  return getProductOptions(productId)
}

export function createMockOrder(product: Product, optionId: number | null, quantity: number) {
  return createMockOrderReceipt(useMock, product, getProductOptions(product.productId), optionId, quantity)
}
