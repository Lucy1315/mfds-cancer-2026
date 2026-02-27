import { useState, useMemo } from 'react';
import { Search, FileText, Download, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DrugApproval } from '@/data/drugData';
import { ExtendedDrugApproval } from '@/data/recentApprovals';
import { exportToExcel } from '@/utils/excelExport';
import ApprovalTypeBadge from '@/components/ApprovalTypeBadge';

interface DataTableProps {
  data: (DrugApproval | ExtendedDrugApproval)[];
  title?: string;
  dateRange?: { start: string; end: string };
}

const DataTable = ({ data, title = '품목 상세 정보', dateRange }: DataTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAndSortedData = useMemo(() => {
    let result = data;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((drug) =>
        drug.drugName.toLowerCase().includes(term) ||
        drug.genericName.toLowerCase().includes(term) ||
        drug.company.toLowerCase().includes(term) ||
        drug.indication.toLowerCase().includes(term) ||
        drug.cancerType.toLowerCase().includes(term) ||
        drug.id.toLowerCase().includes(term)
      );
    }
    // 과거순(오래된 날짜 먼저) 정렬
    return [...result].sort((a, b) => 
      new Date(a.approvalDate).getTime() - new Date(b.approvalDate).getTime()
    );
  }, [data, searchTerm]);

  const handleExport = () => {
    exportToExcel(filteredAndSortedData, {
      filename: 'MFDS_항암제_승인현황',
      dateRange,
    });
  };

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <span className="text-sm text-muted-foreground ml-2">Total: {filteredAndSortedData.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="테이블 내 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-[250px]"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Excel 다운로드
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-6">
        <table className="data-table min-w-[1800px]">
          <thead>
            <tr>
              <th className="w-[120px]">품목기준코드</th>
              <th className="w-[200px]">제품명</th>
              <th className="w-[160px]">업체명</th>
              <th className="w-[100px]">허가일</th>
              <th className="w-[180px]">주성분</th>
              <th className="min-w-[280px]">적응증</th>
              <th className="w-[100px]">암종</th>
              
              <th className="w-[100px]">허가유형</th>
              <th className="w-[80px]">제조/수입</th>
              <th className="w-[100px]">제조국</th>
              <th className="w-[180px]">제조업체</th>
              <th className="w-[120px]">비고</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-12 text-muted-foreground">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              filteredAndSortedData.map((drug, index) => {
                const ext = drug as ExtendedDrugApproval;
                const manufactureType = ext.manufactureType || (drug.company.includes('한국') ? '수입' : '제조');
                
                return (
                  <tr 
                    key={drug.id} 
                    className="animate-slide-in"
                    style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                  >
                    <td className="text-primary font-medium text-xs">
                      <a 
                        href={`https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq=${drug.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline inline-flex items-center gap-1"
                      >
                        {drug.id}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="font-medium">
                      <a 
                        href={`https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq=${drug.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {drug.drugName}
                      </a>
                    </td>
                    <td>{drug.company}</td>
                    <td className="text-muted-foreground whitespace-nowrap">{drug.approvalDate}</td>
                    <td className="text-primary text-sm">{drug.genericName || '-'}</td>
                    <td className="text-sm" title={drug.indication}>
                      {drug.indication.length > 60 
                        ? `${drug.indication.substring(0, 60)}...` 
                        : drug.indication}
                    </td>
                    <td>
                      <span className="text-primary text-sm font-medium">
                        {drug.cancerType}
                      </span>
                    </td>
                    <td>
                      <ApprovalTypeBadge approvalType={ext.approvalType} />
                    </td>
                    <td>
                      <span className={`text-xs ${manufactureType === '수입' ? 'text-primary' : ''}`}>
                        {manufactureType}
                      </span>
                    </td>
                    <td className="text-sm text-muted-foreground">
                      {ext.manufacturingCountry || '-'}
                    </td>
                    <td className="text-xs text-muted-foreground" title={ext.consignedManufacturer}>
                      {ext.consignedManufacturer 
                        ? (ext.consignedManufacturer.length > 40 
                            ? `${ext.consignedManufacturer.substring(0, 40)}...` 
                            : ext.consignedManufacturer)
                        : '-'}
                    </td>
                    <td className="text-xs text-muted-foreground">
                      {ext.notes || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
        총 {filteredAndSortedData.length}개 품목
      </div>
    </div>
  );
};

export default DataTable;
