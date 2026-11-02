// 상품 사진은 BE가 주는 무신사 이미지 서버 주소를 브라우저가 바로 받는다 (BE docs/API.md 2절, ADR-127).
export type ImageAttempt = { src: string; srcSet?: string }

type WithImages = { imageUrl?: string | null; thumbnailUrl?: string | null }

// img 태그에 그대로 넣으므로 https 주소만 쓴다.
const https = (value: string | null | undefined): string | null =>
  typeof value === 'string' && value.startsWith('https://') ? value : null

// 앞에서부터 시도한다. 두 크기(125px, 500px)를 함께 주면 브라우저가 카드 크기와 화면 해상도에 맞는 것을 고른다.
// 그 사진을 못 불러오면 원본만 다시 받고, 그것도 안 되면 사진 없이 보인다.
export function imageAttempts(product: WithImages): ImageAttempt[] {
  const large = https(product.imageUrl)
  const small = https(product.thumbnailUrl)
  if (large && small) return [{ src: small, srcSet: `${small} 125w, ${large} 500w` }, { src: large }]
  const only = large ?? small
  return only ? [{ src: only }] : []
}
