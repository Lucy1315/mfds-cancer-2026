import * as XLSX from 'xlsx';
import { DrugApproval } from '@/data/drugData';
import { ExtendedDrugApproval } from '@/data/recentApprovals';
import { toast } from '@/hooks/use-toast';

export interface ParsedDrugData {
  drugs: ExtendedDrugApproval[];
  fileName: string;
}

// 암종 추출 함수
function extractCancerType(indication: string, productName: string): string {
  const combined = `${indication} ${productName}`.toLowerCase();
  const cancerTypes: Record<string, string[]> = {
    '폐암': ['폐암', '비소세포폐암', 'nsclc', 'lung'],
    '유방암': ['유방암', 'breast', 'her2'],
    '대장암': ['대장암', '결장암', '직장암', 'colorectal'],
    '위암': ['위암', 'gastric'],
    '간암': ['간암', '간세포암', 'hepatocellular'],
    '췌장암': ['췌장암', 'pancreatic'],
    '전립선암': ['전립선암', 'prostate'],
    '난소암': ['난소암', 'ovarian'],
    '신장암': ['신장암', '신세포암', 'renal'],
    '방광암': ['방광암', 'bladder'],
    '뇌종양': ['뇌종양', '신경교종', '교모세포종', 'glioma'],
    '혈액암': ['백혈병', 'leukemia', '림프종', 'lymphoma', '골수종', 'myeloma', '다발골수종'],
    '피부암': ['흑색종', 'melanoma'],
  };

  for (const [type, keywords] of Object.entries(cancerTypes)) {
    if (keywords.some(k => combined.includes(k))) {
      return type;
    }
  }
  return '기타';
}

function extractGenericName(productName: string): string {
  const match = productName.match(/\(([^)]+)\)/);
  return match ? match[1].trim() : '';
}

function inferCancerTypeFromName(productName: string): string {
  const name = productName.toLowerCase();

  if (name.includes('다사티닙') || name.includes('다사킨')) return '혈액암';
  if (name.includes('졸베툭시맙') || name.includes('빌로이')) return '위암';

  return '기타';
}

function inferMechanismNote(productName: string): string {
  const name = productName.toLowerCase();

  if (name.includes('다사티닙') || name.includes('다사킨')) return 'BCR-ABL TKI, 표적항암제';
  if (name.includes('졸베툭시맙') || name.includes('빌로이')) return 'CLDN18.2 표적 단클론항체';

  return '';
}

function isLikelyAntiCancerDrug(productName: string, indication: string): boolean {
  const text = `${productName} ${indication}`.toLowerCase();

  const includeKeywords = [
    '항암',
    '암',
    '백혈병',
    '림프종',
    '골수종',
    '다발골수종',
    'cancer',
    'oncology',
    '다사티닙',
    '다사킨',
    '졸베툭시맙',
    '빌로이',
  ];

  const excludeKeywords = [
    '피마사르탄',
    '아토르바스타틴',
    '에제티미브',
    '인플루엔자',
    '미녹시딜',
    '레비티라세탐',
    '텔미사르탄',
    '암로디핀',
    '보노프라잔',
    '피타바스타틴',
    '페노피브레이트',
  ];

  if (excludeKeywords.some((keyword) => text.includes(keyword))) {
    return false;
  }

  return includeKeywords.some((keyword) => text.includes(keyword));
}

// 컬럼명 매핑
const COLUMN_MAPPINGS: Record<string, keyof DrugApproval | 'extra'> = {
  '제품명': 'drugName',
  '약품명': 'drugName',
  'ITEM_NAME': 'drugName',
  '품목명': 'drugName',
  
  '성분명': 'genericName',
  '주성분': 'genericName',
  'MAIN_INGR': 'genericName',
  
  '업체명': 'company',
  '제조사': 'company',
  '제조/수입사': 'company',
  'ENTP_NAME': 'company',
  
  '적응증': 'indication',
  '효능효과': 'indication',
  'EE_DOC_DATA': 'indication',
  
  '암종': 'cancerType',
  
  '허가일': 'approvalDate',
  '허가일자': 'approvalDate',
  '승인일': 'approvalDate',
  'ITEM_PERMIT_DATE': 'approvalDate',
  
  '상태': 'status',
  
  '품목기준코드': 'id',
  'ITEM_SEQ': 'id',
  '허가심사유형': 'extra',
  '전문일반': 'extra',
};

export async function parseExcelFile(file: File): Promise<ParsedDrugData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // 첫 번째 시트 사용
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // JSON으로 변환
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        
        if (jsonData.length === 0) {
          throw new Error('Excel 파일에 데이터가 없습니다.');
        }

        // 컬럼 매핑
        const drugs: ExtendedDrugApproval[] = jsonData.map((row, index) => {
          const drug: Partial<ExtendedDrugApproval> = {
            id: `upload-${index}`,
            status: 'approved',
            approvalType: '',
            drugCategory: '',
            manufactureType: '',
            notes: '',
          };

          // 각 컬럼에서 데이터 추출
          for (const [excelCol, value] of Object.entries(row)) {
            const mappedKey = COLUMN_MAPPINGS[excelCol];
            if (mappedKey && mappedKey !== 'extra') {
              if (mappedKey === 'status') {
                const statusStr = String(value).toLowerCase();
                drug.status = statusStr.includes('심사') || statusStr.includes('pending') 
                  ? 'pending' 
                  : statusStr.includes('반려') || statusStr.includes('reject')
                  ? 'rejected'
                  : 'approved';
              } else if (mappedKey === 'approvalDate') {
                drug.approvalDate = formatExcelDate(value);
              } else if (mappedKey === 'id') {
                drug.id = String(value);
              } else {
                (drug as Record<string, unknown>)[mappedKey] = String(value || '');
              }
            } else if (excelCol === '허가심사유형') {
              drug.approvalType = String(value || '');
            } else if (excelCol === '전문일반') {
              drug.drugCategory = String(value || '');
            }
          }

          if (!drug.genericName && drug.drugName) {
            drug.genericName = extractGenericName(drug.drugName);
          }

          // 암종 자동 추출
          if (!drug.cancerType || drug.cancerType === '') {
            const extractedCancerType = extractCancerType(
              drug.indication || '',
              drug.drugName || ''
            );

            drug.cancerType = extractedCancerType === '기타'
              ? inferCancerTypeFromName(drug.drugName || '')
              : extractedCancerType;
          }

          if (!drug.notes && drug.drugName) {
            drug.notes = inferMechanismNote(drug.drugName);
          }

          return {
            id: drug.id || `upload-${index}`,
            drugName: drug.drugName || '',
            genericName: drug.genericName || '',
            company: drug.company || '',
            indication: drug.indication || '',
            cancerType: drug.cancerType || '기타',
            approvalDate: drug.approvalDate || '',
            status: drug.status || 'approved',
            approvalType: drug.approvalType || '',
            drugCategory: drug.drugCategory || '',
            manufactureType: drug.manufactureType || '',
            notes: drug.notes || '',
          } as ExtendedDrugApproval;
        }).filter(drug => drug.drugName) // 제품명 없는 행 제외
          .filter(drug => isLikelyAntiCancerDrug(drug.drugName, drug.indication));

        toast({
          title: '파일 업로드 성공',
          description: `${drugs.length}개의 항암제 데이터를 불러왔습니다.`,
        });

        resolve({
          drugs,
          fileName: file.name,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : '파일 파싱 중 오류가 발생했습니다.';
        toast({
          title: '파일 업로드 실패',
          description: message,
          variant: 'destructive',
        });
        reject(error);
      }
    };

    reader.onerror = () => {
      toast({
        title: '파일 읽기 실패',
        description: '파일을 읽을 수 없습니다.',
        variant: 'destructive',
      });
      reject(new Error('파일 읽기 실패'));
    };

    reader.readAsBinaryString(file);
  });
}

function formatExcelDate(value: unknown): string {
  if (!value) return '';
  
  // 숫자인 경우 (Excel 날짜 시리얼)
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
  }
  
  // 문자열인 경우
  const str = String(value);
  
  // YYYYMMDD 형식
  if (/^\d{8}$/.test(str)) {
    return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
  }
  
  // YYYY-MM-DD 형식
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  
  return str;
}
