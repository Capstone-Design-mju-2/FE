import { useEffect, useId, useRef, useState } from 'react'
import { fetchReviews } from '../api/catalog'
import { ApiRequestError } from '../api/client'
import { REVIEW_SORTS, SKIN_TYPES, formatReviewScore, hasMorePages, skinTypeLabel } from '../lib/catalog'
import { formatPrice } from '../lib/format'
import { useDialog } from '../lib/useDialog'
import type { ProductSummary, Review, ReviewSort, SkinType } from '../types/catalog'
import './OrderSheet.css'
import './ReviewSheet.css'

type Props = {
  product: ProductSummary
  onClose: () => void
}

const PAGE_SIZE = 20

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; reviews: Review[]; total: number; page: number; hasMore: boolean; loadingMore: boolean; moreError: string | null }

// 리뷰 조회 API(GET /api/v1/products/{id}/reviews)로 상품 하나의 리뷰를 보여 주는 오른쪽 패널
function ReviewSheet({ product, onClose }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [sort, setSort] = useState<ReviewSort>('recent')
  const [skinType, setSkinType] = useState<SkinType | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<State>({ status: 'loading' })
  // 정렬·필터를 빠르게 바꿨을 때 늦게 온 이전 응답이 화면을 덮지 않게 한다.
  const requestRef = useRef(0)

  useDialog(panelRef, closeRef, onClose)

  // 정렬·필터·재시도를 바꾸면 첫 페이지부터 다시 불러온다. 로딩 표시는 바꾸는 쪽에서 켠다.
  const reload = (change: () => void) => {
    requestRef.current += 1
    setState({ status: 'loading' })
    change()
  }

  useEffect(() => {
    const request = ++requestRef.current
    fetchReviews(product.productId, { sort, skinType, page: 0, size: PAGE_SIZE }).then((response) => {
      if (request !== requestRef.current) return
      setState({ status: 'ready', reviews: response.reviews, total: response.total, page: 0,
        hasMore: hasMorePages(response), loadingMore: false, moreError: null })
    }).catch((e) => {
      if (request !== requestRef.current) return
      setState({ status: 'error', message: e instanceof ApiRequestError ? e.message : '리뷰를 불러오지 못했어요.' })
    })
  }, [product.productId, sort, skinType, attempt])

  const loadMore = () => {
    if (state.status !== 'ready' || state.loadingMore) return
    const request = requestRef.current
    const page = state.page + 1
    setState({ ...state, loadingMore: true, moreError: null })
    fetchReviews(product.productId, { sort, skinType, page, size: PAGE_SIZE }).then((response) => {
      if (request !== requestRef.current) return
      setState((prev) => prev.status !== 'ready' ? prev : {
        ...prev, reviews: [...prev.reviews, ...response.reviews], page, hasMore: hasMorePages(response),
        loadingMore: false, moreError: null,
      })
    }).catch(() => {
      if (request !== requestRef.current) return
      setState((prev) => prev.status !== 'ready' ? prev : {
        ...prev, loadingMore: false, moreError: '리뷰를 더 불러오지 못했어요. 다시 눌러 주세요.',
      })
    })
  }

  return (
    <div className="order-sheet">
      <div className="order-sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <section ref={panelRef} className="order-sheet__panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="order-sheet__header">
          <h2 id={titleId}>{product.name} 리뷰</h2>
          <button ref={closeRef} type="button" className="order-sheet__close" onClick={onClose} aria-label="리뷰 닫기">
            ✕
          </button>
        </header>

        <div className="order-sheet__body">
          <div className="order-sheet__product">
            <div className="order-sheet__thumb" aria-hidden="true" />
            <div>
              <div className="order-sheet__brand">{product.brand}</div>
              <div className="order-sheet__name">{product.name}</div>
              <div>
                {formatPrice(product.price)} · {product.reviewCount === 0 ? '리뷰 없음' :
                  `★ ${formatReviewScore(product.reviewScore)} (무신사 리뷰 ${product.reviewCount.toLocaleString('ko-KR')})`}
              </div>
            </div>
          </div>

          <div className="review-sheet__filters">
            <label className="review-sheet__sort">
              <span className="order-sheet__label">정렬</span>
              <select value={sort} onChange={(e) => {
                const next = e.target.value as ReviewSort
                reload(() => setSort(next))
              }}>
                {REVIEW_SORTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <div className="review-sheet__skins" role="group" aria-label="작성자 피부 타입">
              <button type="button" aria-pressed={skinType === null}
                onClick={() => skinType !== null && reload(() => setSkinType(null))}>전체</button>
              {SKIN_TYPES.map((type) => (
                <button key={type.value} type="button" aria-pressed={skinType === type.value}
                  onClick={() => skinType !== type.value && reload(() => setSkinType(type.value))}>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {state.status === 'loading' && <p className="order-sheet__note" role="status">리뷰를 불러오는 중이에요.</p>}
          {state.status === 'error' && (
            <div>
              <p className="order-sheet__note" role="alert">{state.message}</p>
              <button type="button" className="order-sheet__retry" onClick={() => reload(() => setAttempt((n) => n + 1))}>
                리뷰 다시 불러오기
              </button>
            </div>
          )}
          {state.status === 'ready' && (
            <>
              <p className="review-sheet__count" role="status">
                {skinType ? `${skinTypeLabel(skinType)} 작성자 리뷰` : '수집한 리뷰'} {state.total.toLocaleString('ko-KR')}개
                <span> · 상품당 최대 300개까지 수집해서 무신사 전체 리뷰 수보다 적을 수 있어요</span>
              </p>
              {state.reviews.length === 0 ? (
                <p className="order-sheet__note">
                  {skinType ? '이 피부 타입으로 작성한 리뷰가 아직 없어요. 전체 리뷰를 확인해 보세요.' : '리뷰가 아직 없어요.'}
                </p>
              ) : (
                <ul className="review-sheet__list">
                  {state.reviews.map((review) => <ReviewItem key={review.reviewId} review={review} />)}
                </ul>
              )}
              {state.hasMore && (
                <>
                  <button type="button" className="order-sheet__retry review-sheet__more" onClick={loadMore}
                    disabled={state.loadingMore}>
                    {state.loadingMore ? '불러오는 중…' : '리뷰 더 보기'}
                  </button>
                  {state.moreError && <p className="review-sheet__more-error" role="alert">{state.moreError}</p>}
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function ReviewItem({ review }: { review: Review }) {
  const skin = skinTypeLabel(review.skinType)
  return (
    <li className="review-sheet__item">
      <div className="review-sheet__meta">
        <span className="review-sheet__stars" aria-hidden="true">
          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
        </span>
        <span className="sr-only">별점 {review.rating}점</span>
        <span className={skin ? 'review-sheet__skin' : 'review-sheet__skin review-sheet__skin--none'}>
          {skin ?? '피부 타입 미선택'}
        </span>
        <span className="review-sheet__date">{review.writtenAt}</span>
      </div>
      <p className="review-sheet__content">{review.content}</p>
      <div className="review-sheet__sub">
        {review.optionText && <span>옵션 {review.optionText}</span>}
        <span>좋아요 {review.likeCount}</span>
      </div>
    </li>
  )
}

export default ReviewSheet
