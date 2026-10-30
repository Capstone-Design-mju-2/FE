import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { test } from 'node:test'
import { createOrder } from '../src/api/createOrder.ts'
import { ApiRequestError } from '../src/api/client.ts'

const request = { ordererKey: 'demo', items: [{ productId: 101, optionKey: '11', quantity: 2 }] }
const success = { orderId: 7, totalPrice: 25800,
  items: [{ productId: 101, optionKey: '11', name: '수분크림 A 50ml', unitPrice: 12900, quantity: 2 }] }

async function withOrderServer(handler, run) {
  const server = createServer(handler)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  try {
    await run(`http://127.0.0.1:${server.address().port}/api/v1/orders`)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

test('주문 생성은 BE 계약의 경로·본문을 보내고 성공 응답을 확인한다', async () => {
  await withOrderServer(async (req, res) => {
    assert.equal(req.method, 'POST')
    assert.equal(req.url, '/api/v1/orders')
    let body = ''
    for await (const chunk of req) body += chunk
    assert.deepEqual(JSON.parse(body), request)
    res.writeHead(201, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(success))
  }, async (url) => {
    assert.deepEqual(await createOrder(request, url), success)
  })
})

test('409 품절 응답은 코드와 메시지를 보존하고 자동 재주문하지 않는다', async () => {
  let calls = 0
  await withOrderServer((_req, res) => {
    calls += 1
    res.writeHead(409, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ code: 'INSUFFICIENT_STOCK', message: '재고가 부족합니다.',
      failedItem: { productId: 101, optionKey: '11', requested: 2, available: 1 } }))
  }, async (url) => {
    await assert.rejects(createOrder(request, url), (error) =>
      error instanceof ApiRequestError && error.status === 409 &&
      error.code === 'INSUFFICIENT_STOCK' && error.message === '재고가 부족합니다.')
    assert.equal(calls, 1)
  })
})

test('주문 성공 응답이 계약과 다르면 완료로 처리하지 않는다', async () => {
  await withOrderServer((_req, res) => {
    res.writeHead(201, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ...success, items: [{ ...success.items[0], quantity: '2' }] }))
  }, async (url) => {
    await assert.rejects(createOrder(request, url), (error) =>
      error instanceof ApiRequestError && error.code === 'INVALID_RESPONSE')
  })
})
