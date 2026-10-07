import type { Inventory, Product } from '../types/api'
import type { MockOrderReceipt, ProductOption, ProductOptions } from '../types/order'

// 옵션은 아직 API 계약에 없다. 목업 모드에서만 목업 옵션을 쓰고, 실제 API 모드에서는
// 상품 ID가 목업과 겹쳐도 목업 옵션을 붙이지 않는다 (null = 옵션 정보 없음).
export function resolveProductOptions(
  productId: number,
  useMock: boolean,
  mockOptions: Record<string, ProductOptions>,
): ProductOptions | null {
  if (!useMock) return null
  return mockOptions[productId] ?? null
}

// 한 번에 주문할 수 있는 수량 상한은 PRD 7절 열린 질문이다. 정해지기 전까지 임시값.
export const MAX_ORDER_QUANTITY = 5

// 주문은 재고 있음일 때만 받는다 (PRD 6절 상품 카드 규칙).
export function canOrder(inventory: Inventory): boolean {
  return inventory.status === 'IN_STOCK' && (inventory.quantity ?? 0) > 0
}

export function maxQuantity(inventory: Inventory): number {
  return Math.max(1, Math.min(inventory.quantity ?? 1, MAX_ORDER_QUANTITY))
}

export function clampQuantity(value: number, max: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(Math.max(Math.trunc(value), 1), max)
}

export function firstAvailableOption(options: ProductOption[]): ProductOption | null {
  return options.find((option) => !option.soldOut) ?? null
}

export function buildMockOrderReceipt(
  product: Product, options: ProductOptions | null, optionId: number | null,
  quantity: number, orderId: string,
): MockOrderReceipt | null {
  const option = options?.options.find((item) => item.optionId === optionId && !item.soldOut)
  if (!option || !canOrder(product.inventory) || !Number.isInteger(quantity) ||
    quantity < 1 || quantity > maxQuantity(product.inventory)) return null

  return {
    orderId, productName: product.name, brand: product.brand, optionName: option.name,
    quantity, unitPrice: product.price, totalPrice: product.price * quantity,
    estimatedDeliveryDate: product.inventory.estimatedDeliveryDate,
  }
}
