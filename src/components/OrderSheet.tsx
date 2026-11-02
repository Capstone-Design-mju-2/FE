import { useEffect, useId, useRef, useState } from 'react'
import { createMockOrder, loadProductOptions } from '../api/order'
import { createOrder } from '../api/createOrder'
import { ApiRequestError } from '../api/client'
import OrderComplete from './OrderComplete'
import ProductImage from './ProductImage'
import type { MockOrderReceipt, ProductOptions } from '../types/order'
import { formatDelivery, formatPrice } from '../lib/format'
import { MAX_ORDER_QUANTITY, buildServerOrderReceipt, clampQuantity, firstAvailableOption, maxQuantity, newOrderRequestId } from '../lib/order'
import { useDialog } from '../lib/useDialog'
import type { Product } from '../types/api'
import './OrderSheet.css'

type Props = {
  product: Product
  onClose: () => void
  onOrderComplete: (receipt: MockOrderReceipt) => void
}

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

// 와이어프레임 5a: 목업 모드와 실제 옵션·주문 API 모드를 같은 화면에서 처리한다.
function OrderSheet({ product, onClose, onOrderComplete }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [productOptions, setProductOptions] = useState<ProductOptions | null>(null)
  const [optionStatus, setOptionStatus] = useState<'loading' | 'ready' | 'unavailable' | 'error'>('loading')
  const [optionLoadAttempt, setOptionLoadAttempt] = useState(0)
  const [optionId, setOptionId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [receipt, setReceipt] = useState<MockOrderReceipt | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [unknownResult, setUnknownResult] = useState(false)
  const submittingRef = useRef(false)
  const selectedOption = productOptions?.options.find((option) => option.optionId === optionId)
  const max = selectedOption?.quantity === undefined ? maxQuantity(product.inventory) :
    Math.max(1, Math.min(selectedOption.quantity, MAX_ORDER_QUANTITY))
  const unitPrice = selectedOption?.price ?? product.price
  const allSoldOut = productOptions !== null && firstAvailableOption(productOptions.options) === null

  useEffect(() => {
    let active = true
    loadProductOptions(product.productId).then((options) => {
      if (!active) return
      setProductOptions(options)
      setOptionId((current) => options?.options.find((option) => option.optionId === current)?.optionId
        ?? (options ? firstAvailableOption(options.options)?.optionId ?? null : null))
      setOptionStatus(options ? 'ready' : 'unavailable')
    }).catch(() => {
      if (active) setOptionStatus('error')
    })
    return () => { active = false }
  }, [product.productId, optionLoadAttempt])

  const retryOptionLoad = () => {
    setOptionStatus('loading')
    setOptionLoadAttempt((attempt) => attempt + 1)
  }

  const submit = async () => {
    if (submittingRef.current || unknownResult || !selectedOption || selectedOption.soldOut || quantity > max) return
    submittingRef.current = true
    setSubmitting(true)
    setOrderError(null)
    try {
      const result = useMock
        ? createMockOrder(product, selectedOption.optionId, quantity)
        : selectedOption.optionKey
          ? buildServerOrderReceipt(product, await createOrder({
            ordererKey: 'demo', requestId: newOrderRequestId(),
            items: [{ productId: product.productId, optionKey: selectedOption.optionKey, quantity }],
          }), selectedOption.optionKey, quantity)
          : null
      if (!result) {
        setUnknownResult(!useMock)
        setOrderError(useMock
          ? '주문을 완료하지 못했어요. 선택한 옵션과 수량을 확인하고 다시 시도해 주세요.'
          : '주문 응답을 확인하지 못했어요. 중복 주문을 피하려면 지금은 다시 주문하지 마세요.')
        return
      }
      setReceipt(result)
      onOrderComplete(result)
    } catch (error) {
      const unknown = error instanceof ApiRequestError &&
        (['TIMEOUT', 'NETWORK_ERROR', 'INVALID_RESPONSE'].includes(error.code) || error.status >= 500)
      if (unknown || !(error instanceof ApiRequestError)) setUnknownResult(true)
      setOrderError(error instanceof ApiRequestError ? error.message :
        '주문 처리 여부를 확인하지 못했어요. 중복 주문을 피하려면 지금은 다시 주문하지 마세요.')
      if (error instanceof ApiRequestError && error.status === 409) retryOptionLoad()
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  // 닫힌 뒤 포커스 복귀는 App이 맡는다.
  useDialog(panelRef, closeRef, onClose, receipt)

  return (
    <div className="order-sheet">
      <div className="order-sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <section
        ref={panelRef}
        className="order-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="order-sheet__header">
          <h2 id={titleId}>{receipt ? '주문 완료' : '주문 확인'}</h2>
          <button ref={closeRef} type="button" className="order-sheet__close" onClick={onClose} aria-label={receipt ? '주문 완료 닫기' : '주문 확인 닫기'}>
            ✕
          </button>
        </header>

        {receipt ? <OrderComplete receipt={receipt} onClose={onClose} /> : <>
          <div className="order-sheet__body">
            <p className="order-sheet__trial">결제 없는 체험 주문입니다</p>

            <div className="order-sheet__product">
              <div className="order-sheet__thumb" aria-hidden="true">
                <ProductImage product={product} className="order-sheet__photo" sizes="64px" fallback={null} />
              </div>
              <div>
                <div className="order-sheet__brand">{product.brand}</div>
                <div className="order-sheet__name">{product.name}</div>
                <div>{useMock ? formatPrice(product.price) : `대표 가격 ${formatPrice(product.price)}`}</div>
              </div>
            </div>

            {optionStatus === 'loading' ? (
              <div className="order-sheet__field" role="status">옵션을 불러오는 중이에요.</div>
            ) : optionStatus === 'error' ? (
              <div className="order-sheet__field">
                <p className="order-sheet__note" role="alert">옵션을 불러오지 못했어요.</p>
                <button type="button" className="order-sheet__retry" onClick={retryOptionLoad}>옵션 다시 불러오기</button>
              </div>
            ) : productOptions === null ? (
              <div className="order-sheet__field">
                <div className="order-sheet__label">옵션</div>
                <p className="order-sheet__note">주문 가능한 옵션이 등록되면 주문할 수 있어요.</p>
              </div>
            ) : (
              <fieldset className="order-sheet__field">
                <legend>{productOptions.label}</legend>
                <div className="order-sheet__options">
                  {productOptions.options.map((option) => (
                    <label
                      key={option.optionId}
                      className={`option-chip${option.soldOut ? ' option-chip--sold-out' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`option-${product.productId}`}
                        value={option.optionId}
                        checked={optionId === option.optionId}
                        disabled={option.soldOut || submitting}
                        onChange={() => {
                          setOptionId(option.optionId)
                          setQuantity(clampQuantity(quantity,
                            option.quantity === undefined ? maxQuantity(product.inventory) :
                              Math.max(1, Math.min(option.quantity, MAX_ORDER_QUANTITY))))
                          setOrderError(null)
                        }}
                      />
                      <span>{option.name}{option.price === undefined ? '' : ` · ${formatPrice(option.price)}`}{option.soldOut ? ' 품절' : ''}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="order-sheet__row">
              <span className="order-sheet__label" id={`${titleId}-qty`}>수량</span>
              <div className="stepper" role="group" aria-labelledby={`${titleId}-qty`}>
                <button
                  type="button"
                  onClick={() => setQuantity(clampQuantity(quantity - 1, max))}
                  disabled={quantity <= 1 || submitting}
                  aria-label="수량 줄이기"
                >
                  −
                </button>
                <output aria-live="polite">{quantity}</output>
                <button
                  type="button"
                  onClick={() => setQuantity(clampQuantity(quantity + 1, max))}
                  disabled={quantity >= max || submitting}
                  aria-label="수량 늘리기"
                >
                  +
                </button>
              </div>
            </div>
            {quantity >= max && max > 1 && (
              <p className="order-sheet__hint">한 번에 최대 {max}개까지 주문할 수 있어요.</p>
            )}

            <div className="order-sheet__row">
              <span className="order-sheet__label">배송 예정일</span>
              <span>{formatDelivery(product.inventory.estimatedDeliveryDate)}</span>
            </div>
          </div>

          <footer className="order-sheet__footer">
            <div className="order-sheet__total">
              <b>합계</b>
              <b className="order-sheet__amount">{formatPrice(unitPrice * quantity)}</b>
            </div>
            {allSoldOut && <p className="order-sheet__hint">모든 옵션이 품절이에요.</p>}
            {!allSoldOut && selectedOption?.soldOut && <p className="order-sheet__hint">선택한 옵션이 품절됐어요. 다른 옵션을 골라 주세요.</p>}
            {!allSoldOut && !selectedOption?.soldOut && quantity > max &&
              <p className="order-sheet__hint">선택한 옵션의 재고가 줄었어요. 수량을 {max}개 이하로 바꿔 주세요.</p>}
            {orderError !== null && (
              <p className="order-sheet__hint order-sheet__error" role="alert">
                {orderError}
              </p>
            )}
            <button
              type="button"
              className="order-sheet__submit"
              disabled={productOptions === null || allSoldOut || selectedOption?.soldOut || quantity > max || submitting || unknownResult}
              onClick={submit}
            >
              {submitting ? '주문 요청 중…' : '주문하기'}
            </button>
          </footer>
        </>}
      </section>
    </div>
  )
}

export default OrderSheet
