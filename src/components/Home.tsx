import { useCallback, useEffect, useRef, useState } from 'react'
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
              <h1>리뷰 수백 개,<br />대신 읽고 골라 드릴게요</h1>
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
