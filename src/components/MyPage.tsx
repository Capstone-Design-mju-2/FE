import { useState } from 'react'
import { formatPrice } from '../lib/format'
import { homeProducts } from '../mocks/home-products'
import type { MockOrderReceipt } from '../types/order'
import './MyPage.css'

const MUSINSA_BEAUTY = 'https://www.musinsa.com/main/beauty'
const byId = (id: number) => homeProducts.find((product) => product.id === id)
const sampleOrders = [
  { id: 'DEMO-001', productId: 1, date: '2026.10.08', option: '50ml', status: '배송 중' },
  { id: 'DEMO-002', productId: 4, date: '2026.10.06', option: '50ml', status: '주문 접수' },
] as const

function MyPage({ trialOrders }: { trialOrders: MockOrderReceipt[] }) {
  const [tab, setTab] = useState<'orders' | 'restock'>('orders')
  const [alertOn, setAlertOn] = useState(true)
  const restockProduct = byId(2)

  return (
    <div className="my-page">
      <header className="home__header">
        <div className="home__header-inner">
          <a className="home__brand" href="#home">PeauPick</a>
          <nav className="home__nav" aria-label="주요 메뉴">
            <a href="#home">홈</a>
            <a href="#chat">AI 상담</a>
            <a href="#my" aria-current="page">마이페이지</a>
          </nav>
        </div>
      </header>
      <main className="my-page__layout">
        <aside className="my-page__side">
          <p className="my-page__eyebrow">시연용 목업</p>
          <strong>마이페이지</strong>
          <nav aria-label="마이페이지 메뉴">
            <button type="button" aria-pressed={tab === 'orders'}
              onClick={() => setTab('orders')}>주문/배송 조회</button>
            <button type="button" aria-pressed={tab === 'restock'}
              onClick={() => setTab('restock')}>재입고 알림</button>
          </nav>
        </aside>

        <div className="my-page__content">
          <h1>{tab === 'orders' ? '주문/배송 조회' : '재입고 알림'}</h1>
          <p className="my-page__notice">체험 주문과 예시 주문은 시연용 데이터입니다. 실제 결제·배송·알림 신청 내역이 아닙니다.</p>

          {tab === 'orders' ? (
            <div className="my-page__cards">
              {trialOrders.map((order) => (
                <article className="my-page__card" key={order.orderId}>
                  <div className="my-page__card-head"><b>이번 체험 주문</b><span>체험 주문번호 {order.orderId}</span></div>
                  <div className="my-page__card-body">
                    <div className="my-page__thumb" aria-hidden="true" />
                    <div className="my-page__details">
                      <strong className="my-page__status">주문 완료 · 체험 상태</strong>
                      <span>{order.brand}</span>
                      <b>{order.productName}</b>
                      <span>{order.optionName} · {order.quantity}개 · {formatPrice(order.totalPrice)}</span>
                    </div>
                  </div>
                </article>
              ))}
              {sampleOrders.map((order) => {
                const product = byId(order.productId)
                if (!product) return null
                return (
                  <article className="my-page__card" key={order.id}>
                    <div className="my-page__card-head"><b>{order.date}</b><span>예시 주문번호 {order.id}</span></div>
                    <div className="my-page__card-body">
                      <div className="my-page__thumb" style={{ background: product.tint }} aria-hidden="true" />
                      <div className="my-page__details">
                        <strong className="my-page__status">{order.status} · 예시 상태</strong>
                        <span>{product.brand}</span>
                        <b>{product.name}</b>
                        <span>{order.option} · 1개 · {formatPrice(product.price)}</span>
                      </div>
                      <div className="my-page__actions">
                        <a href={MUSINSA_BEAUTY} target="_blank" rel="noopener noreferrer">무신사 뷰티 열기 ↗</a>
                        <span>외부 페이지로 이동하며, 이 주문과 연결되지 않습니다.</span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="my-page__cards">
              <p className="my-page__description">알림 목록과 설정 동작을 미리 보여 드리는 목업입니다. 알림은 발송되지 않습니다.</p>
              {restockProduct && <article className="my-page__card my-page__restock">
                <div className="my-page__thumb" style={{ background: restockProduct.tint }} aria-hidden="true" />
                <div className="my-page__details">
                  <span>{restockProduct.brand}</span><b>{restockProduct.name}</b>
                  <span>품절 · 예시 상품</span>
                </div>
                <button type="button" className="my-page__toggle" aria-pressed={alertOn}
                  onClick={() => setAlertOn((current) => !current)}>
                  알림 {alertOn ? '켜짐' : '꺼짐'}
                </button>
              </article>}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default MyPage
