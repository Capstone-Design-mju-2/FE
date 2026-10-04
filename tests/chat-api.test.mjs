import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { test } from 'node:test'
import { ApiRequestError, postJson } from '../src/api/client.ts'
import { isChatResponse } from '../src/api/validateChat.ts'

const fixture = JSON.parse(await readFile(new URL('../src/mocks/chat-response.example.json', import.meta.url)))

test('실제 HTTP: 질문 본문 전송, 정상/빈 결과/재고 장애/검색 장애/재시도', async (t) => {
  let status = 200
  let response = fixture
  const server = createServer(async (req, res) => {
    assert.equal(req.method, 'POST')
    assert.equal(req.url, '/api/v1/chat')
    assert.equal(req.headers['content-type'], 'application/json')
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    assert.deepEqual(JSON.parse(Buffer.concat(chunks)), { message: '순한 선크림' })
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(response))
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => { server.closeAllConnections(); server.close() })
  const request = () => postJson(`http://127.0.0.1:${server.address().port}/api/v1/chat`, { message: '순한 선크림' })
  assert.deepEqual(await request(), fixture)
  response = { answer: '결과 없음', products: [] }
  assert.ok(isChatResponse(await request()))
  response = { ...fixture, products: fixture.products.map((p) => ({ ...p,
    inventory: { status: 'UNKNOWN', quantity: null, estimatedDeliveryDate: null },
  })) }
  assert.ok(isChatResponse(await request()))
  status = 502
  response = { code: 'PRODUCT_SEARCH_FAILED', message: '상품 검색에 실패했습니다.' }
  await assert.rejects(request, (error) => error instanceof ApiRequestError &&
    error.status === 502 && error.code === response.code && error.message === response.message)
  status = 200
  response = fixture
  assert.deepEqual(await request(), fixture)
})

test('잘못된 응답은 렌더링 전에 거부하고 reason은 null/문자열 모두 허용', () => {
  assert.ok(isChatResponse(fixture))
  assert.ok(isChatResponse({ ...fixture, products: fixture.products.map((p) => ({ ...p, reason: '리뷰 근거' })) }))
  for (const invalid of [null, {}, { answer: '답변', products: null },
    { ...fixture, products: [null] },
    { ...fixture, products: [{ ...fixture.products[0], evidence: [null] }] },
    { ...fixture, products: [{ ...fixture.products[0], inventory: { status: 'NOT_FOUND' } }] },
  ]) assert.equal(isChatResponse(invalid), false)
})

test('네트워크·시간 초과·잘못된 JSON·비 JSON 오류 응답을 표시 가능한 오류로 변환', async (t) => {
  const scenarios = [
    [() => { throw new TypeError('Failed to fetch') }, 'NETWORK_ERROR'],
    [() => { throw new DOMException('timeout', 'TimeoutError') }, 'TIMEOUT'],
    [() => new Response('<html>proxy</html>'), 'INVALID_RESPONSE'],
    [() => new Response('<html>proxy</html>', { status: 502 }), 'UNKNOWN_ERROR'],
    [() => new Response(JSON.stringify({ code: {}, message: [] }), { status: 500 }), 'UNKNOWN_ERROR'],
  ]
  for (const [fetch, code] of scenarios) {
    t.mock.method(globalThis, 'fetch', fetch)
    await assert.rejects(() => postJson('/api/v1/chat', {}), (error) =>
      error instanceof ApiRequestError && error.code === code && typeof error.message === 'string')
    t.mock.restoreAll()
  }
})
