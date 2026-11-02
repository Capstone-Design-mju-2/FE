// 상품 사진은 BE가 주는 무신사 이미지 서버 주소를 브라우저가 바로 받는다 (BE docs/API.md 2절, ADR-127).
// candidates: 이번 시도에서 브라우저가 고를 수 있는 주소들. 실패하면 이 중 실제로 받던 주소를 실패로 기록한다.
export type ImageAttempt = { src: string; srcSet?: string; candidates: string[] }

type WithImages = { imageUrl?: string | null; thumbnailUrl?: string | null }

// img 태그에 그대로 넣으므로 https 주소만 쓴다.
const https = (value: string | null | undefined): string | null =>
  typeof value === 'string' && value.startsWith('https://') ? value : null

// 아직 실패하지 않은 주소로 다음 시도를 만든다. 두 크기(125px, 500px)가 다 남아 있으면 srcset으로 주어
// 브라우저가 카드 크기와 화면 배율에 맞는 것을 고르게 한다. 한 크기를 못 불러오면 남은 크기만 다시 받고
// (BE 계약: thumbnailUrl을 못 불러오면 imageUrl로), 둘 다 안 되면 null(사진 없이 보인다)이다.
export function imageAttempt(product: WithImages, failed: readonly string[] = []): ImageAttempt | null {
  const large = https(product.imageUrl)
  const small = https(product.thumbnailUrl)
  const usableSmall = small && !failed.includes(small) ? small : null
  const usableLarge = large && large !== small && !failed.includes(large) ? large : null
  if (usableSmall && usableLarge) {
    return { src: usableSmall, srcSet: `${usableSmall} 125w, ${usableLarge} 500w`, candidates: [usableSmall, usableLarge] }
  }
  const only = usableSmall ?? usableLarge
  return only ? { src: only, candidates: [only] } : null
}

// img의 error 이벤트에서 실패한 주소. srcset이면 브라우저가 실제로 받던 currentSrc다.
// currentSrc가 후보와 다르면(비어 있는 경우 등) src를 실패로 본다. 후보 중 하나를 반드시 돌려주므로
// 시도할 때마다 남은 주소가 줄어 같은 주소를 다시 받지 않는다.
export function failedImageUrl(attempt: ImageAttempt, currentSrc: string): string {
  return attempt.candidates.find((url) => url === currentSrc) ?? attempt.src
}
