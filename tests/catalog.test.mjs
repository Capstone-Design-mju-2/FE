import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  HOME_CATEGORIES, formatReviewScore, hasMorePages, isProductListResponse, isReviewListResponse,
  productListPath, reviewListPath, skinTypeLabel,
} from '../src/lib/catalog.ts'

// BE docs/API.md 2절 예시 응답
const productList = {
  category: '104001', page: 0, size: 20, total: 2185,
  products: [{ productId: 101, name: '수분크림 A', brand: '브랜드 A', price: 25900, reviewCount: 1520, reviewScore: 96 }],
}
const reviewList = {
  productId: 101, page: 0, size: 20, total: 285,
  reviews: [{ reviewId: 9001, rating: 5, content: '건성인데 아침까지 당김 없이 촉촉해요', skinType: 'dry',
    optionText: '50ml', likeCount: 3, writtenAt: '2026-08-01' }],
}

test('계약 예시 응답은 통과하고 형식이 틀린 응답은 거부한다', () => {
  assert.ok(isProductListResponse(productList))
  assert.ok(isProductListResponse({ ...productList, products: [] }))
  assert.ok(isReviewListResponse(reviewList))
  assert.ok(isReviewListResponse({ ...reviewList, reviews: [{ ...reviewList.reviews[0], skinType: null, optionText: null }] }))
  for (const invalid of [
    null, {}, { ...productList, products: null },
    { ...productList, products: [{ ...productList.products[0], reviewScore: 101 }] },
    { ...productList, products: [{ ...productList.products[0], price: '25900' }] },
  ]) assert.equal(isProductListResponse(invalid), false)
  for (const invalid of [
    null, { ...reviewList, reviews: null },
    { ...reviewList, reviews: [{ ...reviewList.reviews[0], rating: 0 }] },
    { ...reviewList, reviews: [{ ...reviewList.reviews[0], content: null }] },
  ]) assert.equal(isReviewListResponse(invalid), false)
})

test('요청 경로는 계약의 파라미터를 쓰고 피부 타입은 고른 경우에만 붙인다', () => {
  assert.equal(productListPath({ category: '104001', sort: 'popular', page: 0, size: 5 }),
    '/api/v1/products?category=104001&sort=popular&page=0&size=5')
  assert.equal(reviewListPath(101, { sort: 'recent', skinType: null, page: 1, size: 20 }),
    '/api/v1/products/101/reviews?sort=recent&page=1&size=20')
  assert.equal(reviewListPath(101, { sort: 'likes', skinType: 'dry', page: 0, size: 20 }),
    '/api/v1/products/101/reviews?sort=likes&page=0&size=20&skinType=dry')
})

test('평점·페이지·피부 타입 표시', () => {
  assert.equal(formatReviewScore(96), '4.8')
  assert.equal(formatReviewScore(93), '4.7')
  assert.equal(formatReviewScore(100), '5.0')
  assert.equal(hasMorePages({ page: 0, size: 20, total: 285 }), true)
  assert.equal(hasMorePages({ page: 14, size: 20, total: 285 }), false)
  assert.equal(hasMorePages({ page: 0, size: 20, total: 20 }), false)
  assert.equal(skinTypeLabel('combination'), '복합성')
  assert.equal(skinTypeLabel('dehydrated_oily'), '수부지')
  assert.equal(skinTypeLabel(null), null)
})

test('메인 카테고리 코드는 BE search-mcp 카테고리 표와 같다', () => {
  // BE services/search-mcp/src/search_mcp/server.py
  const be = { '스킨케어': '104001', '선케어': '104002', '클렌징/필링': '104003', '프레그런스': '104005',
    '헤어케어': '104006', '바디케어': '104007', '베이스메이크업': '104014', '립메이크업': '104015' }
  const expected = { '스킨케어': be['스킨케어'], '클렌징': be['클렌징/필링'], '선케어': be['선케어'],
    '메이크업': be['베이스메이크업'], '립': be['립메이크업'], '헤어': be['헤어케어'], '바디': be['바디케어'],
    '향수': be['프레그런스'] }
  assert.deepEqual(Object.fromEntries(HOME_CATEGORIES.map((c) => [c.label, c.code])), expected)
})
