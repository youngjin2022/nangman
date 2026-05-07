# admin-web

관리자용 웹 - 메뉴·카테고리·테이블·QR·매출 관리. React + Vite, 데스크톱 우선.

## 실행

```bash
cd apps/admin-web
pnpm install   # 또는 루트에서 pnpm install
pnpm dev
# http://localhost:3002
```

## 라우트

| 경로 | 설명 |
|---|---|
| `/dashboard` | 오늘의 매출·메뉴·테이블 요약 |
| `/menus` | 메뉴 CRUD + 카테고리 매니저 + 품절 토글 |
| `/tables` | 테이블 CRUD + QR 발급/재발급 |
| `/tables/qr-print` | A4 일괄 QR 인쇄 (브라우저 인쇄 → PDF) |
| `/sales/daily` | 일별 매출 (시간대별 차트 + 결제수단 + 베스트셀러) |
| `/sales/monthly` | 월별 매출 (일자별 추이 + 결제수단 + 베스트셀러) |

## 요구사항 매핑

| 요구사항 | 구현 |
|---|---|
| 메뉴 추가·수정·삭제 | `MenusPage` + `MenuFormModal` (이름·설명·가격·카테고리·품절) |
| 카테고리 관리 | `CategoryManager` (추가·이름수정·순서이동·삭제, 메뉴 보유 시 삭제 차단) |
| 품절 토글 | 테이블 행에서 즉시 토글, 낙관적 업데이트 |
| 일별 매출 조회 | `DailySalesPage` (Recharts BarChart + Pie + 베스트셀러 TOP5) |
| 월별 매출 조회 | `MonthlySalesPage` (Recharts LineChart + Pie + 베스트셀러) |
| 테이블별 QR 생성 | `TablesPage`에서 카드별 QR 즉시 렌더 (`qrcode` 라이브러리) |
| QR 출력 | `QrPrintPage` (A4 2×4 또는 4×4, `window.print()` → PDF 저장) |

## QR PDF 출력

별도 PDF 라이브러리를 쓰지 않고 브라우저 인쇄(Ctrl/Cmd+P)로 처리합니다.

- `@media print` CSS로 A4 사이즈 페이지 자동 분할
- 인쇄 미리보기에서 "PDF로 저장" 선택
- 여백·배율 기본값 권장 안내 노출

## 데이터

현재 Mock. `.env.local`로 실 백엔드 전환:

```
VITE_USE_MOCK=false
VITE_API_URL=https://api.example.com
VITE_CUSTOMER_BASE_URL=https://order.example.com
```

매출 데이터는 시드 기반 결정적 난수로 생성되어 동일 날짜는 항상 같은 값이 나옵니다(시연용).

## 폴더 구조

```
src/
├── App.tsx                # 라우팅 + 사이드바 셸
├── main.tsx
├── index.css              # 인쇄용 @media print 포함
├── components/
│   ├── Sidebar.tsx
│   ├── PageHeader.tsx
│   ├── Modal.tsx
│   ├── ConfirmDialog.tsx
│   ├── FormField.tsx
│   ├── StatCard.tsx
│   ├── QrCodeImg.tsx       # qrcode 라이브러리 래퍼
│   └── ToastHost.tsx
├── pages/
│   ├── dashboard/DashboardPage.tsx
│   ├── menus/
│   │   ├── MenusPage.tsx
│   │   ├── MenuFormModal.tsx
│   │   └── CategoryManager.tsx
│   ├── tables/
│   │   ├── TablesPage.tsx
│   │   ├── TableFormModal.tsx
│   │   └── QrPrintPage.tsx
│   └── sales/
│       ├── DailySalesPage.tsx
│       └── MonthlySalesPage.tsx
└── lib/
    ├── api.ts
    ├── mockData.ts
    ├── types.ts
    ├── utils.ts
    └── store/
        ├── menusStore.ts
        ├── tablesStore.ts
        └── notificationStore.ts
```

## 배포 (Vercel)

`vercel.json` 동봉. Vercel 프로젝트 생성 시 Root Directory를 `apps/admin-web`로 지정.

자세한 절차는 루트 [DEPLOYMENT.md](../../DEPLOYMENT.md) 참고.
