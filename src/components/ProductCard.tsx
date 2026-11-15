import { formatInventory, formatPrice } from '../lib/format'
import { highlight, highlightTerms } from '../lib/highlight'
import { canOrder } from '../lib/order'
import type { Product } from '../types/api'
import ProductImage from './ProductImage'
import './ProductCard.css'

type Props = {
  product: Product
  question?: string
  onOrder?: (product: Product) => void
}

function ProductCard({ product, question = '', onOrder }: Props) {
  const stock = formatInventory(product.inventory)
  const orderable = canOrder(product.inventory)
  const terms = highlightTerms(question)

  return (
    <article className="product-card">
      <div className="product-card__thumb" aria-hidden="true">
        <ProductImage product={product} className="product-card__photo" sizes="112px" fallback={null} />
      </div>
      <div className="product-card__body">
        <div className="product-card__brand">{product.brand}</div>
        <h3 className="product-card__name">{product.name}</h3>
        <span className={`stock-badge stock-badge--${stock.tone}`}>{stock.label}</span>

        {/* reason이 null이면 줄 자체를 숨긴다 (1C 전까지는 항상 null) */}
        {product.reason?.trim() && (
          <div className="product-card__reason">
            <h4 className="sr-only">추천 이유</h4>
            <p>{product.reason}</p>
          </div>
        )}

        <div className="product-card__reviews">
          <h4 className="sr-only">리뷰 근거</h4>
          <ul className="product-card__evidence" aria-label="추천의 근거가 된 리뷰">
            {product.evidence.map((review) => (
              <li key={review.reviewId}>
                <q>
                  {highlight(review.excerpt, terms).map((part, i) =>
                    part.marked ? <mark key={i}>{part.text}</mark> : part.text)}
                </q>
                <span className="product-card__rating">
                  <span aria-hidden="true">★ {review.rating}</span>
                  <span className="sr-only">{`별점 ${review.rating}점`}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="product-card__buy">
          <span className="product-card__price">{formatPrice(product.price)}</span>
          {onOrder && (
            // 재고 있음일 때만 주문할 수 있다. 확인하지 못한 재고는 잠근다.
            <button type="button" className="btn-primary" onClick={() => onOrder(product)} disabled={!orderable}>
              {orderable ? '주문하기' : '주문 불가'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default ProductCard
