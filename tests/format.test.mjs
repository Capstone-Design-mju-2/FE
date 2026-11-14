import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatDelivery } from '../src/lib/format.ts'

test('배송일은 올바른 날짜만 표시하고 잘못된 형식·없는 날짜는 확인 불가로 처리', () => {
  const today = new Date(2026, 9, 6)
  assert.equal(formatDelivery('2026-10-06', today), '오늘 도착')
  assert.equal(formatDelivery('2026-10-07', today), '내일 도착')
  assert.equal(formatDelivery('2026-10-09', today), '10/9 도착')
  assert.equal(formatDelivery('2028-02-29', today), '2/29 도착')
  for (const date of [null, '', '2026/10/07', 'invalid', '2026-02-29', '2026-02-30', '2026-13-01', '2026-10-00']) {
    assert.equal(formatDelivery(date, today), '배송일 확인 불가', String(date))
  }
})
