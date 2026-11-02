// BE docs/API.md 2절 "카테고리별 상품 목록"·"리뷰 조회" 계약 (BE #31 계약, #33 구현).

export type ProductSort = 'popular' | 'rating' | 'priceAsc' | 'priceDesc'
export type ReviewSort = 'recent' | 'rating' | 'likes'
// 필터로 고를 수 있는 값. 응답에는 드물게 dehydrated_oily·normal·trouble_prone도 온다.
export type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive'

export type ProductSummary = {
  productId: number
  name: string
  brand: string
  price: number
  reviewCount: number // 수집 당시 무신사의 전체 리뷰 수
  reviewScore: number // 수집한 평점 그대로 0~100
}

export type ProductListResponse = {
  category: string
  page: number
  size: number
  total: number
  products: ProductSummary[]
}

export type Review = {
  reviewId: number
  rating: number
  content: string
  skinType: string | null
  optionText: string | null
  likeCount: number
  writtenAt: string // YYYY-MM-DD (한국 시간)
}

export type ReviewListResponse = {
  productId: number
  page: number
  size: number
  total: number // 수집해 둔 리뷰 수 (상품당 최대 300개)
  reviews: Review[]
}
