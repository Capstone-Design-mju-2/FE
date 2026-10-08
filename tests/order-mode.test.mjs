import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { createMockOrderReceipt, resolveProductOptions } from '../src/lib/order.ts'

const { products } = JSON.parse(await readFile(new URL('../src/mocks/chat-response.example.json', import.meta.url)))
const options = { 101: { label: '용량', options: [
  { optionId: 1012, name: '80ml', soldOut: false },
  { optionId: 1013, name: '100ml', soldOut: true },
] } }

test('실제 API 모드는 상품 ID가 목업과 겹쳐도 옵션·목업 완료를 만들지 않는다', () => {
  assert.equal(resolveProductOptions(101, false, options), null)
  assert.equal(createMockOrderReceipt(false, products[0], options[101], 1012, 3), null)
})

test('목업 모드는 선택한 옵션으로 완료하고 무효한 선택에서는 완료를 만들지 않는다', () => {
  const receipt = createMockOrderReceipt(true, products[0], resolveProductOptions(101, true, options), 1012, 3)
  assert.equal(receipt.optionName, '80ml')
  assert.equal(receipt.totalPrice, 77700)
  assert.match(receipt.orderId, /^MOCK-\d{8}-\d{4,}$/)
  assert.notEqual(createMockOrderReceipt(true, products[0], options[101], 1012, 3).orderId, receipt.orderId)
  assert.equal(createMockOrderReceipt(true, products[0], options[101], 1013, 1), null)
})
