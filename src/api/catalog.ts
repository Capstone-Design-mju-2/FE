import {
  isProductListResponse, isReviewListResponse, productListPath, reviewListPath,
} from '../lib/catalog'
import { mockProductsByCategory, mockReviews } from '../mocks/catalog'
import type {
  ProductListResponse, ProductSort, ReviewListResponse, ReviewSort, SkinType,
} from '../types/catalog'
import { ApiRequestError, getJson } from './client'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const TIMEOUT_MS = 15_000

const invalid = () => new ApiRequestError(200, {
  code: 'INVALID_RESPONSE',
  message: '서버 응답 형식이 올바르지 않아요. 다시 시도해 주세요.',
})

const delay = () => new Promise((resolve) => setTimeout(resolve, 300))

// 카테고리별 상품 목록 (catalog-service, 개발 서버에서는 8081로 프록시)
export async function fetchProducts(params: {
  category: string; sort: ProductSort; page: number; size: number
}): Promise<ProductListResponse> {
  if (useMock) {
    await delay()
    const all = [...(mockProductsByCategory[params.category] ?? [])].sort((a, b) => {
      if (params.sort === 'rating') return b.reviewScore - a.reviewScore || a.productId - b.productId
      if (params.sort === 'priceAsc') return a.price - b.price || a.productId - b.productId
      if (params.sort === 'priceDesc') return b.price - a.price || a.productId - b.productId
      return b.reviewCount - a.reviewCount || a.productId - b.productId
    })
    const start = params.page * params.size
    return { category: params.category, page: params.page, size: params.size, total: all.length,
      products: all.slice(start, start + params.size) }
  }
  const response = await getJson<unknown>(productListPath(params), { timeoutMs: TIMEOUT_MS })
  if (!isProductListResponse(response)) throw invalid()
  return response
}

// 상품 하나의 리뷰 (skinType을 주면 그 피부 타입 작성자의 리뷰만)
export async function fetchReviews(productId: number, params: {
  sort: ReviewSort; skinType: SkinType | null; page: number; size: number
}): Promise<ReviewListResponse> {
  if (useMock) {
    await delay()
    const all = mockReviews(productId)
      .filter((review) => !params.skinType || review.skinType === params.skinType)
      .sort((a, b) => {
        if (params.sort === 'rating') return b.rating - a.rating || b.writtenAt.localeCompare(a.writtenAt)
        if (params.sort === 'likes') return b.likeCount - a.likeCount || b.writtenAt.localeCompare(a.writtenAt)
        return b.writtenAt.localeCompare(a.writtenAt) || b.reviewId - a.reviewId
      })
    const start = params.page * params.size
    return { productId, page: params.page, size: params.size, total: all.length,
      reviews: all.slice(start, start + params.size) }
  }
  const response = await getJson<unknown>(reviewListPath(productId, params), { timeoutMs: TIMEOUT_MS })
  if (!isReviewListResponse(response)) throw invalid()
  return response
}
