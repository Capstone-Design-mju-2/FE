import { useEffect, useRef, useState } from 'react'
import { sendChat } from './api/chat'
import { ApiRequestError } from './api/client'
import ChatInput from './components/ChatInput'
import ProductCard from './components/ProductCard'
import type { ChatResponse } from './types/api'
import './App.css'

type Message =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; response: ChatResponse }
  | { id: number; role: 'error'; question: string; code: string; detail: string }

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

  const ask = async (question: string) => {
    setInput('')
    setLoading(true)
    try {
      const response = await sendChat(question)
      setMessages((prev) => [...prev, { id: nextId++, role: 'assistant', response }])
    } catch (e) {
      const error =
        e instanceof ApiRequestError
          ? { code: e.code, detail: e.message }
          : { code: 'UNKNOWN_ERROR', detail: '알 수 없는 오류가 발생했어요.' }
      setMessages((prev) => [...prev, { id: nextId++, role: 'error', question, ...error }])
      setInput(question) // 입력했던 질문을 남긴다
    } finally {
      setLoading(false)
    }
  }

  const send = (text: string) => {
    if (loading) return
    setMessages((prev) => [...prev, { id: nextId++, role: 'user', text }])
    ask(text)
  }

  // 같은 질문을 말풍선을 다시 쌓지 않고 한 번 더 보낸다.
  const retry = (errorId: number, question: string) => {
    if (loading) return
    setMessages((prev) => prev.filter((m) => m.id !== errorId))
    ask(question)
  }

  return (
    <div className="chat">
      <header className="chat__header">PeauPick</header>

      <main className="chat__scroll">
        <div className="chat__list" aria-live="polite">
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
                <div key={m.id} className="notice notice--error" role="alert">
                  <b>잠시 후 다시 시도해 주세요</b>
                  <span className="notice__detail">
                    {m.detail} <code>{m.code}</code>
                  </span>
                  <button
                    type="button"
                    className="notice__action"
                    onClick={() => retry(m.id, m.question)}
                    disabled={loading}
                  >
                    다시 시도
                  </button>
                </div>
              )
            }
            return <Answer key={m.id} response={m.response} />
          })}

          {loading && (
            <div className="loading">
              <div className="loading__card" />
              <div className="loading__card" />
              <p className="loading__text">
                <span className="loading__dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                찾고 있어요…
              </p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="chat__footer">
        <ChatInput value={input} disabled={loading} onChange={setInput} onSubmit={send} />
      </footer>
    </div>
  )
}

function Answer({ response }: { response: ChatResponse }) {
  const { answer, products } = response

  if (products.length === 0) {
    return (
      <div className="answer">
        <div className="bubble bubble--assistant">{answer}</div>
        {/* 1A는 조건 완화 제안을 주지 않아서 BE 검색 규칙에 맞는 안내만 보여 준다. */}
        <div className="notice">
          <b>조건을 모두 만족하는 상품이 없어요</b>
          <span className="notice__detail">
            수분크림·선크림처럼 상품 종류를 넣거나, 가격 조건을 빼고 다시 물어보세요.
          </span>
        </div>
      </div>
    )
  }

  const unknownCount = products.filter((p) => p.inventory.status === 'UNKNOWN').length

  return (
    <div className="answer">
      <p className="answer__text">{answer}</p>
      {unknownCount > 0 && (
        <p className="answer__note">
          {unknownCount === products.length
            ? '지금 재고를 확인하지 못했어요. 추천은 그대로 보여 드려요.'
            : `추천 ${products.length}개 중 ${unknownCount}개는 지금 재고를 확인하지 못했어요.`}
        </p>
      )}
      {products.map((product) => (
        <ProductCard key={product.productId} product={product} />
      ))}
    </div>
  )
}

export default App
