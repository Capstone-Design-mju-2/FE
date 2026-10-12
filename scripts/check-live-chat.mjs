import { parseArgs } from 'node:util'
import { isChatResponse } from '../src/api/validateChat.ts'

const usage = `Usage: npm run check:live-chat -- --question "실제 데이터의 검색어" --expect normal|unknown|error|empty [--url http://localhost:5173]

Run Vite and the BE services first. Stop order-service for unknown, stop
catalog-service for error, then restore both for normal. VITE_USE_MOCK=false
is needed for browser checks, not for this command's /api request.`

async function main() {
  const { values } = parseArgs({
    options: {
      question: { type: 'string' },
      expect: { type: 'string' },
      url: { type: 'string', default: 'http://localhost:5173' },
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
    throw new Error(`${endpoint} 연결 실패: ${error.message}. 개발 서버가 실행 중인지, --url이 맞는지 확인해 주세요.`, { cause: error })
  }

  const body = await response.json().catch(() => null)
  if (values.expect === 'error') {
    if (response.status !== 502 || body?.code !== 'PRODUCT_SEARCH_FAILED' || typeof body?.message !== 'string') {
      throw new Error(`검색 장애 응답 HTTP 502 PRODUCT_SEARCH_FAILED 예상, 실제 HTTP ${response.status}: ${JSON.stringify(body)}`)
    }
    console.log(`PASS error: HTTP ${response.status}, code=${body.code}, message=${body.message}`)
    return
  }

  if (response.ok && Array.isArray(body?.products) && body.products.some((product) =>
    product && typeof product === 'object' &&
    Array.isArray(product.evidence) && product.evidence.length === 0)) {
    throw new Error('리뷰 근거가 없는 상품이 있습니다.')
  }
  if (!response.ok || !isChatResponse(body)) {
    throw new Error(`채팅 계약 응답 예상, 실제 HTTP ${response.status}: ${JSON.stringify(body)}`)
  }
  if (values.expect === 'empty') {
    if (body.products.length !== 0) throw new Error(`상품 0개 예상, 실제 ${body.products.length}개`)
  } else {
    if (body.products.length === 0) throw new Error('상품 카드 1개 이상 예상, 실제 0개')
    const statuses = body.products.map((product) => product.inventory.status)
    if (values.expect === 'unknown' && statuses.some((status) => status !== 'UNKNOWN')) {
      throw new Error(`모든 재고 UNKNOWN 예상, 실제 ${statuses.join(', ')}`)
    }
    if (values.expect === 'normal' && statuses.some((status) => status === 'UNKNOWN')) {
      throw new Error(`정상 모드에서 UNKNOWN 재고가 있습니다: ${statuses.join(', ')}`)
    }
  }

  console.log(`PASS ${values.expect}: 상품 ${body.products.length}개, 재고 ${body.products.map((product) => product.inventory.status).join(', ') || '없음'}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
