import type { ChatRequest, ChatResponse } from '../types/api'

export type SearchOrigin = {
  question: string
  skinType?: ChatRequest['skinType']
  searchConditions: ChatResponse['searchConditions']
  excludedProductIds: number[]
}

export function isSoldOutOrderFailure(error: { status: number; code: string }): boolean {
  return error.status === 409 && error.code === 'OUT_OF_STOCK'
}

export function alternativeRequest(origin: SearchOrigin, soldOutProductId: number): ChatRequest | null {
  if (!origin.searchConditions || !Number.isSafeInteger(soldOutProductId) || soldOutProductId < 1) return null
  const excluded = [...new Set([...origin.excludedProductIds, soldOutProductId])]
  if (excluded.length > 10) return null
  return { message: origin.question, ...(origin.skinType ? { skinType: origin.skinType } : {}),
    searchConditions: origin.searchConditions, excludeProductIds: excluded }
}

export function excludesSoldOutProducts(productIds: number[], excludedProductIds: number[]): boolean {
  const excluded = new Set(excludedProductIds)
  return productIds.every((id) => !excluded.has(id))
}
