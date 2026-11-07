// 주문 API 계약이 나오기 전 목업용 임시 타입.
// 7주차 주문 API 설계(옵션·수량 → 재고 차감·주문 생성)가 정해지면 계약에 맞춰 교체한다.

export type ProductOption = {
  optionId: number
  name: string // 예: 50ml, 21호 라이트
  soldOut: boolean
  optionKey?: string // 실제 주문 API의 옵션 키. 목업 옵션에는 없다.
  price?: number
  quantity?: number
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
  serverAccepted?: true
}

export type InventoryOptionsResponse = {
  productId: number
  options: {
    optionKey: string
    name: string
    price: number
    quantity: number
    status: 'IN_STOCK' | 'OUT_OF_STOCK'
  }[]
}

// BE PR #30의 주문 생성 계약. 서버의 requestId 멱등 처리는 아직 구현 전이다.
export type CreateOrderRequest = {
  ordererKey: string
  // 주문 시도마다 새로 만들고, 결과가 불명확한 같은 주문을 재전송할 때는 재사용한다.
  requestId?: string
  items: { productId: number; optionKey: string; quantity: number }[]
}

export type CreateOrderResponse = {
  orderId: number
  totalPrice: number
  items: {
    productId: number
    optionKey: string
    name: string
    unitPrice: number
    quantity: number
  }[]
}
