# customer-web

손님용 모바일 주문 PWA. QR 스캔 → 메뉴 → 장바구니 → 주문 제출까지의 손님 흐름을 담당.

## 실행

```bash
cd apps/customer-web
npm install
npm run dev
# http://localhost:3000
```

## 데모 진입 경로

루트(`/`)에서 데모 QR 토큰 링크 제공. QR 시뮬레이션은 다음 URL 직접 접속.

- `http://localhost:3000/t/tbl-001-token` → 1번 테이블
- `http://localhost:3000/t/tbl-002-token` → 2번 테이블
- `http://localhost:3000/t/tbl-vip-token` → VIP룸

## 주요 라우트

| 경로 | 설명 |
|---|---|
| `/` | 진입 안내 (세션 있으면 `/menu`로 자동 이동) |
| `/t/[tableToken]` | QR 진입 — 테이블 정보 조회 후 세션 저장 |
| `/menu` | 카테고리 탭 + 메뉴 리스트, 옵션 시트 |
| `/cart` | 장바구니, 요청사항, 주문 제출 |
| `/order/[orderId]` | 주문 완료 화면 |

## 폴더 구조

```
app/                  # Next.js App Router 페이지
components/           # UI 컴포넌트
lib/
├── api.ts            # Mock ↔ 실서버 스위칭 API 클라이언트
├── mockData.ts       # 메뉴/테이블 Mock 데이터
├── types.ts          # 도메인 타입
├── utils.ts          # 포맷터·헬퍼
└── store/
    ├── sessionStore.ts   # 테이블 세션 (sessionStorage 영속)
    └── cartStore.ts      # 장바구니 (sessionStorage 영속)
```

## Mock → 실 백엔드 전환

`.env.local`에:

```
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=https://api.example.com
```

백엔드 API 명세는 `lib/api.ts`의 함수 시그니처와 `lib/types.ts`의 DTO를 기준으로 구현.

## 모바일 최적화 적용 사항

- viewport `viewport-fit=cover` + safe-area inset 적용 (iOS notch)
- 입력 필드 16px → iOS 자동 줌 방지
- `overscroll-behavior-y: none` → pull-to-refresh 차단
- 터치 타겟 최소 44px (수량 버튼, 액션 버튼)
- 가로 스크롤 카테고리 탭 + 활성 탭 자동 스크롤
- 섹션 IntersectionObserver로 스크롤 위치에 따른 탭 자동 활성화
- 옵션 선택 바텀시트 (slide-up 애니메이션)
- 옵션 없는 메뉴는 클릭 즉시 1개 담기 (탭 1회로 주문)
- 품절 메뉴 시각적 비활성화 + 클릭 차단
- PWA manifest로 홈 화면 추가 지원
