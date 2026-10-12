import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { promisify } from 'node:util'
import { test } from 'node:test'
import example from '../src/mocks/chat-response.example.json' with { type: 'json' }

const run = promisify(execFile)

test('실제 연동 점검 명령은 정상·재고 장애·검색 장애·빈 결과를 구분한다', async () => {
  const server = createServer(async (request, response) => {
    assert.equal(request.method, 'POST')
    assert.equal(request.url, '/api/v1/chat')
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    const { message } = JSON.parse(Buffer.concat(chunks).toString())
    response.setHeader('Content-Type', 'application/json')
    if (message === 'error') {
      response.writeHead(502)
      response.end(JSON.stringify({ code: 'PRODUCT_SEARCH_FAILED', message: '검색 실패' }))
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
    response.end(JSON.stringify(example))
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
    await assert.rejects(check('normal', 'unknown'), /재고가 모두 UNKNOWN/)
    await assert.rejects(check('unknown', 'normal'), /모든 재고 UNKNOWN 예상/)
  } finally {
    server.close()
  }
})
