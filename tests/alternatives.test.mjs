import assert from 'node:assert/strict'
import { test } from 'node:test'
import { alternativeRequest, excludesSoldOutProducts, isSoldOutOrderFailure } from '../src/lib/alternatives.ts'
import { isChatResponse } from '../src/api/validateChat.ts'

const origin = { question: '3만 원 이하 수분크림', skinType: 'dry',
  searchConditions: { q: '수분크림', max_price: 30000, product_types: ['수분크림'] },
  excludedProductIds: [101] }

test('품절 대안은 원래 질문·피부 타입·검색 조건을 보존하고 제외 ID를 누적한다', () => {
  assert.deepEqual(alternativeRequest(origin, 102), {
    message: origin.question, skinType: 'dry', searchConditions: origin.searchConditions,
    excludeProductIds: [101, 102],
  })
  assert.deepEqual(alternativeRequest(origin, 101)?.excludeProductIds, [101])
  assert.equal(alternativeRequest({ ...origin, searchConditions: null }, 102), null)
  assert.equal(alternativeRequest({ ...origin, excludedProductIds: Array.from({ length: 10 }, (_, i) => i + 1) }, 11), null)
})

test('검색 조건이 있는 BE 답변만 대안 문맥으로 받아들인다', () => {
  const response = { answer: '한 개 찾았어요', products: [], searchConditions: origin.searchConditions }
  assert.equal(isChatResponse(response), true)
  assert.equal(isChatResponse({ ...response, searchConditions: null }), true)
  assert.equal(isChatResponse({ ...response, searchConditions: [] }), false)
  assert.equal(isChatResponse({ ...response, searchConditions: '수분크림' }), false)
})

test('실제 품절 409에만 대안을 제안하고 수량 부족은 별도로 처리한다', () => {
  assert.equal(isSoldOutOrderFailure({ status: 409, code: 'OUT_OF_STOCK' }), true)
  assert.equal(isSoldOutOrderFailure({ status: 409, code: 'INSUFFICIENT_STOCK' }), false)
  assert.equal(isSoldOutOrderFailure({ status: 503, code: 'LOCK_UNAVAILABLE' }), false)
})

test('BE 대안에 이미 제외한 품절 상품이 다시 나오면 거부한다', () => {
  assert.equal(excludesSoldOutProducts([103, 104], [101, 102]), true)
  assert.equal(excludesSoldOutProducts([101, 103], [101, 102]), false)
})
