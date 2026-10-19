import { useRef, useState } from 'react'
import { formatPrice } from '../lib/format'
import { homeProducts, type HomeProduct } from '../mocks/home-products'
import ChatInput from './ChatInput'
import './Home.css'

type Props = {
  examples: string[]
  loading: boolean
  onAsk: (question: string) => void
  onOpenChat: () => void
}

const categories = [
  ['스킨케어', '#efe6da'], ['클렌징', '#e8ede6'], ['선케어', '#f3ebd6'],
  ['메이크업', '#e9d3d6'], ['립', '#e4ccd0'], ['헤어', '#eee7dc'],
  ['바디', '#f0eae2'], ['향수', '#e6e4ee'],
] as const

const recommendationIds = [1, 2, 8, 4, 10]
const rankingIds = {
  전체: [4, 1, 8, 6, 10],
  스킨케어: [1, 8, 2],
  메이크업: [6, 7],
  선케어: [4],
} as const

const byId = (id: number) => homeProducts.find((product) => product.id === id)
const productsFor = (ids: readonly number[]) => ids.map(byId).filter((product): product is HomeProduct => Boolean(product))

function Home({ examples, loading, onAsk, onOpenChat }: Props) {
  const [input, setInput] = useState('')
  const [rankTab, setRankTab] = useState<keyof typeof rankingIds>('전체')
  const inputRef = useRef<HTMLInputElement>(null)
  const ask = (question: string) => {
    if (loading) return
    setInput('')
    onAsk(question)
  }

  return (
    <div className="home">
      <header className="home__header">
        <div className="home__header-inner">
          <a className="home__brand" href="#home">PeauPick</a>
          <nav className="home__nav" aria-label="주요 메뉴">
            <a href="#home" aria-current="page">홈</a>
            <a href="#chat">AI 상담</a>
            <a href="#my">마이페이지</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="home__hero">
          <div className="home__hero-inner">
            <p className="home__eyebrow">실제 리뷰를 근거로 찾는 뷰티 쇼핑</p>
            <h1>오늘은 어떤 화장품을 찾으세요?</h1>
            <div className="home__search">
              <ChatInput inputRef={inputRef} value={input} disabled={loading} onChange={setInput}
                onSubmit={ask} submitLabel="AI에게 묻기" />
            </div>
            <div className="home__examples" aria-label="예시 질문">
              {examples.map((example) => (
                <button key={example} type="button" onClick={() => ask(example)} disabled={loading}>
                  {example}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="home__content">
          <section className="home__categories" aria-label="카테고리별 상품 보기 준비 중">
            {categories.map(([name, tint]) => (
              <div key={name} className="home__category">
                <span className="home__category-icon" style={{ background: tint }} aria-hidden="true" />
                <span>{name}</span>
              </div>
            ))}
          </section>
          <p className="home__category-note">카테고리별 상품 보기는 API가 준비되면 열립니다.</p>

          <section className="home__section" aria-labelledby="home-recommend-title">
            <div className="home__section-head">
              <div>
                <h2 id="home-recommend-title">리뷰가 좋은 상품</h2>
                <p>디자인 시안의 예시 상품으로 화면을 미리 보여 드려요.</p>
              </div>
              <button className="home__text-action" type="button" onClick={onOpenChat}>AI로 더 좁히기 →</button>
            </div>
            <div className="home__product-grid">
              {productsFor(recommendationIds).map((product) => (
                <HomeProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>

          <section className="home__chat-banner">
            <h2>원하는 조건을 말하면<br />리뷰로 골라 드려요</h2>
            <button type="button" onClick={onOpenChat}>AI 상담 시작</button>
          </section>

          <section className="home__section" aria-labelledby="home-ranking-title">
            <div className="home__section-head home__section-head--rank">
              <div>
                <h2 id="home-ranking-title">지금 인기 랭킹</h2>
                <p>순위와 상품 정보는 실제 판매·인기 데이터가 아닌 가상 예시예요.</p>
              </div>
              <div className="home__rank-tabs" role="group" aria-label="랭킹 카테고리">
                {(Object.keys(rankingIds) as (keyof typeof rankingIds)[]).map((tab) => (
                  <button key={tab} type="button" aria-pressed={rankTab === tab}
                    onClick={() => setRankTab(tab)}>{tab}</button>
                ))}
              </div>
            </div>
            <div className="home__product-grid">
              {productsFor(rankingIds[rankTab]).map((product, index) => (
                <HomeProductCard key={product.id} product={product} rank={index + 1} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="home__footer">
        <span>PeauPick · 리뷰 기반 뷰티 쇼핑 체험</span>
        <span>상품·가격·평점·순위는 디자인 시연용 예시이며, 주문은 결제 없이 진행돼요.</span>
      </footer>
    </div>
  )
}

function HomeProductCard({ product, rank }: {
  product: HomeProduct
  rank?: number
}) {
  return (
    <article className="home-product">
      <span className="home-product__image" style={{ background: product.tint }}>
        {rank && <span className="home-product__rank">{rank}</span>}
        <span className="home-product__placeholder">제품 이미지</span>
      </span>
      <span className="home-product__brand">{product.brand}</span>
      <span className="home-product__name">{product.name}</span>
      <span className="home-product__prices">
        <strong>{formatPrice(product.price)}</strong>
      </span>
      <span className="home-product__reviews">★ {product.rating} ({product.reviewCount.toLocaleString('ko-KR')})</span>
      <span className="home-product__sample">시안 예시 · 상세 화면 없음</span>
    </article>
  )
}

export default Home
