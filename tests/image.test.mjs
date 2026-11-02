import assert from 'node:assert/strict'
import { test } from 'node:test'
import { imageAttempts } from '../src/lib/image.ts'

// BE docs/API.md 2절 예시 주소
const large = 'https://image.msscdn.net/images/goods_img/20260101/101/101_1_500.jpg'
const small = 'https://image.msscdn.net/images/goods_img/20260101/101/101_1_125.jpg'

test('두 크기가 있으면 브라우저가 고르게 하고, 못 불러오면 원본만 다시 받는다', () => {
  assert.deepEqual(imageAttempts({ imageUrl: large, thumbnailUrl: small }),
    [{ src: small, srcSet: `${small} 125w, ${large} 500w` }, { src: large }])
})

test('한 크기만 있으면 그것만 쓴다', () => {
  assert.deepEqual(imageAttempts({ imageUrl: large, thumbnailUrl: null }), [{ src: large }])
  assert.deepEqual(imageAttempts({ thumbnailUrl: small }), [{ src: small }])
})

test('사진이 없거나 https 주소가 아니면 시도하지 않는다', () => {
  assert.deepEqual(imageAttempts({ imageUrl: null, thumbnailUrl: null }), [])
  assert.deepEqual(imageAttempts({}), [])
  assert.deepEqual(imageAttempts({ imageUrl: 'javascript:alert(1)', thumbnailUrl: 'http://image.msscdn.net/a.jpg' }), [])
})
