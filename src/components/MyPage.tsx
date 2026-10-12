import { useState } from 'react'
import { formatPrice } from '../lib/format'
import { homeProducts } from '../mocks/home-products'
import './MyPage.css'

const MUSINSA_BEAUTY = 'https://www.musinsa.com/main/beauty'
const byId = (id: number) => homeProducts.find((product) => product.id === id)
const sampleOrders = [
  { id: 'DEMO-001', productId: 1, date: '2026.10.08', option: '50ml', status: '배송 중', actions: ['배송 조회', '교환·반품 신청', '리뷰 쓰기'] },
  { id: 'DEMO-002', productId: 4, date: '2026.10.06', option: '50ml', status: '주문 접수', actions: ['주문 취소'] },
] as const

function MyPage() {
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
            <button type="button" aria-current={tab === 'orders' ? 'page' : undefined}
              onClick={() => setTab('orders')}>주문/배송 조회</button>
            <button type="button" aria-current={tab === 'restock' ? 'page' : undefined}
              onClick={() => setTab('restock')}>재입고 알림</button>
          </nav>
        </aside>

        <div className="my-page__content">
          <h1>{tab === 'orders' ? '주문/배송 조회' : '재입고 알림'}</h1>
          <p className="my-page__notice">이 화면의 주문·배송·재입고 정보는 디자인 시연용 가상 데이터입니다. 실제 주문이나 알림 신청 내역이 아닙니다.</p>

          {tab === 'orders' ? (
            <div className="my-page__cards">
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
                        {order.actions.map((action) => (
                          <a key={action} href={MUSINSA_BEAUTY} target="_blank" rel="noopener noreferrer"
                            aria-label={`${action} — 무신사 뷰티 새 창 열기`}>{action} ↗</a>
                        ))}
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
