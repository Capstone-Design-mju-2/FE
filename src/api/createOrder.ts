import { ApiRequestError, postJson } from './client.ts'
import type { CreateOrderRequest, CreateOrderResponse } from '../types/order'

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null
const nonnegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0

function isCreateOrderResponse(value: unknown): value is CreateOrderResponse {
  return record(value) && nonnegativeInteger(value.orderId) &&
    nonnegativeInteger(value.totalPrice) && Array.isArray(value.items) &&
    value.items.length > 0 && value.items.every((item: unknown) =>
      record(item) && nonnegativeInteger(item.productId) &&
      typeof item.optionKey === 'string' && typeof item.name === 'string' &&
      nonnegativeInteger(item.unitPrice) && nonnegativeInteger(item.quantity) &&
      item.quantity > 0)
}

// 옵션 조회 계약이 정해지면 실제 optionKey를 선택한 뒤 호출한다.
// 주문은 재고를 차감하므로 실패 시 자동으로 재전송하지 않는다.
export async function createOrder(
  request: CreateOrderRequest,
  endpoint = '/api/v1/orders',
): Promise<CreateOrderResponse> {
  const response = await postJson<unknown>(endpoint, request)
  if (!isCreateOrderResponse(response)) {
    throw new ApiRequestError(201, {
      code: 'INVALID_RESPONSE',
      message: '주문 응답을 확인하지 못했어요. 주문 내역을 확인한 뒤 다시 시도해 주세요.',
    })
  }
  return response
}
