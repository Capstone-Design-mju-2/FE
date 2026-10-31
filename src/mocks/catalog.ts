// 목업 모드에서 카테고리 목록·리뷰 조회 API 대신 쓰는 가상 데이터. 실제 상품·리뷰가 아니다.
import type { ProductSummary, Review } from '../types/catalog'
import { homeProducts } from './home-products'

const toSummary = (id: number): ProductSummary => {
  const product = homeProducts.find((item) => item.id === id)!
  return {
    productId: product.id, name: product.name, brand: product.brand, price: product.price,
    reviewCount: product.reviewCount, reviewScore: Math.round(product.rating * 20),
  }
}

// 카테고리 코드별 상품 (없는 카테고리는 빈 목록)
export const mockProductsByCategory: Record<string, ProductSummary[]> = {
  '104001': [1, 8, 2].map(toSummary),
  '104002': [4].map(toSummary),
  '104015': [6, 7].map(toSummary),
  '104007': [10].map(toSummary),
}

const SAMPLE_TEXTS = [
  '건성인데 바르고 나서 하루 종일 당기지 않아요.',
  '향이 거의 없고 자극이 없어서 매일 써요. 흡수도 빨라서 아침에 쓰기 좋습니다.',
  '여름에는 조금 무거운 느낌이 있어요.',
  '용량 대비 가격이 괜찮고 재구매 의사 있어요.',
  '민감한 편인데 따가움 없이 잘 맞았어요.',
  '발림성이 좋고 끈적임이 남지 않아요.',
]
const SAMPLE_SKINS = ['dry', 'oily', null, 'combination', 'sensitive', 'dry', null, 'normal']

// 상품마다 같은 결과가 나오도록 productId로 정해진 리뷰를 만든다.
export function mockReviews(productId: number): Review[] {
  return Array.from({ length: 23 }, (_, i) => ({
    reviewId: productId * 1000 + i,
    rating: 5 - ((i + productId) % 3 === 0 ? 1 : 0) - (i % 7 === 6 ? 2 : 0),
    content: SAMPLE_TEXTS[(i + productId) % SAMPLE_TEXTS.length],
    skinType: SAMPLE_SKINS[i % SAMPLE_SKINS.length],
    optionText: i % 4 === 3 ? null : '50ml',
    likeCount: (i * 7 + productId) % 15,
    writtenAt: `2026-10-${String(28 - i).padStart(2, '0')}`,
  }))
}
