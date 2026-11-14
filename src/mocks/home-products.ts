// Beauty Shop 디자인 시안의 화면 배치용 예시 데이터. 실제 상품·가격·랭킹이 아니다.
export type HomeProduct = {
  id: number
  category: '스킨케어' | '선케어' | '메이크업' | '바디'
  brand: string
  name: string
  price: number
  rating: number
  reviewCount: number
  tint: string
}

export const homeProducts: HomeProduct[] = [
  { id: 1, category: '스킨케어', brand: '하루온', name: '자작나무 수분 장벽 크림', price: 24000, rating: 4.8, reviewCount: 1203, tint: '#efe6da' },
  { id: 2, category: '스킨케어', brand: '소일', name: '오트 세라마이드 젤크림', price: 19800, rating: 4.7, reviewCount: 862, tint: '#e3e9e0' },
  { id: 4, category: '선케어', brand: '무드랩', name: '데일리 마일드 선크림 SPF50+', price: 16900, rating: 4.8, reviewCount: 2310, tint: '#f3ebd6' },
  { id: 6, category: '메이크업', brand: '베리넷', name: '벨벳 블러 립 틴트 #로즈모브', price: 14000, rating: 4.7, reviewCount: 1540, tint: '#e9d3d6' },
  { id: 7, category: '메이크업', brand: '무드랩', name: '글로이 립밤 틴트 #베리', price: 12000, rating: 4.6, reviewCount: 903, tint: '#e4ccd0' },
  { id: 8, category: '스킨케어', brand: '하루온', name: '약산성 결 토너 패드 70매', price: 18500, rating: 4.7, reviewCount: 1876, tint: '#e8ede6' },
  { id: 10, category: '바디', brand: '오트밀리', name: '오트 바디 로션 무향', price: 13500, rating: 4.8, reviewCount: 1102, tint: '#f0eae2' },
]
