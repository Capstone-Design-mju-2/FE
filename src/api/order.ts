import optionsByProduct from '../mocks/product-options.example.json'
import type { ProductOptions } from '../types/order'

// 옵션 정보는 아직 API 계약에 없다. 목업에 없는 상품(실제 API로 받은 상품 등)은
// 옵션 하나짜리 기본값으로 보여 준다.
const DEFAULT_OPTIONS: ProductOptions = {
  label: '옵션',
  options: [{ optionId: 0, name: '기본', soldOut: false }],
}

export function getProductOptions(productId: number): ProductOptions {
  return (optionsByProduct as Record<string, ProductOptions>)[productId] ?? DEFAULT_OPTIONS
}
