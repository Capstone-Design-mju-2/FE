import assert from 'node:assert/strict'
import { test } from 'node:test'
import { highlight, highlightTerms } from '../src/lib/highlight.ts'

test('질문 단어에서 흔한 어미·조사를 떼고, 추천처럼 뜻 없는 말은 뺀다', () => {
  const terms = highlightTerms('은은하고 촉촉한 발색의 립스틱 추천해줘')
  assert.deepEqual([...terms].sort(), ['립스틱', '발색', '은은', '촉촉'].sort())
  assert.deepEqual(highlightTerms('3만 원 이하 순한 선크림'), ['선크림', '3만', '순한'])
  assert.deepEqual(highlightTerms(''), [])
})

test('리뷰 문장을 형광펜 구간과 나머지로 나누고, 특수문자가 든 질문도 깨지지 않는다', () => {
  assert.deepEqual(highlight('발색이 잘되고 촉촉한', ['촉촉', '발색']), [
    { text: '발색', marked: true },
    { text: '이 잘되고 ', marked: false },
    { text: '촉촉', marked: true },
    { text: '한', marked: false },
  ])
  assert.deepEqual(highlight('리뷰 그대로', []), [{ text: '리뷰 그대로', marked: false }])
  assert.deepEqual(highlight('50ml+ 대용량', highlightTerms('50ml+ (대용량)')), [
    { text: '50ml', marked: true },
    { text: '+ ', marked: false },
    { text: '대용량', marked: true },
  ])
})
