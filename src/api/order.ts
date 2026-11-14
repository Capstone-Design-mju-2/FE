import mockOptions from '../mocks/product-options.example.json'
import { createMockOrderReceipt, isInventoryOptionsResponse, resolveProductOptions, toProductOptions } from '../lib/order'
import type { Product } from '../types/api'
import type { ProductOptions } from '../types/order'
import { ApiRequestError, getJson } from './client'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

// null이면 옵션 정보가 없는 상품이다.
export function getProductOptions(productId: number): ProductOptions | null {
  return resolveProductOptions(productId, useMock, mockOptions as Record<string, ProductOptions>)
}

// BE PR #30 계약. 구현 전에는 404 PRODUCT_NOT_FOUND나 프록시 오류로 주문을 막는다.
export async function loadProductOptions(productId: number): Promise<ProductOptions | null> {
  if (useMock) {
    const options = getProductOptions(productId)
    if (productId === 101 && new URLSearchParams(window.location.search).get('mock') === 'alternatives' && options) {
      return { ...options, options: options.options.map((option) => ({ ...option, soldOut: true })) }
    }
    return options
  }
  let response: unknown
  try {
    response = await getJson<unknown>(`/api/v1/inventories/${productId}/options`, { timeoutMs: 15_000 })
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404 && error.code === 'PRODUCT_NOT_FOUND') return null
    throw error
  }
  if (!isInventoryOptionsResponse(response, productId)) {
    throw new ApiRequestError(200, { code: 'INVALID_RESPONSE', message: '옵션 응답 형식이 올바르지 않아요.' })
  }
  return toProductOptions(response)
}

export function createMockOrder(product: Product, optionId: number | null, quantity: number) {
  return createMockOrderReceipt(useMock, product, getProductOptions(product.productId), optionId, quantity)
}
