# PeauPick FE

자연어로 화장품을 물으면 지금 살 수 있는 상품만 실제 리뷰를 근거로 추천하는 뷰티 쇼핑 도우미의 프런트엔드.

- 백엔드: [Capstone-Design-mju-2/BE](https://github.com/Capstone-Design-mju-2/BE)
- API 계약: [BE docs/API.md](https://github.com/Capstone-Design-mju-2/BE/blob/main/docs/API.md)

## 스택

React 19 · TypeScript · Vite · ESLint

## 디자인 작업 기준

팀에 공유한 `docs`의 디자인 파일을 기준으로 화면을 구현한다. `docs/Beauty Shop.dc.html`은 색·글꼴·카드 등 시각 스타일, `docs/Wireframes.dc.html`은 화면 구성과 흐름의 기준이다. 이후 추가되는 디자인 자료도 작업 전에 확인한다. 기능 범위와 데이터 표시는 Milestone의 해당 Stage 및 API 계약에 맞춘다.

디자인 자료는 기존 `docs/` Git 제외 정책에 따라 로컬에서 관리한다.

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
| `/?mock=stage1a` | 모든 `reason`이 `null`인 1A·1B 화면 |
| `/?mock=stage1c` | 추천 이유 표시·숨김 비교, 재고 있는 상품은 시연 당일 기준 내일 도착 |

`stage1c`는 기존 fixture의 추천 이유를 보여 주는 목업이며 LLM을 호출하지 않는다. 상대 배송일은 이 시연 모드에서만 적용하고, 기본 목업의 고정 날짜와 실제 API 응답은 그대로 표시한다.

## 첫 시연 화면 점검 (Stage 1C 준비)

목업 모드로 `npm run dev`를 실행한 뒤 아래 순서를 두 번 반복한다. 실제 BE로 시연할 때는 Stage 1B 연동 절차를 따르고, BE에서 생성된 `reason`과 리뷰 근거를 확인한다.

1. `/?mock=stage1c`에서 예시 질문을 누른다. 로딩 중 입력·전송·새 대화가 잠기는지 확인한다.
2. 카드 3개와 재고 있음·품절·확인 불가를 확인한다. 첫 카드의 **추천 이유**와 **리뷰 근거**가 구분되고, 이유가 없는 나머지 카드에는 추천 이유 영역이 없는지 확인한다.
3. **새 대화**를 누른다. 질문·답변·입력값이 초기화되고 입력창으로 포커스가 돌아오는지 확인한다.
4. `/?mock=stage1a`에서 질문한다. 모든 카드에 리뷰 근거만 표시되는지 확인한다.
5. `/?mock=empty`, `/?mock=unknown`, `/?mock=error`에서 각각 결과 없음·전체 재고 확인 불가·오류 화면을 확인한다. 오류 화면의 다시 시도를 눌러 사용자 말풍선이 중복되지 않는지 확인한다.
6. 모바일 너비 320px에서 카드·리뷰·입력창이 가로로 넘치지 않는지 확인한다. 한글을 조합하는 중 Enter로 질문이 먼저 전송되지 않는지도 확인한다.

응답 후 자동 포커스는 정밀 포인터 환경(`pointer: fine`)에서만 적용한다. 터치 환경에서는 카드를 가리지 않도록 자동 포커스를 주지 않으며, 새 대화를 누른 경우에는 입력창으로 이동한다. 실제 OS 한글 입력기 확인 시 macOS Safari에서도 조합 확정 Enter와 전송 Enter를 점검한다. 실제 BE·LLM 시연 완료 조건은 별도로 확인한다.

## 주문 확인 화면 (목업)

카드의 **주문** 버튼을 누르면 채팅 위 오른쪽 패널(와이어프레임 5a)이 열린다. 주문은 재고 있음일 때만 누를 수 있고, 품절·재고 확인 불가 카드는 **주문 불가**로 잠긴다.

- 옵션은 아직 API 계약에 없다. **목업 모드에서만** `src/mocks/product-options.example.json`(상품 101·102·103)을 쓰고, 실제 API 모드(`VITE_USE_MOCK=false`)에서는 상품 ID가 목업과 겹쳐도 목업 옵션을 붙이지 않고 "옵션 정보를 아직 불러올 수 없어요"로 표시한다. 목업 모드에서도 목업에 없는 상품은 같은 안내를 보여 준다. 타입은 `src/types/order.ts`의 임시 타입이며 주문 API 계약이 나오면 교체한다.
- 품절 옵션은 선택할 수 없다. 처음에는 품절이 아닌 첫 옵션이 선택된다.
- 수량 상한은 재고 수와 임시 상한 5개 중 작은 값이다 (PRD 열린 질문, `src/lib/order.ts`의 `MAX_ORDER_QUANTITY`).
- **주문하기**는 주문 API·주문 완료 화면을 연결하기 전이라 "준비 중" 안내만 보여 준다.
- Esc·바깥 영역·✕로 닫으면 누른 주문 버튼으로 포커스가 돌아간다. 패널이 열려 있는 동안 채팅 화면은 `inert`로 잠기고, Tab·Shift+Tab은 패널의 처음·끝 요소에서 순환한다.

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run lint` | ESLint |
| `npm test` | 로컬 HTTP 요청·장애 응답·응답 구조, 배송일 표시, 주문 수량·옵션 규칙 회귀 테스트 (Node 24) |
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
  api/          # 서버 호출 (client.ts: 공통 fetch, chat.ts: /chat, order.ts: 목업 옵션)
  components/   # ChatInput, ProductCard, OrderSheet
  lib/          # 가격·재고·배송일 표시 형식, 주문 수량·옵션 규칙
  types/        # API 계약 타입 (api.ts: BE docs/API.md, order.ts: 주문 계약 전 임시 타입)
  mocks/        # BE docs/mocks의 목업 응답, 주문 옵션 목업
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
