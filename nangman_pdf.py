"""
낭만포차 프로젝트 문서화 + 사업계획서 + 진행도 PDF 생성 스크립트
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# -- 한글 폰트 등록 ----------------------------------------------
# Noto Sans KR (korean subset, woff2->ttf 변환) — 완전한 한글 임베딩
import subprocess, glob, tempfile

def _prepare_fonts():
    """npm @fontsource/noto-sans-kr에서 한글 TTF 추출."""
    reg_out  = "/tmp/NotoSansKR-regular.ttf"
    bold_out = "/tmp/NotoSansKR-bold.ttf"
    if os.path.exists(reg_out) and os.path.getsize(reg_out) > 100_000:
        return reg_out, bold_out  # 이미 준비됨

    # npm 패키지 설치
    npm_dir = "/tmp/fontsource_install"
    os.makedirs(npm_dir, exist_ok=True)
    subprocess.run(
        ["npm", "install", "@fontsource/noto-sans-kr"],
        cwd=npm_dir, capture_output=True
    )

    base = os.path.join(npm_dir, "node_modules/@fontsource/noto-sans-kr/files")
    pairs = [
        (os.path.join(base, "noto-sans-kr-korean-400-normal.woff2"), reg_out),
        (os.path.join(base, "noto-sans-kr-korean-700-normal.woff2"), bold_out),
    ]
    from fontTools.ttLib import TTFont as FTFont
    for src, dst in pairs:
        if os.path.exists(src):
            f = FTFont(src)
            f.flavor = None
            f.save(dst)
    return reg_out, bold_out

_reg_path, _bold_path = _prepare_fonts()
pdfmetrics.registerFont(TTFont("NotoKR",   _reg_path))
pdfmetrics.registerFont(TTFont("NotoKR-B", _bold_path))
pdfmetrics.registerFontFamily("NotoKR", normal="NotoKR", bold="NotoKR-B")
FONT      = "NotoKR"
FONT_BOLD = "NotoKR-B"

# -- 색상 팔레트 -------------------------------------------------
PRIMARY    = colors.HexColor("#1A1A2E")
ACCENT     = colors.HexColor("#E94560")
ACCENT2    = colors.HexColor("#0F3460")
LIGHT_BG   = colors.HexColor("#F8F9FC")
BORDER     = colors.HexColor("#E0E3EA")
DONE_GREEN = colors.HexColor("#22C55E")
WAIT_AMBER = colors.HexColor("#F59E0B")
MUTED      = colors.HexColor("#6B7280")
WHITE      = colors.white
BLACK      = colors.black

W, H = A4

# -- 스타일 정의 -------------------------------------------------
def make_styles():
    def s(name, **kw):
        base_font = kw.pop("fontName", FONT)
        return ParagraphStyle(name, fontName=base_font, **kw)
    return {
        "cover_title": s("ct", fontName=FONT_BOLD, fontSize=32, leading=42,
                         textColor=WHITE, alignment=TA_CENTER),
        "cover_sub":   s("cs", fontSize=14, leading=22,
                         textColor=colors.HexColor("#CBD5E1"), alignment=TA_CENTER),
        "section":     s("sec", fontName=FONT_BOLD, fontSize=18, leading=26,
                         textColor=PRIMARY, spaceBefore=18, spaceAfter=6),
        "subsection":  s("sub", fontName=FONT_BOLD, fontSize=13, leading=20,
                         textColor=ACCENT2, spaceBefore=12, spaceAfter=4),
        "body":        s("body", fontSize=10, leading=17, textColor=colors.HexColor("#374151")),
        "body_small":  s("bs", fontSize=9, leading=15, textColor=MUTED),
        "bullet":      s("blt", fontSize=10, leading=17, leftIndent=14,
                         textColor=colors.HexColor("#374151")),
        "footer":      s("ft", fontSize=8, textColor=MUTED, alignment=TA_CENTER),
        "highlight":   s("hl", fontName=FONT_BOLD, fontSize=10, leading=17, textColor=ACCENT),
    }

ST = make_styles()

# -- 헬퍼 ---------------------------------------------------------
def hr(color=BORDER, thickness=0.8, space=6):
    return HRFlowable(width="100%", thickness=thickness, color=color,
                      spaceAfter=space, spaceBefore=space)

def section_header(text, number=None):
    label = f"{number}. {text}" if number else text
    return [
        Spacer(1, 4*mm),
        hr(ACCENT, 2, 4),
        Paragraph(label, ST["section"]),
        hr(BORDER, 0.5, 2),
    ]

def subsection(text):
    return Paragraph(f"> {text}", ST["subsection"])

def body(text):
    return Paragraph(text, ST["body"])

def bullet(items):
    return [Paragraph(f"- {i}", ST["bullet"]) for i in items]

def sp(h=4):
    return Spacer(1, h*mm)

def grid_table(data, col_widths, header_color=PRIMARY):
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), header_color),
        ("TEXTCOLOR",     (0,0), (-1,0), WHITE),
        ("FONTNAME",      (0,0), (-1,0), FONT_BOLD),
        ("FONTNAME",      (0,1), (-1,-1), FONT),
        ("FONTSIZE",      (0,0), (-1,-1), 9),
        ("GRID",          (0,0), (-1,-1), 0.5, BORDER),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, LIGHT_BG]),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 7),
    ]))
    return t

def kv_table(rows, col_widths=None):
    if col_widths is None:
        col_widths = [45*mm, 120*mm]
    data = [[Paragraph(f"<b>{k}</b>", ST["body"]), Paragraph(v, ST["body"])] for k,v in rows]
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (0,-1), LIGHT_BG),
        ("GRID",          (0,0), (-1,-1), 0.5, BORDER),
        ("FONTNAME",      (0,0), (-1,-1), FONT),
        ("FONTSIZE",      (0,0), (-1,-1), 10),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
    ]))
    return t


# -- 표지 ----------------------------------------------------------
def build_cover(story):
    cover_data = [[Paragraph("낭만포차", ST["cover_title"])]]
    cover_t = Table(cover_data, colWidths=[165*mm], rowHeights=[30*mm])
    cover_t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), PRIMARY),
        ("ALIGN",         (0,0), (-1,-1), "CENTER"),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    story.append(sp(18))
    story.append(cover_t)

    accent_bar = Table([[""]], colWidths=[165*mm], rowHeights=[3*mm])
    accent_bar.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1), ACCENT)]))
    story.append(accent_bar)
    story.append(sp(8))

    story.append(Paragraph("QR 기반 술집 모바일 오더 시스템", ParagraphStyle(
        "st2", fontName=FONT_BOLD, fontSize=16, leading=24,
        textColor=ACCENT2, alignment=TA_CENTER)))
    story.append(sp(2))
    story.append(Paragraph("프로젝트 문서화  ·  사업계획서  ·  개발 진행도", ParagraphStyle(
        "st3", fontName=FONT, fontSize=12, leading=20,
        textColor=MUTED, alignment=TA_CENTER)))

    story.append(sp(10))
    story.append(kv_table([
        ("문서 버전",    "v1.0"),
        ("작성일",       "2026년 5월 22일"),
        ("프로젝트명",   "nangman (낭만포차)"),
        ("레포지토리",   "github.com/…/nangman  [Private]"),
        ("배포 환경",    "Vercel (프론트) + Railway (API / PostgreSQL)"),
    ], [50*mm, 115*mm]))
    story.append(PageBreak())


# -- 목차 ----------------------------------------------------------
def build_toc(story):
    story += section_header("목차")
    toc = [
        ("1", "프로젝트 개요"),
        ("2", "시스템 아키텍처"),
        ("3", "기술 스택"),
        ("4", "데이터베이스 설계"),
        ("5", "주요 기능 상세"),
        ("6", "배포 현황"),
        ("7", "개발 진행도"),
        ("8", "향후 계획 (로드맵)"),
        ("9", "사업계획 요약"),
    ]
    toc_data = [[Paragraph(f"<b>{n}.</b>", ST["body"]),
                 Paragraph(t, ST["body"])] for n, t in toc]
    toc_t = Table(toc_data, colWidths=[12*mm, 153*mm])
    toc_t.setStyle(TableStyle([
        ("FONTNAME",      (0,0), (-1,-1), FONT),
        ("FONTSIZE",      (0,0), (-1,-1), 11),
        ("LEADING",       (0,0), (-1,-1), 20),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("LINEBELOW",     (0,0), (-1,-1), 0.3, BORDER),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ]))
    story.append(toc_t)
    story.append(PageBreak())


# -- 1. 프로젝트 개요 ----------------------------------------------
def build_overview(story):
    story += section_header("프로젝트 개요", 1)
    story.append(body(
        "낭만포차(Nangman Pocha)는 <b>QR코드 기반 모바일 주문 시스템</b>으로, "
        "포차·바·소규모 식음료 매장의 디지털 전환을 목적으로 개발된 풀스택 솔루션입니다. "
        "손님은 테이블 QR코드 스캔만으로 메뉴를 보고 주문할 수 있으며, "
        "홀직원은 POS 화면에서 실시간 주문을 수신·처리하고, "
        "관리자는 메뉴·테이블·매출 데이터를 웹에서 직접 관리합니다."
    ))
    story.append(sp(4))
    story.append(subsection("핵심 가치 제안"))
    story += bullet([
        "주문 오류 감소: 구두 주문 -> 디지털 주문으로 전환, 수기 실수 제로화",
        "인건비 절감: 주문 접수 자동화로 서빙 인원 효율화",
        "데이터 기반 운영: 일·월별 매출 분석, 인기 메뉴 파악",
        "빠른 도입: SaaS 방식, QR 출력만으로 즉시 운영 가능",
        "확장성: 멀티 스토어 지원 아키텍처, 프린터 연동 예정",
    ])
    story.append(sp(3))
    story.append(subsection("대상 고객"))
    story += bullet([
        "포차·이자카야·바·호프집 등 주류 중심 소규모 매장",
        "테이블 회전율이 높고 추가 주문 빈도가 많은 매장",
        "POS 기기 도입 비용이 부담되는 1~5인 운영 소상공인",
    ])
    story.append(PageBreak())


# -- 2. 시스템 아키텍처 --------------------------------------------
def build_architecture(story):
    story += section_header("시스템 아키텍처", 2)
    story.append(body(
        "낭만포차는 <b>Turborepo 기반 모노레포</b> 구조로, "
        "4개의 독립적인 앱과 2개의 공유 패키지로 구성됩니다. "
        "프론트엔드는 Vercel에, 백엔드와 DB는 Railway에 각각 독립 배포됩니다."
    ))
    story.append(sp(4))

    data = [
        ["구분", "앱/패키지", "역할", "상태"],
        ["앱", "customer-web", "손님 모바일 주문 (Next.js 14 PWA)", "[완료]"],
        ["앱", "pos-web",      "홀직원 POS (Vite + React)",         "[완료]"],
        ["앱", "admin-web",    "관리자 대시보드 (Vite + React)",     "[완료]"],
        ["앱", "api",          "백엔드 REST API (Node + Prisma)",    "[완료]"],
        ["앱", "print-agent",  "영수증 프린터 데몬 (Node.js)",       "[예정]"],
        ["패키지", "shared-types", "공통 도메인 타입 (TypeScript)", "[완료]"],
        ["패키지", "tsconfig",     "공유 TypeScript 설정",           "[완료]"],
    ]
    data_fmt = [[Paragraph(str(c), ST["body"]) if r > 0 else c
                 for c in row] for r, row in enumerate(data)]
    story.append(grid_table(data_fmt, [18*mm, 32*mm, 82*mm, 20*mm]))
    story.append(sp(4))

    story.append(subsection("데이터 흐름"))
    story += bullet([
        "손님: QR 스캔 -> customer-web -> REST API -> PostgreSQL",
        "POS: Socket.IO 구독 -> 실시간 주문 수신 -> 처리·결제",
        "프린터 (예정): print-agent가 PrintJob 큐 폴링 -> ESC/POS 출력",
        "관리자: admin-web -> REST API -> 메뉴·테이블·매출 CRUD",
    ])
    story.append(PageBreak())


# -- 3. 기술 스택 --------------------------------------------------
def build_tech_stack(story):
    story += section_header("기술 스택", 3)

    groups = [
        ("프론트엔드", [
            ("customer-web", "Next.js 14, TailwindCSS, Zustand, PWA"),
            ("pos-web",      "Vite 5, React 18, TailwindCSS, Zustand, Socket.IO"),
            ("admin-web",    "Vite 5, React 18, TailwindCSS, Recharts"),
            ("공통",         "TailwindCSS utility-first, 반응형 모바일 우선"),
        ]),
        ("백엔드", [
            ("런타임",    "Node.js 20 (NestJS 마이그레이션 예정)"),
            ("ORM / DB",  "Prisma 5 + PostgreSQL 16"),
            ("실시간",    "Socket.IO (예정)"),
            ("캐시",      "Redis (선택적)"),
            ("인증",      "JWT (도입 예정)"),
            ("결제",      "PortOne(아임포트) 또는 토스페이먼츠"),
        ]),
        ("인프라 / DevOps", [
            ("모노레포",   "pnpm 9 + Turborepo 2"),
            ("언어",       "TypeScript 5 (strict)"),
            ("프론트 배포","Vercel — customer-web, pos-web, admin-web"),
            ("백엔드 배포","Railway — api, PostgreSQL, Redis"),
            ("CI",         "GitHub Actions (lint + type-check on PR)"),
            ("로컬 환경",  "Docker Compose — PostgreSQL + Redis"),
        ]),
    ]

    for title, items in groups:
        story.append(subsection(title))
        story.append(kv_table(items, [40*mm, 125*mm]))
        story.append(sp(3))
    story.append(PageBreak())


# -- 4. 데이터베이스 설계 ------------------------------------------
def build_database(story):
    story += section_header("데이터베이스 설계", 4)
    story.append(body(
        "PostgreSQL 16 기반, Prisma 5 ORM으로 관리합니다. "
        "모든 모델은 cuid() PK를 사용하며 snake_case 컬럼명을 camelCase로 매핑합니다."
    ))
    story.append(sp(3))

    model_data = [
        ["모델",            "역할",           "주요 필드"],
        ["Store",           "매장 마스터",     "name, businessNumber, phone, address"],
        ["Staff",           "직원 계정",       "email, passwordHash, role(OWNER/MANAGER/SERVER)"],
        ["RestaurantTable", "테이블",          "tableNumber, qrToken(unique), capacity, status"],
        ["MenuCategory",    "메뉴 카테고리",   "name, displayOrder, isActive"],
        ["Menu",            "메뉴 항목",       "name, price, description, imageUrl, isSoldOut"],
        ["MenuOption",      "옵션 그룹",       "name, isRequired, maxSelect"],
        ["MenuOptionItem",  "옵션 선택지",     "name, additionalPrice"],
        ["Order",           "주문",           "status, type(CUSTOMER_MOBILE/POS), totalAmount"],
        ["OrderItem",       "주문 항목",       "quantity, unitPrice, status, selectedOptions"],
        ["Payment",         "결제",           "method, status, amount, approvalNumber"],
        ["PrintJob",        "프린트 큐",       "type(KITCHEN/HALL), status, payload"],
        ["DailySales",      "일별 매출",       "date, totalRevenue, orderCount, closedBy"],
    ]
    fmt = [[Paragraph(str(c), ST["body"]) if r > 0 else c
            for c in row] for r, row in enumerate(model_data)]
    story.append(grid_table(fmt, [38*mm, 35*mm, 92*mm], ACCENT2))
    story.append(sp(4))

    story.append(subsection("열거형 (Enum)"))
    story += bullet([
        "StaffRole: OWNER | MANAGER | SERVER",
        "TableStatus: AVAILABLE | OCCUPIED | RESERVED",
        "OrderStatus: PENDING | CONFIRMED | PREPARING | SERVED | COMPLETED | CANCELLED",
        "PaymentMethod: CARD | CASH | KAKAO | NAVER | TOSS",
        "PaymentStatus: PENDING | PAID | FAILED | REFUNDED | PARTIAL_REFUNDED",
        "PrintJobStatus: QUEUED | PRINTED | FAILED",
    ])
    story.append(PageBreak())


# -- 5. 주요 기능 상세 ---------------------------------------------
def build_features(story):
    story += section_header("주요 기능 상세", 5)

    apps = [
        ("손님 모바일 (customer-web)", [
            "QR 토큰 진입 — /t/[tableToken] 라우트로 테이블 자동 인식",
            "메뉴 카테고리 탭 필터링 + 품절 메뉴 비활성화 표시",
            "메뉴 상세 바텀시트 — 옵션 선택, 수량 조절, 요청사항 입력",
            "장바구니 플로팅 버튼 + 장바구니 화면",
            "주문 제출 -> 주문 완료 확인 화면 (/order/[orderId])",
            "PWA 지원 — 홈 화면 추가 가능, 오프라인 스플래시",
        ]),
        ("홀직원 POS (pos-web)", [
            "테이블 그리드 뷰 — 상태별 색상(빈 자리 / 착석 / 예약) 표시",
            "실시간 주문 수신 — Socket.IO 연결, 신규 주문 토스트 알림",
            "주문 패널 — 테이블별 주문 내역, 항목 확인 / 취소",
            "직접 주문 입력 — 메뉴 피커 다이얼로그로 POS 주문 추가",
            "결제 다이얼로그 — 결제 수단 선택, 할인 적용, 테이블 초기화",
            "합산 금액 실시간 갱신",
        ]),
        ("관리자 (admin-web)", [
            "대시보드 — 오늘 매출, 주문 수, 테이블 현황 통계 카드",
            "메뉴 관리 — 카테고리 CRUD, 메뉴 CRUD, 품절 토글",
            "테이블·QR 관리 — 테이블 추가/수정, QR코드 생성·인쇄",
            "일별 매출 — 날짜별 목록, 결제 수단 분포",
            "월별 매출 — Recharts 라인 차트, 월간 합산",
            "모바일 하단 내비게이션 + PC 사이드바 반응형 레이아웃",
        ]),
        ("백엔드 API (api)", [
            "RESTful API — Store, Menu, Table, Order, Payment, DailySales",
            "Prisma 5 + Railway PostgreSQL — 마이그레이션 자동 배포",
            "시드 데이터 — 샘플 매장·카테고리·메뉴·테이블·QR토큰",
            "헬스체크 — GET /health -> {status:'ok', db:'ok'}",
            "환경 분리 — NEXT_PUBLIC_USE_MOCK / VITE_USE_MOCK 플래그",
        ]),
    ]

    for title, items in apps:
        story.append(KeepTogether([
            subsection(title),
            *bullet(items),
            sp(3),
        ]))
    story.append(PageBreak())


# -- 6. 배포 현황 --------------------------------------------------
def build_deployment(story):
    story += section_header("배포 현황", 6)
    story.append(body("프론트 3개 앱은 Vercel에, 백엔드 API + PostgreSQL은 Railway에 배포·운영 중입니다."))
    story.append(sp(3))

    data = [
        ["앱",           "플랫폼",  "URL / 도메인",                          "상태"],
        ["customer-web", "Vercel",  "nangman-customer-web.vercel.app",       "[운영중]"],
        ["pos-web",      "Vercel",  "nangman-pos-web-o3p6.vercel.app",       "[운영중]"],
        ["admin-web",    "Vercel",  "nangman-admin-web.vercel.app",          "[운영중]"],
        ["api",          "Railway", "nangman-production.up.railway.app",     "[운영중]"],
        ["PostgreSQL",   "Railway", "Railway 내부 네트워크",                  "[운영중]"],
        ["print-agent",  "매장 PC", "클라우드 미배포 — 로컬 데몬",            "[미구현]"],
    ]
    fmt = [[Paragraph(str(c), ST["body"]) if r > 0 else c
            for c in row] for r, row in enumerate(data)]
    story.append(grid_table(fmt, [30*mm, 22*mm, 83*mm, 20*mm]))
    story.append(sp(4))

    story.append(subsection("CI/CD 파이프라인"))
    story += bullet([
        "GitHub PR -> GitHub Actions lint + type-check 자동 실행",
        "main 브랜치 푸시 -> Vercel 자동 배포 (turbo-ignore로 변경 앱만 재배포)",
        "main 브랜치 푸시 -> Railway 자동 빌드 + prisma migrate deploy",
    ])
    story.append(sp(3))

    story.append(subsection("검증된 API 엔드포인트"))
    story += bullet([
        "GET /health -> {\"status\":\"ok\",\"db\":\"ok\"}",
        "GET /stores/store-001/menu -> 카테고리 + 메뉴 JSON 반환 정상 확인",
    ])
    story.append(PageBreak())


# -- 7. 개발 진행도 ------------------------------------------------
def build_progress(story):
    story += section_header("개발 진행도", 7)

    # 완료
    story.append(Paragraph("[완료]된 작업", ParagraphStyle(
        "dh", fontName=FONT_BOLD, fontSize=11, textColor=DONE_GREEN, spaceAfter=4)))
    done = [
        ["단계",      "항목",                       "완료 내용"],
        ["1단계",     "시스템 아키텍처 설계",         "모노레포 구조, 앱 분리, 기술 스택 확정"],
        ["2단계",     "DB ERD 설계",                  "13개 모델, Enum 6종, Prisma 스키마 완성"],
        ["3단계",     "손님 모바일 (customer-web)",   "QR 진입, 메뉴 탭, 장바구니, 주문 제출 전체 플로우"],
        ["4단계",     "홀직원 POS (pos-web)",         "테이블 그리드, 실시간 주문 수신, 결제 처리"],
        ["모노레포",  "통합 + 배포 설정",             "Vercel·Railway 셋업, turbo 빌드, CI 구성"],
        ["6단계",     "관리자 (admin-web)",           "대시보드, 메뉴·테이블 관리, 매출 조회, QR 인쇄"],
        ["백엔드",    "DB 셋업 + 운영 배포",          "Prisma + Railway PostgreSQL, 마이그레이션·시드"],
    ]
    fmt = [[Paragraph(str(c), ST["body_small"]) if r > 0 else c
            for c in row] for r, row in enumerate(done)]
    t = Table(fmt, colWidths=[20*mm, 42*mm, 103*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), DONE_GREEN),
        ("TEXTCOLOR",     (0,0), (-1,0), WHITE),
        ("FONTNAME",      (0,0), (-1,0), FONT_BOLD),
        ("FONTNAME",      (0,1), (-1,-1), FONT),
        ("FONTSIZE",      (0,0), (-1,-1), 9),
        ("GRID",          (0,0), (-1,-1), 0.5, BORDER),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, LIGHT_BG]),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
        ("TOPPADDING",    (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING",   (0,0), (-1,-1), 6),
    ]))
    story.append(t)
    story.append(sp(5))

    # 보류
    story.append(Paragraph("[보류] 다음 작업", ParagraphStyle(
        "wh", fontName=FONT_BOLD, fontSize=11, textColor=WAIT_AMBER, spaceAfter=4)))
    wait = [
        ["단계",   "항목",                   "내용"],
        ["5단계",  "영수증 프린터 연동 *",   "ESC/POS print-agent 데몬, PrintJob 큐 — 최우선"],
        ["6단계+", "관리자 기능 확장",        "옵션 그룹 UI, 마감 처리, JWT 권한 분리, 직원·매장 설정"],
        ["전체",   "Socket.IO 전면 도입",     "실시간 주문 상태 동기화 고도화"],
        ["API",    "NestJS 마이그레이션",     "순수 Node http -> NestJS 모듈 구조"],
        ["결제",   "PG사 실결제 연동",        "PortOne(아임포트) 또는 토스페이먼츠"],
    ]
    fmt2 = [[Paragraph(str(c), ST["body_small"]) if r > 0 else c
             for c in row] for r, row in enumerate(wait)]
    t2 = Table(fmt2, colWidths=[20*mm, 42*mm, 103*mm])
    t2.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), WAIT_AMBER),
        ("TEXTCOLOR",     (0,0), (-1,0), WHITE),
        ("FONTNAME",      (0,0), (-1,0), FONT_BOLD),
        ("FONTNAME",      (0,1), (-1,-1), FONT),
        ("FONTSIZE",      (0,0), (-1,-1), 9),
        ("GRID",          (0,0), (-1,-1), 0.5, BORDER),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, LIGHT_BG]),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
        ("TOPPADDING",    (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING",   (0,0), (-1,-1), 6),
    ]))
    story.append(t2)
    story.append(sp(5))

    # 진행률 바
    story.append(subsection("전체 완성도 — 약 58% (7 / 12 단계 완료)"))
    filled = 165 * 0.58
    bar = Table([["", ""]], colWidths=[filled*mm, (165-filled)*mm], rowHeights=[8*mm])
    bar.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (0,0), DONE_GREEN),
        ("BACKGROUND", (1,0), (1,0), BORDER),
    ]))
    story.append(bar)
    story.append(Paragraph("58% 완료", ParagraphStyle(
        "pct", fontName=FONT_BOLD, fontSize=10, textColor=DONE_GREEN, spaceBefore=3)))
    story.append(PageBreak())


# -- 8. 향후 계획 --------------------------------------------------
def build_roadmap(story):
    story += section_header("향후 계획 (로드맵)", 8)

    phases = [
        ("Phase 1 — 프린터 연동 (5단계, 최우선)", [
            "apps/print-agent 데몬 구현 (Socket.IO + 큐 폴링)",
            "ESC/POS 템플릿 2종: kitchen.ts (주방표) / receipt.ts (영수증)",
            "PrintJob 모듈·DB 추가 -> order.created / payment.approved 이벤트 enqueue",
            "프린터 시뮬레이터(콘솔 출력) 모드 선검증 후 실기기 테스트",
            "printers.json 기반 교체 가능한 프린터 설정 구조",
        ]),
        ("Phase 2 — 관리자 기능 확장", [
            "메뉴 옵션 그룹·항목 CRUD UI (/menus/options)",
            "마감 처리 화면 — DailySales 스냅샷 생성 (/sales/closing)",
            "JWT 도입 + OWNER/MANAGER/SERVER 권한 가드",
            "직원 계정 관리 (/staff), 매장 설정 (/settings)",
            "카테고리 드래그 정렬 (현재 ↑↓ 버튼)",
        ]),
        ("Phase 3 — 실시간 고도화 + 결제 연동", [
            "Socket.IO 전면 도입 — 주문 상태 실시간 동기화",
            "PG사 실결제 연동 (PortOne 또는 토스페이먼츠)",
            "NestJS 마이그레이션으로 구조화된 백엔드",
            "Redis 캐시 본격 활용",
        ]),
        ("Phase 4 — SaaS 확장", [
            "멀티 스토어 지원 — 스토어 생성·구독 플로우",
            "요금제 도입 (Freemium / Pro / Business)",
            "Analytics 대시보드 고도화",
            "PWA -> 네이티브 래퍼 (Capacitor 등) 검토",
        ]),
    ]

    for title, items in phases:
        story.append(KeepTogether([
            subsection(title),
            *bullet(items),
            sp(3),
        ]))
    story.append(PageBreak())


# -- 9. 사업계획 요약 ----------------------------------------------
def build_business_plan(story):
    story += section_header("사업계획 요약", 9)

    story.append(subsection("시장 기회"))
    story.append(body(
        "국내 소규모 식음료 매장은 약 70만 개 이상이며, 그 중 포차·주점류는 약 15만 개로 추산됩니다. "
        "기존 POS 솔루션의 초기 도입비(50~200만원) + 월정액(3~10만원)은 소상공인에게 높은 장벽이며, "
        "QR 주문 특화 제품도 포차·주류 매장에 최적화된 사례가 드뭅니다."
    ))
    story.append(sp(3))

    story.append(subsection("수익 모델"))
    biz = [
        ["요금제",    "월 정액",    "포함 기능"],
        ["Starter",  "무료",       "1개 매장, 테이블 5개, 기본 통계"],
        ["Pro",      "29,000원",   "테이블 무제한, 프린터 연동, 고급 통계"],
        ["Business", "79,000원",   "멀티 스토어 3개, 전 기능, 전용 지원"],
    ]
    fmt = [[Paragraph(str(c), ST["body"]) if r > 0 else c
            for c in row] for r, row in enumerate(biz)]
    t = Table(fmt, colWidths=[28*mm, 28*mm, 109*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), ACCENT),
        ("TEXTCOLOR",     (0,0), (-1,0), WHITE),
        ("FONTNAME",      (0,0), (-1,0), FONT_BOLD),
        ("FONTNAME",      (0,1), (-1,-1), FONT),
        ("FONTSIZE",      (0,0), (-1,-1), 10),
        ("GRID",          (0,0), (-1,-1), 0.5, BORDER),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, LIGHT_BG]),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    story.append(sp(4))

    story.append(subsection("목표 KPI (12개월)"))
    kpi = [
        ["지표",              "3개월",     "6개월",      "12개월"],
        ["가입 매장 수",      "50개",      "200개",      "1,000개"],
        ["유료 전환율",       "10%",       "15%",        "20%"],
        ["MRR (월 반복매출)", "15만원",    "90만원",     "580만원"],
        ["일 평균 주문 수",   "500건",     "3,000건",    "20,000건"],
    ]
    fmt2 = [[Paragraph(str(c), ST["body"]) if r > 0 else c
             for c in row] for r, row in enumerate(kpi)]
    t2 = Table(fmt2, colWidths=[48*mm, 30*mm, 30*mm, 30*mm])
    t2.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), ACCENT2),
        ("TEXTCOLOR",     (0,0), (-1,0), WHITE),
        ("FONTNAME",      (0,0), (-1,0), FONT_BOLD),
        ("FONTNAME",      (0,1), (-1,-1), FONT),
        ("FONTSIZE",      (0,0), (-1,-1), 10),
        ("GRID",          (0,0), (-1,-1), 0.5, BORDER),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, LIGHT_BG]),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("ALIGN",         (1,0), (-1,-1), "CENTER"),
    ]))
    story.append(t2)
    story.append(sp(4))

    story.append(subsection("경쟁 우위"))
    story += bullet([
        "포차·주류 특화: 술집 메뉴 구조(소주·맥주·안주) + 추가 주문 특화 UX",
        "저비용 도입: 하드웨어 불필요, QR 출력만으로 당일 운영 시작",
        "빠른 개발 사이클: 모노레포 + CI/CD로 기능 추가·배포 속도 우위",
        "오픈소스 스택: 벤더 종속 없이 유연한 확장",
    ])
    story.append(sp(4))

    story.append(subsection("운영 비용 추산 (월)"))
    cost = [
        ["항목",           "비용",          "비고"],
        ["Vercel Pro",     "$20/월",        "커머셜 사용 시 (Hobby 무료)"],
        ["Railway",        "$5~20/월",      "API + PostgreSQL + Redis"],
        ["도메인",         "약 1,000원/월", "연간 약 12,000원"],
        ["합계",           "약 4~5만원/월", "초기 운영 기준"],
    ]
    fmt3 = [[Paragraph(str(c), ST["body"]) if r > 0 else c
             for c in row] for r, row in enumerate(cost)]
    t3 = Table(fmt3, colWidths=[45*mm, 38*mm, 82*mm])
    t3.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), colors.HexColor("#374151")),
        ("TEXTCOLOR",     (0,0), (-1,0), WHITE),
        ("FONTNAME",      (0,0), (-1,0), FONT_BOLD),
        ("FONTNAME",      (0,1), (-1,-1), FONT),
        ("FONTSIZE",      (0,0), (-1,-1), 10),
        ("GRID",          (0,0), (-1,-1), 0.5, BORDER),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, LIGHT_BG]),
        ("FONTNAME",      (0,-1), (-1,-1), FONT_BOLD),
        ("BACKGROUND",    (0,-1), (-1,-1), colors.HexColor("#FEF3C7")),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
    ]))
    story.append(t3)


# -- 메인 --------------------------------
def main():
    out_path = "/sessions/elegant-awesome-wright/mnt/nangman/낭만포차_프로젝트문서.pdf"

    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=18*mm, bottomMargin=20*mm,
        title="낭만포차 프로젝트 문서",
        author="nangman team",
        subject="프로젝트 문서화·사업계획서·개발 진행도",
    )

    story = []
    build_cover(story)
    build_toc(story)
    build_overview(story)
    build_architecture(story)
    build_tech_stack(story)
    build_database(story)
    build_features(story)
    build_deployment(story)
    build_progress(story)
    build_roadmap(story)
    build_business_plan(story)

    doc.build(story)
    print("PDF generated: " + out_path)

if __name__ == "__main__":
    main()
