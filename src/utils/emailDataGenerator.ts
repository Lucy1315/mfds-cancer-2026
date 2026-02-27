import { format } from 'date-fns';
import { ExtendedDrugApproval } from '@/data/recentApprovals';
import { FilterState } from '@/components/FilterPanel';

export interface EmailStatistics {
  totalCount: number;
  cancerTypeStats: Record<string, number>;
  approvalTypeStats: Record<string, number>;
  manufactureStats: { import: number; domestic: number };
  mechanismStats: Record<string, number>;
}

export const DASHBOARD_URL = 'https://mfds-cancer-watch.lovable.app';

// 통계 데이터 계산
export const calculateStatistics = (data: ExtendedDrugApproval[]): EmailStatistics => {
  const cancerTypeStats: Record<string, number> = {};
  const approvalTypeStats: Record<string, number> = {};
  const mechanismStats: Record<string, number> = {};
  let importCount = 0;
  let domesticCount = 0;

  data.forEach((drug) => {
    // 암종별 통계
    cancerTypeStats[drug.cancerType] = (cancerTypeStats[drug.cancerType] || 0) + 1;

    // 허가유형별 통계
    if (drug.approvalType) {
      approvalTypeStats[drug.approvalType] = (approvalTypeStats[drug.approvalType] || 0) + 1;
    }

    // 제조/수입 통계
    const isImported = drug.company.includes('한국') || drug.company.includes('Korea');
    if (isImported) {
      importCount++;
    } else {
      domesticCount++;
    }

    // 작용기전 통계 (notes에서 추출)
    const ext = drug as ExtendedDrugApproval;
    if (ext.notes) {
      if (ext.notes.includes('EGFR TKI')) mechanismStats['EGFR TKI'] = (mechanismStats['EGFR TKI'] || 0) + 1;
      else if (ext.notes.includes('FLT3 억제제')) mechanismStats['FLT3 억제제'] = (mechanismStats['FLT3 억제제'] || 0) + 1;
      else if (ext.notes.includes('IDH 억제제')) mechanismStats['IDH 억제제'] = (mechanismStats['IDH 억제제'] || 0) + 1;
      else if (ext.notes.includes('안드로겐 수용체 억제제')) mechanismStats['안드로겐 수용체 억제제'] = (mechanismStats['안드로겐 수용체 억제제'] || 0) + 1;
      else if (ext.notes.includes('ADC')) mechanismStats['ADC'] = (mechanismStats['ADC'] || 0) + 1;
      else if (ext.notes.includes('SERD')) mechanismStats['SERD'] = (mechanismStats['SERD'] || 0) + 1;
    }
  });

  return {
    totalCount: data.length,
    cancerTypeStats,
    approvalTypeStats,
    manufactureStats: { import: importCount, domestic: domesticCount },
    mechanismStats,
  };
};

// 기간 텍스트 생성 (yy-MM-dd 형식)
export const getDateRangeText = (filters: FilterState): string => {
  if (!filters.startDate && !filters.endDate) {
    return '전체 기간';
  }
  if (filters.startDate && filters.endDate) {
    return `${format(filters.startDate, 'yy-MM-dd')} ~ ${format(filters.endDate, 'yy-MM-dd')}`;
  }
  if (filters.startDate) {
    return `${format(filters.startDate, 'yy-MM-dd')} ~`;
  }
  if (filters.endDate) {
    return `~ ${format(filters.endDate, 'yy-MM-dd')}`;
  }
  return '사용자 지정 기간';
};

// 통계를 문자열로 포맷팅
const formatStats = (stats: Record<string, number>): string => {
  return Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => `${key}(${value})`)
    .join(', ');
};

// 이메일 본문 미리보기용 텍스트 생성
export const generateEmailPreview = (
  dateRangeText: string,
  statistics: EmailStatistics,
  additionalNote?: string
): string => {
  let preview = `📋 MFDS 항암제 승인현황 리포트\n\n`;
  preview += `📅 승인기간: ${dateRangeText}\n\n`;
  preview += `📊 요약 통계\n`;
  preview += `• 총 승인 품목: ${statistics.totalCount}건\n\n`;
  
  preview += `🔹 암종별 분포:\n   ${formatStats(statistics.cancerTypeStats)}\n\n`;
  preview += `🔹 허가유형별 분포:\n   ${formatStats(statistics.approvalTypeStats)}\n\n`;
  preview += `🔹 제조/수입 비율:\n   수입(${statistics.manufactureStats.import}), 제조(${statistics.manufactureStats.domestic})\n\n`;
  
  if (Object.keys(statistics.mechanismStats).length > 0) {
    preview += `🔹 작용기전별 분포:\n   ${formatStats(statistics.mechanismStats)}\n\n`;
  }

  if (additionalNote) {
    preview += `📝 추가 메모:\n${additionalNote}\n\n`;
  }

  preview += `🔗 대시보드: ${DASHBOARD_URL}`;

  return preview;
};

// 엑셀 파일명 생성 (형식: MFDS_항암제_승인현황_YYYY-MM-DD_YYYY-MM-DD_YYYYMMDD.xlsx)
export const generateExcelFilename = (filters: FilterState): string => {
  const today = format(new Date(), 'yyyyMMdd');
  if (filters.startDate && filters.endDate) {
    const start = format(filters.startDate, 'yyyy-MM-dd');
    const end = format(filters.endDate, 'yyyy-MM-dd');
    return `MFDS_항암제_승인현황_${start}_${end}_${today}.xlsx`;
  }
  return `MFDS_항암제_승인현황_전체_${today}.xlsx`;
};

// 통계를 HTML 문자열로 포맷팅
const formatStatsHtml = (stats: Record<string, number>): string => {
  return Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => `${key}(${value}건)`)
    .join(', ');
};

// 이메일 본문에 포함할 품목 데이터 인터페이스
export interface EmailDrugItem {
  approvalDate: string;
  drugName: string;
  company: string;
  cancerType: string;
  approvalType?: string;
  notes?: string;
}

// 품목 데이터를 날짜 오름차순(과거순)으로 정렬
export const sortDrugItemsAsc = (data: ExtendedDrugApproval[]): EmailDrugItem[] => {
  return [...data]
    .sort((a, b) => new Date(a.approvalDate).getTime() - new Date(b.approvalDate).getTime())
    .map((d) => ({
      approvalDate: d.approvalDate,
      drugName: d.drugName,
      company: d.company,
      cancerType: d.cancerType,
      approvalType: d.approvalType,
      notes: d.notes,
    }));
};

// 품목 리스트 HTML 테이블 행 생성
const generateDrugRowsHtml = (items: EmailDrugItem[]): string => {
  return items
    .map((item, i) => {
      const bgColor = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      return `<tr style="background-color: ${bgColor};">
        <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 12px; white-space: nowrap;">${item.approvalDate}</td>
        <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 12px;">${item.drugName}</td>
        <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 12px;">${item.company}</td>
        <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 12px; text-align: center;">${item.cancerType}</td>
        <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 12px; text-align: center;">${item.approvalType || '-'}</td>
        <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 12px;">${item.notes || '-'}</td>
      </tr>`;
    })
    .join('\n');
};

// HTML 이메일 미리보기 생성 (아웃룩 호환 테이블 기반)
export const generateEmailHtmlPreview = (
  dateRangeText: string,
  statistics: EmailStatistics,
  drugItems: EmailDrugItem[],
  additionalNote?: string,
  attachExcel?: boolean,
  excelFilename?: string
): string => {
  const cancerStats = formatStatsHtml(statistics.cancerTypeStats);
  const approvalStats = formatStatsHtml(statistics.approvalTypeStats);
  const mechanismStats = Object.keys(statistics.mechanismStats).length > 0
    ? formatStatsHtml(statistics.mechanismStats)
    : '분석 중';
  const drugRows = generateDrugRowsHtml(drugItems);

  return `<!DOCTYPE html>
<html lang="ko" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Malgun Gothic', '맑은 고딕', Dotum, Arial, sans-serif;">
  <!-- 전체 래퍼 테이블 (아웃룩 호환) -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <!-- 본문 컨테이너 -->
        <table role="presentation" width="720" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #d1d5db;">
          <!-- 헤더 -->
          <tr>
            <td style="background-color: #1e40af; padding: 20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="color: #ffffff; font-size: 20px; font-weight: bold; font-family: 'Malgun Gothic', Arial, sans-serif;">MFDS 항암제 승인현황 리포트</td>
                </tr>
                <tr>
                  <td style="color: #bfdbfe; font-size: 13px; padding-top: 4px; font-family: 'Malgun Gothic', Arial, sans-serif;">식품의약품안전처 허가 데이터 기반</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- 기간 -->
          <tr>
            <td style="background-color: #eff6ff; padding: 12px 24px; border-bottom: 1px solid #dbeafe;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 14px; color: #1e3a8a; font-family: 'Malgun Gothic', Arial, sans-serif;"><strong>승인기간:</strong> ${dateRangeText}</td>
                  <td align="right" style="font-size: 14px; color: #1e3a8a; font-family: 'Malgun Gothic', Arial, sans-serif;"><strong>총 ${statistics.totalCount}건</strong></td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- 요약 통계 -->
          <tr>
            <td style="padding: 20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-collapse: collapse;">
                <tr>
                  <td colspan="4" style="background-color: #1e40af; padding: 8px 12px; color: #ffffff; font-size: 13px; font-weight: bold; border: 1px solid #1e40af; font-family: 'Malgun Gothic', Arial, sans-serif;">요약 통계</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 12px; font-weight: bold; width: 25%; font-family: 'Malgun Gothic', Arial, sans-serif;">암종별</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 12px; font-weight: bold; width: 25%; font-family: 'Malgun Gothic', Arial, sans-serif;">허가유형별</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 12px; font-weight: bold; width: 25%; font-family: 'Malgun Gothic', Arial, sans-serif;">제조/수입</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 12px; font-weight: bold; width: 25%; font-family: 'Malgun Gothic', Arial, sans-serif;">작용기전</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 11px; color: #374151; vertical-align: top; font-family: 'Malgun Gothic', Arial, sans-serif;">${cancerStats}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 11px; color: #374151; vertical-align: top; font-family: 'Malgun Gothic', Arial, sans-serif;">${approvalStats}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 11px; color: #374151; vertical-align: top; font-family: 'Malgun Gothic', Arial, sans-serif;">수입 ${statistics.manufactureStats.import}건<br/>제조 ${statistics.manufactureStats.domestic}건</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 11px; color: #374151; vertical-align: top; font-family: 'Malgun Gothic', Arial, sans-serif;">${mechanismStats}</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- 품목 리스트 -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-collapse: collapse;">
                <tr>
                  <td colspan="6" style="background-color: #1e40af; padding: 8px 12px; color: #ffffff; font-size: 13px; font-weight: bold; border: 1px solid #1e40af; font-family: 'Malgun Gothic', Arial, sans-serif;">승인 품목 리스트 (${drugItems.length}건, 허가일 오름차순)</td>
                </tr>
                <tr style="background-color: #f1f5f9;">
                  <th style="padding: 8px; border: 1px solid #e2e8f0; font-size: 11px; font-weight: bold; text-align: center; color: #1e293b; width: 85px; font-family: 'Malgun Gothic', Arial, sans-serif;">허가일</th>
                  <th style="padding: 8px; border: 1px solid #e2e8f0; font-size: 11px; font-weight: bold; text-align: left; color: #1e293b; font-family: 'Malgun Gothic', Arial, sans-serif;">제품명</th>
                  <th style="padding: 8px; border: 1px solid #e2e8f0; font-size: 11px; font-weight: bold; text-align: left; color: #1e293b; width: 130px; font-family: 'Malgun Gothic', Arial, sans-serif;">업체명</th>
                  <th style="padding: 8px; border: 1px solid #e2e8f0; font-size: 11px; font-weight: bold; text-align: center; color: #1e293b; width: 75px; font-family: 'Malgun Gothic', Arial, sans-serif;">암종</th>
                  <th style="padding: 8px; border: 1px solid #e2e8f0; font-size: 11px; font-weight: bold; text-align: center; color: #1e293b; width: 80px; font-family: 'Malgun Gothic', Arial, sans-serif;">허가유형</th>
                  <th style="padding: 8px; border: 1px solid #e2e8f0; font-size: 11px; font-weight: bold; text-align: left; color: #1e293b; width: 110px; font-family: 'Malgun Gothic', Arial, sans-serif;">비고</th>
                </tr>
                ${drugRows}
              </table>
            </td>
          </tr>${additionalNote ? `
          <!-- 추가 메모 -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left: 4px solid #f59e0b; background-color: #fffbeb;">
                <tr>
                  <td style="padding: 12px 16px;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold; color: #92400e; font-family: 'Malgun Gothic', Arial, sans-serif;">추가 메모</p>
                    <p style="margin: 0; font-size: 12px; color: #78350f; font-family: 'Malgun Gothic', Arial, sans-serif;">${additionalNote}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ''}${attachExcel && excelFilename ? `
          <!-- 첨부 파일 -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0fdf4; border: 1px solid #86efac;">
                <tr>
                  <td style="padding: 10px 16px; font-size: 12px; color: #166534; font-family: 'Malgun Gothic', Arial, sans-serif;"><strong>첨부파일:</strong> ${excelFilename}</td>
                </tr>
              </table>
            </td>
          </tr>` : ''}
          <!-- 대시보드 링크 -->
          <tr>
            <td style="padding: 0 24px 20px 24px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: #1e40af; padding: 12px 32px; text-align: center;">
                    <a href="${DASHBOARD_URL}" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; font-family: 'Malgun Gothic', Arial, sans-serif;">대시보드 바로가기</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- 푸터 -->
          <tr>
            <td style="padding: 16px 24px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 11px; color: #9ca3af; text-align: center; font-family: 'Malgun Gothic', Arial, sans-serif;">본 이메일은 MFDS 항암제 승인현황 대시보드에서 자동 발송되었습니다.</p>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #9ca3af; text-align: center; font-family: 'Malgun Gothic', Arial, sans-serif;">데이터 출처: 식품의약품안전처 공공데이터포털</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
