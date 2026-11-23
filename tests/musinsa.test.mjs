import assert from 'node:assert/strict'
import { test } from 'node:test'
import { musinsaUrl } from '../src/lib/musinsa.ts'

test('무신사 상품 페이지 주소만 링크로 쓰고 나머지는 숨긴다', () => {
  assert.equal(musinsaUrl('https://www.musinsa.com/products/2996090'), 'https://www.musinsa.com/products/2996090')
  assert.equal(musinsaUrl(null), null)
  assert.equal(musinsaUrl(undefined), null)
  assert.equal(musinsaUrl('javascript:alert(1)'), null)
  assert.equal(musinsaUrl('https://evil.example/products/1'), null)
})
