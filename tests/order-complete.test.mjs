import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildMockOrderReceipt } from '../src/lib/order.ts'

const product = { name: '수분크림', brand: '브랜드', price: 25900,
  inventory: { status: 'IN_STOCK', quantity: 3, estimatedDeliveryDate: '2026-10-08' } }
const options = { label: '용량', options: [
  { optionId: 1, name: '80ml', soldOut: false },
  { optionId: 2, name: '100ml', soldOut: true },
] }

test('완료 내용은 선택한 옵션·수량·가격·배송일을 복사하고 원본이 바뀌어도 유지한다', () => {
  const source = structuredClone(product)
  const receipt = buildMockOrderReceipt(source, options, 1, 3, 'MOCK-test')
  assert.deepEqual(receipt, { orderId: 'MOCK-test', productName: '수분크림', brand: '브랜드',
    optionName: '80ml', quantity: 3, unitPrice: 25900, totalPrice: 77700,
    estimatedDeliveryDate: '2026-10-08' })
  source.price = 100
  source.inventory.estimatedDeliveryDate = null
  assert.equal(receipt.totalPrice, 77700)
  assert.equal(receipt.estimatedDeliveryDate, '2026-10-08')
})

test('옵션 없음·품절·재고 부족·잘못된 수량은 주문 완료를 만들지 않는다', () => {
  for (const qty of [0, -1, 4, 1.5, NaN, Infinity]) {
    assert.equal(buildMockOrderReceipt(product, options, 1, qty, 'MOCK-test'), null)
  }
  for (const optionId of [null, 2, 999]) {
    assert.equal(buildMockOrderReceipt(product, options, optionId, 1, 'MOCK-test'), null)
  }
  assert.equal(buildMockOrderReceipt(product, null, 1, 1, 'MOCK-test'), null)
  assert.equal(buildMockOrderReceipt({ ...product, inventory: { status: 'UNKNOWN', quantity: null } }, options, 1, 1, 'MOCK-test'), null)
})
