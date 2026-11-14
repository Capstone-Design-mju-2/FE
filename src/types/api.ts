// BE docs/API.md (Stage 1 계약)를 그대로 옮긴 타입.
// 계약이 바뀌면 이 파일부터 고친다.

export type ApiError = {
  code: string
  message: string
}

// NOT_FOUND는 agent가 응답에서 빼므로 화면에는 오지 않는다.
export type InventoryStatus = 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'

export type Inventory = {
  status: InventoryStatus
  quantity: number | null
  estimatedDeliveryDate: string | null // YYYY-MM-DD
}

export type Evidence = {
  reviewId: number
  rating: number
  excerpt: string
}

export type Product = {
  productId: number
  name: string
  brand: string
  price: number // 원 단위 정수
  imageUrl?: string | null // 무신사 이미지 서버의 500px 사진. 없으면 null, OpenSearch 검색이면 필드가 없다
  thumbnailUrl?: string | null // 같은 사진의 125px
  reason: string | null // 1C 전까지는 항상 null
  evidence: Evidence[]
  inventory: Inventory
}

export type ChatRequest = {
  message: string
  skinType?: 'dry' | 'oily' | 'combination' | 'sensitive'
  searchConditions?: Record<string, unknown>
  excludeProductIds?: number[]
}

export type ChatResponse = {
  answer: string
  products: Product[]
  searchConditions?: Record<string, unknown> | null
}
