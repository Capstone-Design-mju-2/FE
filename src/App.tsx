import { useState } from 'react'
import { sendChat } from './api/chat'
import type { ChatResponse } from './types/api'

// 세팅 확인용 임시 화면. 채팅 화면을 만들면 교체한다.
function App() {
  const [result, setResult] = useState<ChatResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    try {
      setResult(await sendChat('건성 피부에 끈적이지 않는 수분크림 추천해 줘'))
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container">
      <h1>PeauPick</h1>
      <p className="muted">
        {import.meta.env.VITE_USE_MOCK === 'true' ? '목업 응답 사용 중' : '실제 API 사용 중'}
      </p>
      <button type="button" onClick={handleClick} disabled={loading}>
        {loading ? '불러오는 중…' : '/chat 호출해 보기'}
      </button>
      {error && <p className="error">{error}</p>}
      {result && (
        <section>
          <p>{result.answer}</p>
          <ul>
            {result.products.map((p) => (
              <li key={p.productId}>
                {p.brand} · {p.name} · {p.inventory.status}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

export default App
