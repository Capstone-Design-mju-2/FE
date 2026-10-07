import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  MAX_ORDER_QUANTITY,
  canOrder,
  clampQuantity,
  firstAvailableOption,
  maxQuantity,
  resolveProductOptions,
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

test('목업 옵션은 목업 모드에서만 쓰고, 실제 API 모드에서는 ID가 겹쳐도 옵션 정보 없음', () => {
  const mockOptions = {
    101: { label: '용량', options: [{ optionId: 1011, name: '50ml', soldOut: false }] },
  }
  assert.deepEqual(resolveProductOptions(101, true, mockOptions), mockOptions[101])
  assert.equal(resolveProductOptions(999, true, mockOptions), null)
  // 실제 응답의 productId가 목업 ID(101)와 같아도 목업 옵션을 붙이지 않는다.
  assert.equal(resolveProductOptions(101, false, mockOptions), null)
  assert.equal(resolveProductOptions(999, false, mockOptions), null)
})

test('기본 선택 옵션은 품절이 아닌 첫 옵션이고, 전부 품절이면 없다', () => {
  const options = [
    { optionId: 1, name: '50ml', soldOut: true },
    { optionId: 2, name: '80ml', soldOut: false },
  ]
  assert.equal(firstAvailableOption(options)?.optionId, 2)
  assert.equal(firstAvailableOption([{ optionId: 1, name: '50ml', soldOut: true }]), null)
})
