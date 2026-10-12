import { parseArgs } from 'node:util'
import { isChatResponse } from '../src/api/validateChat.ts'

const usage = `Usage: npm run check:live-chat -- --question "실제 데이터의 검색어" --expect normal|unknown|error|empty [--url http://127.0.0.1:5173]

Run Vite with VITE_USE_MOCK=false and the BE services first. Stop order-service for
unknown, stop catalog-service for error, then restore both for normal.`

async function main() {
  const { values } = parseArgs({
    options: {
      question: { type: 'string' },
      expect: { type: 'string' },
      url: { type: 'string', default: 'http://127.0.0.1:5173' },
      help: { type: 'boolean' },
    },
  })

  if (values.help) {
    console.log(usage)
    return
  }
  if (!values.question?.trim() || !['normal', 'unknown', 'error', 'empty'].includes(values.expect)) {
    throw new Error(usage)
  }

  const endpoint = new URL('/api/v1/chat', values.url)
  if (!['http:', 'https:'].includes(endpoint.protocol)) throw new Error('HTTP(S) 주소를 입력해 주세요.')

  let response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: values.question }),
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    throw new Error(`${endpoint} 연결 실패: ${error.message}`, { cause: error })
  }

  const body = await response.json().catch(() => null)
  if (values.expect === 'error') {
    if (response.ok || typeof body?.code !== 'string' || typeof body?.message !== 'string') {
      throw new Error(`오류 응답 {code, message} 예상, 실제 HTTP ${response.status}: ${JSON.stringify(body)}`)
    }
    console.log(`PASS error: HTTP ${response.status}, code=${body.code}, message=${body.message}`)
    return
  }

  if (!response.ok || !isChatResponse(body)) {
    throw new Error(`채팅 계약 응답 예상, 실제 HTTP ${response.status}: ${JSON.stringify(body)}`)
  }
  if (values.expect === 'empty') {
    if (body.products.length !== 0) throw new Error(`상품 0개 예상, 실제 ${body.products.length}개`)
  } else {
    if (body.products.length === 0) throw new Error('상품 카드 1개 이상 예상, 실제 0개')
    if (body.products.some((product) => product.evidence.length === 0)) {
      throw new Error('리뷰 근거가 없는 상품이 있습니다.')
    }
    const statuses = body.products.map((product) => product.inventory.status)
    if (values.expect === 'unknown' && statuses.some((status) => status !== 'UNKNOWN')) {
      throw new Error(`모든 재고 UNKNOWN 예상, 실제 ${statuses.join(', ')}`)
    }
    if (values.expect === 'normal' && statuses.every((status) => status === 'UNKNOWN')) {
      throw new Error('정상 모드에서 재고가 모두 UNKNOWN입니다.')
    }
  }

  console.log(`PASS ${values.expect}: 상품 ${body.products.length}개, 재고 ${body.products.map((product) => product.inventory.status).join(', ') || '없음'}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
