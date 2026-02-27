# MFDS 항암제 승인현황 대시보드

> 식품의약품안전처(MFDS) 항암제 허가 현황을 시각화하는 대시보드 애플리케이션

## 프로젝트 소개

식품의약품안전처의 항암제 허가 데이터를 시각적으로 분석하고 관리할 수 있는 웹 대시보드입니다.
공공데이터포털(data.go.kr) API와 MFDS 의약품안전나라(nedrug.mfds.go.kr) 데이터를 활용합니다.

### 주요 기능

- **데이터 시각화**: 암종별, 업체별, 허가유형별, 월별 추이 차트
- **다중 필터링**: 날짜 범위, 암종, 제조/수입 구분, 업체, 허가유형, 작용기전
- **Excel 업로드**: 외부 Excel 파일 업로드 및 자동 분류
- **Excel 다운로드**: 스타일이 적용된 전문적인 보고서 내보내기 (요약 + 상세목록 2개 시트)
- **MFDS 연동**: 품목기준코드 클릭 시 공식 상세 페이지 연결
- **이메일 발송**: 승인현황 요약 이메일 발송 (Gmail SMTP, Excel 첨부)
- **관리자 패널**: 이메일 발송 등 관리 기능

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui |
| Charts | Recharts |
| 상태 관리 | TanStack Query (React Query) |
| Excel 처리 | xlsx, xlsx-js-style |
| Backend | Supabase Edge Functions |

---

## 설치 및 실행

### 사전 요구 사항

- Node.js 18.x 이상
- npm 패키지 매니저

### 로컬 개발 환경 설정

```bash
# 1. 저장소 클론
git clone https://github.com/Lucy1315/mfds-cancer-2026.git

# 2. 프로젝트 디렉토리 이동
cd mfds-cancer-2026

# 3. 의존성 설치
npm install

# 4. 환경 변수 설정
cp .env.example .env
# .env 파일에 Supabase 및 Gmail SMTP 정보 입력

# 5. 개발 서버 실행
npm run dev
```

개발 서버가 시작되면 `http://localhost:5173`에서 앱에 접근할 수 있습니다.

### 환경 변수

```env
VITE_SUPABASE_PROJECT_ID=<Supabase 프로젝트 ID>
VITE_SUPABASE_PUBLISHABLE_KEY=<Supabase anon key>
VITE_SUPABASE_URL=<Supabase URL>

# 이메일 발송용 (선택)
GMAIL_USER=<Gmail 주소>
GMAIL_APP_PASSWORD=<Gmail 앱 비밀번호>
```

---

## 프로젝트 구조

```
src/
├── components/              # React 컴포넌트
│   ├── AdminPanel.tsx           # 관리자 패널
│   ├── ApprovalChart.tsx        # 차트 컴포넌트
│   ├── ChartGrid.tsx            # 차트 그리드
│   ├── DataTable.tsx            # 데이터 테이블
│   ├── EmailTab.tsx             # 이메일 발송 탭
│   ├── FilterPanel.tsx          # 필터 패널
│   └── ui/                      # shadcn/ui 컴포넌트
├── data/                    # 데이터 정의
│   ├── drugData.ts              # 타입 & 암종 목록
│   └── recentApprovals.ts       # 정적 데이터
├── hooks/                   # 커스텀 훅
│   └── useDrugData.ts           # 데이터 관리
├── pages/                   # 페이지 컴포넌트
│   └── Index.tsx                # 메인 대시보드
└── utils/                   # 유틸리티 함수
    ├── emailDataGenerator.ts    # 이메일 HTML/통계 생성
    ├── excelExport.ts           # Excel 내보내기
    └── excelParser.ts           # Excel 파싱

supabase/functions/
├── fetch-drug-data/         # 공공데이터 API 중계
└── send-approval-email/     # Gmail SMTP 발송

scripts/
└── send-test-email.cjs      # 로컬 이메일 발송 스크립트
```

---

## 사용 방법

### 데이터 조회
- 필터 패널에서 날짜 범위, 암종, 제조/수입 구분 등을 선택하여 필터링

### Excel 업로드
1. 필터 패널의 **"Excel 업로드"** 버튼 클릭
2. MFDS 형식의 Excel 파일 선택
3. 자동으로 데이터가 파싱되어 대시보드에 반영

### Excel 다운로드
- **"전체 다운로드"**: 현재 필터링된 전체 데이터 내보내기
- **테이블 내 다운로드**: 테이블에 표시된 데이터만 내보내기

### 이메일 발송
- 관리자 패널에서 수신자 설정 후 승인현황 요약 이메일 발송 (Excel 첨부 가능)

---

## 개발 명령어

```bash
npm run dev        # 개발 서버 실행
npm run build      # 프로덕션 빌드
npm run preview    # 빌드 미리보기
npm run lint       # ESLint 검사
npm run test       # 테스트 실행
```

---

## 데이터 출처

본 데이터는 [식품의약품안전처](https://mfds.go.kr) 공개자료([공공데이터포털](https://data.go.kr))를 기반으로 제작되었습니다.

---

## 라이선스

MIT License

---

*마지막 업데이트: 2026년 2월 27일*
