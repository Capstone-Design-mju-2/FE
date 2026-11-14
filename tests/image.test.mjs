import assert from 'node:assert/strict'
import { test } from 'node:test'
import { failedImageUrl, imageAttempt } from '../src/lib/image.ts'

// BE docs/API.md 2절 예시 주소
const large = 'https://image.msscdn.net/images/goods_img/20260101/101/101_1_500.jpg'
const small = 'https://image.msscdn.net/images/goods_img/20260101/101/101_1_125.jpg'
const both = { imageUrl: large, thumbnailUrl: small }

test('두 크기가 있으면 srcset으로 주어 브라우저가 고르게 한다', () => {
  assert.deepEqual(imageAttempt(both),
    { src: small, srcSet: `${small} 125w, ${large} 500w`, candidates: [small, large] })
})

test('못 불러온 크기는 다시 받지 않고 남은 크기로 바꾼다', () => {
  // 화면 배율이 낮은 작은 카드: 브라우저가 125px을 받다가 실패 → 500px (BE 계약)
  assert.deepEqual(imageAttempt(both, [small]), { src: large, candidates: [large] })
  // 큰 카드나 고배율 화면: 브라우저가 500px을 받다가 실패 → 125px (같은 500px을 다시 받지 않는다)
  assert.deepEqual(imageAttempt(both, [large]), { src: small, candidates: [small] })
  // 둘 다 실패하면 사진 없이 보인다
  assert.equal(imageAttempt(both, [small, large]), null)
})

test('실패한 주소는 브라우저가 실제로 받던 주소(currentSrc)로 정한다', () => {
  const first = imageAttempt(both)
  assert.equal(failedImageUrl(first, large), large)
  assert.equal(failedImageUrl(first, small), small)
  // currentSrc가 비어 있거나 후보와 다르면 src를 실패로 본다
  assert.equal(failedImageUrl(first, ''), small)
  assert.equal(failedImageUrl(first, 'https://other.example/x.jpg'), small)
})

test('어떤 실패 순서든 같은 주소를 두 번 시도하지 않고 끝난다', () => {
  for (const currentSrcs of [[large, small], [small, large], ['', '']]) {
    const failed = []
    const tried = []
    let attempt = imageAttempt(both, failed)
    for (const currentSrc of currentSrcs) {
      if (!attempt) break
      const url = failedImageUrl(attempt, currentSrc)
      assert.ok(!tried.includes(url), `${url}을 다시 시도함`)
      tried.push(url)
      failed.push(url)
      attempt = imageAttempt(both, failed)
    }
    assert.equal(attempt, null)
    assert.equal(tried.length, 2)
  }
})

test('한 크기만 있으면 그것만 쓰고, 실패하면 사진 없이 보인다', () => {
  assert.deepEqual(imageAttempt({ imageUrl: large, thumbnailUrl: null }), { src: large, candidates: [large] })
  assert.deepEqual(imageAttempt({ thumbnailUrl: small }), { src: small, candidates: [small] })
  assert.equal(imageAttempt({ imageUrl: large }, [large]), null)
  // 두 주소가 같으면 한 번만 시도한다
  assert.deepEqual(imageAttempt({ imageUrl: large, thumbnailUrl: large }), { src: large, candidates: [large] })
})

test('사진이 없거나 https 주소가 아니면 시도하지 않는다', () => {
  assert.equal(imageAttempt({ imageUrl: null, thumbnailUrl: null }), null)
  assert.equal(imageAttempt({}), null)
  assert.equal(imageAttempt({ imageUrl: 'javascript:alert(1)', thumbnailUrl: 'http://image.msscdn.net/a.jpg' }), null)
})
