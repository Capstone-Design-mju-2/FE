// 질문에 쓴 말이 리뷰 근거에 나오면 그 부분에 형광펜을 칠한다(ADR-161).
// 형태소 분석 없이 흔한 어미·조사만 떼므로 "은은하고"는 "은은"으로 찾고, "순해요"처럼 바뀐 꼴은 놓친다.
const ENDINGS = /(으로|하고|하게|하는|해줘|한|해|의|은|는|이|가|을|를|에|로|도|만|요)$/
const IGNORED = new Set(['추천', '알려', '찾아', '상품', '제품', '이하', '이상', '않는', '있는', '없는', '가능'])

export function highlightTerms(question: string): string[] {
  const terms = new Set<string>()
  for (const word of question.split(/\s+/)) {
    const clean = word.replace(/[^\p{L}\p{N}]/gu, '')
    const stem = clean.replace(ENDINGS, '')
    const term = stem.length >= 2 ? stem : clean
    if (term.length >= 2 && !IGNORED.has(term)) terms.add(term)
  }
  // 긴 말부터 찾아야 "수분크림"이 "수분"보다 먼저 잡힌다.
  return [...terms].sort((a, b) => b.length - a.length)
}

export type Segment = { text: string; marked: boolean }

export function highlight(text: string, terms: string[]): Segment[] {
  if (terms.length === 0) return [{ text, marked: false }]
  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')
  return text.split(pattern).filter(Boolean).map((part) => ({ text: part, marked: terms.includes(part) }))
}
