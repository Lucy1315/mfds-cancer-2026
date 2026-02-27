import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// 항암제 키워드 및 필터링 로직 (방법론 문서 기반)
const EXCLUDE_KEYWORDS = [
  '암로디핀', 'amlodipine', '텔미사르탄', 'telmisartan', '클로르탈리돈',
  '로사르탄', 'losartan', '발사르탄', 'valsartan', '올메사르탄'
];

const ANTICANCER_KEYWORDS = [
  // 명확한 항암 키워드
  '항암', '백혈병', 'leukemia', '림프종', 'lymphoma', '골수종', 'myeloma',
  '흑색종', 'melanoma', '육종', 'sarcoma',
  // 항암제 성분 패턴
  'mab', 'nib', 'taxel', 'platin', 'rubicin', 'ciclib',
  // 특정 항암제 성분
  '퀴자티닙', 'quizartinib', '보라시데닙', 'vorasidenib', '엔잘루타미드', 'enzalutamide',
  '독소루비신', 'doxorubicin', '시스플라틴', 'cisplatin', '트라스투주맙', 'trastuzumab',
  '니볼루맙', 'nivolumab', '펨브롤리주맙', 'pembrolizumab',
  '다사티닙', 'dasatinib', '이마티닙', 'imatinib', '수니티닙', 'sunitinib',
  '베바시주맙', 'bevacizumab', '세툭시맙', 'cetuximab', '리툭시맙', 'rituximab',
  '팔보시클립', 'palbociclib', '올라파립', 'olaparib',
  // 구체적 암종
  '폐암', '유방암', '대장암', '위암', '간암', '췌장암', '전립선암', '난소암',
  '신장암', '방광암', '뇌종양', '교모세포종', '신경교종',
  // 항암 기전
  'checkpoint', 'immunotherapy', 'chemotherapy', 'targeted therapy',
  // 기타 항암 관련
  '종양', 'tumor', 'carcinoma', 'neoplasm', 'metastatic', '전이', '재발',
  'relapsed', 'refractory'
];

// 검색할 주요 항암제 키워드 (API 검색용)
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

function isAnticancerDrug(productName: string, ingredients: string): boolean {
  const combined = `${productName} ${ingredients}`.toLowerCase();
  
  // 제외 키워드 확인
  for (const keyword of EXCLUDE_KEYWORDS) {
    if (combined.includes(keyword.toLowerCase())) {
      return false;
    }
  }
  
  // 항암 키워드 확인
  for (const keyword of ANTICANCER_KEYWORDS) {
    if (combined.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

// 암종 추출
function extractCancerType(indication: string, productName: string): string {
  const combined = `${indication} ${productName}`.toLowerCase();
  const cancerTypes: Record<string, string[]> = {
    '폐암': ['폐암', '비소세포폐암', 'nsclc', 'lung cancer', 'sclc'],
    '유방암': ['유방암', 'breast cancer', 'her2'],
    '대장암': ['대장암', '결장암', '직장암', 'colorectal'],
    '위암': ['위암', 'gastric', 'stomach'],
    '간암': ['간암', '간세포암', 'hepatocellular', '렌비마'],
    '췌장암': ['췌장암', 'pancreatic'],
    '전립선암': ['전립선암', 'prostate', '엔잘루타미드'],
    '난소암': ['난소암', 'ovarian', '린파자'],
    '신장암': ['신장암', '신세포암', 'renal'],
    '방광암': ['방광암', '요로상피암', 'bladder'],
    '뇌종양': ['뇌종양', '신경교종', '교모세포종', 'glioma', 'glioblastoma', '보라시데닙', '보라니고'],
    '혈액암': ['백혈병', 'leukemia', 'aml', 'cml', 'all', '림프종', 'lymphoma', '골수종', 'myeloma', '다라잘렉스', '리툭산', '글리벡', '퀴자티닙', '반플리타'],
    '피부암': ['흑색종', 'melanoma', '젤보라프'],
  };
  
  for (const [type, keywords] of Object.entries(cancerTypes)) {
    if (keywords.some(k => combined.includes(k))) {
      return type;
    }
  }
  return '기타';
}

interface DrugItem {
  ITEM_SEQ: string;
  ITEM_NAME: string;
  ENTP_NAME: string;
  ITEM_PERMIT_DATE: string;
  EE_DOC_DATA?: string;
  UD_DOC_DATA?: string;
  NB_DOC_DATA?: string;
  MAIN_ITEM_INGR?: string;
  INGR_NAME?: string;
  CLASS_NAME?: string;
}

interface FetchResult {
  items: DrugItem[];
  totalCount: number;
}

async function fetchDrugsByKeyword(apiKey: string, keyword: string): Promise<FetchResult> {
  const baseUrl = 'https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnInq07';
  
  const params = new URLSearchParams({
    serviceKey: apiKey,
    pageNo: '1',
    numOfRows: '100',
    type: 'json',
    item_name: keyword,
  });

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    if (!response.ok) {
      console.error(`API error for keyword "${keyword}": ${response.status}`);
      return { items: [], totalCount: 0 };
    }

    const data = await response.json();
    const body = data?.response?.body || data?.body || {};
    const items = body?.items?.item || body?.items || [];
    const totalCount = body?.totalCount || 0;

    return {
      items: Array.isArray(items) ? items : items ? [items] : [],
      totalCount,
    };
  } catch (error) {
    console.error(`Fetch error for keyword "${keyword}":`, error);
    return { items: [], totalCount: 0 };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('DATA_GO_KR_API_KEY');
    if (!apiKey) {
      throw new Error('DATA_GO_KR_API_KEY is not configured');
    }

    const { searchType = 'list', searchTerm = '', fetchAll = false } = await req.json().catch(() => ({}));

    console.log(`Request: searchType=${searchType}, searchTerm=${searchTerm}, fetchAll=${fetchAll}`);

    let allItems: DrugItem[] = [];
    let totalOriginalCount = 0;

    if (searchTerm) {
      // 특정 검색어로 검색
      const result = await fetchDrugsByKeyword(apiKey, searchTerm);
      allItems = result.items;
      totalOriginalCount = result.totalCount;
    } else if (fetchAll || searchType === 'all') {
      // 주요 항암제 키워드로 병렬 검색
      console.log(`Fetching data for ${SEARCH_KEYWORDS.length} keywords...`);
      
      const results = await Promise.all(
        SEARCH_KEYWORDS.map(keyword => fetchDrugsByKeyword(apiKey, keyword))
      );

      // 결과 합치기 및 중복 제거
      const seenIds = new Set<string>();
      for (const result of results) {
        totalOriginalCount += result.totalCount;
        for (const item of result.items) {
          if (!seenIds.has(item.ITEM_SEQ)) {
            seenIds.add(item.ITEM_SEQ);
            allItems.push(item);
          }
        }
      }
      console.log(`Total unique items: ${allItems.length}`);
    } else {
      // 기본: 주요 키워드로 검색
      const result = await fetchDrugsByKeyword(apiKey, '키트루다');
      const result2 = await fetchDrugsByKeyword(apiKey, '옵디보');
      const result3 = await fetchDrugsByKeyword(apiKey, '허쥬마');
      
      const seenIds = new Set<string>();
      for (const item of [...result.items, ...result2.items, ...result3.items]) {
        if (!seenIds.has(item.ITEM_SEQ)) {
          seenIds.add(item.ITEM_SEQ);
          allItems.push(item);
        }
      }
      totalOriginalCount = result.totalCount + result2.totalCount + result3.totalCount;
    }

    // 항암제 필터링 및 데이터 변환
    const processedDrugs = allItems
      .filter((item: DrugItem) => {
        if (!item || !item.ITEM_NAME) return false;
        const ingredients = item.MAIN_ITEM_INGR || item.INGR_NAME || '';
        return isAnticancerDrug(item.ITEM_NAME, ingredients);
      })
      .map((item: DrugItem, index: number) => {
        const ingredients = item.MAIN_ITEM_INGR || item.INGR_NAME || '';
        const indication = item.EE_DOC_DATA || item.UD_DOC_DATA || item.NB_DOC_DATA || '';
        
        // XML 태그 제거
        const cleanIndication = indication.replace(/<[^>]*>/g, '').substring(0, 200);
        
        return {
          id: item.ITEM_SEQ || `drug-${index}`,
          drugName: item.ITEM_NAME || '',
          genericName: extractGenericName(item.ITEM_NAME, ingredients),
          company: item.ENTP_NAME || '',
          indication: cleanIndication || '정보 없음',
          cancerType: extractCancerType(cleanIndication, item.ITEM_NAME),
          approvalDate: formatDate(item.ITEM_PERMIT_DATE),
          status: 'approved' as const,
          className: item.CLASS_NAME || '',
        };
      })
      .sort((a, b) => b.approvalDate.localeCompare(a.approvalDate));

    return new Response(
      JSON.stringify({
        success: true,
        data: processedDrugs,
        totalCount: processedDrugs.length,
        originalCount: totalOriginalCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching drug data:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function extractGenericName(productName: string, ingredients: string): string {
  // 괄호 안의 성분명 추출
  const match = productName.match(/\(([^)]+)\)/);
  if (match) {
    return match[1].replace(/,.*/, '').trim();
  }
  // 주성분 있으면 반환
  if (ingredients) {
    return ingredients.split(',')[0].trim();
  }
  return '';
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  // 형식: 20240101 또는 2024-01-01
  const cleaned = dateStr.replace(/-/g, '');
  if (cleaned.length === 8) {
    return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 6)}-${cleaned.substring(6, 8)}`;
  }
  return dateStr;
}
