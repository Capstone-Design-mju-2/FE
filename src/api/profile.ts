import { ApiRequestError, postJson } from './client'
import type { PersonalData, ProfileMatchedItem, ProfileObservation } from '../lib/personal'

const isObservation = (value: unknown): value is ProfileObservation =>
  typeof value === 'object' && value !== null && 'text' in value && typeof value.text === 'string' &&
  'sourceIds' in value && Array.isArray(value.sourceIds) && value.sourceIds.every((id) => typeof id === 'string')

const isMatchedItem = (value: unknown): value is ProfileMatchedItem =>
  typeof value === 'object' && value !== null && 'name' in value && typeof value.name === 'string' &&
  'sourceIds' in value && Array.isArray(value.sourceIds) && value.sourceIds.every((id) => typeof id === 'string')

export async function analyzeProfile(data: PersonalData): Promise<{
  observations: ProfileObservation[]; matchedProducts: ProfileMatchedItem[]; matchedIngredients: ProfileMatchedItem[]
}> {
  const result = await postJson<unknown>('/api/v1/profile/insights', {
    skinType: data.skinType === 'unknown' ? null : data.skinType,
    skinNotes: data.skinNotes,
    conversations: data.history.slice(0, 20).map(({ id, question, answer }) => ({ id, question, answer: answer.slice(0, 2000) })),
  })
  if (typeof result !== 'object' || result === null || !('observations' in result) ||
    !Array.isArray(result.observations) || !result.observations.every(isObservation) ||
    !('matchedProducts' in result) || !Array.isArray(result.matchedProducts) || !result.matchedProducts.every(isMatchedItem) ||
    !('matchedIngredients' in result) || !Array.isArray(result.matchedIngredients) || !result.matchedIngredients.every(isMatchedItem)) {
    throw new ApiRequestError(200, { code: 'INVALID_RESPONSE', message: '분석 결과를 읽지 못했어요. 다시 시도해 주세요.' })
  }
  return { observations: result.observations, matchedProducts: result.matchedProducts,
    matchedIngredients: result.matchedIngredients }
}
