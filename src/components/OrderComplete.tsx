import { formatDelivery, formatPrice } from '../lib/format'
import type { MockOrderReceipt } from '../types/order'

type Props = { receipt: MockOrderReceipt; onClose: () => void }

export default function OrderComplete({ receipt, onClose }: Props) {
  return (
    <>
      <div className="order-sheet__body order-complete">
        <div className="order-complete__mark" aria-hidden="true">✓</div>
        <h3>체험 주문이 완료됐어요</h3>
        <p className="order-sheet__trial">화면 체험용 주문입니다. 실제 결제·주문 접수·배송은 이루어지지 않아요.</p>
        <p className="order-complete__number">주문 번호 <strong>{receipt.orderId}</strong></p>
        <dl className="order-complete__details">
          <div><dt>브랜드</dt><dd>{receipt.brand}</dd></div>
          <div><dt>상품</dt><dd>{receipt.productName}</dd></div>
          <div><dt>옵션</dt><dd>{receipt.optionName}</dd></div>
          <div><dt>수량</dt><dd>{receipt.quantity}개</dd></div>
          <div><dt>상품 가격</dt><dd>{formatPrice(receipt.unitPrice)}</dd></div>
          <div><dt>합계</dt><dd><b>{formatPrice(receipt.totalPrice)}</b></dd></div>
          <div><dt>배송 예정일</dt><dd>{formatDelivery(receipt.estimatedDeliveryDate)}</dd></div>
        </dl>
      </div>
      <footer className="order-sheet__footer">
        <button type="button" className="order-sheet__submit" onClick={onClose}>대화로 돌아가기</button>
      </footer>
    </>
  )
}
