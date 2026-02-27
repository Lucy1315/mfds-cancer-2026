# CLAUDE.md

이 문서는 이 저장소에서 AI 코딩 어시스턴트(Assistant)가 일관된 방식으로 작업하기 위한 프로젝트 가이드입니다.

## 1) 프로젝트 개요 (Project Overview)

- 프로젝트명: MFDS 항암제 승인현황 대시보드
- 목적: 식품의약품안전처(MFDS) 항암제 허가 데이터를 시각화하고 필터링/내보내기
- 핵심 기능:
  - 차트 시각화(암종/업체/허가유형/월별 추이)
  - 다중 필터(날짜, 암종, 제조/수입, 업체, 허가유형, 작용기전)
  - Excel 업로드/다운로드
  - MFDS 상세 페이지 링크 연동

## 2) 기술 스택 (Tech Stack)

- Frontend: React 18, TypeScript, Vite
- UI: Tailwind CSS, shadcn/ui
- Data Fetching/State: TanStack Query (React Query)
- Chart: Recharts
- Excel: xlsx, xlsx-js-style
- Backend 연동: Supabase Edge Functions (Lovable Cloud)

## 3) 로컬 실행 (Local Development)

```bash
npm install
npm run dev
```

- 기본 개발 서버: `http://localhost:5173`

추가 명령:

```bash
npm run build
npm run preview
npm run lint
npm run test
```

## 4) 주요 디렉터리 구조 (Directory Map)

```text
src/
  components/            # 화면 컴포넌트
  components/ui/         # shadcn/ui 컴포넌트
  pages/                 # 라우트 페이지
  hooks/                 # 커스텀 훅
  data/                  # 정적 데이터/타입
  utils/                 # Excel/문서/보조 유틸
  integrations/supabase/ # Supabase 클라이언트/타입
  test/                  # Vitest 테스트

supabase/functions/
  fetch-drug-data/       # 공공데이터 API 중계 Edge Function
```

## 5) 데이터/도메인 메모 (Domain Notes)

- 주요 데이터 원천:
  - 공공데이터포털(data.go.kr) API
  - MFDS 의약품안전나라(nedrug.mfds.go.kr) 교차 확인
- 대시보드 데이터는 정적 데이터(`src/data/recentApprovals.ts`)와 API 연동 흐름을 함께 사용
- 공공 API 응답은 품목코드, 제품명, 업체, 허가일 등을 내부 필드로 매핑해 사용

## 6) 코딩 규칙 (Coding Rules)

아래 규칙은 이 저장소에서 작업할 때 항상 우선 적용합니다.

1. 모든 설명/주석은 한국어로 작성한다.
2. 전문 용어는 영어 원문을 괄호로 병기한다.  
   예: 실행 컨텍스트(Execution Context), 상태 관리(State Management)
3. 변경 시 부분 코드가 아닌 실행 가능한 완전한 코드(Full Code)를 우선 제공한다.
4. 기존 UI 스타일은 shadcn/ui + Tailwind 패턴을 유지한다.
5. 타입 안정성(Type Safety)을 위해 TypeScript 타입을 명시한다.
6. 데이터 변환/필터링 로직은 가능한 순수 함수(Pure Function)로 분리한다.
7. 새 기능 추가 시 가능한 범위에서 테스트(Vitest)를 함께 작성한다.

## 7) 작업 원칙 (Workflow Rules)

1. 원격 저장소(GitHub)에 대한 쓰기 작업(push/force-push/rewrite)은 사용자의 명시 요청 없이는 수행하지 않는다.
2. 로컬 변경 후에는 가능한 `lint` 또는 `test`로 기본 검증을 수행한다.
3. 환경 변수(Secrets)는 코드에 하드코딩하지 않는다.
4. Supabase Edge Function 수정 시 CORS/오류 응답 형식을 기존 패턴과 맞춘다.

## 8) 이메일 발송 기능 (Email Feature)

### 아키텍처
- **프론트엔드 (대시보드 UI)**: `EmailTab.tsx` → HTML 미리보기 생성 → Supabase Edge Function 호출
- **백엔드 (Edge Function)**: `send-approval-email/index.ts` → Gmail SMTP(nodemailer)로 발송
- **로컬 스크립트 (대안)**: `scripts/send-test-email.cjs` → CLI에서 직접 Gmail SMTP 발송

### 주요 파일

| 파일 | 역할 |
|------|------|
| `src/components/EmailTab.tsx` | 이메일 작성 UI (태그 입력, 미리보기, 발송 확인 다이얼로그) |
| `src/components/AdminPanel.tsx` | 관리자 탭 컨테이너 (관리자 인증 후 EmailTab 노출) |
| `src/utils/emailDataGenerator.ts` | 이메일 데이터 유틸 (통계 계산, HTML/텍스트 미리보기 생성, 파일명 생성) |
| `src/utils/excelExport.ts` | 엑셀 파일 Base64 생성 (`generateExcelBase64`) |
| `supabase/functions/send-approval-email/index.ts` | Edge Function — Gmail SMTP 발송 |
| `scripts/send-test-email.cjs` | 로컬 발송 스크립트 (Edge Function 배포 불가 시 대안) |

### 발송 흐름
1. 프론트엔드에서 `generateEmailHtmlPreview()`로 Outlook 호환 HTML 본문 생성
2. `generateExcelBase64()`로 엑셀 첨부파일 Base64 생성
3. Edge Function(`send-approval-email`)에 다음 데이터 전송:
   - `recipients`: 수신자 배열
   - `cc`: CC 수신자 배열 (선택)
   - `subject`: 이메일 제목
   - `htmlBody`: 프론트엔드에서 생성한 HTML (미리보기와 동일)
   - `textBody`: 플레인 텍스트 대체 본문
   - `attachExcel`, `excelBase64`, `excelFilename`: 엑셀 첨부 정보
4. Edge Function이 Gmail SMTP(Port 587 STARTTLS)로 발송

### Gmail SMTP 설정
- 환경 변수: `GMAIL_USER`, `GMAIL_APP_PASSWORD` (`.env` 및 Supabase secrets)
- Gmail 앱 비밀번호(App Password) 필요 (2단계 인증 활성화 후 생성)
- Port 587 STARTTLS 사용, `transporter.verify()`로 연결 검증
- 타임아웃: 연결 15초, 소켓 30초

### 이메일 HTML 템플릿
- Outlook/회사 메일 호환: `role="presentation"` 테이블 기반, MSO 조건부 주석
- 폰트: 맑은 고딕(Malgun Gothic) + Arial fallback
- 구조: 헤더(파란색 배경) → 기간/총건수 → 요약 통계 → 품목 리스트 테이블 → 첨부파일 표시 → 대시보드 링크 → 푸터
- `generateEmailHtmlPreview()` 함수에서 모든 HTML 생성 (Edge Function은 본문을 직접 전달만 함)

### 엑셀 파일
- 파일명 형식: `MFDS_항암제_승인현황_YYYY-MM-DD_YYYY-MM-DD_YYYYMMDD.xlsx`
- 2개 시트: "요약" (통계 + 간략 목록) / "상세목록" (전체 필드)
- xlsx-js-style 라이브러리 사용 (스타일 적용)
- 대시보드 "전체 다운로드"와 동일한 구조

### 로컬 발송 스크립트 사용법
```bash
# 기본 수신자(jisoo.kim@samyang.com)로 발송
node scripts/send-test-email.cjs

# 특정 수신자 지정
node scripts/send-test-email.cjs someone@example.com
```
- 스크립트 내 `drugs` 배열을 `src/data/recentApprovals.ts` 데이터와 동기화 필요
- `FILTER_START`, `FILTER_END` 변수로 승인기간 설정

### Supabase Edge Function 배포
- 프로젝트 ID: `sbihifwhghaycykdsfqv`
- Lovable Cloud 관리 프로젝트로, CLI 배포 시 Owner 권한 토큰 필요
- 배포 명령: `supabase functions deploy send-approval-email --project-ref sbihifwhghaycykdsfqv`
- Secrets 설정: `supabase secrets set GMAIL_USER=... GMAIL_APP_PASSWORD=...`

### 알려진 이슈
- 기업 메일 서버(예: samyang.com)에서 개인 Gmail 발신 이메일을 스팸 차단할 수 있음
- 개선 방안: 발신자를 비즈니스 이메일(SendGrid/Resend) 또는 회사 도메인 이메일로 변경 검토

## 9) 자주 수정되는 파일 (High-Touch Files)

- `src/pages/Index.tsx`
- `src/components/FilterPanel.tsx`
- `src/components/ChartGrid.tsx`
- `src/components/DataTable.tsx`
- `src/hooks/useDrugData.ts`
- `src/utils/excelParser.ts`
- `src/utils/excelExport.ts`
- `supabase/functions/fetch-drug-data/index.ts`
- `src/components/EmailTab.tsx`
- `src/utils/emailDataGenerator.ts`
- `supabase/functions/send-approval-email/index.ts`

## 10) 변경 체크리스트 (Change Checklist)

- [ ] 타입 오류(Type Error) 없음
- [ ] ESLint 경고/오류 확인
- [ ] 필터 조건이 차트/테이블에 동일하게 반영됨
- [ ] Excel 업로드/다운로드 동작 확인
- [ ] 링크(MFDS 상세페이지) 동작 확인
- [ ] 회귀(Regression) 영향 범위 점검

