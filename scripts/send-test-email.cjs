/**
 * 테스트 이메일 발송 스크립트
 * - 대시보드 미리보기와 동일한 HTML 본문
 * - 대시보드 "전체 다운로드"와 동일한 엑셀 첨부
 * - Gmail SMTP 직접 연동
 */
const nodemailer = require('nodemailer');
const XLSX = require('xlsx-js-style');

// ============================================================
// 설정
// ============================================================
const GMAIL_USER = 'popice76@gmail.com';
const GMAIL_APP_PASSWORD = 'ipmssmqaibbadtjy';
const RECIPIENT = process.argv[2] || 'jisoo.kim@samyang.com';
const DASHBOARD_URL = 'https://mfds-cancer-watch.lovable.app';

// 대시보드 필터 기간
const FILTER_START = '2026-02-01';
const FILTER_END = '2026-02-26';
const DATE_RANGE_TEXT = '26-02-01 ~ 26-02-26';

// 파일명: MFDS_항암제_승인현황_2026-02-01_2026-02-26_20260227.xlsx
const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
const EXCEL_FILENAME = `MFDS_항암제_승인현황_${FILTER_START}_${FILTER_END}_${today}.xlsx`;

// ============================================================
// 2026년 2월 승인 데이터 (recentApprovals.ts와 동일)
// ============================================================
const drugs = [
  {
    id: '202600307',
    drugName: '덴브레이스주(데노수맙)',
    genericName: '데노수맙 (Denosumab)',
    company: '에이치케이이노엔(주)',
    indication: '다발성 골수종 및 고형암의 골전이 환자에서 골격계 증상 발생 위험 감소, 골거대세포종 치료',
    cancerType: '다발성골수종',
    approvalDate: '2026-02-04',
    status: 'approved',
    manufacturingCountry: '스페인',
    consignedManufacturer: 'GH GENHELIX S.A., UNIVERSAL FARMA, S.L.',
    approvalType: '자료제출의약품, 유전자재조합의약품 및 세포배양의약품',
    drugCategory: '전문의약품',
    manufactureType: '수입',
    notes: 'RANKL 억제제, 동등생물의약품(엑스지바 대조)',
  },
  {
    id: '202600308',
    drugName: '이잠비아프리필드시린지(데노수맙)',
    genericName: '데노수맙 (Denosumab)',
    company: '에이치케이이노엔(주)',
    indication: '다발성 골수종 및 고형암의 골전이 환자에서 골격계 증상 발생 위험 감소, 골거대세포종 치료',
    cancerType: '다발성골수종',
    approvalDate: '2026-02-04',
    status: 'approved',
    manufacturingCountry: '스페인',
    consignedManufacturer: 'GH GENHELIX S.A., UNIVERSAL FARMA, S.L.',
    approvalType: '자료제출의약품, 유전자재조합의약품 및 세포배양의약품',
    drugCategory: '전문의약품',
    manufactureType: '수입',
    notes: 'RANKL 억제제, 동등생물의약품(엑스지바 대조)',
  },
  {
    id: '202600376',
    drugName: '루마크라스정240밀리그램(소토라십)',
    genericName: '소토라십 (Sotorasib)',
    company: '암젠코리아유한회사',
    indication: 'KRAS G12C 변이 양성 국소 진행성 또는 전이성 비소세포폐암 치료',
    cancerType: '폐암',
    approvalDate: '2026-02-10',
    status: 'approved',
    manufacturingCountry: '캐나다, 미국',
    consignedManufacturer: 'Amgen Inc.',
    approvalType: '자료제출의약품',
    drugCategory: '전문의약품',
    manufactureType: '수입',
    notes: 'KRAS G12C 억제제, 표적항암제',
  },
  {
    id: '202600431',
    drugName: '풀베서드주(풀베스트란트)',
    genericName: '풀베스트란트 (Fulvestrant)',
    company: '삼진제약(주)',
    indication: 'HR-양성, HER2-음성 폐경기 이후 여성의 진행성 또는 전이성 유방암 치료',
    cancerType: '유방암',
    approvalDate: '2026-02-13',
    status: 'approved',
    manufacturingCountry: '한국',
    consignedManufacturer: '동국제약(주)',
    approvalType: '제네릭',
    drugCategory: '전문의약품',
    manufactureType: '제조',
    notes: 'SERD, 호르몬요법',
  },
  {
    id: '202600429',
    drugName: '인루리오정200밀리그램(임루네스트란트토실산염)',
    genericName: '임루네스트란트토실산염 (Imlunestrant Tosylate)',
    company: '한국릴리(유)',
    indication: 'ER-양성, HER2-음성, ESR1 변이가 있는 진행성 또는 전이성 유방암 환자에서 단독요법',
    cancerType: '유방암',
    approvalDate: '2026-02-13',
    status: 'approved',
    manufacturingCountry: '스페인',
    consignedManufacturer: 'Recipharm Leganes S.L.U.',
    approvalType: '신약',
    drugCategory: '전문의약품',
    manufactureType: '수입',
    notes: '경구 SERD, ESR1 변이 표적',
  },
];

// 허가일 오름차순 정렬
drugs.sort((a, b) => new Date(a.approvalDate).getTime() - new Date(b.approvalDate).getTime());

// ============================================================
// 통계 계산
// ============================================================
const cancerTypeStats = {};
const approvalTypeStats = {};
const mechanismStats = {};
let importCount = 0, domesticCount = 0;

drugs.forEach((d) => {
  cancerTypeStats[d.cancerType] = (cancerTypeStats[d.cancerType] || 0) + 1;
  if (d.approvalType) approvalTypeStats[d.approvalType] = (approvalTypeStats[d.approvalType] || 0) + 1;
  if (d.manufactureType === '수입') importCount++; else domesticCount++;
  if (d.notes) {
    if (d.notes.includes('SERD')) mechanismStats['SERD'] = (mechanismStats['SERD'] || 0) + 1;
    if (d.notes.includes('RANKL')) mechanismStats['RANKL 억제제'] = (mechanismStats['RANKL 억제제'] || 0) + 1;
    if (d.notes.includes('KRAS')) mechanismStats['KRAS G12C 억제제'] = (mechanismStats['KRAS G12C 억제제'] || 0) + 1;
  }
});

const statistics = {
  totalCount: drugs.length,
  cancerTypeStats,
  approvalTypeStats,
  manufactureStats: { import: importCount, domestic: domesticCount },
  mechanismStats,
};

// ============================================================
// 엑셀 생성 (대시보드 "전체 다운로드"와 동일한 구조)
// ============================================================
function generateExcelBase64() {
  const workbook = XLSX.utils.book_new();
  const dateRange = { start: FILTER_START, end: FILTER_END };

  // ----- 시트 1: 요약 -----
  const title = `${dateRange.start} ~ ${dateRange.end} 항암제 승인현황 요약`;
  const approvalTypes = {};
  const manufactureTypes = { '수입': 0, '제조': 0 };
  drugs.forEach((d) => {
    const t = d.approvalType || '기타';
    approvalTypes[t] = (approvalTypes[t] || 0) + 1;
    manufactureTypes[d.manufactureType || '제조'] = (manufactureTypes[d.manufactureType || '제조'] || 0) + 1;
  });

  const summaryRows = [
    [title, '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['승인 현황 통계', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['구분', '건수', '', '', '', ''],
    ['총 제품 수', drugs.length, '', '', '', ''],
  ];
  Object.entries(approvalTypes).forEach(([t, c]) => summaryRows.push([t, c, '', '', '', '']));
  summaryRows.push(['수입', manufactureTypes['수입'], '', '', '', '']);
  summaryRows.push(['제조', manufactureTypes['제조'], '', '', '', '']);
  summaryRows.push(['', '', '', '', '', ''], ['', '', '', '', '', '']);
  summaryRows.push(['제품별 상세 목록', '', '', '', '', ''], ['', '', '', '', '', '']);
  summaryRows.push(['품목기준코드', '제품명', '업체명', '허가유형', '제조국', '제조업체']);
  drugs.forEach((d) => summaryRows.push([d.id, d.drugName, d.company, d.approvalType || '-', d.manufacturingCountry || '-', d.consignedManufacturer || '']));

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 24 }, { wch: 35 }, { wch: 20 }, { wch: 14 }, { wch: 22 }, { wch: 60 }];
  summarySheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

  // 스타일 적용
  const HEADER = { font: { name: '맑은 고딕', bold: true, sz: 12, color: { rgb: 'FFFFFF' } }, fill: { patternType: 'solid', fgColor: { rgb: '374151' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: { top: { style: 'medium', color: { rgb: '1F2937' } }, bottom: { style: 'medium', color: { rgb: '1F2937' } }, left: { style: 'medium', color: { rgb: '1F2937' } }, right: { style: 'medium', color: { rgb: '1F2937' } } } };
  const DATA = { font: { name: '맑은 고딕', sz: 11, color: { rgb: '1F2937' } }, alignment: { vertical: 'center', wrapText: true }, border: { top: { style: 'thin', color: { rgb: '9CA3AF' } }, bottom: { style: 'thin', color: { rgb: '9CA3AF' } }, left: { style: 'thin', color: { rgb: '9CA3AF' } }, right: { style: 'thin', color: { rgb: '9CA3AF' } } } };
  const TITLE = { font: { name: '맑은 고딕', bold: true, sz: 16, color: { rgb: '1F2937' } }, fill: { patternType: 'solid', fgColor: { rgb: 'F3F4F6' } }, alignment: { horizontal: 'left', vertical: 'center' } };
  const SUB_HEADER = { font: { name: '맑은 고딕', bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { patternType: 'solid', fgColor: { rgb: '4B5563' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: { top: { style: 'medium', color: { rgb: '374151' } }, bottom: { style: 'medium', color: { rgb: '374151' } }, left: { style: 'medium', color: { rgb: '374151' } }, right: { style: 'medium', color: { rgb: '374151' } } } };

  const prodHeaderIdx = summaryRows.findIndex(r => r[0] === '품목기준코드');
  const range1 = XLSX.utils.decode_range(summarySheet['!ref'] || 'A1');
  for (let r = range1.s.r; r <= range1.e.r; r++) {
    for (let c = range1.s.c; c <= range1.e.c; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!summarySheet[ref]) summarySheet[ref] = { t: 's', v: '' };
      if (r === 0) summarySheet[ref].s = TITLE;
      else if (summaryRows[r]?.[0] === '구분' || summaryRows[r]?.[0] === '품목기준코드') summarySheet[ref].s = SUB_HEADER;
      else if (prodHeaderIdx > 0 && r > prodHeaderIdx) summarySheet[ref].s = DATA;
      else if (r >= 5 && r < prodHeaderIdx - 2) summarySheet[ref].s = DATA;
    }
  }
  XLSX.utils.book_append_sheet(workbook, summarySheet, '요약');

  // ----- 시트 2: 상세 목록 -----
  const detailHeaders = ['품목기준코드', '제품명', '업체명', '허가일', '주성분', '적응증', '암종', '전문일반', '허가유형', '제조/수입', '제조국', '제조업체', '비고'];
  const detailRows = [detailHeaders];
  drugs.forEach((d) => detailRows.push([d.id, d.drugName, d.company, d.approvalDate, d.genericName, d.indication, d.cancerType, d.drugCategory || '전문의약품', d.approvalType || '-', d.manufactureType || '제조', d.manufacturingCountry || '-', d.consignedManufacturer || '', d.notes || '']));

  const detailSheet = XLSX.utils.aoa_to_sheet(detailRows);
  detailSheet['!cols'] = [{ wch: 16 }, { wch: 38 }, { wch: 20 }, { wch: 14 }, { wch: 40 }, { wch: 70 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 60 }, { wch: 28 }];
  detailSheet['!rows'] = detailRows.map((_, i) => ({ hpt: i === 0 ? 38 : 34 }));

  const range2 = XLSX.utils.decode_range(detailSheet['!ref'] || 'A1');
  for (let r = range2.s.r; r <= range2.e.r; r++) {
    for (let c = range2.s.c; c <= range2.e.c; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!detailSheet[ref]) detailSheet[ref] = { t: 's', v: '' };
      detailSheet[ref].s = r === 0 ? HEADER : DATA;
    }
  }
  XLSX.utils.book_append_sheet(workbook, detailSheet, '상세목록');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
}

// ============================================================
// HTML 이메일 본문 (대시보드 미리보기와 동일)
// ============================================================
function formatStats(stats) {
  return Object.entries(stats).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}(${v}건)`).join(', ');
}

const drugRows = drugs.map((d, i) => {
  const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
  return `<tr style="background-color: ${bg};">
    <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 12px; white-space: nowrap; font-family: 'Malgun Gothic', Arial, sans-serif;">${d.approvalDate}</td>
    <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 12px; font-family: 'Malgun Gothic', Arial, sans-serif;">${d.drugName}</td>
    <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 12px; font-family: 'Malgun Gothic', Arial, sans-serif;">${d.company}</td>
    <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 12px; text-align: center; font-family: 'Malgun Gothic', Arial, sans-serif;">${d.cancerType}</td>
    <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 12px; text-align: center; font-family: 'Malgun Gothic', Arial, sans-serif;">${d.approvalType || '-'}</td>
    <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 12px; font-family: 'Malgun Gothic', Arial, sans-serif;">${d.notes || '-'}</td>
  </tr>`;
}).join('\n');

const htmlBody = `<!DOCTYPE html>
<html lang="ko" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Malgun Gothic', '맑은 고딕', Dotum, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" width="720" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #d1d5db;">
          <tr>
            <td style="background-color: #1e40af; padding: 20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="color: #ffffff; font-size: 20px; font-weight: bold; font-family: 'Malgun Gothic', Arial, sans-serif;">MFDS 항암제 승인현황 리포트</td></tr>
                <tr><td style="color: #bfdbfe; font-size: 13px; padding-top: 4px; font-family: 'Malgun Gothic', Arial, sans-serif;">식품의약품안전처 허가 데이터 기반</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #eff6ff; padding: 12px 24px; border-bottom: 1px solid #dbeafe;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 14px; color: #1e3a8a; font-family: 'Malgun Gothic', Arial, sans-serif;"><strong>승인기간:</strong> ${DATE_RANGE_TEXT}</td>
                  <td align="right" style="font-size: 14px; color: #1e3a8a; font-family: 'Malgun Gothic', Arial, sans-serif;"><strong>총 ${statistics.totalCount}건</strong></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-collapse: collapse;">
                <tr><td colspan="4" style="background-color: #1e40af; padding: 8px 12px; color: #ffffff; font-size: 13px; font-weight: bold; border: 1px solid #1e40af; font-family: 'Malgun Gothic', Arial, sans-serif;">요약 통계</td></tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 12px; font-weight: bold; width: 25%; font-family: 'Malgun Gothic', Arial, sans-serif;">암종별</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 12px; font-weight: bold; width: 25%; font-family: 'Malgun Gothic', Arial, sans-serif;">허가유형별</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 12px; font-weight: bold; width: 25%; font-family: 'Malgun Gothic', Arial, sans-serif;">제조/수입</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 12px; font-weight: bold; width: 25%; font-family: 'Malgun Gothic', Arial, sans-serif;">작용기전</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 11px; color: #374151; vertical-align: top; font-family: 'Malgun Gothic', Arial, sans-serif;">${formatStats(statistics.cancerTypeStats)}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 11px; color: #374151; vertical-align: top; font-family: 'Malgun Gothic', Arial, sans-serif;">${formatStats(statistics.approvalTypeStats)}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 11px; color: #374151; vertical-align: top; font-family: 'Malgun Gothic', Arial, sans-serif;">수입 ${statistics.manufactureStats.import}건<br/>제조 ${statistics.manufactureStats.domestic}건</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 11px; color: #374151; vertical-align: top; font-family: 'Malgun Gothic', Arial, sans-serif;">${formatStats(statistics.mechanismStats)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-collapse: collapse;">
                <tr><td colspan="6" style="background-color: #1e40af; padding: 8px 12px; color: #ffffff; font-size: 13px; font-weight: bold; border: 1px solid #1e40af; font-family: 'Malgun Gothic', Arial, sans-serif;">승인 품목 리스트 (${drugs.length}건, 허가일 오름차순)</td></tr>
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
          </tr>
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0fdf4; border: 1px solid #86efac;">
                <tr><td style="padding: 10px 16px; font-size: 12px; color: #166534; font-family: 'Malgun Gothic', Arial, sans-serif;"><strong>첨부파일:</strong> ${EXCEL_FILENAME}</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 20px 24px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="background-color: #1e40af; padding: 12px 32px; text-align: center;"><a href="${DASHBOARD_URL}" style="color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; font-family: 'Malgun Gothic', Arial, sans-serif;">대시보드 바로가기</a></td></tr>
              </table>
            </td>
          </tr>
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

// plain text 대체 본문
const textBody = `MFDS 항암제 승인현황 리포트
식품의약품안전처 허가 데이터 기반

승인기간: ${DATE_RANGE_TEXT} | 총 ${statistics.totalCount}건

[요약 통계]
- 암종별: ${formatStats(statistics.cancerTypeStats)}
- 허가유형별: ${formatStats(statistics.approvalTypeStats)}
- 제조/수입: 수입 ${statistics.manufactureStats.import}건, 제조 ${statistics.manufactureStats.domestic}건

[승인 품목 리스트 (${drugs.length}건)]
${drugs.map((d, i) => `${i + 1}. ${d.approvalDate} | ${d.drugName} | ${d.company} | ${d.cancerType} | ${d.approvalType}`).join('\n')}

첨부파일: ${EXCEL_FILENAME}
대시보드: ${DASHBOARD_URL}

---
본 이메일은 MFDS 항암제 승인현황 대시보드에서 자동 발송되었습니다.
데이터 출처: 식품의약품안전처 공공데이터포털`;

// ============================================================
// 이메일 발송
// ============================================================
async function sendEmail() {
  console.log(`수신자: ${RECIPIENT}`);
  console.log(`첨부파일: ${EXCEL_FILENAME}`);
  console.log(`품목 수: ${drugs.length}건`);
  console.log('');

  // 엑셀 생성
  console.log('엑셀 파일 생성 중...');
  const excelBase64 = generateExcelBase64();
  console.log(`엑셀 생성 완료 (${Math.round(excelBase64.length * 3 / 4 / 1024)}KB)`);

  // SMTP 연결
  console.log('Gmail SMTP 연결 중...');
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });

  await transporter.verify();
  console.log('Gmail SMTP 인증 성공');

  // 발송
  const info = await transporter.sendMail({
    from: `"MFDS 대시보드" <${GMAIL_USER}>`,
    to: RECIPIENT,
    subject: `MFDS 항암제 승인현황 리포트 (${DATE_RANGE_TEXT})`,
    text: textBody,
    html: htmlBody,
    attachments: [{
      filename: EXCEL_FILENAME,
      content: excelBase64,
      encoding: 'base64',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }],
  });

  console.log('');
  console.log(`✅ 발송 완료!`);
  console.log(`   messageId: ${info.messageId}`);
  console.log(`   SMTP 응답: ${info.response}`);
}

sendEmail().catch((err) => {
  console.error('❌ 발송 실패:', err.message);
  process.exit(1);
});
