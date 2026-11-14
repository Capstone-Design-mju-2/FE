import assert from 'node:assert/strict'
import { test } from 'node:test'
import { screenForLocation } from '../src/lib/navigation.ts'

test('메인·상담·마이페이지 경로와 기존 목업 점검 주소를 구분한다', () => {
  assert.equal(screenForLocation('', ''), 'home')
  assert.equal(screenForLocation('#home', '?mock=empty'), 'home')
  assert.equal(screenForLocation('#chat', ''), 'chat')
  assert.equal(screenForLocation('', '?mock=stage1c'), 'chat')
  assert.equal(screenForLocation('#my', ''), 'my')
})
