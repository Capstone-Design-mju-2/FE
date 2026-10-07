import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { createServer } from 'vite'

test('주문 완료는 실제 API 설정에서 차단되고 목업 설정에서만 생성된다', async () => {
  const original = process.env.VITE_USE_MOCK
  const { products } = JSON.parse(await readFile(new URL('../src/mocks/chat-response.example.json', import.meta.url)))
  try {
    for (const mode of ['false', 'true']) {
      process.env.VITE_USE_MOCK = mode
      const server = await createServer({ server: { middlewareMode: true, hmr: false }, logLevel: 'error' })
      try {
        const { createMockOrder } = await server.ssrLoadModule('/src/api/order.ts')
        const receipt = createMockOrder(products[0], 1012, 3)
        if (mode === 'false') assert.equal(receipt, null)
        else {
          assert.equal(receipt.optionName, '80ml')
          assert.equal(receipt.totalPrice, 77700)
          assert.ok(receipt.orderId.startsWith('MOCK-'))
          assert.notEqual(createMockOrder(products[0], 1012, 3).orderId, receipt.orderId)
          assert.equal(createMockOrder(products[0], 1013, 1), null)
        }
      } finally { await server.close() }
    }
  } finally {
    if (original === undefined) delete process.env.VITE_USE_MOCK
    else process.env.VITE_USE_MOCK = original
  }
})
