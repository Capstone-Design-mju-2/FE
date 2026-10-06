import { formatInventory, formatPrice } from '../lib/format'
import type { Product } from '../types/api'
import './ProductCard.css'

type Props = {
  product: Product
}

function ProductCard({ product }: Props) {
  const stock = formatInventory(product.inventory)

  return (
    <article className="product-card">
      <div className="product-card__thumb" aria-hidden="true" />
      <div className="product-card__body">
        <div className="product-card__head">
          <div>
            <div className="product-card__brand">{product.brand}</div>
            <h3 className="product-card__name">{product.name}</h3>
          </div>
          <div className="product-card__price">{formatPrice(product.price)}</div>
        </div>

        <span className={`stock-badge stock-badge--${stock.tone}`}>{stock.label}</span>

        {/* reason이 null이면 줄 자체를 숨긴다 (1C 전까지는 항상 null) */}
        {product.reason?.trim() && (
          <div className="product-card__reason">
            <h4 className="product-card__label">추천 이유</h4>
            <p>{product.reason}</p>
          </div>
        )}

        <div className="product-card__reviews">
          <h4 className="product-card__label">리뷰 근거</h4>
          <ul className="product-card__evidence" aria-label="추천의 근거가 된 리뷰">
            {product.evidence.map((review) => (
              <li key={review.reviewId}>
                <span className="product-card__rating">
                  <span aria-hidden="true">★ {review.rating}</span>
                  <span className="sr-only">{`별점 ${review.rating}점`}</span>
                </span>
                <q>{review.excerpt}</q>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
