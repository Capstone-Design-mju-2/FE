import type { Inventory } from '../types/api'
import type { ProductOption } from '../types/order'

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
