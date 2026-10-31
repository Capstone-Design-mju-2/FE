import { useEffect, useState } from 'react'
import { fetchProducts } from '../api/catalog'
import { ApiRequestError } from '../api/client'
import type { ProductSort, ProductSummary } from '../types/catalog'
import { hasMorePages } from './catalog'

type ListState = {
  key: string
  products: ProductSummary[]
  total: number
  page: number
  hasMore: boolean
  error: string | null
  loadingMore: boolean
}

const errorMessage = (e: unknown) =>
  e instanceof ApiRequestError ? e.message : '상품을 불러오지 못했어요.'

// 카테고리별 상품 목록. category가 null이면 부르지 않는다.
// 조건(key)이 바뀌면 이전 결과는 보여 주지 않고, 늦게 온 이전 응답도 무시한다.
export function useProducts(category: string | null, sort: ProductSort, size: number, attempt = 0) {
  const key = category ? `${category}|${sort}|${size}|${attempt}` : ''
  const [state, setState] = useState<ListState | null>(null)

  useEffect(() => {
    if (!category) return
    let active = true
    fetchProducts({ category, sort, page: 0, size }).then((response) => {
      if (active) setState({ key, products: response.products, total: response.total, page: 0,
        hasMore: hasMorePages(response), error: null, loadingMore: false })
    }).catch((e) => {
      if (!active) return
      // BE는 상품이 하나도 없는 카테고리 코드에 400 INVALID_PRODUCT_LIST를 준다.
      // 정렬·페이지·개수는 FE가 정해서 보내므로, 이 코드는 "상품 없음"으로 보여 준다.
      const empty = e instanceof ApiRequestError && e.code === 'INVALID_PRODUCT_LIST'
      setState({ key, products: [], total: 0, page: 0, hasMore: false,
        error: empty ? null : errorMessage(e), loadingMore: false })
    })
    return () => { active = false }
  }, [category, sort, size, key])

  const current = state && state.key === key ? state : null

  const loadMore = () => {
    if (!category || !current || current.loadingMore || !current.hasMore) return
    const page = current.page + 1
    setState({ ...current, loadingMore: true })
    fetchProducts({ category, sort, page, size }).then((response) => {
      setState((prev) => prev?.key !== key ? prev : {
        ...prev, products: [...prev.products, ...response.products], page,
        hasMore: hasMorePages(response), loadingMore: false,
      })
    }).catch(() => {
      setState((prev) => prev?.key !== key ? prev : { ...prev, loadingMore: false })
    })
  }

  return {
    loading: Boolean(category) && current === null,
    error: current?.error ?? null,
    products: current?.products ?? [],
    total: current?.total ?? 0,
    hasMore: current?.hasMore ?? false,
    loadingMore: current?.loadingMore ?? false,
    loadMore,
  }
}
