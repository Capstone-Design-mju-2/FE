import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  HOME_CATEGORIES, PRODUCT_SORTS, RANKING_TABS, categoryLabel, formatReviewScore,
} from '../lib/catalog'
import { formatPrice } from '../lib/format'
import { highlight, highlightTerms } from '../lib/highlight'
import { useProducts } from '../lib/useProducts'
import type { ProductSort, ProductSummary } from '../types/catalog'
import ChatInput from './ChatInput'
import ProductImage from './ProductImage'
import ReviewSheet from './ReviewSheet'
import './Home.css'

type Props = {
  examples: string[]
  loading: boolean
  onAsk: (question: string) => void
}

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const CATEGORY_PAGE_SIZE = 10
const RANKING_SIZE = 5
const TAB_SLIDE_MS = 220

// "이렇게 골라요" 구역의 예시. 리뷰 문장은 상품 818의 실제 리뷰(109245) 원문이라 줄이거나 고치지 않는다.
const HOW_EXAMPLE = {
  question: '건성 피부에 끈적이지 않는 수분크림 중 내일 도착 가능한 거',
  brand: '토리든',
  name: '밸런스풀 시카 진정 크림 80ml',
  review: '여름에 피부 진정용으로 매우 좋아요 흡수도 잘 되고 끈적이지 않아요',
  price: 16600,
}

// 첫 화면 등장은 페이지를 처음 열 때 한 번만 한다. 채팅에서 홈으로 돌아올 때는 하지 않는다.
let heroRevealed = false

// 홈에서 보여 주는 추천 예시. 11/14 시연 서버가 이 질문에 답한 카드의 리뷰 근거를 줄이지 않고 옮겼다.
const SHOWCASE = {
  question: '은은하고 촉촉한 발색의 립스틱 추천해줘',
  brand: '너티퍼센트',
  name: '멜팅샤인 립스틱 (4 Colors)',
  image: {
    imageUrl: 'https://image.msscdn.net/images/goods_img/20260422/6354025/6354025_17834923863243_500.jpg',
    thumbnailUrl: 'https://image.msscdn.net/images/goods_img/20260422/6354025/6354025_17834923863243_125.jpg',
  },
  excerpt: '엄청나게 촉촉함이 가득 느껴져요. 수분감이 많다보니 입술에 바를때도 부드럽게 슥슥 발리고요. 촉촉한 립스틱들은 발색이 약하다는 편견이 있었는데',
  rating: 5,
}

function Home({ examples, loading, onAsk }: Props) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [categorySort, setCategorySort] = useState<ProductSort>('popular')
  const [categoryAttempt, setCategoryAttempt] = useState(0)
  const [rankTab, setRankTab] = useState<string>(RANKING_TABS[0])
  const [rankAttempt, setRankAttempt] = useState(0)
  const categoryList = useProducts(category, categorySort, CATEGORY_PAGE_SIZE, categoryAttempt)
  const ranking = useProducts(rankTab, 'popular', RANKING_SIZE, rankAttempt)

  const [reveal] = useState(() => !heroRevealed)
  useEffect(() => {
    heroRevealed = true
  }, [])

  // 랭킹 탭의 선택 표시는 누른 탭 크기로 바로 바꾸고, 바뀌는 동안만 transform으로 이전 자리에서 옮겨 온다.
  const tabsRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const tabs = tabsRef.current
    const indicator = indicatorRef.current
    if (!tabs || !indicator) return
    const place = (animate: boolean) => {
      const pressed = tabs.querySelector<HTMLElement>('[aria-pressed="true"]')
      if (!pressed) return
      const before = indicator.getBoundingClientRect()
      const to = `translate(${pressed.offsetLeft}px, ${pressed.offsetTop}px)`
      indicator.style.width = `${pressed.offsetWidth}px`
      indicator.style.height = `${pressed.offsetHeight}px`
      indicator.style.transform = to
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!animate || before.width === 0 || reduced) return
      const after = indicator.getBoundingClientRect()
      const dx = pressed.offsetLeft + before.left - after.left
      const dy = pressed.offsetTop + before.top - after.top
      indicator.animate(
        [{ transform: `translate(${dx}px, ${dy}px) scaleX(${before.width / after.width})` }, { transform: to }],
        { duration: TAB_SLIDE_MS, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      )
    }
    place(true)
    const observer = new ResizeObserver(() => place(false))
    observer.observe(tabs)
    return () => observer.disconnect()
  }, [rankTab])

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
      <div className={`home${reveal ? ' home--reveal' : ''}`} inert={reviewProduct !== null}>
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
              <h1>궁금한 건<br />그냥 물어보세요</h1>
              <p className="home__lead">리뷰 80만 개에서 내 피부와 사용감, 예산에 맞는 화장품을 찾고 재고와 도착일까지 확인해요.</p>
              <div className="home__search">
                <ChatInput inputRef={inputRef} value={input} disabled={loading} onChange={setInput}
                  onSubmit={ask} submitLabel="추천받기" />
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

          <div className="home__showcase-wrap">
            <button type="button" className="home__showcase" onClick={() => ask(SHOWCASE.question)} disabled={loading}>
              <span className="home__showcase-photo" aria-hidden="true">
                <ProductImage product={SHOWCASE.image} className="home__showcase-img" sizes="300px" fallback={null} />
              </span>
              <span className="home__showcase-body">
                <span className="home__showcase-question">{SHOWCASE.question}</span>
                <span className="home__showcase-brand">{SHOWCASE.brand}</span>
                <span className="home__showcase-name">{SHOWCASE.name}</span>
                <q className="home__showcase-quote">
                  {highlight(SHOWCASE.excerpt, highlightTerms(SHOWCASE.question)).map((part, i) =>
                    part.marked ? <mark key={i}>{part.text}</mark> : part.text)}
                </q>
                <span className="home__showcase-meta">★ {SHOWCASE.rating} 실제 구매 리뷰, 누르면 이 질문으로 추천받아요</span>
              </span>
            </button>
          </div>

          <section className="home__how" aria-labelledby="home-how-title">
            <div className="home__how-intro">
              <h2 id="home-how-title">이렇게 골라요</h2>
              <p>리뷰 801,690건에서 질문에 맞는 리뷰를 찾고, 재고와 도착일까지 확인해요.</p>
            </div>
            <ol className="home__how-steps">
              <li className="home__how-step">
                <h3><span className="home__how-num" aria-hidden="true">1</span>말로 물어요</h3>
                <p>피부 타입, 사용감, 예산, 도착일을 한 문장으로 적으면 돼요.</p>
                <div className="home__how-sample">
                  <span className="home__how-bubble">{HOW_EXAMPLE.question}</span>
                </div>
              </li>
              <li className="home__how-step">
                <h3><span className="home__how-num" aria-hidden="true">2</span>리뷰에서 근거를 찾아요</h3>
                <p>상품마다 실제 구매 리뷰를 근거로 보여 주고, 질문에 나온 말을 칠해요.</p>
                <div className="home__how-sample">
                  <span className="home__how-brand">{HOW_EXAMPLE.brand}</span>
                  <span className="home__how-name">{HOW_EXAMPLE.name}</span>
                  <q className="home__how-quote">
                    {highlight(HOW_EXAMPLE.review, highlightTerms(HOW_EXAMPLE.question)).map((part, i) =>
                      part.marked ? <mark key={i}>{part.text}</mark> : part.text)}
                  </q>
                </div>
              </li>
              <li className="home__how-step">
                <h3><span className="home__how-num" aria-hidden="true">3</span>재고를 보고 주문해요</h3>
                <p>재고와 도착일을 확인하고 결제 없이 체험 주문해요. 그사이 품절되면 같은 조건으로 다른 상품을 찾아요.</p>
                <div className="home__how-sample home__how-buy">
                  <strong>{formatPrice(HOW_EXAMPLE.price)}</strong>
                  <span className="home__how-stock">재고 있음 · 내일 도착</span>
                </div>
              </li>
            </ol>
          </section>

          <div className="home__content">
            {useMock && (
              <p className="home__mock-note">목업 모드: 아래 상품·리뷰는 가상 데이터예요. 실제 데이터는 BE 연결 후 보여요.</p>
            )}

            <section className="home__categories" aria-label="카테고리">
              {HOME_CATEGORIES.map(({ label, code, photo }) => (
                <button key={code} type="button" className="home__category" aria-pressed={category === code}
                  onClick={() => setCategory((current) => current === code ? null : code)}>
                  <span className="home__category-icon" aria-hidden="true">
                    <ProductImage product={photo} sizes="64px" className="home__category-photo" fallback={null} />
                  </span>
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

            <section className="home__section" aria-labelledby="home-ranking-title">
              <div className="home__section-head home__section-head--rank">
                <div>
                  <h2 id="home-ranking-title">지금 리뷰가 많은 {categoryLabel(rankTab)}</h2>
                  <p>무신사 리뷰 수 순서, 수집한 날 기준</p>
                </div>
                <div className="home__rank-tabs" role="group" aria-label="랭킹 카테고리" ref={tabsRef}>
                  <span className="home__rank-indicator" ref={indicatorRef} aria-hidden="true" />
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
          <span>PeauPick은 리뷰를 근거로 고르는 뷰티 쇼핑 체험 서비스예요.</span>
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
  // 탭·정렬을 바꿔 새 목록을 불러오는 동안 앞 목록을 흐리게 남겨, 구역 높이와 스크롤 위치가 튀지 않게 한다.
  // 첫 상품이 달라졌을 때만 새 목록으로 바뀐 것으로 본다. "더 보기"로 뒤에 붙은 상품은 떠오르지 않는다.
  const [shown, setShown] = useState<ProductSummary[]>([])
  const [swapped, setSwapped] = useState(false)
  const settled = !list.loading && list.products !== shown && (list.products.length > 0 || shown.length > 0)
  if (settled) {
    setSwapped(shown.length > 0 && list.products[0]?.productId !== shown[0].productId)
    setShown(list.products)
  }

  const stale = list.loading && shown.length > 0
  if (list.loading && !stale) return <p className="home__state" role="status">상품을 불러오는 중이에요.</p>
  if (list.error) {
    return (
      <div className="home__state" role="alert">
        <p>{list.error}</p>
        <button type="button" className="home__more" onClick={onRetry}>다시 불러오기</button>
      </div>
    )
  }
  const products = stale ? shown : list.products
  if (products.length === 0) return <p className="home__state">{emptyText}</p>
  return (
    <div className={`home__product-grid${stale ? ' is-stale' : swapped ? ' is-swapped' : ''}`} aria-busy={stale}>
      {stale && <p className="sr-only" role="status">상품을 불러오는 중이에요.</p>}
      {products.map((product, index) => (
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
        <ProductImage product={product} className="home-product__photo"
          sizes="(max-width: 360px) 90vw, (max-width: 760px) 45vw, 240px"
          fallback={<span className="home-product__placeholder">이미지 없음</span>} />
      </span>
      <span className="home-product__brand">{rank ? `${rank}위 ${product.brand}` : product.brand}</span>
      <span className="home-product__name">{product.name}</span>
      <span className="home-product__prices">
        <strong>{formatPrice(product.price)}</strong>
        {product.reviewCount > 0 && <span className="home-product__score">★ {formatReviewScore(product.reviewScore)}</span>}
      </span>
      <span className="home-product__sample">
        {product.reviewCount === 0 ? '리뷰 없음' : `리뷰 ${product.reviewCount.toLocaleString('ko-KR')}개 보기`}
      </span>
    </button>
  )
}

export default Home
