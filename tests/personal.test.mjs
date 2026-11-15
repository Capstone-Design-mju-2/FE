import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addChatRecord, emptyPersonalData, parsePersonalData, profileFingerprint, recommendedProducts, removeChatRecord, toChatRecord } from '../src/lib/personal.ts'

const response = { answer: '수분크림을 추천합니다.', products: [
  { productId: 101, name: '수분크림 A', brand: '브랜드 A', reason: '건조함을 고려했어요.' },
] }

test('성공한 상담만 저장할 수 있는 기록으로 만들고 최근 50건을 유지한다', () => {
  const record = toChatRecord('건성 수분크림 추천', response, new Date('2026-11-02T00:00:00Z'))
  assert.equal(record.question, '건성 수분크림 추천')
  assert.equal(record.askedAt, '2026-11-02T00:00:00.000Z')
  assert.deepEqual(record.products, [{ productId: 101, name: '수분크림 A', brand: '브랜드 A', reason: '건조함을 고려했어요.' }])
  let data = emptyPersonalData()
  for (let i = 0; i < 51; i++) data = addChatRecord(data, { ...record, id: String(i) })
  assert.equal(data.history.length, 50)
  assert.equal(data.history[0].id, '50')
  assert.equal(data.history.at(-1).id, '1')
})

test('브라우저 저장 데이터는 잘못된 값에서 안전하게 복구한다', () => {
  assert.deepEqual(parsePersonalData('invalid'), emptyPersonalData())
  const parsed = parsePersonalData(JSON.stringify({ nickname: '나', skinType: 'dry', skinNotes: '건조함',
    history: [{ ...toChatRecord('질문', response), id: 'one' }, { id: 'broken' }],
    feedback: { 101: 'good', 102: 'maybe' }, likedIngredients: ['판테놀', 2] }))
  assert.equal(parsed.skinType, 'dry')
  assert.equal(parsed.history.length, 1)
  assert.deepEqual(parsed.feedback, { 101: 'good' })
  assert.deepEqual(parsed.likedIngredients, ['판테놀'])
})

test('추천 이력은 제품별 횟수를 세지만 실제로 잘 맞았다고 추정하지 않는다', () => {
  const first = toChatRecord('질문1', response)
  const second = toChatRecord('질문2', response)
  assert.deepEqual(recommendedProducts([first, second]), [{
    productId: 101, name: '수분크림 A', brand: '브랜드 A', reason: '건조함을 고려했어요.', count: 2,
  }])
})

test('상담을 지우면 더는 보이지 않는 제품 평가도 함께 지운다', () => {
  const record = { ...toChatRecord('질문', response), id: 'one' }
  const data = { ...emptyPersonalData(), history: [record], feedback: { 101: 'good' }, likedIngredients: ['판테놀'] }
  assert.deepEqual(removeChatRecord(data, 'one'), {
    ...data, history: [], feedback: {},
  })
})

test('피부 정보·상담이 바뀌면 저장한 AI 분석은 오래된 결과가 된다', () => {
  const data = { ...emptyPersonalData(), skinType: 'dry' }
  const fingerprint = profileFingerprint(data)
  const saved = { ...data, insights: { fingerprint, analyzedAt: '2026-11-02T00:00:00Z',
    observations: [{ text: '건성을 직접 선택했어요', sourceIds: ['profile'] }],
    matchedProducts: [], matchedIngredients: [] } }
  assert.deepEqual(parsePersonalData(JSON.stringify(saved)).insights, saved.insights)
  assert.notEqual(profileFingerprint({ ...saved, skinNotes: '겨울에는 건조함' }), fingerprint)
  assert.notEqual(profileFingerprint({ ...saved, history: [toChatRecord('질문', response)] }), fingerprint)
  assert.equal(parsePersonalData(JSON.stringify({ ...saved, insights: { ...saved.insights,
    matchedProducts: [{ name: '제품' }] } })).insights, null)
})
