import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer as createHttpServer } from 'node:http'
import { test } from 'node:test'
import { createServer as createViteServer } from 'vite'

test('개발 프록시는 채팅·피부 분석·상품·재고 옵션·주문을 같은 Gateway로 보내고 팀 인증은 서버에서 붙인다', async (t) => {
  const received = []
  const gateway = createHttpServer(async (request, response) => {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    received.push({ path: request.url, host: request.headers.host,
      authorization: request.headers.authorization, body: Buffer.concat(chunks).toString('utf8') })
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end('{}')
  })
  gateway.listen(0, '127.0.0.1')
  await once(gateway, 'listening')
  const oldGateway = process.env.GATEWAY_SERVICE_URL
  const oldAuth = process.env.BE_BASIC_AUTH
  process.env.GATEWAY_SERVICE_URL = `http://127.0.0.1:${gateway.address().port}`
  process.env.BE_BASIC_AUTH = 'team:dummy'

  let vite
  t.after(async () => {
    await vite?.close()
    gateway.closeAllConnections()
    gateway.close()
    if (oldGateway === undefined) delete process.env.GATEWAY_SERVICE_URL
    else process.env.GATEWAY_SERVICE_URL = oldGateway
    if (oldAuth === undefined) delete process.env.BE_BASIC_AUTH
    else process.env.BE_BASIC_AUTH = oldAuth
  })
  vite = await createViteServer({ logLevel: 'silent', server: { host: '127.0.0.1', port: 0 } })
  await vite.listen()
  const origin = `http://127.0.0.1:${vite.httpServer.address().port}`
  for (const [method, path] of [
    ['POST', '/api/v1/chat'],
    ['POST', '/api/v1/profile/insights'],
    ['GET', '/api/v1/products?category=104001'],
    ['GET', '/api/v1/products/101/reviews'],
    ['POST', '/api/v1/inventories/check'],
    ['GET', '/api/v1/inventories/101/options'],
    ['POST', '/api/v1/orders'],
  ]) {
    const response = await fetch(origin + path, { method,
      ...(method === 'POST' ? { body: '{}', headers: { 'Content-Type': 'application/json' } } : {}) })
    assert.equal(response.status, 200, `${method} ${path}`)
  }
  assert.equal(received.length, 7)
  for (const item of received) {
    assert.equal(item.host, `127.0.0.1:${gateway.address().port}`)
    assert.equal(item.authorization, 'Basic ' + Buffer.from('team:dummy').toString('base64'))
  }
  assert.deepEqual(received.map((item) => item.path), [
    '/api/v1/chat', '/api/v1/profile/insights', '/api/v1/products?category=104001',
    '/api/v1/products/101/reviews', '/api/v1/inventories/check',
    '/api/v1/inventories/101/options', '/api/v1/orders',
  ])
})
