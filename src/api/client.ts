import type { ApiError } from '../types/api'

export class ApiRequestError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, body: ApiError) {
    super(body.message)
    this.status = status
    this.code = body.code
  }
}

// 개발 중에는 vite.config.ts의 프록시가 /api 요청을 agent-service로 넘긴다.
export async function postJson<T>(path: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiRequestError(0, {
      code: 'NETWORK_ERROR',
      message: '서버에 연결하지 못했습니다.',
    })
  }

  if (!res.ok) {
    const error = await res.json().catch(() => null)
    throw new ApiRequestError(res.status, {
      code: error?.code ?? 'UNKNOWN_ERROR',
      message: error?.message ?? '잠시 후 다시 시도해 주세요.',
    })
  }

  return res.json() as Promise<T>
}
