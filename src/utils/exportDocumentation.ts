 import XLSX from 'xlsx-js-style';
 import { recentApprovals, dateRange as defaultDateRange } from '@/data/recentApprovals';
 
 // 스타일 상수 정의 (기존 excelExport.ts와 통일)
 const STYLES = {
   // 헤더 스타일: 12pt, 굵게, 진한 배경 (그레이)
   header: {
     font: { name: '맑은 고딕', bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
     fill: { patternType: 'solid', fgColor: { rgb: '374151' } },
     alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
     border: {
       top: { style: 'medium', color: { rgb: '1F2937' } },
       bottom: { style: 'medium', color: { rgb: '1F2937' } },
       left: { style: 'medium', color: { rgb: '1F2937' } },
       right: { style: 'medium', color: { rgb: '1F2937' } },
     },
   },
   // 데이터 행 - 11pt, 배경 없음, 테두리만
   data: {
     font: { name: '맑은 고딕', sz: 11, color: { rgb: '1F2937' } },
     alignment: { vertical: 'center', wrapText: true },
     border: {
       top: { style: 'thin', color: { rgb: '9CA3AF' } },
       bottom: { style: 'thin', color: { rgb: '9CA3AF' } },
       left: { style: 'thin', color: { rgb: '9CA3AF' } },
       right: { style: 'thin', color: { rgb: '9CA3AF' } },
     },
   },
   // 제목 스타일
   title: {
     font: { name: '맑은 고딕', bold: true, sz: 16, color: { rgb: '1F2937' } },
     fill: { patternType: 'solid', fgColor: { rgb: 'F3F4F6' } },
     alignment: { horizontal: 'left', vertical: 'center' },
     border: {
       bottom: { style: 'medium', color: { rgb: '6B7280' } },
     },
   },
   // 섹션 헤더
   sectionHeader: {
     font: { name: '맑은 고딕', bold: true, sz: 14, color: { rgb: '374151' } },
     fill: { patternType: 'solid', fgColor: { rgb: 'E5E7EB' } },
     alignment: { vertical: 'center' },
     border: {
       top: { style: 'medium', color: { rgb: '9CA3AF' } },
       bottom: { style: 'medium', color: { rgb: '9CA3AF' } },
       left: { style: 'thin', color: { rgb: '9CA3AF' } },
       right: { style: 'thin', color: { rgb: '9CA3AF' } },
     },
   },
   // 서브 헤더
   subHeader: {
     font: { name: '맑은 고딕', bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
     fill: { patternType: 'solid', fgColor: { rgb: '4B5563' } },
     alignment: { horizontal: 'center', vertical: 'center' },
     border: {
       top: { style: 'medium', color: { rgb: '374151' } },
       bottom: { style: 'medium', color: { rgb: '374151' } },
       left: { style: 'medium', color: { rgb: '374151' } },
       right: { style: 'medium', color: { rgb: '374151' } },
     },
   },
   // 레이블 스타일
   label: {
     font: { name: '맑은 고딕', bold: true, sz: 11, color: { rgb: '374151' } },
     fill: { patternType: 'solid', fgColor: { rgb: 'F9FAFB' } },
     alignment: { vertical: 'center' },
     border: {
       top: { style: 'thin', color: { rgb: '9CA3AF' } },
       bottom: { style: 'thin', color: { rgb: '9CA3AF' } },
       left: { style: 'thin', color: { rgb: '9CA3AF' } },
       right: { style: 'thin', color: { rgb: '9CA3AF' } },
     },
   },
   // 코드/모노스페이스
   code: {
     font: { name: 'Consolas', sz: 10, color: { rgb: '1F2937' } },
     fill: { patternType: 'solid', fgColor: { rgb: 'F3F4F6' } },
     alignment: { vertical: 'center', wrapText: true },
     border: {
       top: { style: 'thin', color: { rgb: 'D1D5DB' } },
       bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
       left: { style: 'thin', color: { rgb: 'D1D5DB' } },
       right: { style: 'thin', color: { rgb: 'D1D5DB' } },
     },
   },
 };
 
 // 항암제 필터링 키워드 (Edge Function에서 사용하는 것과 동일)
 const EXCLUDE_KEYWORDS = [
   '암로디핀', 'amlodipine', '텔미사르탄', 'telmisartan', '클로르탈리돈',
   '로사르탄', 'losartan', '발사르탄', 'valsartan', '올메사르탄'
 ];
 
 const ANTICANCER_KEYWORDS = [
   '항암', '백혈병', 'leukemia', '림프종', 'lymphoma', '골수종', 'myeloma',
   '흑색종', 'melanoma', '육종', 'sarcoma',
   'mab', 'nib', 'taxel', 'platin', 'rubicin', 'ciclib',
   '퀴자티닙', 'quizartinib', '보라시데닙', 'vorasidenib', '엔잘루타미드', 'enzalutamide',
   '독소루비신', 'doxorubicin', '시스플라틴', 'cisplatin', '트라스투주맙', 'trastuzumab',
   '니볼루맙', 'nivolumab', '펨브롤리주맙', 'pembrolizumab',
   '다사티닙', 'dasatinib', '이마티닙', 'imatinib', '수니티닙', 'sunitinib',
   '베바시주맙', 'bevacizumab', '세툭시맙', 'cetuximab', '리툭시맙', 'rituximab',
   '팔보시클립', 'palbociclib', '올라파립', 'olaparib',
   '폐암', '유방암', '대장암', '위암', '간암', '췌장암', '전립선암', '난소암',
   '신장암', '방광암', '뇌종양', '교모세포종', '신경교종',
   'checkpoint', 'immunotherapy', 'chemotherapy', 'targeted therapy',
   '종양', 'tumor', 'carcinoma', 'neoplasm', 'metastatic', '전이', '재발',
   'relapsed', 'refractory'
 ];
 
 const SEARCH_KEYWORDS = [
   '키트루다', '옵디보', '허쥬마', '타그리소', '렌비마', '린파자', '이브란스',
   '다라잘렉스', '테센트릭', '젤보라프', '임핀지', '엔허투', '아바스틴',
   '허셉틴', '리툭산', '글리벡', '타세바', '이레사', '젤로다', '알림타',
   '택솔', '탁소테레', '시스플라틴', '카보플라틴', '옥살리플라틴',
   '독소루비신', '에피루비신', '젬자르', '빈크리스틴', '빈블라스틴',
   '플루오로우라실', '카페시타빈', '메토트렉세이트', '이리노테칸',
   '보라니고', '반플리타', '퀴자티닙', '보라시데닙', '엔잘루타미드',
   '브렌랩', '벨란타맙', '엘라히어', '미르베툭시맙', '풀베스트란트',
   '오시머티닙', '오티닙', 'ADC', '골수종'
 ];
 
 export function exportDocumentationExcel(): void {
   const workbook = XLSX.utils.book_new();
 
   // ===== Sheet 1: Data (Raw Data) =====
   const dataSheet = createDataSheet();
   XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data');
 
   // ===== Sheet 2: 설명 (Documentation) =====
   const docSheet = createDocumentationSheet();
   XLSX.utils.book_append_sheet(workbook, docSheet, '설명');
 
   // 파일 생성
   const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
   XLSX.writeFile(workbook, `MFDS_항암제_승인현황_문서화_${dateStr}.xlsx`);
 }
 
 function createDataSheet(): XLSX.WorkSheet {
   const headers = [
     '품목기준코드', '제품명', '업체명', '허가일', '주성분', 
     '적응증', '암종', '허가유형', '제조/수입', '제조국', '위탁제조업체', '비고'
   ];
 
   const rows: (string | number)[][] = [headers];
 
   recentApprovals.forEach((drug) => {
     rows.push([
       drug.id,
       drug.drugName,
       drug.company,
       drug.approvalDate,
       drug.genericName,
       drug.indication,
       drug.cancerType,
       drug.approvalType || '-',
       drug.manufactureType || '-',
       drug.manufacturingCountry || '-',
       drug.consignedManufacturer || '',
       drug.notes || '',
     ]);
   });
 
   const sheet = XLSX.utils.aoa_to_sheet(rows);
 
   // 컬럼 너비
   sheet['!cols'] = [
     { wch: 14 },  // 품목기준코드
     { wch: 40 },  // 제품명
     { wch: 22 },  // 업체명
     { wch: 12 },  // 허가일
     { wch: 36 },  // 주성분
     { wch: 70 },  // 적응증
     { wch: 16 },  // 암종
     { wch: 20 },  // 허가유형
     { wch: 10 },  // 제조/수입
     { wch: 18 },  // 제조국
     { wch: 50 },  // 위탁제조업체
     { wch: 28 },  // 비고
   ];
 
   // 행 높이
   sheet['!rows'] = rows.map((_, idx) => ({ hpt: idx === 0 ? 36 : 32 }));
 
   // 스타일 적용
   applyDataSheetStyles(sheet, rows);
 
   return sheet;
 }
 
 function createDocumentationSheet(): XLSX.WorkSheet {
   const rows: (string | number)[][] = [];
 
   // 제목
   rows.push(['MFDS 항암제 승인현황 대시보드 - 데이터 문서화', '', '', '']);
   rows.push(['', '', '', '']);
 
   // ===== A. 컬럼별 명칭 =====
   rows.push(['A. 컬럼별 명칭', '', '', '']);
   rows.push(['컬럼명', '영문명', 'API 원본 필드', '설명']);
   rows.push(['품목기준코드', 'id', 'ITEM_SEQ', '식약처 고유 품목 식별자']);
   rows.push(['제품명', 'drugName', 'ITEM_NAME', '의약품 제품명 (용량 포함)']);
   rows.push(['업체명', 'company', 'ENTP_NAME', '제조/수입 업체명']);
   rows.push(['허가일', 'approvalDate', 'ITEM_PERMIT_DATE', '식약처 허가일 (YYYY-MM-DD)']);
   rows.push(['주성분', 'genericName', 'MAIN_ITEM_INGR', '주요 활성 성분명']);
   rows.push(['적응증', 'indication', 'EE_DOC_DATA', '효능효과 (효능효과 문서에서 추출)']);
   rows.push(['암종', 'cancerType', '(자동 분류)', '적응증 텍스트 기반 자동 분류']);
   rows.push(['허가유형', 'approvalType', '(수동 추가)', '신약, 제네릭, 희귀의약품 등']);
   rows.push(['제조/수입', 'manufactureType', '(수동 추가)', '제조 또는 수입 구분']);
   rows.push(['제조국', 'manufacturingCountry', '(수동 추가)', '원산지 국가']);
   rows.push(['위탁제조업체', 'consignedManufacturer', '(수동 추가)', '실제 제조 업체 (있을 경우)']);
   rows.push(['비고', 'notes', '(수동 추가)', '추가 정보 (작용기전 등)']);
   rows.push(['', '', '', '']);
 
   // ===== B. 데이터 정리 구조 =====
   rows.push(['B. 데이터 정리 구조', '', '', '']);
   rows.push(['단계', '구성요소', '설명', '']);
   rows.push(['1. 데이터 수집', '공공데이터포털 API', 'DrugPrdtPrmsnInfoService07 API 호출', '']);
   rows.push(['2. 프록시 처리', 'Edge Function', 'Lovable Cloud에서 API 키 보호 및 CORS 처리', '']);
   rows.push(['3. 필터링/변환', '항암제 분류 로직', '키워드 매칭으로 항암제 필터링', '']);
   rows.push(['4. 암종 분류', '자동 분류 알고리즘', '적응증 텍스트에서 암종 추출', '']);
   rows.push(['5. UI 표시', 'React 대시보드', '차트, 테이블, 필터로 시각화', '']);
   rows.push(['', '', '', '']);
 
   // ===== C. 항암제 필터링 키워드 =====
   rows.push(['C. 항암제 필터링 키워드', '', '', '']);
   rows.push(['구분', '키워드 목록', '', '']);
   rows.push(['포함 키워드', ANTICANCER_KEYWORDS.slice(0, 20).join(', '), '', '']);
   rows.push(['포함 키워드 (계속)', ANTICANCER_KEYWORDS.slice(20).join(', '), '', '']);
   rows.push(['제외 키워드', EXCLUDE_KEYWORDS.join(', '), '', '']);
   rows.push(['검색 키워드', SEARCH_KEYWORDS.slice(0, 15).join(', '), '', '']);
   rows.push(['검색 키워드 (계속)', SEARCH_KEYWORDS.slice(15, 30).join(', '), '', '']);
   rows.push(['검색 키워드 (계속)', SEARCH_KEYWORDS.slice(30).join(', '), '', '']);
   rows.push(['', '', '', '']);
 
   // ===== D. 수집방법 개요 =====
   rows.push(['D. 수집방법 개요', '', '', '']);
   rows.push(['단계', '처리 내용', '상세 설명', '']);
   rows.push(['1', 'API 호출', '공공데이터포털(data.go.kr) DrugPrdtPrmsnInfoService07 API 사용', '']);
   rows.push(['2', '병렬 검색', '40+ 항암제 키워드별 병렬 요청으로 포괄적 수집', '']);
   rows.push(['3', '중복 제거', 'ITEM_SEQ(품목기준코드) 기준 중복 제거', '']);
   rows.push(['4', '항암제 필터링', '포함/제외 키워드로 항암제 여부 판정', '']);
   rows.push(['5', '암종 자동 분류', '적응증 텍스트에서 정규표현식으로 암종 추출', '']);
   rows.push(['6', '날짜 정렬', '최신 허가일순 정렬', '']);
   rows.push(['', '', '', '']);
 
   // ===== E. 수집 결과 예시 =====
   rows.push(['E. 수집 결과 예시', '', '', '']);
   rows.push(['구분', '내용', '', '']);
   rows.push(['API 응답 원본', 'ITEM_SEQ, ITEM_NAME, ENTP_NAME, ITEM_PERMIT_DATE, EE_DOC_DATA...', '', '']);
   rows.push(['변환 후', 'id, drugName, company, approvalDate, indication, cancerType...', '', '']);
   rows.push(['예시 데이터', recentApprovals[0]?.drugName || '-', recentApprovals[0]?.company || '-', '']);
   rows.push(['', '', '', '']);
 
   // ===== F. 필터링 프로세스 =====
   rows.push(['F. 필터링 프로세스', '', '', '']);
   rows.push(['순서', '처리 내용', '목적', '']);
   rows.push(['1', '제외 키워드 확인', '고혈압약(암로디핀 등) 오탐 방지', '']);
   rows.push(['2', '포함 키워드 매칭', '항암제 성분/적응증 키워드 포함 여부', '']);
   rows.push(['3', '접미사 패턴 검사', '-mab, -nib, -taxel 등 항암제 성분 패턴', '']);
   rows.push(['4', '암종 자동 추출', '폐암, 유방암, 혈액암 등 12개 카테고리', '']);
   rows.push(['5', '날짜 포맷 변환', 'YYYYMMDD → YYYY-MM-DD', '']);
   rows.push(['', '', '', '']);
 
   // ===== G. 데이터 출처 및 검증 =====
   rows.push(['G. 데이터 출처 및 검증', '', '', '']);
   rows.push(['항목', '내용', '', '']);
   rows.push(['API 출처', '공공데이터포털 DrugPrdtPrmsnInfoService07', '', '']);
   rows.push(['API URL', 'https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService07', '', '']);
   rows.push(['검증 방법', '식약처 nedrug.mfds.go.kr 교차 확인', '', '']);
   rows.push(['데이터 기간', `${defaultDateRange.start} ~ ${defaultDateRange.end}`, '', '']);
   rows.push(['총 수집 건수', `${recentApprovals.length}건`, '', '']);
   rows.push(['갱신 주기', '수시 (신규 허가 시 업데이트)', '', '']);
   rows.push(['', '', '', '']);
 
   // ===== H. 기술 스택 =====
   rows.push(['H. 기술 스택', '', '', '']);
   rows.push(['분류', '기술', '버전', '용도']);
   rows.push(['Frontend', 'React', '18.3.1', 'UI 프레임워크']);
   rows.push(['Frontend', 'TypeScript', '-', '타입 안정성']);
   rows.push(['Frontend', 'Vite', '-', '빌드 도구']);
   rows.push(['Frontend', 'Tailwind CSS', '-', '스타일링']);
   rows.push(['UI 컴포넌트', 'shadcn/ui', '-', '기본 UI 컴포넌트']);
   rows.push(['시각화', 'Recharts', '-', '도넛 차트, 파이 차트']);
   rows.push(['데이터 처리', 'xlsx-js-style', '-', '스타일 적용 엑셀 내보내기']);
   rows.push(['데이터 처리', 'date-fns', '-', '날짜 처리']);
   rows.push(['Backend', 'Lovable Cloud', '-', 'Edge Functions, DB']);
   rows.push(['Backend', 'Supabase', '-', 'Edge Function 런타임']);
   rows.push(['API', '공공데이터포털', '-', '식약처 의약품 허가 데이터']);
 
   const sheet = XLSX.utils.aoa_to_sheet(rows);
 
   // 컬럼 너비
   sheet['!cols'] = [
     { wch: 22 },
     { wch: 60 },
     { wch: 40 },
     { wch: 30 },
   ];
 
   // 행 높이
   sheet['!rows'] = rows.map((row, idx) => {
     if (idx === 0) return { hpt: 32 }; // 제목
     if (row[0]?.toString().startsWith('A.') || 
         row[0]?.toString().startsWith('B.') || 
         row[0]?.toString().startsWith('C.') ||
         row[0]?.toString().startsWith('D.') ||
         row[0]?.toString().startsWith('E.') ||
         row[0]?.toString().startsWith('F.') ||
         row[0]?.toString().startsWith('G.') ||
         row[0]?.toString().startsWith('H.')) {
       return { hpt: 28 }; // 섹션 헤더
     }
     return { hpt: 22 }; // 일반 행
   });
 
   // 제목 셀 병합
   sheet['!merges'] = [
     { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }
   ];
 
   // 스타일 적용
   applyDocSheetStyles(sheet, rows);
 
   return sheet;
 }
 
 function applyDataSheetStyles(sheet: XLSX.WorkSheet, data: (string | number)[][]): void {
   const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
   
   for (let row = range.s.r; row <= range.e.r; row++) {
     for (let col = range.s.c; col <= range.e.c; col++) {
       const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
       if (!sheet[cellRef]) {
         sheet[cellRef] = { t: 's', v: '' };
       }
       
       const cell = sheet[cellRef];
       cell.s = row === 0 ? STYLES.header : STYLES.data;
     }
   }
 }
 
 function applyDocSheetStyles(sheet: XLSX.WorkSheet, data: (string | number)[][]): void {
   const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
   
   // 섹션 헤더 행 인덱스 찾기
   const sectionRows: number[] = [];
   const tableHeaderRows: number[] = [];
   
   data.forEach((row, idx) => {
     const firstCell = row[0]?.toString() || '';
     if (firstCell.match(/^[A-H]\./)) {
       sectionRows.push(idx);
     }
     if (['컬럼명', '단계', '구분', '순서', '항목', '분류'].includes(firstCell)) {
       tableHeaderRows.push(idx);
     }
   });
 
   for (let row = range.s.r; row <= range.e.r; row++) {
     for (let col = range.s.c; col <= range.e.c; col++) {
       const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
       if (!sheet[cellRef]) {
         sheet[cellRef] = { t: 's', v: '' };
       }
       
       const cell = sheet[cellRef];
       
       if (row === 0) {
         cell.s = STYLES.title;
       } else if (sectionRows.includes(row)) {
         cell.s = STYLES.sectionHeader;
       } else if (tableHeaderRows.includes(row)) {
         cell.s = STYLES.subHeader;
       } else if (col === 0 && data[row]?.[0]) {
         cell.s = STYLES.label;
       } else {
         cell.s = STYLES.data;
       }
     }
   }
 }