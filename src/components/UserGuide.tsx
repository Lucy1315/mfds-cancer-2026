import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Download, Upload, Filter, BarChart3, Table, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const UserGuide = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const guideItems = [
    {
      icon: Upload,
      title: '데이터 업로드',
      description: '식약처 공공데이터포털에서 다운로드한 Excel/CSV 파일을 업로드하면 자동으로 항암제만 필터링되어 대시보드에 반영됩니다.',
      steps: [
        '"파일 선택" 버튼 클릭',
        'Excel(.xlsx, .xls) 또는 CSV 파일 선택',
        '항암제 데이터 자동 추출 및 반영',
      ],
    },
    {
      icon: Filter,
      title: '필터 사용법',
      description: '날짜, 암종, 제조/수입, 업체명으로 데이터를 필터링할 수 있습니다.',
      steps: [
        '시작일/종료일: 허가일 기준 기간 설정',
        '암종: 특정 암종만 필터링 (폐암, 유방암 등)',
        '제조/수입: 국내 제조 또는 수입 구분',
        '업체명: 특정 제약사 필터링',
        '"초기화" 버튼으로 모든 필터 해제',
      ],
    },
    {
      icon: BarChart3,
      title: '차트 분석',
      description: '대시보드의 4가지 차트로 승인 현황을 한눈에 파악할 수 있습니다.',
      steps: [
        '암종별 분포: 파이 차트로 암종별 비율 확인',
        '허가유형별: 신약, 희귀의약품, 제네릭 구분',
        '제조/수입: 국내 제조 vs 수입 비율',
        '작용기전(MOA): 약물 작용기전별 분류',
      ],
    },
    {
      icon: Table,
      title: '데이터 테이블',
      description: '상세 품목 정보를 테이블에서 확인하고 검색할 수 있습니다.',
      steps: [
        '품목기준코드 클릭: 식약처 상세정보 페이지 이동',
        '테이블 내 검색: 제품명, 성분명, 업체명 등 검색',
        '컬럼 정보: 허가일, 주성분, 적응증, 암종 등',
      ],
    },
    {
      icon: Download,
      title: 'Excel 다운로드',
      description: '필터링된 데이터를 Excel 파일로 다운로드할 수 있습니다.',
      steps: [
        '"전체 다운로드": 현재 필터 적용된 전체 데이터',
        '"Excel 다운로드" (테이블): 테이블에 표시된 데이터',
        '시트 구성: 요약 시트 + 상세목록 시트',
        '스타일: 헤더 강조, 줄무늬 배경, 테두리 적용',
      ],
    },
    {
      icon: FileSpreadsheet,
      title: '데이터 출처',
      description: '본 대시보드는 식품의약품안전처 공개자료를 기반으로 합니다.',
      steps: [
        '공공데이터포털: data.go.kr',
        '의약품안전나라: nedrug.mfds.go.kr',
        '업데이트 주기: 신규 허가 시 수시 반영',
      ],
    },
  ];

  return (
    <div className="stat-card mb-6 animate-fade-in">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">사용방법 안내</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {isExpanded ? '접기' : '펼치기'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-[2000px] mt-6" : "max-h-0"
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guideItems.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">{item.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {item.description}
              </p>
              <ul className="space-y-1.5">
                {item.steps.map((step, stepIndex) => (
                  <li
                    key={stepIndex}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-primary font-medium min-w-[18px]">
                      {stepIndex + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">💡 Tip:</strong> 데이터를 업로드하면 기존 데이터 대신 업로드된 파일의 항암제 데이터가 표시됩니다. 
            "초기화" 버튼을 클릭하면 기본 데이터로 돌아갑니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
