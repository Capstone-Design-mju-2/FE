import { useState, type ReactNode } from 'react'
import { failedImageUrl, imageAttempt } from '../lib/image'

type Props = {
  product: { imageUrl?: string | null; thumbnailUrl?: string | null }
  sizes: string // 카드에서 사진이 차지하는 너비. 브라우저가 이 값으로 사진 크기를 고른다
  className: string
  fallback: ReactNode
}

// 화면에 가까워질 때만 받고, 못 불러온 주소는 기억해 두었다가 남은 크기로, 다 안 되면 fallback을 보인다.
function ProductImage({ product, sizes, className, fallback }: Props) {
  const [failed, setFailed] = useState<string[]>([])
  const attempt = imageAttempt(product, failed)
  if (!attempt) return fallback

  return (
    <img key={attempt.candidates.join(' ')} className={className} src={attempt.src} srcSet={attempt.srcSet}
      sizes={attempt.srcSet ? sizes : undefined} alt="" loading="lazy" decoding="async"
      onError={(e) => {
        const url = failedImageUrl(attempt, e.currentTarget.currentSrc)
        setFailed((prev) => [...prev, url])
      }} />
  )
}

export default ProductImage
