import { useCallback, useEffect, useRef, useState } from 'react'
import {
  HOME_CATEGORIES, PRODUCT_SORTS, RANKING_TABS, categoryLabel, formatReviewScore,
} from '../lib/catalog'
import { formatPrice } from '../lib/format'
import { useProducts } from '../lib/useProducts'
import type { ProductSort, ProductSummary } from '../types/catalog'
import ChatInput from './ChatInput'
import ReviewSheet from './ReviewSheet'
import './Home.css'

type Props = {
  examples: string[]
  loading: boolean
  onAsk: (question: string) => void
  onOpenChat: () => void
}

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const CATEGORY_PAGE_SIZE = 10
const RANKING_SIZE = 5

function Home({ examples, loading, onAsk, onOpenChat }: Props) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [categorySort, setCategorySort] = useState<ProductSort>('popular')
  const [categoryAttempt, setCategoryAttempt] = useState(0)
  const [rankTab, setRankTab] = useState<string>(RANKING_TABS[0])
  const [rankAttempt, setRankAttempt] = useState(0)
  const categoryList = useProducts(category, categorySort, CATEGORY_PAGE_SIZE, categoryAttempt)
  const ranking = useProducts(rankTab, 'popular', RANKING_SIZE, rankAttempt)

  // 리뷰 패널: 열린 동안 메인은 inert, 닫히면 누른 상품 카드로 포커스를 돌린다.
  const [reviewProduct, setReviewProduct] = useState<ProductSummary | null>(null)
  const reviewOpenerRef = useRef<HTMLElement | null>(null)
  const openReviews = (product: ProductSummary) => {
    reviewOpenerRef.current = document.activeElement as HTMLElement | null
    setReviewProduct(product)
  }
  const closeReviews = useCallback(() => setReviewProduct(null), [])
  useEffect(() => {
    if (reviewProduct === null && reviewOpenerRef.current) {
      reviewOpenerRef.current.focus()
      reviewOpenerRef.current = null
    }
  }, [reviewProduct])

  const ask = (question: string) => {
    if (loading) return
    setInput('')
    onAsk(question)
  }

  return (
    <>
      <div className="home" inert={reviewProduct !== null}>
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
            {useMock && (
              <p className="home__mock-note">목업 모드: 아래 상품·리뷰는 가상 데이터예요. 실제 데이터는 BE 연결 후 보여요.</p>
            )}

            <section className="home__categories" aria-label="카테고리">
              {HOME_CATEGORIES.map(({ label, code, tint }) => (
                <button key={code} type="button" className="home__category" aria-pressed={category === code}
                  onClick={() => setCategory((current) => current === code ? null : code)}>
                  <span className="home__category-icon" style={{ background: tint }} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </section>

            {category && (
              <section className="home__section" aria-labelledby="home-category-title">
                <div className="home__section-head">
                  <div>
                    <h2 id="home-category-title">{categoryLabel(category)} 상품</h2>
                    <p>
                      {categoryList.loading || categoryList.error
                        ? '수집한 무신사 뷰티 상품이에요.'
                        : `수집한 무신사 뷰티 상품 ${categoryList.total.toLocaleString('ko-KR')}개`}
                    </p>
                  </div>
                  <label className="home__sort">
                    <span className="sr-only">정렬</span>
                    <select value={categorySort} onChange={(e) => setCategorySort(e.target.value as ProductSort)}>
                      {PRODUCT_SORTS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <ProductGrid list={categoryList} onOpen={openReviews}
                  onRetry={() => setCategoryAttempt((n) => n + 1)} emptyText="이 카테고리에는 아직 상품이 없어요." />
                {categoryList.hasMore && (
                  <>
                    <button type="button" className="home__more" onClick={categoryList.loadMore}
                      disabled={categoryList.loadingMore}>
                      {categoryList.loadingMore ? '불러오는 중…' : '상품 더 보기'}
                    </button>
                    {categoryList.moreError && <p className="home__more-error" role="alert">{categoryList.moreError}</p>}
                  </>
                )}
              </section>
            )}

            <section className="home__chat-banner">
              <h2>원하는 조건을 말하면<br />리뷰로 골라 드려요</h2>
              <button type="button" onClick={onOpenChat}>AI 상담 시작</button>
            </section>

            <section className="home__section" aria-labelledby="home-ranking-title">
              <div className="home__section-head home__section-head--rank">
                <div>
                  <h2 id="home-ranking-title">지금 인기 랭킹</h2>
                  <p>무신사 리뷰 수가 많은 순서예요 (수집한 날 기준).</p>
                </div>
                <div className="home__rank-tabs" role="group" aria-label="랭킹 카테고리">
                  {RANKING_TABS.map((code) => (
                    <button key={code} type="button" aria-pressed={rankTab === code}
                      onClick={() => setRankTab(code)}>{categoryLabel(code)}</button>
                  ))}
                </div>
              </div>
              <ProductGrid list={ranking} ranked onOpen={openReviews}
                onRetry={() => setRankAttempt((n) => n + 1)} emptyText="랭킹에 표시할 상품이 아직 없어요." />
            </section>
          </div>
        </main>

        <footer className="home__footer">
          <span>PeauPick · 리뷰 기반 뷰티 쇼핑 체험</span>
          <span>가격·리뷰 수·평점은 수집한 날 기준이며, 주문은 결제 없이 진행돼요.</span>
        </footer>
      </div>
      {reviewProduct && <ReviewSheet product={reviewProduct} onClose={closeReviews} />}
    </>
  )
}

type ProductList = ReturnType<typeof useProducts>

function ProductGrid({ list, ranked = false, onOpen, onRetry, emptyText }: {
  list: ProductList
  ranked?: boolean
  onOpen: (product: ProductSummary) => void
  onRetry: () => void
  emptyText: string
}) {
  if (list.loading) return <p className="home__state" role="status">상품을 불러오는 중이에요.</p>
  if (list.error) {
    return (
      <div className="home__state" role="alert">
        <p>{list.error}</p>
        <button type="button" className="home__more" onClick={onRetry}>다시 불러오기</button>
      </div>
    )
  }
  if (list.products.length === 0) return <p className="home__state">{emptyText}</p>
  return (
    <div className="home__product-grid">
      {list.products.map((product, index) => (
        <HomeProductCard key={product.productId} product={product} rank={ranked ? index + 1 : undefined}
          onOpen={onOpen} />
      ))}
    </div>
  )
}

function HomeProductCard({ product, rank, onOpen }: {
  product: ProductSummary
  rank?: number
  onOpen: (product: ProductSummary) => void
}) {
  return (
    <button type="button" className="home-product" onClick={() => onOpen(product)}>
      <span className="home-product__image" aria-hidden="true">
        {rank && <span className="home-product__rank">{rank}</span>}
        <span className="home-product__placeholder">이미지 없음</span>
      </span>
      {rank && <span className="sr-only">{rank}위</span>}
      <span className="home-product__brand">{product.brand}</span>
      <span className="home-product__name">{product.name}</span>
      <span className="home-product__prices">
        <strong>{formatPrice(product.price)}</strong>
      </span>
      <span className="home-product__reviews">
        {product.reviewCount === 0 ? '리뷰 없음' :
          `★ ${formatReviewScore(product.reviewScore)} (${product.reviewCount.toLocaleString('ko-KR')})`}
      </span>
      <span className="home-product__sample">리뷰 보기 →</span>
    </button>
  )
}

export default Home
