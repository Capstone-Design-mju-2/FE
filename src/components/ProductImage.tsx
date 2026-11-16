import { useState, type ReactNode } from 'react'
import { failedImageUrl, imageAttempt } from '../lib/image'

type Props = {
  product: { imageUrl?: string | null; thumbnailUrl?: string | null }
  sizes: string // 카드에서 사진이 차지하는 너비. 브라우저가 이 값으로 사진 크기를 고른다
  className: string
  fallback: ReactNode
  priority?: boolean // 첫 화면에 바로 보이는 사진. 지연 로딩 없이 먼저 받는다
}

// 화면에 가까워질 때만 받고, 못 불러온 주소는 기억해 두었다가 남은 크기로, 다 안 되면 fallback을 보인다.
// 받은 사진은 서서히 나타난다(index.css .product-image).
function ProductImage({ product, sizes, className, fallback, priority = false }: Props) {
  const [failed, setFailed] = useState<string[]>([])
  const [loaded, setLoaded] = useState<string | null>(null)
  const attempt = imageAttempt(product, failed)
  if (!attempt) return fallback
  const attemptKey = attempt.candidates.join(' ')

  return (
    <img key={attemptKey} className={`${className} product-image${loaded === attemptKey ? ' is-loaded' : ''}`}
      src={attempt.src} srcSet={attempt.srcSet} sizes={attempt.srcSet ? sizes : undefined} alt=""
      loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async"
      onLoad={() => setLoaded(attemptKey)}
      onError={(e) => {
        const url = failedImageUrl(attempt, e.currentTarget.currentSrc)
        setFailed((prev) => [...prev, url])
      }} />
  )
}

export default ProductImage
