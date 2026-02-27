

# 이메일 발송 기능 구현 계획 (확장)

## 개요
관리자 모드의 이메일 탭에서 발송할 이메일에 다음 항목들을 포함하도록 구현합니다:

1. **승인기간**: yy-mm-dd ~ yy-mm-dd 형식
2. **통계 요약**: 이미지에 표시된 차트 데이터 (암종별, 허가유형별, 제조/수입, 작용기전별 분포)
3. **엑셀 첨부**: 필터 설정에 맞는 데이터를 엑셀 파일로 첨부
4. **대시보드 링크**: https://mfds-cancer-watch.lovable.app

---

## 1. 이메일 본문 구조

```text
┌─────────────────────────────────────────────────────┐
│ MFDS 항암제 승인현황 리포트                           │
├─────────────────────────────────────────────────────┤
│ 승인기간: 25-12-01 ~ 26-01-28                       │
├─────────────────────────────────────────────────────┤
│ 요약 통계                                           │
│ • 총 승인 품목: 13건                                │
│                                                     │
│ 암종별 분포:                                        │
│   - 전립선암(3), 폐암(2), 급성골수성백혈병(2)...     │
│                                                     │
│ 허가유형별 분포:                                    │
│   - 제네릭(6), 신약(4), 희귀(3)...                  │
│                                                     │
│ 제조/수입 비율:                                     │
│   - 수입(8), 제조(5)                                │
│                                                     │
│ 작용기전별 분포:                                    │
│   - 안드로겐 수용체 억제제, ADC, EGFR TKI...        │
├─────────────────────────────────────────────────────┤
│ 📎 첨부파일: MFDS_항암제_승인현황_25-12-01_26-01-28.xlsx │
├─────────────────────────────────────────────────────┤
│ 🔗 대시보드 바로가기                                 │
│    https://mfds-cancer-watch.lovable.app            │
└─────────────────────────────────────────────────────┘
```

---

## 2. 신규/수정 파일 목록

| 파일 | 작업 | 설명 |
|------|------|------|
| `src/components/AdminLogin.tsx` | 신규 | 관리자 비밀번호 입력 다이얼로그 |
| `src/components/AdminPanel.tsx` | 신규 | 관리자 메인 패널 |
| `src/components/EmailTab.tsx` | 신규 | 이메일 발송 인터페이스 |
| `src/utils/emailDataGenerator.ts` | 신규 | 이메일 본문 HTML 생성 + 통계 계산 |
| `src/utils/excelExport.ts` | 수정 | Base64 엑셀 생성 함수 추가 |
| `src/pages/Index.tsx` | 수정 | 탭 네비게이션 + 관리자 인증 상태 추가 |
| `supabase/functions/send-approval-email/index.ts` | 신규 | Resend API 연동 Edge Function |
| `supabase/config.toml` | 수정 | 새 Edge Function JWT 설정 추가 |

---

## 3. 통계 데이터 구조

이메일 본문에 포함될 통계 데이터를 계산하는 유틸리티 함수를 생성합니다.

### EmailStatistics 인터페이스

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `totalCount` | number | 총 승인 품목 수 |
| `cancerTypeStats` | Record<string, number> | 암종별 건수 |
| `approvalTypeStats` | Record<string, number> | 허가유형별 건수 |
| `manufactureStats` | { import: number, domestic: number } | 제조/수입 비율 |
| `mechanismStats` | Record<string, number> | 작용기전별 건수 |

---

## 4. 엑셀 첨부 파일 처리

### 처리 방식
1. 클라이언트에서 기존 `excelExport.ts`를 확장하여 **Base64 인코딩된 엑셀 데이터** 생성
2. Edge Function으로 Base64 데이터 전송
3. Resend API에서 Base64 데이터를 첨부파일로 변환하여 발송

### 신규 함수

| 함수명 | 반환 타입 | 설명 |
|--------|----------|------|
| `generateExcelBase64()` | string | 필터링된 데이터를 Base64 엑셀로 변환 |

---

## 5. EmailTab 컴포넌트 UI

### 입력 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| 수신자 이메일 | textarea | 쉼표 또는 줄바꿈으로 구분 |
| 제목 | input | 기본값: "MFDS 항암제 승인현황 리포트" |
| 기간 표시 | readonly | 자동 생성 (yy-mm-dd ~ yy-mm-dd) |
| 추가 메모 | textarea | 선택적 추가 내용 |
| 엑셀 첨부 | checkbox | 필터링된 데이터 엑셀 첨부 여부 |

### 미리보기 영역
- 이메일 본문 HTML 미리보기
- 통계 요약 표시
- 첨부파일명 표시

---

## 6. Edge Function 구현

### 요청 페이로드

| 필드 | 타입 | 설명 |
|------|------|------|
| `recipients` | string[] | 수신자 이메일 목록 |
| `subject` | string | 이메일 제목 |
| `dateRangeText` | string | 기간 텍스트 (yy-mm-dd ~ yy-mm-dd) |
| `statistics` | EmailStatistics | 통계 데이터 |
| `additionalNote` | string | 추가 메모 (선택) |
| `attachExcel` | boolean | 엑셀 첨부 여부 |
| `excelBase64` | string | Base64 인코딩된 엑셀 데이터 (선택) |
| `excelFilename` | string | 첨부파일명 |
| `dashboardUrl` | string | 대시보드 링크 |

### HTML 이메일 템플릿 생성
Edge Function 내에서 통계 데이터를 기반으로 전문적인 HTML 이메일 템플릿을 생성합니다.

---

## 7. 구현 순서

### Phase 1: 관리자 인증 UI
1. `AdminLogin.tsx` - 비밀번호 입력 다이얼로그
2. `Index.tsx` - 탭 네비게이션 추가 (대시보드 / 관리자)
3. 인증 상태 관리 (sessionStorage 기반)

### Phase 2: 이메일 탭 UI
4. `AdminPanel.tsx` - 관리자 패널 프레임
5. `EmailTab.tsx` - 이메일 발송 폼 UI
6. `emailDataGenerator.ts` - 통계 계산 + 본문 생성

### Phase 3: 엑셀 첨부 기능
7. `excelExport.ts` 확장 - `generateExcelBase64()` 추가

### Phase 4: Edge Function
8. RESEND_API_KEY Secret 요청
9. `send-approval-email/index.ts` 구현
10. `config.toml` 업데이트

### Phase 5: 통합 및 테스트
11. EmailTab ↔ Edge Function 연동
12. 이메일 발송 테스트

---

## 8. 기술 세부사항

### 기간 텍스트 생성
```typescript
// filters에서 기간 텍스트 생성
const dateRangeText = `${format(filters.startDate, 'yy-MM-dd')} ~ ${format(filters.endDate, 'yy-MM-dd')}`;
// 예: "25-12-01 ~ 26-01-28"
```

### 통계 계산 함수
ChartGrid 컴포넌트의 통계 계산 로직을 재사용하여 emailDataGenerator에서 동일한 데이터를 생성합니다.

### 대시보드 URL
```typescript
const DASHBOARD_URL = 'https://mfds-cancer-watch.lovable.app';
```

### Resend 첨부파일 형식
```typescript
await resend.emails.send({
  from: 'MFDS 대시보드 <noreply@your-domain.com>',
  to: recipients,
  subject,
  html: emailHtml,
  attachments: attachExcel ? [{
    filename: excelFilename,
    content: excelBase64, // Base64 string
  }] : undefined,
});
```

---

## 9. 보안 고려사항

| 항목 | 처리 방식 |
|------|----------|
| 관리자 비밀번호 | 클라이언트 측 검증 (fda2025) |
| 세션 유지 | sessionStorage (탭 닫으면 초기화) |
| Edge Function 인증 | verify_jwt = false (공개 API) |
| RESEND_API_KEY | Supabase Secrets에 저장 |

---

## 10. 필요한 외부 설정

### Resend API 설정
1. https://resend.com 가입
2. https://resend.com/domains 에서 발신 도메인 인증
3. https://resend.com/api-keys 에서 API 키 생성
4. `RESEND_API_KEY` Secret 등록

---

## 11. 예상 결과

### 관리자 탭 접근 시
1. "관리자" 탭 클릭
2. 비밀번호 입력 다이얼로그 표시
3. `fda2025` 입력 시 관리자 패널 접근

### 이메일 발송 시
1. 수신자 입력
2. 기간 자동 표시 (25-12-01 ~ 26-01-28)
3. 통계 미리보기 확인
4. 엑셀 첨부 옵션 선택
5. "발송" 버튼 클릭
6. 수신자에게 통계 요약 + 엑셀 + 대시보드 링크 포함된 이메일 수신

