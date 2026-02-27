import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Upload, RotateCcw, Search, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export interface FilterState {
  startDate: Date | undefined;
  endDate: Date | undefined;
  cancerType: string;
  manufactureType: string;
  company: string;
  approvalType: string;
  mechanismType: string;
}

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  onFileUpload: (file: File) => void;
  cancerTypes: string[];
  companies: string[];
  approvalTypes: string[];
  mechanismTypes: string[];
}

const FilterPanel = ({
  filters,
  onFiltersChange,
  onReset,
  onFileUpload,
  cancerTypes,
  companies,
  approvalTypes,
  mechanismTypes,
}: FilterPanelProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      onFileUpload(file);
      setTimeout(() => setIsUploading(false), 1000);
      e.target.value = '';
    }
  };

  const updateFilter = (key: keyof FilterState, value: string | Date | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="stat-card mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">필터 & 데이터 업로드</h3>
        </div>
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          초기화
        </Button>
      </div>

      {/* 파일 업로드 영역 */}
      <div className="mb-6 p-4 border-2 border-dashed border-border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">Excel/CSV 데이터 업로드</p>
              <p className="text-sm text-muted-foreground">
                지원 형식: Excel(.xlsx, .xls), CSV - 항암제 승인 데이터 자동 반영
              </p>
            </div>
          </div>
          <label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button variant="default" className="gap-2 cursor-pointer" asChild>
              <span>
                <Upload className="w-4 h-4" />
                파일 선택
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* 필터 영역 - 한 줄 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* 시작일 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">시작일</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? format(filters.startDate, "yy-MM-dd") : "시작일"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.startDate}
                onSelect={(date) => updateFilter('startDate', date)}
                initialFocus
                locale={ko}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 종료일 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">종료일</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? format(filters.endDate, "yy-MM-dd") : "종료일"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.endDate}
                onSelect={(date) => updateFilter('endDate', date)}
                initialFocus
                locale={ko}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 암종 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">암종 (Cancer Type)</label>
          <Select value={filters.cancerType} onValueChange={(v) => updateFilter('cancerType', v)}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">전체</SelectItem>
              {cancerTypes.filter(t => t !== '전체').map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 제조/수입 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">제조/수입</label>
          <Select value={filters.manufactureType} onValueChange={(v) => updateFilter('manufactureType', v)}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">전체</SelectItem>
              <SelectItem value="제조">제조</SelectItem>
              <SelectItem value="수입">수입</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 업체명 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">업체명</label>
          <Select value={filters.company} onValueChange={(v) => updateFilter('company', v)}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">전체</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company} value={company}>{company}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 허가유형 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">허가유형</label>
          <Select value={filters.approvalType} onValueChange={(v) => updateFilter('approvalType', v)}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">전체</SelectItem>
              {approvalTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 작용기전 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">작용기전</label>
          <Select value={filters.mechanismType} onValueChange={(v) => updateFilter('mechanismType', v)}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">전체</SelectItem>
              {mechanismTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
