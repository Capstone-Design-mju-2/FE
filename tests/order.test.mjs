import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  MAX_ORDER_QUANTITY,
  canOrder,
  clampQuantity,
  firstAvailableOption,
  maxQuantity,
} from '../src/lib/order.ts'

const inStock = (quantity) => ({ status: 'IN_STOCK', quantity, estimatedDeliveryDate: '2026-10-07' })

test('주문은 재고 있음이고 수량이 1개 이상일 때만 받는다', () => {
  assert.equal(canOrder(inStock(3)), true)
  assert.equal(canOrder(inStock(0)), false)
  assert.equal(canOrder(inStock(null)), false)
  assert.equal(canOrder({ status: 'OUT_OF_STOCK', quantity: 0, estimatedDeliveryDate: null }), false)
  assert.equal(canOrder({ status: 'UNKNOWN', quantity: null, estimatedDeliveryDate: null }), false)
})

test('수량 상한은 재고와 임시 상한 중 작은 값이고, 입력값은 1~상한으로 맞춘다', () => {
  assert.equal(maxQuantity(inStock(2)), 2)
  assert.equal(maxQuantity(inStock(12)), MAX_ORDER_QUANTITY)
  assert.equal(maxQuantity(inStock(null)), 1)
  assert.equal(clampQuantity(0, 3), 1)
  assert.equal(clampQuantity(4, 3), 3)
  assert.equal(clampQuantity(2.7, 3), 2)
  assert.equal(clampQuantity(Number.NaN, 3), 1)
})

test('기본 선택 옵션은 품절이 아닌 첫 옵션이고, 전부 품절이면 없다', () => {
  const options = [
    { optionId: 1, name: '50ml', soldOut: true },
    { optionId: 2, name: '80ml', soldOut: false },
  ]
  assert.equal(firstAvailableOption(options)?.optionId, 2)
  assert.equal(firstAvailableOption([{ optionId: 1, name: '50ml', soldOut: true }]), null)
})
