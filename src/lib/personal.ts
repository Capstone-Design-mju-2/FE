import type { ChatResponse } from '../types/api'

export type SkinType = 'unknown' | 'dry' | 'oily' | 'combination' | 'sensitive'
export type Fit = 'good' | 'bad'
export type ProfileObservation = { text: string; sourceIds: string[] }
export type ProfileMatchedItem = { name: string; sourceIds: string[] }
export type SavedInsights = { fingerprint: string; observations: ProfileObservation[];
  matchedProducts: ProfileMatchedItem[]; matchedIngredients: ProfileMatchedItem[]; analyzedAt: string }

export type ChatRecord = {
  id: string
  askedAt: string
  question: string
  answer: string
  products: { productId: number; name: string; brand: string; reason: string | null }[]
}

export type PersonalData = {
  nickname: string
  skinType: SkinType
  skinNotes: string
  history: ChatRecord[]
  feedback: Record<string, Fit>
  likedIngredients: string[]
  insights: SavedInsights | null
}

const STORAGE_KEY = 'peaupick-personal-v1'
const MAX_HISTORY = 50

export const emptyPersonalData = (): PersonalData => ({
  nickname: '', skinType: 'unknown', skinNotes: '', history: [], feedback: {}, likedIngredients: [], insights: null,
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isSkinType = (value: unknown): value is SkinType =>
  value === 'unknown' || value === 'dry' || value === 'oily' || value === 'combination' || value === 'sensitive'
const hasSourceIds = (value: Record<string, unknown>): boolean =>
  Array.isArray(value.sourceIds) && value.sourceIds.every((id: unknown) => typeof id === 'string')
const isObservation = (value: unknown): value is ProfileObservation =>
  isRecord(value) && typeof value.text === 'string' && hasSourceIds(value)
const isMatchedItem = (value: unknown): value is ProfileMatchedItem =>
  isRecord(value) && typeof value.name === 'string' && hasSourceIds(value)

export function parsePersonalData(raw: string | null): PersonalData {
  if (!raw) return emptyPersonalData()
  try {
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value)) return emptyPersonalData()
    const history = Array.isArray(value.history) ? value.history.filter((entry: unknown): entry is ChatRecord =>
      isRecord(entry) && typeof entry.id === 'string' && typeof entry.askedAt === 'string' &&
      typeof entry.question === 'string' && typeof entry.answer === 'string' &&
      Array.isArray(entry.products) && entry.products.every((product: unknown) =>
        isRecord(product) && typeof product.productId === 'number' &&
        typeof product.name === 'string' && typeof product.brand === 'string' &&
        (product.reason === null || typeof product.reason === 'string'))) : []
    const feedback: Record<string, Fit> = {}
    if (isRecord(value.feedback)) {
      for (const [key, fit] of Object.entries(value.feedback)) {
        if (/^\d+$/.test(key) && (fit === 'good' || fit === 'bad')) feedback[key] = fit
      }
    }
    const insights = isRecord(value.insights) && typeof value.insights.fingerprint === 'string' &&
      typeof value.insights.analyzedAt === 'string' && Array.isArray(value.insights.observations) &&
      value.insights.observations.every(isObservation) &&
      Array.isArray(value.insights.matchedProducts) && value.insights.matchedProducts.every(isMatchedItem) &&
      Array.isArray(value.insights.matchedIngredients) && value.insights.matchedIngredients.every(isMatchedItem)
      ? value.insights as SavedInsights : null
    return {
      nickname: typeof value.nickname === 'string' ? value.nickname.slice(0, 30) : '',
      skinType: isSkinType(value.skinType) ? value.skinType : 'unknown',
      skinNotes: typeof value.skinNotes === 'string' ? value.skinNotes.slice(0, 500) : '',
      history: history.slice(0, MAX_HISTORY),
      feedback,
      likedIngredients: Array.isArray(value.likedIngredients)
        ? value.likedIngredients.filter((item: unknown): item is string => typeof item === 'string')
          .map((item: string) => item.slice(0, 40)).slice(0, 20)
        : [],
      insights,
    }
  } catch {
    return emptyPersonalData()
  }
}

export function profileFingerprint(data: PersonalData): string {
  return JSON.stringify({ skinType: data.skinType, skinNotes: data.skinNotes,
    conversations: data.history.slice(0, 20).map(({ id, question, answer }) => ({ id, question, answer })) })
}

export function readPersonalData(): PersonalData {
  try { return parsePersonalData(globalThis.localStorage.getItem(STORAGE_KEY)) }
  catch { return emptyPersonalData() }
}

export function savePersonalData(data: PersonalData): void {
  try { globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }
  catch { /* 브라우저 저장소 차단·용량 제한 시 현재 탭의 상태만 유지한다. */ }
}

export function toChatRecord(question: string, response: ChatResponse, now = new Date()): ChatRecord {
  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`,
    askedAt: now.toISOString(), question, answer: response.answer,
    products: response.products.map((product) => ({
      productId: product.productId, name: product.name, brand: product.brand, reason: product.reason,
    })),
  }
}

export function addChatRecord(data: PersonalData, record: ChatRecord): PersonalData {
  return { ...data, history: [record, ...data.history].slice(0, MAX_HISTORY) }
}

export function removeChatRecord(data: PersonalData, id: string): PersonalData {
  const history = data.history.filter((record) => record.id !== id)
  const visibleIds = new Set(history.flatMap((record) => record.products.map((product) => String(product.productId))))
  const feedback = Object.fromEntries(Object.entries(data.feedback).filter(([productId]) => visibleIds.has(productId)))
  return { ...data, history, feedback }
}

export function recommendedProducts(history: ChatRecord[]) {
  const products = new Map<number, { productId: number; name: string; brand: string; reason: string | null; count: number }>()
  for (const record of history) {
    for (const product of record.products) {
      const existing = products.get(product.productId)
      if (existing) existing.count += 1
      else products.set(product.productId, { ...product, count: 1 })
    }
  }
  return [...products.values()].sort((a, b) => b.count - a.count || a.productId - b.productId)
}
