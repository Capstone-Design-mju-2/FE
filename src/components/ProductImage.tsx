import { useState, type ReactNode } from 'react'
import { imageAttempts } from '../lib/image'

type Props = {
  product: { imageUrl?: string | null; thumbnailUrl?: string | null }
  sizes: string // 카드에서 사진이 차지하는 너비. 브라우저가 이 값으로 사진 크기를 고른다
  className: string
  fallback: ReactNode
}

// 화면에 가까워질 때만 받고, 못 불러오면 다음 주소로, 다 안 되면 fallback을 보인다.
function ProductImage({ product, sizes, className, fallback }: Props) {
  const attempts = imageAttempts(product)
  const [tried, setTried] = useState(0)
  const attempt = attempts[tried]
  if (!attempt) return fallback

  return (
    <img key={tried} className={className} src={attempt.src} srcSet={attempt.srcSet}
      sizes={attempt.srcSet ? sizes : undefined} alt="" loading="lazy" decoding="async"
      onError={() => setTried(tried + 1)} />
  )
}

export default ProductImage
