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

첫 화면(`/` 또는 `/#home`)은 `docs/Beauty Shop.dc.html`을 기준으로 만든 메인 화면이다. 검색창·예시 질문은 AI 상담 화면(`#chat`)으로 이어진다. 기존 목업 점검 주소(`/?mock=...`)는 상담 화면으로 바로 열린다.

- **카테고리 타일**을 누르면 BE 카테고리별 상품 목록(`GET /api/v1/products?category=…`)을 정렬(리뷰 많은 순·평점 높은 순·가격순)과 "상품 더 보기"(10개씩)로 보여 준다. 타일과 BE 카테고리 코드의 대응은 `src/lib/catalog.ts`의 `HOME_CATEGORIES`(BE search-mcp 카테고리 표 기준)에 있다. 상품이 하나도 없는 카테고리는 BE가 `400 INVALID_PRODUCT_LIST`를 주므로 "상품 없음"으로 표시한다.
- **지금 인기 랭킹**은 카테고리별 `sort=popular`(무신사 리뷰 수 많은 순) 상위 5개다. BE에 카테고리 없는 전체 목록은 없어서 탭은 스킨케어·선케어·립·메이크업이다.
- **상품 카드**를 누르면 리뷰 패널이 열리고 리뷰 조회 API(`GET /api/v1/products/{id}/reviews`)로 정렬(최신·별점·좋아요)과 작성자 피부 타입(건성·지성·복합성·민감성) 필터, "리뷰 더 보기"(20개씩)를 제공한다. 리뷰 수는 수집해 둔 수(상품당 최대 300개)라 카드의 무신사 리뷰 수보다 적을 수 있다고 함께 안내한다. 피부 타입을 고르지 않은 리뷰는 "피부 타입 미선택"으로 표시한다.
- 평점은 BE `reviewScore`(0~100)를 별 5개 기준으로 바꿔 보여 준다(96 → 4.8). 상품 이미지는 수집하지 않아 자리만 표시한다.

마이페이지(`#my`)는 주문/배송 조회와 재입고 알림의 일부 화면만 시연한다. 현재 화면에서 완료한 체험 주문은 주문 목록 맨 위에 보이고, 새로고침하면 사라진다. 고정 예시 주문·배송·재입고 정보는 가상 데이터다. 예시 주문의 외부 링크는 무신사 뷰티 첫 화면으로 연결되며 해당 주문과 무관하다. 실제 주문 처리나 알림 발송을 뜻하지 않는다. 배송지 관리, 기획전, 로그인·회원가입은 Issue #10 범위에서 제외했다. 채팅의 피부 타입 선택·전달(`skinType`)은 BE 구현(11주차 초) 후 연결한다.

## 화면 데이터 출처

| 화면 | 데이터 출처 |
| --- | --- |
| 메인 카테고리 상품·랭킹·리뷰 | `VITE_USE_MOCK=false`에서 BE catalog-service의 상품 목록·리뷰 조회 API(수집한 무신사 데이터, 수집일 기준). 목업 모드에서는 `src/mocks/catalog.ts`의 가상 데이터이며 화면에 목업 안내를 띄운다 |
| 마이페이지 주문·배송·재입고 | 체험 주문은 현재 앱 상태의 `MockOrderReceipt`, 고정 예시 주문·재입고는 `src/components/MyPage.tsx`의 가상 시연 데이터. 실제 사용자 이력과 연결되지 않음 |
| AI 상담 상품 | 기본값은 `src/mocks/chat-response.example.json`, `VITE_USE_MOCK=false`에서 BE `/api/v1/chat` 응답 |

## 목업 ↔ 실제 API

| 설정 | 동작 |
| --- | --- |
| `VITE_USE_MOCK=true` (기본) | 채팅은 `src/mocks/chat-response.example.json`, 메인 상품·리뷰는 `src/mocks/catalog.ts`를 쓴다 |
| `VITE_USE_MOCK=false` | 실제 API를 호출한다. 개발 서버가 경로별로 넘긴다 (아래 표) |

| 경로 | 개발 서버가 넘기는 곳 (기본값) |
| --- | --- |
| `/api/v1/products…` (상품 목록·리뷰) | `CATALOG_SERVICE_URL` (`http://127.0.0.1:8081`) |
| `/api/v1/orders…` (주문 생성) | `ORDER_SERVICE_URL` (`http://127.0.0.1:8082`) |
| 그 밖의 `/api` (채팅) | `AGENT_SERVICE_URL` (`http://127.0.0.1:8000`) |

공통 기본값은 `.env.development`에 있다. 내 컴퓨터에서만 바꾸려면 `.env.development.local`을 만든다.

```bash
# .env.development.local
VITE_USE_MOCK=false
```

목업 모드에서는 주소 뒤에 `?mock=`을 붙여 상태 화면을 BE 없이 확인할 수 있다.

| 주소 | 상황 |
| --- | --- |
| `/#chat` | 목업 응답 그대로 (재고 있음·품절·확인 불가 각 1개) |
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
- **주문하기**는 목업 모드에서 유효한 옵션을 선택한 경우 주문 완료 화면으로 이동한다. 옵션 로딩·실패 상태를 표시하고, 주문 요청 중에는 중복 제출과 옵션·수량 변경을 막는다. 실패해도 선택값을 유지한다. 옵션 정보가 없거나 모든 옵션이 품절이면 비활성화한다. 실제 API 모드에서 목업 주문 완료를 만들지 않는다.
- BE `POST /api/v1/orders`의 요청·성공·오류 처리 코드는 준비돼 있다. 개발 프록시는 이 경로를 `ORDER_SERVICE_URL`(기본 `http://127.0.0.1:8082`)로 보낸다. 주문 요청은 15초만 기다리며, 시간 초과·연결 끊김·서버 오류에서는 처리 여부를 알 수 없어 자동 재주문하지 않는다. 실제 상품의 옵션 조회 계약이 정해질 때까지 주문 버튼과 이 호출은 연결하지 않는다. 연결할 때는 확인 화면 합계를 옵션 가격으로 계산하고 완료 화면에는 주문 응답의 가격을 표시해야 한다.
- Esc·바깥 영역·✕로 닫으면 누른 주문 버튼으로 포커스가 돌아간다. 다른 화면으로 이동하면 패널이 닫힌다. 패널이 열려 있는 동안 채팅 화면은 `inert`로 잠기고, Tab·Shift+Tab은 패널의 처음·끝 요소에서 순환한다.

## 주문 완료 화면 (목업)

와이어프레임 5d를 기준으로 주문 번호, 브랜드·상품·옵션·수량·상품 가격·합계·배송 예정일을 표시한다. 주문 번호는 `MOCK-YYYYMMDD-0001` 형태의 시연용 번호이며 실제 주문 번호가 아니다. HTTPS가 아닌 휴대폰의 LAN 접속에서도 생성된다. 선택 당시 값을 복사해 표시하고, 결제·서버 주문 접수·재고 차감·실제 배송은 수행하지 않는다. 완료 화면은 패널을 닫으면 사라지지만 체험 주문은 마이페이지에서 확인할 수 있다. 새로고침하면 체험 주문 내역도 사라진다.

옵션 정보가 없으면 옵션 정보와 주문 API가 준비된 뒤 주문할 수 있다는 이유를 표시한다. 주문 완료 내역 생성에 실패하면 오류 안내를 보여 준다.

확인 순서: `/?mock=stage1c` → 예시 질문 → 재고 있는 카드의 **주문** → **80ml**, 수량 **3개** → **주문하기**. 완료 화면의 옵션과 합계 **77,700원**, 배송일을 확인한다. **대화로 돌아가기**를 누르면 기존 채팅과 카드가 유지되고 주문 버튼으로 포커스가 돌아간다. 다시 주문하면 수량 1개부터 시작하고 새 목업 주문 번호가 생성된다.

실제 주문 API 연결은 Milestone 10주차 범위다. `MockOrderReceipt`는 화면 시연용 타입이며 향후 BE 주문 계약에 맞춰 별도로 연결해야 한다.

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run lint` | ESLint |
| `npm test` | 로컬 HTTP 요청·장애 응답·응답 구조, 배송일 표시, 주문 수량·옵션 규칙 회귀 테스트 (Node 24) |
| `npm run check:live-chat -- --question "검색어" --expect normal` | 실행 중인 실제 BE의 채팅 응답 점검 |
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

실제 BE가 준비되면 다음 명령으로 개발 프록시를 통과한 응답을 반복 확인할 수 있다. `--question`에는 **적재된 실제 상품이 검색되는 질문**을 넣는다. 기본 주소는 Vite 개발 서버 `http://localhost:5173`이며, 다른 주소라면 `--url`로 지정한다. 이 명령은 목업 설정과 무관하게 `/api`를 호출한다. 브라우저 화면을 확인할 때는 `VITE_USE_MOCK=false`로 실행한다.

```bash
npm run check:live-chat -- --question "수분크림" --expect normal
# order-service를 중지한 뒤 같은 질문
npm run check:live-chat -- --question "수분크림" --expect unknown
# order-service를 복구하고 catalog-service를 중지한 뒤
npm run check:live-chat -- --question "수분크림" --expect error
# 두 서비스를 복구한 뒤 다시 정상 응답 확인
npm run check:live-chat -- --question "수분크림" --expect normal
# 검색은 실행되지만 가격 조건에 맞는 결과가 없는 질문
npm run check:live-chat -- --question "수분크림 100원 이하" --expect empty
```

상품 종류나 효능 단어가 없는 질문은 BE가 catalog 검색 없이 빈 결과를 돌려줄 수 있으므로 검색 결과 0개 검증에는 쓰지 않는다. 위 예시는 실제 가격 데이터에 따라 조정한다. 이 명령은 HTTP 응답의 계약·상품 수·리뷰 근거·재고 상태·오류 본문을 확인한다. 서비스 중지·복구와 브라우저 카드·오류 화면 확인은 위 절차대로 별도 수행해야 한다. 현재 로컬에 BE가 실행되지 않으면 완료 조건을 통과한 것으로 기록하지 않는다.

`npm test`는 임시 로컬 HTTP 서버와 응답 fixture로 FE의 전송·오류 처리를 검증한다. 실제 BE 연동이나 브라우저 화면 검증을 대신하지 않는다. 개발 프록시는 `npm run dev`에서 적용되며, 배포 환경에서는 `/api`를 BE로 전달하는 별도 구성이 필요하다.

실제 응답의 상품에 리뷰 근거가 하나도 없으면 API 계약 위반으로 처리해 오류 화면을 보여 준다. 일부 카드만 조용히 제외하면 답변의 상품 수와 화면이 달라질 수 있기 때문이다.
`INVALID_RESPONSE`가 같은 질문에서 반복되면 재시도만 반복하지 말고 BE 로그와 응답의 리뷰 근거를 확인한다.

## 폴더 구조

```text
src/
  api/          # 서버 호출 (client.ts: 공통 fetch, chat.ts: /chat, catalog.ts: 상품 목록·리뷰, order.ts·createOrder.ts: 주문)
  components/   # ChatInput, ProductCard, Home, ReviewSheet, OrderSheet, MyPage
  lib/          # 표시 형식, 주문 규칙, 카테고리 코드·카탈로그 응답 검증, 패널 공통 동작(useDialog)
  types/        # API 계약 타입 (api.ts: 채팅, catalog.ts: 상품 목록·리뷰, order.ts: 주문)
  mocks/        # BE docs/mocks의 목업 응답, 상품·리뷰·주문 옵션 목업
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
