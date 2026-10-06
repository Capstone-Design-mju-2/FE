import { useCallback, useEffect, useRef, useState } from 'react'
import { sendChat } from './api/chat'
import { ApiRequestError } from './api/client'
import ChatInput from './components/ChatInput'
import OrderSheet from './components/OrderSheet'
import ProductCard from './components/ProductCard'
import type { ChatResponse, Product } from './types/api'
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
  const [orderProduct, setOrderProduct] = useState<Product | null>(null)
  const orderOpenerRef = useRef<HTMLElement | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 패널이 열리면 채팅 화면이 inert가 되면서 포커스가 풀리므로, 누른 버튼을 클릭 시점에 기억해 둔다.
  const openOrder = (product: Product) => {
    orderOpenerRef.current = document.activeElement as HTMLElement | null
    setOrderProduct(product)
  }
  const closeOrder = useCallback(() => setOrderProduct(null), [])

  // 패널이 닫혀 inert가 풀린 뒤 주문 버튼으로 포커스를 되돌린다.
  useEffect(() => {
    if (orderProduct === null && orderOpenerRef.current) {
      orderOpenerRef.current.focus()
      orderOpenerRef.current = null
    }
  }, [orderProduct])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }, [messages, loading])

  const ask = async (question: string, preserveDraft = false) => {
    if (!preserveDraft) setInput('')
    setLoading(true)
    try {
      const response = await sendChat(question)
      setMessages((prev) => [...prev, { id: nextId++, role: 'assistant', response }])
      // 재시도가 성공하면 실패 때 되돌려 둔 질문만 지우고, 새로 쓰던 질문은 남긴다.
      if (preserveDraft) setInput((prev) => (prev.trim() === question ? '' : prev))
    } catch (e) {
      const error =
        e instanceof ApiRequestError
          ? { code: e.code, detail: e.message }
          : { code: 'UNKNOWN_ERROR', detail: '알 수 없는 오류가 발생했어요.' }
      setMessages((prev) => [...prev, { id: nextId++, role: 'error', question, ...error }])
      if (!preserveDraft) setInput(question) // 재시도 중에는 작성 중인 질문을 보존한다
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
    ask(question, true)
  }

  const resetChat = () => {
    if (loading) return
    setMessages([])
    setInput('')
    inputRef.current?.focus()
  }

  const latest = messages.at(-1)
  const announcement = loading
    ? '찾고 있어요…'
    : latest?.role === 'assistant'
      ? `검색이 완료됐어요. 상품 ${latest.response.products.length}개를 찾았어요.`
      : ''

  return (
    <>
      {/* 주문 확인 패널이 열려 있는 동안 채팅 화면은 포커스·클릭을 받지 않는다. */}
      <div className="chat" inert={orderProduct !== null}>
        <header className="chat__header">
          <div className="chat__header-inner">
            <span className="chat__brand">PeauPick</span>
            <button type="button" className="chat__reset" onClick={resetChat}
              disabled={loading || (messages.length === 0 && input.length === 0)}>
              새 대화
            </button>
          </div>
        </header>

        <main className="chat__scroll">
          <p className="sr-only" role="status" aria-atomic="true">{announcement}</p>
          <div className="chat__list">
            {messages.length === 0 && !loading && (
              <section className="chat__welcome">
                <h1>어떤 화장품을 찾고 있어요?</h1>
                <p>실제 리뷰를 근거로 고르고, 재고와 배송 정보를 함께 확인해요.</p>
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
              return <Answer key={m.id} response={m.response} onOrder={openOrder} />
            })}

            {loading && (
              <div className="loading">
                <div className="loading__card" aria-hidden="true" />
                <div className="loading__card" aria-hidden="true" />
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
          <ChatInput inputRef={inputRef} value={input} disabled={loading} onChange={setInput} onSubmit={send} />
        </footer>
      </div>
      {orderProduct && <OrderSheet product={orderProduct} onClose={closeOrder} />}
    </>
  )
}

type AnswerProps = {
  response: ChatResponse
  onOrder: (product: Product) => void
}

function Answer({ response, onOrder }: AnswerProps) {
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
        <ProductCard key={product.productId} product={product} onOrder={onOrder} />
      ))}
    </div>
  )
}

export default App
