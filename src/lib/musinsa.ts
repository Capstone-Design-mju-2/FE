// 카드의 "무신사에서 보기" 링크 주소 (BE docs/API.md 1절 productUrl, ADR-189).
// href에 그대로 넣으므로 무신사 상품 페이지 주소일 때만 쓰고, 아니면 링크를 숨긴다.
export function musinsaUrl(productUrl: string | null | undefined): string | null {
  return typeof productUrl === 'string' && productUrl.startsWith('https://www.musinsa.com/products/')
    ? productUrl
    : null
}
