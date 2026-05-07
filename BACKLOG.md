# 개발 백로그 (Backlog)

진행 중·완료·보류 작업을 한 파일에서 추적합니다. 항목이 늘어나면 GitHub Issues로 이관하세요.

---

## ✅ 완료 (Done)

- [x] **1단계** — 전체 시스템 아키텍처 설계
- [x] **2단계** — 데이터베이스 ERD·테이블 설계
- [x] **3단계** — 손님용 모바일 주문 화면 (`apps/customer-web`)
- [x] **4단계** — 홀직원용 POS 화면 (`apps/pos-web`)
- [x] **모노레포 통합 + 배포 설정** — Vercel·Railway 셋업
- [x] **6단계** — 관리자 화면 (`apps/admin-web`) ※ 5단계보다 먼저 진행
- [x] **백엔드 DB 셋업** — Prisma 5 + Railway PostgreSQL, 마이그레이션·시드 워크플로

## 🚧 진행 중 (In Progress)

- [ ] (없음)

---

## ⏸ 보류 (Deferred — 다음 진행)

### 5단계 — 영수증 프린터 연동 ⭐ 다음 작업

**위치**: `apps/print-agent` (매장 PC 상주 Node.js 데몬), `apps/api/src/modules/print`

**조건**
- ESC/POS 방식 열전사 프린터 기준 (`node-thermal-printer` 또는 `escpos` 라이브러리)
- 주문 접수 시(`order.created` 또는 `order.confirmed`) 주방 프린터 자동 출력
- 결제 완료 시(`payment.approved`) 홀 프린터 영수증 자동 출력

**출력 내용 (필수 필드)**
- 공통: 매장명, 출력 시각, 테이블 번호·이름, 주문번호
- 주방표: 주문 항목 + 수량 + 옵션 + 요청사항 (가격 X, 글자 크게)
- 영수증: 항목별 단가·수량·금액 + 소계·할인·총액 + 결제수단·승인번호 + 사업자정보

**프린터 설정 분리 (`apps/print-agent/config/printers.json`)**
```jsonc
{
  "kitchen": {
    "interface": "tcp://192.168.1.100:9100",   // 또는 "usb", "serial:/dev/ttyUSB0"
    "type": "epson",                            // epson | star | custom
    "characterSet": "KOREA",
    "width": 48                                 // 80mm 기준 컬럼 수
  },
  "hall": {
    "interface": "tcp://192.168.1.101:9100",
    "type": "epson",
    "characterSet": "KOREA",
    "width": 48
  }
}
```
- 환경별로 `.env`에서 `PRINT_CONFIG_PATH` 지정
- 프린터 교체 시 코드 수정 없이 JSON만 갱신
- 인쇄 실패는 `PrintJob` 테이블에 기록·재시도 큐 운용

**구현 순서**
1. `apps/api`에 `PrintJob` 모듈·DB 추가 → 이벤트 발생 시 큐에 enqueue
2. `apps/print-agent` 데몬 구현 — Socket.IO로 API 연결, 큐 폴링·실행
3. ESC/POS 템플릿 2종 (kitchen.ts / receipt.ts) 작성
4. 프린터 시뮬레이터 (콘솔 출력) 모드로 먼저 검증
5. 실제 프린터 연결 테스트

---

### 6단계 — 관리자 화면 ✅ 완료

`apps/admin-web` 구현 완료. 다음 항목은 향후 확장 예정:

- **옵션 그룹 관리 UI** — 현재 메뉴 폼에서 옵션 편집 미지원 (Mock 데이터에 옵션 포함). 별도 페이지 `/menus/options`로 분리 구현 필요
- **마감 처리** — `DailySales` 스냅샷 생성 화면 (`/sales/closing`) 추가 예정 (백엔드 API 의존)
- **권한 분리** — 현재 모든 화면 노출. JWT 도입 후 OWNER/MANAGER/SERVER 가드 적용
- **직원 계정 관리** (`/staff`) — OWNER 전용
- **매장 설정** (`/settings`) — 영업시간·사업자정보 등
- **메뉴 옵션 그룹·항목 CRUD** — 현재는 표시만, 편집 추가 필요
- **카테고리 드래그 정렬** — 현재는 ↑↓ 버튼

---

## 📌 참고

- 우선순위는 5단계 → 6단계 권장 (프린터 연동이 매장 운영 필수)
- 5·6단계 모두 백엔드 API(`apps/api`)에 의존 → 백엔드 NestJS 모듈도 함께 진행
- 진행 시 본 파일에서 해당 항목을 "완료"로 옮기고 PR 본문에 체크리스트 인용
