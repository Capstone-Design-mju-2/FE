import type { ApiError } from '../types/api'

export class ApiRequestError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown

  constructor(status: number, body: ApiError, details: unknown = body) {
    super(body.message)
    this.status = status
    this.code = body.code
    this.details = details
  }
}

const TIMEOUT_MS = 90_000

type RequestOptions = { timeoutMs?: number }

// 개발 중 요청 대상은 vite.config.ts의 경로별 프록시가 결정한다.
export function postJson<T>(path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
  return requestJson<T>('POST', path, body, options)
}

export function getJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return requestJson<T>('GET', path, undefined, options)
}

async function requestJson<T>(
  method: 'GET' | 'POST', path: string, body: unknown, { timeoutMs = TIMEOUT_MS }: RequestOptions,
): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method,
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
      body: method === 'POST' ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      throw new ApiRequestError(0, {
        code: 'TIMEOUT',
        message: '응답이 너무 오래 걸려요.',
      })
    }
    throw new ApiRequestError(0, {
      code: 'NETWORK_ERROR',
      message: '서버에 연결하지 못했습니다.',
    })
  }

  if (!res.ok) {
    const error = await res.json().catch(() => null)
    throw new ApiRequestError(res.status, {
      code: typeof error?.code === 'string' ? error.code : 'UNKNOWN_ERROR',
      message: typeof error?.message === 'string' ? error.message : '잠시 후 다시 시도해 주세요.',
    }, error)
  }

  try {
    return await res.json() as T
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      throw new ApiRequestError(0, { code: 'TIMEOUT', message: '응답이 너무 오래 걸려요.' })
    }
    throw new ApiRequestError(res.status, {
      code: 'INVALID_RESPONSE',
      message: '서버 응답을 읽지 못했어요. 다시 시도해 주세요.',
    })
  }
}
