import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildServerOrderReceipt, isInventoryOptionsResponse, newOrderRequestId, toProductOptions,
} from '../src/lib/order.ts'

const options = { productId: 101, options: [
  { optionKey: '50ml-1', name: '50ml x 1개', price: 14900, quantity: 3, status: 'IN_STOCK' },
  { optionKey: '50ml-2', name: '50ml x 2개', price: 32900, quantity: 0, status: 'OUT_OF_STOCK' },
] }

test('BE 옵션 응답은 상품 ID·가격·상태를 검증하고 주문 화면 옵션으로 바꾼다', () => {
  assert.equal(isInventoryOptionsResponse(options, 101), true)
  assert.deepEqual(toProductOptions(options), { label: '옵션', options: [
    { optionId: 0, optionKey: '50ml-1', name: '50ml x 1개', price: 14900, quantity: 3, soldOut: false },
    { optionId: 1, optionKey: '50ml-2', name: '50ml x 2개', price: 32900, quantity: 0, soldOut: true },
  ] })
  assert.equal(isInventoryOptionsResponse(options, 102), false)
  assert.equal(isInventoryOptionsResponse({ ...options, options: [] }, 101), false)
  assert.equal(isInventoryOptionsResponse({ ...options, options: [options.options[0], options.options[0]] }, 101), false)
  assert.equal(isInventoryOptionsResponse({ ...options, options: [{ ...options.options[0], status: 'OUT_OF_STOCK' }] }, 101), false)
  assert.equal(isInventoryOptionsResponse({ ...options, options: [{ ...options.options[0], price: '14900' }] }, 101), false)
})

test('실제 주문 완료는 응답의 옵션 가격과 번호를 쓰고 요청과 다른 결과는 완료로 표시하지 않는다', () => {
  const product = { productId: 101, name: 'QA 크림', brand: 'QA 브랜드', price: 12000,
    inventory: { estimatedDeliveryDate: '2026-11-03' } }
  const order = { orderId: 7, totalPrice: 29800,
    items: [{ productId: 101, optionKey: '50ml-1', name: '50ml x 1개', unitPrice: 14900, quantity: 2 }] }
  assert.deepEqual(buildServerOrderReceipt(product, order, '50ml-1', 2), {
    orderId: '7', productName: 'QA 크림', brand: 'QA 브랜드', optionName: '50ml x 1개',
    quantity: 2, unitPrice: 14900, totalPrice: 29800,
    estimatedDeliveryDate: '2026-11-03', serverAccepted: true,
  })
  assert.equal(buildServerOrderReceipt(product, order, '50ml-2', 2), null)
  assert.equal(buildServerOrderReceipt(product, order, '50ml-1', 1), null)
  assert.equal(buildServerOrderReceipt(product, { ...order, totalPrice: 1 }, '50ml-1', 2), null)
})

test('주문 시도 ID는 중복 없이 UUID 형식으로 생성한다', () => {
  const first = newOrderRequestId()
  const second = newOrderRequestId()
  assert.match(first, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/)
  assert.notEqual(first, second)
})
