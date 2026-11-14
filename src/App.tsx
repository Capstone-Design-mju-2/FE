import { useCallback, useEffect, useRef, useState } from 'react'
import { sendChat } from './api/chat'
import { ApiRequestError } from './api/client'
import ChatInput from './components/ChatInput'
import Home from './components/Home'
import MyPage from './components/MyPage'
import OrderSheet from './components/OrderSheet'
import ProductCard from './components/ProductCard'
import type { ChatResponse, Product } from './types/api'
import type { MockOrderReceipt } from './types/order'
import { screenForLocation } from './lib/navigation'
import { alternativeRequest, excludesSoldOutProducts, type SearchOrigin } from './lib/alternatives'
import { addChatRecord, readPersonalData, savePersonalData, toChatRecord } from './lib/personal'
import './App.css'

type Message =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; response: ChatResponse; origin: SearchOrigin }
  | { id: number; role: 'error'; question: string; code: string; detail: string; alternative?: { origin: SearchOrigin; productId: number } }
  | { id: number; role: 'soldout'; productName: string }

const EXAMPLES = [
  '건성 피부에 끈적이지 않는 수분크림 중 내일 도착 가능한 거',
  '3만 원 이하 순한 선크림',
  '진정 토너 추천해 줘',
]

let nextId = 0

const currentScreen = () => screenForLocation(window.location.hash, window.location.search)

function App() {
  const [screen, setScreen] = useState(currentScreen)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [orderTarget, setOrderTarget] = useState<{ product: Product; origin: SearchOrigin } | null>(null)
  const [trialOrders, setTrialOrders] = useState<MockOrderReceipt[]>([])
  const [personal, setPersonal] = useState(readPersonalData)
  const orderOpenerRef = useRef<HTMLElement | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { savePersonalData(personal) }, [personal])

  useEffect(() => {
    const onNavigate = () => {
      const next = currentScreen()
      setScreen(next)
      if (next !== 'chat') {
        orderOpenerRef.current = null
        setOrderTarget(null)
      }
    }
    window.addEventListener('hashchange', onNavigate)
    return () => window.removeEventListener('hashchange', onNavigate)
  }, [])

  const showChat = () => {
    window.location.hash = 'chat'
    setScreen('chat')
  }

  // 패널이 열리면 채팅 화면이 inert가 되면서 포커스가 풀리므로, 누른 버튼을 클릭 시점에 기억해 둔다.
  const openOrder = (product: Product, origin: SearchOrigin) => {
    orderOpenerRef.current = document.activeElement as HTMLElement | null
    setOrderTarget({ product, origin })
  }
  const closeOrder = useCallback(() => setOrderTarget(null), [])

  // 패널이 닫혀 inert가 풀린 뒤 주문 버튼으로 포커스를 되돌린다.
  useEffect(() => {
    if (orderTarget === null && orderOpenerRef.current) {
      orderOpenerRef.current.focus()
      orderOpenerRef.current = null
    }
  }, [orderTarget])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }, [messages, loading])

  const ask = async (question: string, preserveDraft = false) => {
    if (!preserveDraft) setInput('')
    setLoading(true)
    try {
      const skinType = personal.skinType === 'unknown' ? undefined : personal.skinType
      const response = await sendChat(question, { skinType })
      const origin: SearchOrigin = { question, skinType, searchConditions: response.searchConditions ?? null,
        excludedProductIds: [] }
      setMessages((prev) => [...prev, { id: nextId++, role: 'assistant', response, origin }])
      setPersonal((prev) => addChatRecord(prev, toChatRecord(question, response)))
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

  const askAlternative = async (origin: SearchOrigin, productId: number, productName: string, showNotice = true) => {
    const request = alternativeRequest(origin, productId)
    if (!request || loading) return
    closeOrder()
    if (showNotice) setMessages((prev) => [...prev, { id: nextId++, role: 'soldout', productName }])
    setLoading(true)
    try {
      const response = await sendChat(request.message, {
        skinType: request.skinType, searchConditions: request.searchConditions,
        excludeProductIds: request.excludeProductIds,
      })
      if (!excludesSoldOutProducts(response.products.map((product) => product.productId), request.excludeProductIds ?? [])) {
        throw new ApiRequestError(200, { code: 'INVALID_RESPONSE', message: '품절 상품이 대안에 포함됐어요. 다시 시도해 주세요.' })
      }
      const nextOrigin: SearchOrigin = { ...origin, excludedProductIds: request.excludeProductIds ?? [] }
      setMessages((prev) => [...prev, { id: nextId++, role: 'assistant', response, origin: nextOrigin }])
      setPersonal((prev) => addChatRecord(prev, toChatRecord(request.message, response)))
    } catch (error) {
      const details = error instanceof ApiRequestError
        ? { code: error.code, detail: error.message }
        : { code: 'UNKNOWN_ERROR', detail: '대안 상품을 찾지 못했어요.' }
      setMessages((prev) => [...prev, { id: nextId++, role: 'error', question: request.message,
        ...details, alternative: { origin, productId } }])
    } finally {
      setLoading(false)
    }
  }

  const send = (text: string) => {
    if (loading) return
    setMessages((prev) => [...prev, { id: nextId++, role: 'user', text }])
    ask(text)
  }

  const askFromHome = (text: string) => {
    if (loading) return
    showChat()
    send(text)
  }

  // 같은 질문을 말풍선을 다시 쌓지 않고 한 번 더 보낸다.
  const retry = (errorId: number, question: string) => {
    if (loading) return
    setMessages((prev) => prev.filter((m) => m.id !== errorId))
    ask(question, true)
  }

  const retryAlternative = (errorId: number, origin: SearchOrigin, productId: number) => {
    if (loading) return
    setMessages((prev) => prev.filter((message) => message.id !== errorId))
    askAlternative(origin, productId, '', false)
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

  if (screen === 'home') {
    return <Home examples={EXAMPLES} loading={loading} onAsk={askFromHome} />
  }
  if (screen === 'my') return <MyPage trialOrders={trialOrders} personal={personal} onPersonalChange={setPersonal} />

  return (
    <>
      {/* 주문 확인 패널이 열려 있는 동안 채팅 화면은 포커스·클릭을 받지 않는다. */}
      <div className="chat" inert={orderTarget !== null}>
        <header className="chat__header">
          <div className="chat__header-inner">
            <a className="chat__brand" href="#home">PeauPick</a>
            <div className="chat__header-actions">
              <a href="#home">홈</a>
              <a href="#my">마이페이지</a>
              <button type="button" className="chat__reset" onClick={resetChat}
                disabled={loading || (messages.length === 0 && input.length === 0)}>
                새 대화
              </button>
            </div>
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
                      onClick={() => m.alternative
                        ? retryAlternative(m.id, m.alternative.origin, m.alternative.productId)
                        : retry(m.id, m.question)}
                      disabled={loading}
                    >
                      다시 시도
                    </button>
                  </div>
                )
              }
              if (m.role === 'soldout') return <div key={m.id} className="notice" role="status">
                <b>방금 품절됐어요</b><span className="notice__detail">{m.productName}을 제외하고 같은 조건으로 대안을 요청했어요.</span>
              </div>
              return <Answer key={m.id} response={m.response} origin={m.origin} onOrder={openOrder} />
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
      {orderTarget && <OrderSheet product={orderTarget.product} onClose={closeOrder}
        onShowAlternatives={() => askAlternative(orderTarget.origin, orderTarget.product.productId, orderTarget.product.name)}
        canShowAlternatives={alternativeRequest(orderTarget.origin, orderTarget.product.productId) !== null}
        onOrderComplete={(receipt) => setTrialOrders((orders) => [receipt, ...orders])} />}
    </>
  )
}

type AnswerProps = {
  response: ChatResponse
  origin: SearchOrigin
  onOrder: (product: Product, origin: SearchOrigin) => void
}

function Answer({ response, origin, onOrder }: AnswerProps) {
  const { answer, products } = response

  if (products.length === 0) {
    const alternative = origin.excludedProductIds.length > 0
    return (
      <div className="answer">
        <div className="bubble bubble--assistant">{answer}</div>
        <div className="notice">
          <b>{alternative ? '같은 조건의 다른 상품이 없어요' : '조건을 모두 만족하는 상품이 없어요'}</b>
          <span className="notice__detail">
            {alternative ? '조건을 바꿔 새로 물어보세요.' :
              '수분크림·선크림처럼 상품 종류를 넣거나, 가격 조건을 빼고 다시 물어보세요.'}
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
        <ProductCard key={product.productId} product={product} question={origin.question}
          onOrder={(selected) => onOrder(selected, origin)} />
      ))}
    </div>
  )
}

export default App
