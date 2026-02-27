import XLSX from 'xlsx-js-style';
import { DrugApproval } from '@/data/drugData';
import { ExtendedDrugApproval } from '@/data/recentApprovals';

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Base64로 엑셀 데이터 생성 (이메일 첨부용)
export function generateExcelBase64(
  drugs: (DrugApproval | ExtendedDrugApproval)[],
  options: { dateRange?: { start: string; end: string } } = {}
): string {
  const { dateRange } = options;
  
  // 워크북 생성 (exportToExcel과 동일한 구조)
  const workbook = XLSX.utils.book_new();

  // ===== 시트 1: 요약 =====
  const summaryData = createSummarySheet(drugs, dateRange);
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  summarySheet['!cols'] = [
    { wch: 24 }, { wch: 35 }, { wch: 20 }, { wch: 14 }, { wch: 22 }, { wch: 60 }
  ];
  
  const productHeaderRowIndex = summaryData.findIndex(row => row[0] === '품목기준코드');
  summarySheet['!rows'] = summaryData.map((_, index) => {
    if (index === 0) return { hpt: 26 };
    if (index === productHeaderRowIndex) return { hpt: 40 };
    if (productHeaderRowIndex > 0 && index > productHeaderRowIndex) return { hpt: 40 };
    return { hpt: 20 };
  });
  
  summarySheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }
  ];
  
  applySummaryStyles(summarySheet, summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, '요약');

  // ===== 시트 2: 상세 목록 =====
  const detailData = createDetailSheet(drugs);
  const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
  
  detailSheet['!cols'] = [
    { wch: 16 }, { wch: 38 }, { wch: 20 }, { wch: 14 }, { wch: 40 }, { wch: 70 },
    { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 60 }, { wch: 28 },
  ];
  
  detailSheet['!rows'] = detailData.map((_, index) => ({ hpt: index === 0 ? 38 : 34 }));
  applyDetailStyles(detailSheet, detailData);
  XLSX.utils.book_append_sheet(workbook, detailSheet, '상세목록');

  // Base64로 출력
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
}

// 스타일 상수 정의
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
  // 제목 스타일 - 더 크고 눈에 띄게
  title: {
    font: { name: '맑은 고딕', bold: true, sz: 16, color: { rgb: '1F2937' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'F3F4F6' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      bottom: { style: 'medium', color: { rgb: '6B7280' } },
    },
  },
  // 섹션 헤더 (그레이)
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
  // 서브 헤더 (그레이)
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
};

export function exportToExcel(
  drugs: (DrugApproval | ExtendedDrugApproval)[],
  options: ExportOptions = {}
): void {
  const {
    filename = 'MFDS_항암제_승인현황',
    dateRange,
  } = options;

  // 워크북 생성
  const workbook = XLSX.utils.book_new();

  // ===== 시트 1: 요약 =====
  const summaryData = createSummarySheet(drugs, dateRange);
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // 요약 시트 컬럼 너비 (넓게)
  summarySheet['!cols'] = [
    { wch: 24 }, { wch: 35 }, { wch: 20 }, { wch: 14 }, { wch: 22 }, { wch: 60 }
  ];
  
  // 행 높이 설정 - 제품 목록 영역은 더 높게
  const productHeaderRowIndex = summaryData.findIndex(row => row[0] === '품목기준코드');
  summarySheet['!rows'] = summaryData.map((_, index) => {
    if (index === 0) return { hpt: 26 }; // 제목 행
    if (index === productHeaderRowIndex) return { hpt: 40 }; // 제품 목록 헤더
    if (productHeaderRowIndex > 0 && index > productHeaderRowIndex) return { hpt: 40 }; // 제품 목록 데이터
    return { hpt: 20 }; // 기타 행
  });
  
  // 제목 행 셀 병합 (A1:F1)
  summarySheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }
  ];
  
  // 요약 시트 스타일 적용
  applySummaryStyles(summarySheet, summaryData);
  
  XLSX.utils.book_append_sheet(workbook, summarySheet, '요약');

  // ===== 시트 2: 상세 목록 =====
  const detailData = createDetailSheet(drugs);
  const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
  
  // 상세 시트 컬럼 너비 (넓게)
  detailSheet['!cols'] = [
    { wch: 16 },  // 품목기준코드
    { wch: 38 },  // 제품명
    { wch: 20 },  // 업체명
    { wch: 14 },  // 허가일
    { wch: 40 },  // 주성분
    { wch: 70 },  // 적응증
    { wch: 16 },  // 암종
    { wch: 12 },  // 전문일반
    { wch: 12 },  // 허가유형
    { wch: 12 },  // 제조/수입
    { wch: 22 },  // 제조국
    { wch: 60 },  // 제조업체
    { wch: 28 },  // 비고
  ];
  
  // 행 높이 설정 (헤더 38, 데이터 34)
  detailSheet['!rows'] = detailData.map((_, index) => ({ hpt: index === 0 ? 38 : 34 }));
  
  // 전체 셀에 스타일 적용
  applyDetailStyles(detailSheet, detailData);
  
  XLSX.utils.book_append_sheet(workbook, detailSheet, '상세목록');

  // 파일 생성일 포함한 파일명
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const fullFilename = `${filename}_${dateStr}.xlsx`;

  // 다운로드
  XLSX.writeFile(workbook, fullFilename);
}

function createSummarySheet(
  drugs: (DrugApproval | ExtendedDrugApproval)[],
  dateRange?: { start: string; end: string }
): (string | number)[][] {
  // 시작일-종료일 형식으로 제목 생성
  const title = dateRange 
    ? `${dateRange.start} ~ ${dateRange.end} 항암제 승인현황 요약`
    : '항암제 승인현황 요약';
  // 허가유형별 집계
  const approvalTypes: Record<string, number> = {};
  const manufactureTypes: Record<string, number> = { '수입': 0, '제조': 0 };
  
  drugs.forEach((drug) => {
    const ext = drug as ExtendedDrugApproval;
    const type = ext.approvalType || '기타';
    approvalTypes[type] = (approvalTypes[type] || 0) + 1;
    
    const mType = ext.manufactureType || (drug.company.includes('한국') ? '수입' : '제조');
    manufactureTypes[mType] = (manufactureTypes[mType] || 0) + 1;
  });

  const rows: (string | number)[][] = [
    [title, '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['승인 현황 통계', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['구분', '건수', '', '', '', ''],
    ['총 제품 수', drugs.length, '', '', '', ''],
  ];

  // 허가유형별 추가
  Object.entries(approvalTypes).forEach(([type, count]) => {
    rows.push([type, count, '', '', '', '']);
  });

  // 제조/수입 추가
  rows.push(['수입', manufactureTypes['수입'], '', '', '', '']);
  rows.push(['제조', manufactureTypes['제조'], '', '', '', '']);
  
  rows.push(['', '', '', '', '', '']);
  rows.push(['', '', '', '', '', '']);
  rows.push(['제품별 상세 목록', '', '', '', '', '']);
  rows.push(['', '', '', '', '', '']);
  rows.push(['품목기준코드', '제품명', '업체명', '허가유형', '제조국', '제조업체']);

  // 제품 목록
  drugs.forEach((drug) => {
    const ext = drug as ExtendedDrugApproval;
    rows.push([
      drug.id,
      drug.drugName,
      drug.company,
      ext.approvalType || '-',
      ext.manufacturingCountry || '-',
      ext.consignedManufacturer || '',
    ]);
  });

  return rows;
}

function createDetailSheet(
  drugs: (DrugApproval | ExtendedDrugApproval)[]
): (string | number)[][] {
  const headers = [
    '품목기준코드', '제품명', '업체명', '허가일', '주성분', 
    '적응증', '암종', '전문일반', '허가유형', '제조/수입', 
    '제조국', '제조업체', '비고'
  ];

  const rows: (string | number)[][] = [headers];

  drugs.forEach((drug) => {
    const ext = drug as ExtendedDrugApproval;
    rows.push([
      drug.id,
      drug.drugName,
      drug.company,
      drug.approvalDate,
      drug.genericName,
      drug.indication,
      drug.cancerType,
      ext.drugCategory || '전문의약품',
      ext.approvalType || '-',
      ext.manufactureType || (drug.company.includes('한국') ? '수입' : '제조'),
      ext.manufacturingCountry || '-',
      ext.consignedManufacturer || '',
      ext.notes || '',
    ]);
  });

  return rows;
}

function applyDetailStyles(sheet: XLSX.WorkSheet, data: (string | number)[][]): void {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      if (!sheet[cellRef]) {
        sheet[cellRef] = { t: 's', v: '' };
      }
      
      const cell = sheet[cellRef];
      
      // 헤더 행 스타일
      if (row === 0) {
        cell.s = STYLES.header;
      } else {
        // 데이터 행 스타일 (배경 없음, 테두리만)
        cell.s = STYLES.data;
      }
    }
  }
}

function applySummaryStyles(sheet: XLSX.WorkSheet, data: (string | number)[][]): void {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  
  // 제품 상세 목록 헤더 행 인덱스 찾기
  let productHeaderRow = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i]?.[0] === '품목기준코드') {
      productHeaderRow = i;
      break;
    }
  }
  
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      if (!sheet[cellRef]) {
        sheet[cellRef] = { t: 's', v: '' };
      }
      
      const cell = sheet[cellRef];
      const rowData = data[row];
      
      // 제목 행 (첫 번째 행)
      if (row === 0) {
        cell.s = STYLES.title;
      }
      // 섹션 헤더 (승인 현황 통계, 제품별 상세 목록)
      else if (rowData?.[0] === '승인 현황 통계' || rowData?.[0] === '제품별 상세 목록') {
        cell.s = STYLES.sectionHeader;
      }
      // 테이블 헤더 행
      else if (rowData?.[0] === '구분' || rowData?.[0] === '품목기준코드') {
        cell.s = STYLES.subHeader;
      }
      // 제품 목록 영역 (상세 목록 헤더 이후)
      else if (productHeaderRow > 0 && row > productHeaderRow) {
        cell.s = STYLES.data;
      }
      // 통계 영역
      else if (row >= 5 && row < productHeaderRow - 2) {
        cell.s = STYLES.data;
      }
      // 빈 행
      else {
        cell.s = {
          font: { name: '맑은 고딕', sz: 11 },
        };
      }
    }
  }
}
