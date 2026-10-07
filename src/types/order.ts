// 주문 API 계약이 나오기 전 목업용 임시 타입.
// 7주차 주문 API 설계(옵션·수량 → 재고 차감·주문 생성)가 정해지면 계약에 맞춰 교체한다.

export type ProductOption = {
  optionId: number
  name: string // 예: 50ml, 21호 라이트
  soldOut: boolean
}

export type ProductOptions = {
  label: string // 옵션 묶음 이름. 예: 용량, 호수, 색상
  options: ProductOption[]
}

// 브라우저 내 시연 결과. 실제 주문 API 응답 계약과는 별개다.
export type MockOrderReceipt = {
  orderId: string
  productName: string
  brand: string
  optionName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  estimatedDeliveryDate: string | null
}
