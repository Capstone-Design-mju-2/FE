import { useEffect, useId, useRef, useState } from 'react'
import { createMockOrder, getProductOptions } from '../api/order'
import OrderComplete from './OrderComplete'
import type { MockOrderReceipt } from '../types/order'
import { formatDelivery, formatPrice } from '../lib/format'
import { clampQuantity, firstAvailableOption, maxQuantity } from '../lib/order'
import type { Product } from '../types/api'
import './OrderSheet.css'

type Props = {
  product: Product
  onClose: () => void
}

// 패널 안에서 Tab으로 이동할 수 있는 요소
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

// 와이어프레임 5a: 채팅 위 오른쪽 패널. 주문 API 연결 전이라 목업 옵션으로 동작한다.
function OrderSheet({ product, onClose }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  // null이면 옵션 정보가 없는 상품 (실제 API 모드 등)
  const productOptions = getProductOptions(product.productId)
  const [optionId, setOptionId] = useState(
    () => (productOptions && firstAvailableOption(productOptions.options)?.optionId) ?? null,
  )
  const [quantity, setQuantity] = useState(1)
  const [receipt, setReceipt] = useState<MockOrderReceipt | null>(null)
  const [orderError, setOrderError] = useState(false)
  const max = maxQuantity(product.inventory)
  const allSoldOut = productOptions !== null && optionId === null

  // 열릴 때 닫기 버튼으로 포커스를 옮긴다. 닫힌 뒤 포커스 복귀는 App이 맡는다.
  useEffect(() => {
    closeRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // aria-modal 동안 Tab·Shift+Tab이 패널 밖으로 나가지 않게 처음·끝 요소에서 순환시킨다.
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      const outside = !panelRef.current.contains(active)
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, receipt])

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
              <div className="order-sheet__thumb" aria-hidden="true" />
              <div>
                <div className="order-sheet__brand">{product.brand}</div>
                <div className="order-sheet__name">{product.name}</div>
                <div>{formatPrice(product.price)}</div>
              </div>
            </div>

            {productOptions === null ? (
              <div className="order-sheet__field">
                <div className="order-sheet__label">옵션</div>
                <p className="order-sheet__note">옵션 정보를 아직 불러올 수 없어요.</p>
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
                        disabled={option.soldOut}
                        onChange={() => setOptionId(option.optionId)}
                      />
                      <span>{option.soldOut ? `${option.name} 품절` : option.name}</span>
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
                  onClick={() => setQuantity((q) => clampQuantity(q - 1, max))}
                  disabled={quantity <= 1}
                  aria-label="수량 줄이기"
                >
                  −
                </button>
                <output aria-live="polite">{quantity}</output>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => clampQuantity(q + 1, max))}
                  disabled={quantity >= max}
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
              <b className="order-sheet__amount">{formatPrice(product.price * quantity)}</b>
            </div>
            {allSoldOut && <p className="order-sheet__hint">모든 옵션이 품절이에요.</p>}
            {productOptions === null && (
              <p className="order-sheet__hint">옵션 정보와 주문 API가 준비되면 주문할 수 있어요.</p>
            )}
            {orderError && (
              <p className="order-sheet__hint order-sheet__error" role="alert">
                주문을 완료하지 못했어요. 다시 시도해 주세요.
              </p>
            )}
            <button
              type="button"
              className="order-sheet__submit"
              disabled={productOptions === null || allSoldOut}
              onClick={() => {
                setOrderError(false)
                try {
                  const result = createMockOrder(product, optionId, quantity)
                  if (result) setReceipt(result)
                  else setOrderError(true)
                } catch {
                  setOrderError(true)
                }
              }}
            >
              주문하기
            </button>
          </footer>
        </>}
      </section>
    </div>
  )
}

export default OrderSheet
