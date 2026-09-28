# PeauPick FE

자연어로 화장품을 물으면 지금 살 수 있는 상품만 실제 리뷰를 근거로 추천하는 뷰티 쇼핑 도우미의 프런트엔드.

- 백엔드: [Capstone-Design-mju-2/BE](https://github.com/Capstone-Design-mju-2/BE)
- API 계약: [BE docs/API.md](https://github.com/Capstone-Design-mju-2/BE/blob/main/docs/API.md)

## 스택

React 19 · TypeScript · Vite · ESLint

## 시작하기

Node 24가 필요하다 (`.nvmrc`).

```bash
npm install
npm run dev      # http://localhost:5173
```

기본값은 목업 모드라서 BE 없이 바로 화면을 볼 수 있다.

## 목업 ↔ 실제 API

| 설정 | 동작 |
| --- | --- |
| `VITE_USE_MOCK=true` (기본) | `src/mocks/chat-response.example.json`을 응답으로 쓴다 |
| `VITE_USE_MOCK=false` | `/api/v1/chat`을 호출한다. 개발 서버가 `AGENT_SERVICE_URL`(기본 `http://127.0.0.1:8000`)로 넘긴다 |

공통 기본값은 `.env.development`에 있다. 내 컴퓨터에서만 바꾸려면 `.env.development.local`을 만든다.

```bash
# .env.development.local
VITE_USE_MOCK=false
```

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run lint` | ESLint |
| `npm run build` | 타입 검사 + 빌드 |
| `npm run preview` | 빌드 결과 미리 보기 |

PR과 `main` 푸시마다 CI가 `lint`와 `build`를 돌린다.

## 폴더 구조

```text
src/
  api/          # 서버 호출 (client.ts: 공통 fetch, chat.ts: /chat)
  components/   # ChatInput, ProductCard
  lib/          # 가격·재고·배송일 표시 형식
  types/        # API 계약 타입 (BE docs/API.md와 맞춘다)
  mocks/        # BE docs/mocks의 목업 응답
  App.tsx       # 채팅 화면
  index.css     # 색·글꼴 토큰
```

## 화면 표시 규칙 (API.md 4절)

| `inventory.status` | 표시 |
| --- | --- |
| `IN_STOCK` | 재고 N개 · 내일 도착 |
| `OUT_OF_STOCK` | 품절 |
| `UNKNOWN` | 재고 확인 불가 |

`reason`이 `null`이면 그 줄을 숨기고 `evidence`만 보여 준다.
