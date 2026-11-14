import type { ProductListResponse, ProductSort, ReviewListResponse, ReviewSort, SkinType } from '../types/catalog'
import { ApiRequestError } from '../api/client.ts'

// 카테고리 사진은 그 카테고리 상품(옆 주석의 productId) 무신사 사진의 125px·500px 주소다.
// 주소가 바뀌면 상품 목록 API(/api/v1/products)의 thumbnailUrl·imageUrl로 다시 넣는다.
const photo = (path: string) => ({
  thumbnailUrl: `https://image.msscdn.net/images/goods_img/${path}_125.jpg`,
  imageUrl: `https://image.msscdn.net/images/goods_img/${path}_500.jpg`,
})

// 메인 카테고리 타일 → BE 카테고리 코드 (BE search-mcp의 카테고리 표 기준)
export const HOME_CATEGORIES = [
  {
    label: '스킨케어', code: '104001',
    photo: photo('20211012/2172345/2172345_17827951793989'), // 22 에스트라 아토베리어365 크림
  },
  {
    label: '클렌징', code: '104003',
    photo: photo('20200810/1542479/1542479_17024268450109'), // 2839 에이트루 클렌징 오일
  },
  {
    label: '선케어', code: '104002',
    photo: photo('20220629/2637406/2637406_17827241261423'), // 2469 듀이트리 선스틱
  },
  {
    label: '메이크업', code: '104014',
    photo: photo('20230808/3450028/3450028_17923708345570'), // 8949 오드타입 워터 블러시
  },
  {
    label: '립', code: '104015',
    photo: photo('20210331/1872009/1872009_17834762953658'), // 9405 에뛰드 픽싱 틴트
  },
  {
    label: '헤어', code: '104006',
    photo: photo('20260414/6310061/6310061_17772821718387'), // 5100 다슈 그루밍 토닉
  },
  {
    label: '바디', code: '104007',
    photo: photo('20260402/6242183/6242183_17751042592204'), // 5741 닥터 브로너스 솝
  },
  {
    label: '향수', code: '104005',
    photo: photo('20230214/3082569/3082569_17860895771326'), // 3394 유쏘풀 니치향수
  },
] as const

export type HomeCategory = (typeof HOME_CATEGORIES)[number]

// 랭킹 탭은 카테고리별 sort=popular (BE에 카테고리 없는 "전체" 목록은 없다)
export const RANKING_TABS = ['104001', '104002', '104015', '104014'] as const

export const PRODUCT_SORTS: { value: ProductSort; label: string }[] = [
  { value: 'popular', label: '리뷰 많은 순' },
  { value: 'rating', label: '평점 높은 순' },
  { value: 'priceAsc', label: '낮은 가격순' },
  { value: 'priceDesc', label: '높은 가격순' },
]

export const REVIEW_SORTS: { value: ReviewSort; label: string }[] = [
  { value: 'recent', label: '최신순' },
  { value: 'rating', label: '별점 높은 순' },
  { value: 'likes', label: '좋아요 많은 순' },
]

export const SKIN_TYPES: { value: SkinType; label: string }[] = [
  { value: 'dry', label: '건성' },
  { value: 'oily', label: '지성' },
  { value: 'combination', label: '복합성' },
  { value: 'sensitive', label: '민감성' },
]

const RARE_SKIN_LABELS: Record<string, string> = {
  dehydrated_oily: '수부지',
  normal: '중성',
  trouble_prone: '트러블성',
}

export function categoryLabel(code: string): string {
  return HOME_CATEGORIES.find((category) => category.code === code)?.label ?? code
}

export function skinTypeLabel(skinType: string | null): string | null {
  if (skinType === null) return null
  return SKIN_TYPES.find((type) => type.value === skinType)?.label ?? RARE_SKIN_LABELS[skinType] ?? skinType
}

// reviewScore는 무신사 평점(0~100)이다. 화면은 별 5개 기준으로 보여 준다 (96 → 4.8).
export function formatReviewScore(score: number): string {
  return (Math.round(score / 2) / 10).toFixed(1)
}

export function hasMorePages(response: { page: number; size: number; total: number }): boolean {
  return (response.page + 1) * response.size < response.total
}

export function isEmptyCategoryError(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 400 && error.code === 'INVALID_PRODUCT_LIST'
}

export function productListPath(params: { category: string; sort: ProductSort; page: number; size: number }): string {
  const query = new URLSearchParams({
    category: params.category, sort: params.sort, page: String(params.page), size: String(params.size),
  })
  return `/api/v1/products?${query}`
}

export function reviewListPath(
  productId: number,
  params: { sort: ReviewSort; skinType: SkinType | null; page: number; size: number },
): string {
  const query = new URLSearchParams({ sort: params.sort, page: String(params.page), size: String(params.size) })
  if (params.skinType) query.set('skinType', params.skinType)
  return `/api/v1/products/${productId}/reviews?${query}`
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null
const integer = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const nullableString = (value: unknown): value is string | null => value === null || typeof value === 'string'

export function isProductListResponse(value: unknown): value is ProductListResponse {
  return record(value) && typeof value.category === 'string' && integer(value.page) &&
    integer(value.size) && integer(value.total) && Array.isArray(value.products) &&
    value.products.every((product: unknown) => record(product) && integer(product.productId) &&
      typeof product.name === 'string' && typeof product.brand === 'string' &&
      integer(product.price) && integer(product.reviewCount) &&
      integer(product.reviewScore) && product.reviewScore <= 100)
}

export function isReviewListResponse(value: unknown): value is ReviewListResponse {
  return record(value) && integer(value.productId) && integer(value.page) && integer(value.size) &&
    integer(value.total) && Array.isArray(value.reviews) &&
    value.reviews.every((review: unknown) => record(review) && integer(review.reviewId) &&
      integer(review.rating) && review.rating >= 1 && review.rating <= 5 &&
      typeof review.content === 'string' && nullableString(review.skinType) &&
      nullableString(review.optionText) && integer(review.likeCount) &&
      typeof review.writtenAt === 'string')
}
