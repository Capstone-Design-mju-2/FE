import { useEffect, useRef, useState } from 'react'
import { sendChat } from './api/chat'
import ChatInput from './components/ChatInput'
import ProductCard from './components/ProductCard'
import type { ChatResponse } from './types/api'
import './App.css'

type Message =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; response: ChatResponse }
  | { id: number; role: 'error'; text: string }

const EXAMPLES = [
  '건성 피부에 끈적이지 않는 수분크림 중 내일 도착 가능한 거',
  '3만 원 이하 순한 선크림',
  '요즘 인기 있는 쿨톤 립',
]

let nextId = 0

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text: string) => {
    if (loading) return
    setMessages((prev) => [...prev, { id: nextId++, role: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const response = await sendChat(text)
      setMessages((prev) => [...prev, { id: nextId++, role: 'assistant', response }])
    } catch (e) {
      const message = e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.'
      setMessages((prev) => [...prev, { id: nextId++, role: 'error', text: message }])
      setInput(text) // 입력했던 질문을 남긴다
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat">
      <header className="chat__header">PeauPick</header>

      <main className="chat__scroll">
        <div className="chat__list">
          {messages.length === 0 && !loading && (
            <section className="chat__welcome">
              <h1>어떤 화장품을 찾고 있어요?</h1>
              <p>지금 살 수 있는 상품만, 실제 리뷰를 근거로 골라 드려요.</p>
              <div className="chat__examples">
                {EXAMPLES.map((example) => (
                  <button key={example} type="button" onClick={() => send(example)}>
                    {example}
                  </button>
                ))}
              </div>
            </section>
          )}

          {messages.map((m) => {
            if (m.role === 'user') {
              return (
                <div key={m.id} className="bubble bubble--user">
                  {m.text}
                </div>
              )
            }
            if (m.role === 'error') {
              return (
                <div key={m.id} className="bubble bubble--error">
                  {m.text}
                </div>
              )
            }
            return (
              <div key={m.id} className="answer">
                <p className="answer__text">{m.response.answer}</p>
                {m.response.products.map((product) => (
                  <ProductCard key={product.productId} product={product} />
                ))}
              </div>
            )
          })}

          {loading && <p className="chat__loading">찾고 있어요…</p>}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="chat__footer">
        <ChatInput value={input} disabled={loading} onChange={setInput} onSubmit={send} />
      </footer>
    </div>
  )
}

export default App
