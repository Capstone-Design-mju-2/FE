import { useState, type Dispatch, type SetStateAction } from 'react'
import { analyzeProfile } from '../api/profile'
import { ApiRequestError } from '../api/client'
import { profileFingerprint, recommendedProducts, removeChatRecord, type Fit, type PersonalData, type SkinType } from '../lib/personal'
import './MyInfo.css'

type Props = {
  personal: PersonalData
  onChange: Dispatch<SetStateAction<PersonalData>>
}

const SKIN_TYPES: { value: SkinType; label: string }[] = [
  { value: 'unknown', label: '아직 모르겠어요' },
  { value: 'dry', label: '건성' },
  { value: 'oily', label: '지성' },
  { value: 'combination', label: '복합성' },
  { value: 'sensitive', label: '민감성' },
]

const dateLabel = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '날짜 확인 불가' : date.toLocaleString('ko-KR')
}

export default function MyInfo({ personal, onChange }: Props) {
  const [ingredient, setIngredient] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const products = recommendedProducts(personal.history)
  const matched = products.filter((product) => personal.feedback[product.productId] === 'good')
  const fingerprint = profileFingerprint(personal)
  const insights = personal.insights?.fingerprint === fingerprint ? personal.insights : null
  const sourceName = (id: string) => id === 'profile' ? '직접 입력한 피부 정보' :
    personal.history.find((item) => item.id === id)?.question ?? '상담 기록'

  const runAnalysis = async () => {
    if (analyzing) return
    const submittedFingerprint = profileFingerprint(personal)
    setAnalyzing(true)
    setAnalysisError('')
    try {
      const result = await analyzeProfile(personal)
      onChange((current) => ({ ...current, insights: {
        fingerprint: submittedFingerprint, ...result, analyzedAt: new Date().toISOString(),
      } }))
    } catch (error) {
      setAnalysisError(error instanceof ApiRequestError ? error.message : '분석 중 문제가 생겼어요. 다시 시도해 주세요.')
    } finally {
      setAnalyzing(false)
    }
  }

  const setFit = (productId: number, fit: Fit) => {
    onChange((prev) => {
      const feedback = { ...prev.feedback }
      if (feedback[productId] === fit) delete feedback[productId]
      else feedback[productId] = fit
      return { ...prev, feedback }
    })
  }

  const addIngredient = () => {
    const name = ingredient.trim()
    if (!name || personal.likedIngredients.some((item) => item.toLowerCase() === name.toLowerCase())) return
    onChange((prev) => ({ ...prev, likedIngredients: [...prev.likedIngredients, name].slice(0, 20) }))
    setIngredient('')
  }

  return (
    <div className="my-info">
      <p className="my-page__notice">이 정보는 이 브라우저에만 저장돼요. 다른 기기에서는 보이지 않으며, 이전에 저장되지 않은 상담은 가져올 수 없어요.</p>

      <section className="my-info__section" aria-labelledby="my-info-profile">
        <h2 id="my-info-profile">내 피부 정보</h2>
        <div className="my-info__fields">
          <label>이름 또는 별명
            <input value={personal.nickname} maxLength={30} placeholder="어떻게 불러 드릴까요?"
              onChange={(event) => onChange((prev) => ({ ...prev, nickname: event.target.value }))} />
          </label>
          <label>피부 타입
            <select value={personal.skinType}
              onChange={(event) => onChange((prev) => ({ ...prev, skinType: event.target.value as SkinType }))}>
              {SKIN_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
          <label className="my-info__wide">피부 상태와 고민
            <textarea value={personal.skinNotes} maxLength={500} rows={3}
              placeholder="예: 겨울에는 건조하고 향이 강한 제품이 자극적이에요."
              onChange={(event) => onChange((prev) => ({ ...prev, skinNotes: event.target.value }))} />
          </label>
        </div>
        <p className="my-info__note">수정한 내용은 이 브라우저에 저장됩니다. 피부 타입은 다음 AI 상담의 추천 근거 선택에 반영돼요. 피부 상태와 고민 메모는 아직 자동 전송되지 않습니다.</p>
      </section>

      <section className="my-info__section" aria-labelledby="my-info-analysis">
        <h2 id="my-info-analysis">AI가 살펴본 내 피부</h2>
        <p className="my-info__note">분석을 누르면 직접 입력한 피부 정보와 최근 상담 20건의 질문·답변이 BE와 설정된 외부 LLM으로 전송됩니다. 의료 진단이 아닌 화장품 선택 참고용이에요.</p>
        <button type="button" className="my-info__analyze" onClick={runAnalysis}
          disabled={analyzing || (personal.skinType === 'unknown' && !personal.skinNotes.trim() && personal.history.length === 0)}>
          {analyzing ? '분석 중…' : insights ? '다시 분석하기' : '내 피부 분석하기'}
        </button>
        {analysisError && <p role="alert" className="my-info__error">{analysisError}</p>}
        {insights && <>
          <p className="my-info__note">{dateLabel(insights.analyzedAt)} 분석 · 피부 정보나 대화가 바뀌면 다시 분석해 주세요.</p>
          {insights.observations.length === 0 ?
            <p>현재 기록에서 근거 있는 피부 특성을 찾지 못했어요. 경험을 더 알려주면 분석할 수 있어요.</p> :
            <ul className="my-info__observations">{insights.observations.map((item, index) =>
              <li key={index}><p>{item.text}</p><small>근거: {item.sourceIds.map(sourceName).join(' · ')}</small></li>)}</ul>}
          {(insights.matchedProducts.length > 0 || insights.matchedIngredients.length > 0) && <div>
            <h3>대화에서 직접 말한 사용 경험</h3>
            <ul className="my-info__observations">
              {insights.matchedProducts.map((item, index) => <li key={`product-${index}`}>제품: {item.name} <small>근거: {item.sourceIds.map(sourceName).join(' · ')}</small></li>)}
              {insights.matchedIngredients.map((item, index) => <li key={`ingredient-${index}`}>성분: {item.name} <small>근거: {item.sourceIds.map(sourceName).join(' · ')}</small></li>)}
            </ul>
          </div>}
        </>}
        {!insights && personal.insights && <p className="my-info__note">정보가 바뀌어 이전 분석을 숨겼어요. 다시 분석해 주세요.</p>}
      </section>

      <section className="my-info__section" aria-labelledby="my-info-matched">
        <h2 id="my-info-matched">잘 맞았던 제품·성분</h2>
        <p className="my-info__note">직접 “잘 맞았어요”로 표시한 제품과 입력한 성분입니다.</p>
        {matched.length === 0 ? <p className="my-info__empty">아직 잘 맞았다고 표시한 제품이 없어요.</p> : (
          <ul className="my-info__matched">
            {matched.map((product) => <li key={product.productId}>{product.brand} {product.name}</li>)}
          </ul>
        )}
        <div className="my-info__ingredient-row">
          <label htmlFor="my-info-ingredient">잘 맞았던 성분 직접 입력</label>
          <div>
            <input id="my-info-ingredient" value={ingredient} maxLength={40} placeholder="예: 판테놀"
              onChange={(event) => setIngredient(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) addIngredient() }} />
            <button type="button" onClick={addIngredient} disabled={!ingredient.trim() || personal.likedIngredients.length >= 20}>추가</button>
          </div>
        </div>
        {personal.likedIngredients.length > 0 && (
          <ul className="my-info__ingredients">
            {personal.likedIngredients.map((name) => (
              <li key={name}>{name}<button type="button" aria-label={`${name} 삭제`}
                onClick={() => onChange((prev) => ({ ...prev,
                  likedIngredients: prev.likedIngredients.filter((item) => item !== name) }))}>×</button></li>
            ))}
          </ul>
        )}
      </section>

      <section className="my-info__section" aria-labelledby="my-info-recommendations">
        <h2 id="my-info-recommendations">AI 상담에서 추천받은 제품</h2>
        {products.length === 0 ? <p className="my-info__empty">상담 기록이 생기면 추천받은 제품이 여기에 모여요.</p> : (
          <ul className="my-info__products">
            {products.map((product) => (
              <li key={product.productId}>
                <div><b>{product.brand} {product.name}</b><span>상담에서 {product.count}회 추천</span></div>
                {product.reason && <p>{product.reason}</p>}
                <div className="my-info__feedback" role="group" aria-label={`${product.name} 사용 후기`}>
                  <button type="button" aria-pressed={personal.feedback[product.productId] === 'good'}
                    onClick={() => setFit(product.productId, 'good')}>잘 맞았어요</button>
                  <button type="button" aria-pressed={personal.feedback[product.productId] === 'bad'}
                    onClick={() => setFit(product.productId, 'bad')}>맞지 않았어요</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="my-info__section" aria-labelledby="my-info-history">
        <div className="my-info__heading">
          <h2 id="my-info-history">AI 상담 기록</h2>
          {personal.history.length > 0 && <button type="button" className="my-info__clear"
            onClick={() => onChange((prev) => ({ ...prev, history: [], feedback: {} }))}>
            상담 기록·제품 평가 모두 삭제
          </button>}
        </div>
        {personal.history.length === 0 ? <p className="my-info__empty">저장된 상담이 없어요. 앞으로 완료한 상담이 여기에 남아요.</p> : (
          <ol className="my-info__history">
            {personal.history.map((record) => (
              <li key={record.id}>
                <details>
                  <summary><span>{record.question}</span><time dateTime={record.askedAt}>{dateLabel(record.askedAt)}</time></summary>
                  <p>{record.answer}</p>
                  {record.products.length > 0 && <p>추천 제품: {record.products.map((product) => product.name).join(', ')}</p>}
                  <button type="button" className="my-info__delete"
                    onClick={() => onChange((prev) => removeChatRecord(prev, record.id))}>이 상담 삭제</button>
                </details>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
