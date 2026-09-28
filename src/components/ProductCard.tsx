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
        {product.reason && <p className="product-card__reason">{product.reason}</p>}

        <ul className="product-card__evidence">
          {product.evidence.map((review) => (
            <li key={review.reviewId}>
              <span className="product-card__rating">★ {review.rating}</span>
              <span>"{review.excerpt}"</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

export default ProductCard
