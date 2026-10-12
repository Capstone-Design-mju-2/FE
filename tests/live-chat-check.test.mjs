import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { promisify } from 'node:util'
import { test } from 'node:test'
import example from '../src/mocks/chat-response.example.json' with { type: 'json' }

const run = promisify(execFile)

test('실제 연동 점검 명령은 정상·재고 장애·검색 장애·빈 결과를 구분한다', async () => {
  const requests = []
  const stocked = { ...example, products: example.products.map((product) => ({
    ...product,
    inventory: { status: 'IN_STOCK', quantity: 12, estimatedDeliveryDate: '2026-10-13' },
  })) }
  const server = createServer(async (request, response) => {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    const { message } = JSON.parse(Buffer.concat(chunks).toString())
    requests.push({ method: request.method, url: request.url, message })
    response.setHeader('Content-Type', 'application/json')
    if (message === 'error') {
      response.writeHead(502)
      response.end(JSON.stringify({ code: 'PRODUCT_SEARCH_FAILED', message: '검색 실패' }))
      return
    }
    if (message === 'bad-error') {
      response.writeHead(400)
      response.end(JSON.stringify({ code: 'INVALID_REQUEST', message: '잘못된 질문' }))
      return
    }
    if (message === 'empty') {
      response.end(JSON.stringify({ answer: '결과 없음', products: [] }))
      return
    }
    if (message === 'unknown') {
      response.end(JSON.stringify({ ...example, products: example.products.map((product) => ({
        ...product,
        inventory: { status: 'UNKNOWN', quantity: null, estimatedDeliveryDate: null },
      })) }))
      return
    }
    response.end(JSON.stringify(message === 'mixed' ? example : stocked))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const url = `http://127.0.0.1:${server.address().port}`
  const check = (expect, question) => run(process.execPath, [
    'scripts/check-live-chat.mjs', '--url', url, '--expect', expect, '--question', question,
  ])

  try {
    for (const mode of ['normal', 'unknown', 'error', 'empty']) {
      assert.match((await check(mode, mode)).stdout, new RegExp(`PASS ${mode}`))
    }
    await assert.rejects(check('normal', 'unknown'), /UNKNOWN 재고가 있습니다/)
    await assert.rejects(check('normal', 'mixed'), /UNKNOWN 재고가 있습니다/)
    await assert.rejects(check('unknown', 'normal'), /모든 재고 UNKNOWN 예상/)
    await assert.rejects(check('error', 'bad-error'), /HTTP 502 PRODUCT_SEARCH_FAILED 예상/)
    assert.ok(requests.every(({ method, url: path }) => method === 'POST' && path === '/api/v1/chat'))
    assert.deepEqual(requests.map(({ message }) => message), [
      'normal', 'unknown', 'error', 'empty', 'unknown', 'mixed', 'normal', 'bad-error',
    ])
  } finally {
    server.close()
  }
})
