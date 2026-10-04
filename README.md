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

목업 모드에서는 주소 뒤에 `?mock=`을 붙여 상태 화면을 BE 없이 확인할 수 있다.

| 주소 | 상황 |
| --- | --- |
| `/` | 목업 응답 그대로 (재고 있음·품절·확인 불가 각 1개) |
| `/?mock=empty` | 결과 0개 |
| `/?mock=unknown` | order-service 장애 (재고 전부 확인 불가) |
| `/?mock=error` | catalog-service 장애 (502 오류 → 다시 시도) |

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run lint` | ESLint |
| `npm test` | 실제 로컬 HTTP 요청·장애 응답·응답 구조 회귀 테스트 (Node 24) |
| `npm run build` | 타입 검사 + 빌드 |
| `npm run preview` | 빌드 결과 미리 보기 |

PR과 `main` 푸시마다 CI가 `lint`, `build`, `test`를 돌린다.

## Stage 1B 실제 연동 확인

`.env.development.local`에 `VITE_USE_MOCK=false`와 `AGENT_SERVICE_URL=http://127.0.0.1:8000`을 설정하고 개발 서버를 재시작한다. 다른 주소에서 BE를 실행하면 `AGENT_SERVICE_URL`을 바꾼다.

1. BE의 catalog·order·agent를 실행하고 실제 데이터에 있는 키워드로 질문한다. 개발자 도구에서 `POST /api/v1/chat`의 `{message}` 요청과 카드 응답을 확인한다.
2. order-service를 중지하고 같은 질문을 보낸다. 카드가 유지되고 모든 재고가 `재고 확인 불가`인지 확인한다.
3. catalog-service를 중지하고 질문한다. 서버의 `code`, `message`와 다시 시도 버튼이 표시되는지 확인한다.
4. 서비스를 복구한 뒤 다시 시도를 누른다. 같은 질문으로 카드가 표시되는지 확인한다.
5. 검색 결과가 없는 질문으로 결과 0개 안내를 확인한다.

`npm test`는 임시 로컬 HTTP 서버와 응답 fixture로 FE의 전송·오류 처리를 검증한다. 실제 BE 연동이나 브라우저 화면 검증을 대신하지 않는다. 개발 프록시는 `npm run dev`에서 적용되며, 배포 환경에서는 `/api`를 BE로 전달하는 별도 구성이 필요하다.

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
