# pos-web

홀직원용 POS (Point of Sale) 화면. 태블릿(가로 1024px+) 우선, PC도 지원.

## 실행

```bash
cd apps/pos-web
npm install
npm run dev
# http://localhost:3001
```

## 화면 구성

```
┌──────────────────────────────────────────────────────────────┐
│ Header: 매장명 | 점유/미확인 카운트 | 시계 | 새로고침 | 직원 │
├──────────────────────┬───────────────────────────────────────┤
│ 테이블 그리드 (320px) │ 선택된 테이블 상세 (가변)              │
│                      │  - 테이블명 / 점유시간 / 합계 요약      │
│ ┌─────┐ ┌─────┐      │  - 액션: + 추가주문 / 결제 / 퇴석       │
│ │ 1번  │ │ 2번  │     │                                       │
│ │ ●    │ │ 신규3│     │  주문 카드 (회차별)                     │
│ │ 23k  │ │ 67k  │     │   #20260504-001 [확인됨] [손님] 19:45  │
│ └─────┘ └─────┘      │     ✓ 참이슬 × 2     10,000원          │
│ ...                  │     ✓ 계란말이 × 1    9,000원          │
│                      │   소계               19,000원          │
└──────────────────────┴───────────────────────────────────────┘
```

## 요구사항 매핑

| 요구사항 | 구현 |
|---|---|
| 테이블별 현황 한눈에 보기 | `TableGrid` + `TableCard` (상태색·점유시간·합계·미확인 배지) |
| 실시간 신규 주문 알림 | `subscribeRealtime()` Mock 폴링 → `ToastHost` 알림 + 테이블 카드 깜빡임 |
| 주문 확인 | PENDING 주문에 [확인] 버튼, 클릭 시 CONFIRMED 전환 |
| 주문 취소 | 결제완료/취소가 아닌 주문에 [취소] 버튼 + 확인 다이얼로그 |
| 추가 주문 직접 입력 | `MenuPickerDialog` (카테고리탭 + 메뉴그리드 + 임시카트 + 옵션시트) |
| 테이블 합산 금액 | 헤더 SummaryStat + 각 주문 카드 소계 |
| 결제 처리 | `PaymentDialog` (카드/현금/카카오/네이버/토스) → 주문 COMPLETED 전환 |
| 테이블 초기화 | [퇴석 처리] → 주문 정리 + 테이블 AVAILABLE 복귀 |

## Mock → 실 백엔드 전환

`.env.local`:
```
VITE_USE_MOCK=false
VITE_API_URL=https://api.example.com
```

`src/lib/socket.ts`의 `subscribeRealtime()`을 Socket.IO로 교체:
```ts
// 예시
import { io } from 'socket.io-client';
const socket = io(API_URL, { auth: { token } });
socket.on('order.created', (payload) => emit({ type: 'order.created', ...payload }));
```

## 폴더 구조

```
src/
├── App.tsx                 # 메인 레이아웃 + 실시간 구독
├── main.tsx
├── index.css
├── components/
│   ├── Header.tsx          # 상단 바
│   ├── TableGrid.tsx       # 좌측 테이블 그리드
│   ├── TableCard.tsx       # 테이블 1개 카드
│   ├── OrderPanel.tsx      # 우측 주문 패널 + 액션
│   ├── OrderItemRow.tsx    # 주문 항목 행
│   ├── MenuPickerDialog.tsx# 추가 주문 입력
│   ├── PaymentDialog.tsx   # 결제 처리
│   ├── ConfirmDialog.tsx   # 범용 확인
│   └── ToastHost.tsx       # 우상단 토스트
└── lib/
    ├── api.ts              # Mock ↔ 실서버 API
    ├── socket.ts           # 실시간 구독 (Mock 폴링)
    ├── mockData.ts         # 시연용 시드 데이터
    ├── types.ts
    ├── utils.ts
    └── store/
        ├── tablesStore.ts          # 테이블·주문·메뉴 통합
        └── notificationStore.ts    # 토스트
```

## 시연 시나리오

1. 첫 진입 시 `tbl-005`(신규 주문 보유)가 자동 선택됨
2. PENDING 주문의 [확인] 버튼 클릭 → CONFIRMED 전환
3. [+ 추가 주문] → 메뉴 클릭 → 임시카트 → 주문 추가
4. [결제하기] → 수단 선택 → 처리 → [퇴석 처리] 안내
5. 25초마다 빈 테이블에 신규 주문 발생 → 우상단 토스트
