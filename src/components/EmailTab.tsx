import { useState, useMemo, useCallback, useRef } from 'react';
import { Mail, Send, Paperclip, ExternalLink, Loader2, X, Plus, ChevronDown, ChevronUp, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ExtendedDrugApproval } from '@/data/recentApprovals';
import { FilterState } from '@/components/FilterPanel';
import {
  calculateStatistics,
  getDateRangeText,
  generateEmailPreview,
  generateEmailHtmlPreview,
  generateExcelFilename,
  sortDrugItemsAsc,
} from '@/utils/emailDataGenerator';
import { generateExcelBase64 } from '@/utils/excelExport';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';

interface EmailTabProps {
  data: ExtendedDrugApproval[];
  filters: FilterState;
}

// 이메일 유효성 검사
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const EmailTab = ({ data, filters }: EmailTabProps) => {
  const { toast } = useToast();
  const recipientInputRef = useRef<HTMLInputElement>(null);
  const ccInputRef = useRef<HTMLInputElement>(null);

  // 수신자 상태 (태그 배열)
  const [recipientTags, setRecipientTags] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');

  // CC 상태
  const [showCc, setShowCc] = useState(false);
  const [ccTags, setCcTags] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');

  // 기타 폼 상태
  const [subject, setSubject] = useState('MFDS 항암제 승인현황 리포트');
  const [additionalNote, setAdditionalNote] = useState('');
  const [attachExcel, setAttachExcel] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // 발송 확인 다이얼로그
  const [showConfirm, setShowConfirm] = useState(false);

  // 미리보기 탭
  const [previewTab, setPreviewTab] = useState('html');

  // 기간 텍스트 및 통계 계산
  const dateRangeText = useMemo(() => getDateRangeText(filters), [filters]);
  const statistics = useMemo(() => calculateStatistics(data), [data]);
  const drugItems = useMemo(() => sortDrugItemsAsc(data), [data]);
  const excelFilename = useMemo(() => generateExcelFilename(filters), [filters]);
  const emailPreview = useMemo(
    () => generateEmailPreview(dateRangeText, statistics, additionalNote),
    [dateRangeText, statistics, additionalNote]
  );
  const emailHtmlPreview = useMemo(
    () => generateEmailHtmlPreview(dateRangeText, statistics, drugItems, additionalNote, attachExcel, excelFilename),
    [dateRangeText, statistics, drugItems, additionalNote, attachExcel, excelFilename]
  );

  // 태그 추가 (수신자/CC 공통)
  const addTag = useCallback((
    input: string,
    tags: string[],
    setTags: React.Dispatch<React.SetStateAction<string[]>>,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const emails = input
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    const newTags = [...tags];
    emails.forEach((email) => {
      if (!newTags.includes(email)) {
        newTags.push(email);
      }
    });
    setTags(newTags);
    setInput('');
  }, []);

  // 태그 삭제
  const removeTag = useCallback((
    index: number,
    tags: string[],
    setTags: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setTags(tags.filter((_, i) => i !== index));
  }, []);

  // 키보드 이벤트 (Enter, 쉼표, 세미콜론으로 태그 추가)
  const handleKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLInputElement>,
    input: string,
    tags: string[],
    setTags: React.Dispatch<React.SetStateAction<string[]>>,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === ';') && input.trim()) {
      e.preventDefault();
      addTag(input, tags, setTags, setInput);
    }
    // Backspace로 마지막 태그 삭제
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }, [addTag]);

  // blur 시 남은 입력값 태그로 추가
  const handleBlur = useCallback((
    input: string,
    tags: string[],
    setTags: React.Dispatch<React.SetStateAction<string[]>>,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (input.trim()) {
      addTag(input, tags, setTags, setInput);
    }
  }, [addTag]);

  // 유효한 수신자만 필터링
  const validRecipients = useMemo(() => recipientTags.filter(isValidEmail), [recipientTags]);
  const validCc = useMemo(() => ccTags.filter(isValidEmail), [ccTags]);

  // 발송 확인 요청
  const handleSendRequest = () => {
    if (validRecipients.length === 0) {
      toast({
        title: '수신자 오류',
        description: '유효한 이메일 주소를 하나 이상 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    setShowConfirm(true);
  };

  // 이메일 발송
  const handleSendEmail = async () => {
    setShowConfirm(false);
    setIsSending(true);

    try {
      // 엑셀 Base64 생성 (첨부 선택 시)
      let excelBase64: string | undefined;
      if (attachExcel) {
        try {
          const dateRange = {
            start: filters.startDate ? filters.startDate.toISOString().split('T')[0] : '',
            end: filters.endDate ? filters.endDate.toISOString().split('T')[0] : '',
          };
          excelBase64 = generateExcelBase64(data, { dateRange });
        } catch (excelError) {
          console.error('Excel 생성 오류:', excelError);
          throw new Error('엑셀 파일 생성 중 오류가 발생했습니다. 첨부 없이 재시도해 주세요.');
        }
      }

      // Edge Function 호출 — 미리보기 HTML을 본문으로 직접 전송
      const { data: responseData, error } = await supabase.functions.invoke('send-approval-email', {
        body: {
          recipients: validRecipients,
          cc: validCc.length > 0 ? validCc : undefined,
          subject,
          htmlBody: emailHtmlPreview,
          textBody: emailPreview,
          attachExcel,
          excelBase64,
          excelFilename,
        },
      });

      if (error) {
        // Edge Function 에러 상세 추출
        let errorMessage = '이메일 발송 중 오류가 발생했습니다.';
        if (error instanceof FunctionsHttpError) {
          try {
            const errorBody = await error.context.json();
            errorMessage = errorBody?.error || `서버 오류 (${error.context.status})`;
          } catch {
            errorMessage = `서버 오류 (HTTP ${error.context.status})`;
          }
        } else if (error instanceof FunctionsRelayError) {
          errorMessage = '서버 연결 오류: Edge Function에 연결할 수 없습니다.';
        } else if (error instanceof FunctionsFetchError) {
          errorMessage = '네트워크 오류: 서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.';
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        console.error('Edge Function 오류:', error);
        throw new Error(errorMessage);
      }

      // 응답 데이터 확인 (Edge Function이 success: false를 반환할 수 있음)
      if (responseData && responseData.success === false) {
        throw new Error(responseData.error || '이메일 발송에 실패했습니다.');
      }

      toast({
        title: '이메일 발송 완료',
        description: `${validRecipients.length}명에게 이메일이 발송되었습니다.${validCc.length > 0 ? ` (CC: ${validCc.length}명)` : ''}`,
      });

      // 폼 초기화
      setRecipientTags([]);
      setRecipientInput('');
      setCcTags([]);
      setCcInput('');
      setAdditionalNote('');
    } catch (error: unknown) {
      console.error('Email send error:', error);
      const message = error instanceof Error ? error.message : '이메일 발송 중 오류가 발생했습니다.';
      toast({
        title: '이메일 발송 실패',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // 태그 입력 UI 렌더링
  const renderTagInput = (
    label: string,
    tags: string[],
    setTags: React.Dispatch<React.SetStateAction<string[]>>,
    input: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    inputRef: React.RefObject<HTMLInputElement>,
    placeholder: string
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[42px] px-3 py-2 border rounded-md bg-background cursor-text focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, index) => (
          <Badge
            key={index}
            variant={isValidEmail(tag) ? 'secondary' : 'destructive'}
            className="gap-1 py-1 px-2 text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index, tags, setTags);
              }}
              className="ml-0.5 hover:bg-black/10 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, input, tags, setTags, setInput)}
          onBlur={() => handleBlur(input, tags, setTags, setInput)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[150px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {tags.filter(isValidEmail).length}명의 유효한 수신자
          {tags.length > tags.filter(isValidEmail).length && (
            <span className="text-destructive ml-1">
              ({tags.length - tags.filter(isValidEmail).length}개의 잘못된 형식)
            </span>
          )}
        </p>
      </div>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* 이메일 작성 폼 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            이메일 발송
          </CardTitle>
          <CardDescription>
            필터링된 항암제 승인현황을 이메일로 발송합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 수신자 (태그 입력) */}
          {renderTagInput(
            '수신자 (To)',
            recipientTags,
            setRecipientTags,
            recipientInput,
            setRecipientInput,
            recipientInputRef,
            '이메일 주소 입력 후 Enter (쉼표/세미콜론으로 구분 가능)'
          )}

          {/* CC 토글 및 입력 */}
          <div>
            <button
              type="button"
              onClick={() => setShowCc(!showCc)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showCc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <Plus className="w-3 h-3" />
              CC 추가
            </button>
            {showCc && (
              <div className="mt-2">
                {renderTagInput(
                  'CC',
                  ccTags,
                  setCcTags,
                  ccInput,
                  setCcInput,
                  ccInputRef,
                  'CC 수신자 입력'
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="subject">제목</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* 통계 요약 카드 */}
          <div className="space-y-2">
            <Label>승인현황 요약</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">총 품목</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{statistics.totalCount}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">수입</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{statistics.manufactureStats.import}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">제조</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{statistics.manufactureStats.domestic}</p>
              </div>
            </div>
            <div className="px-3 py-2 bg-muted rounded-md text-xs text-muted-foreground">
              기간: {dateRangeText}
            </div>
          </div>

          {/* 추가 메모 */}
          <div className="space-y-2">
            <Label htmlFor="additionalNote">추가 메모 (선택)</Label>
            <Textarea
              id="additionalNote"
              placeholder="이메일에 추가할 메모를 입력하세요"
              value={additionalNote}
              onChange={(e) => setAdditionalNote(e.target.value)}
              rows={2}
            />
          </div>

          {/* 엑셀 첨부 옵션 */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="attachExcel"
              checked={attachExcel}
              onCheckedChange={(checked) => setAttachExcel(checked === true)}
            />
            <Label htmlFor="attachExcel" className="flex items-center gap-2 cursor-pointer">
              <Paperclip className="w-4 h-4" />
              엑셀 파일 첨부
            </Label>
          </div>

          {attachExcel && (
            <p className="text-xs text-muted-foreground pl-6">
              {excelFilename}
            </p>
          )}

          {/* 대시보드 링크 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ExternalLink className="w-4 h-4" />
            대시보드 링크가 이메일에 포함됩니다
          </div>

          {/* 발송 버튼 */}
          <Button
            onClick={handleSendRequest}
            disabled={isSending || validRecipients.length === 0}
            className="w-full"
            size="lg"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                발송 중...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                이메일 발송 ({validRecipients.length}명)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 미리보기 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            이메일 미리보기
          </CardTitle>
          <CardDescription>
            발송될 이메일의 내용을 미리 확인하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={previewTab} onValueChange={setPreviewTab}>
            <TabsList className="w-full">
              <TabsTrigger value="html" className="flex-1 gap-1">
                <Eye className="w-3 h-3" />
                HTML 미리보기
              </TabsTrigger>
              <TabsTrigger value="text" className="flex-1 gap-1">
                <FileText className="w-3 h-3" />
                텍스트
              </TabsTrigger>
            </TabsList>
            <TabsContent value="html" className="mt-3">
              <div className="border rounded-lg overflow-hidden bg-white">
                <iframe
                  srcDoc={emailHtmlPreview}
                  className="w-full border-0"
                  style={{ height: '500px' }}
                  title="이메일 미리보기"
                  sandbox=""
                />
              </div>
            </TabsContent>
            <TabsContent value="text" className="mt-3">
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                {emailPreview}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 발송 확인 다이얼로그 */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이메일 발송 확인</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>다음 내용으로 이메일을 발송합니다.</p>
                <div className="bg-muted rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <span className="font-medium text-foreground min-w-[50px]">수신자:</span>
                    <span className="text-foreground">{validRecipients.join(', ')}</span>
                  </div>
                  {validCc.length > 0 && (
                    <div className="flex gap-2">
                      <span className="font-medium text-foreground min-w-[50px]">CC:</span>
                      <span className="text-foreground">{validCc.join(', ')}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <span className="font-medium text-foreground min-w-[50px]">제목:</span>
                    <span className="text-foreground">{subject}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-foreground min-w-[50px]">데이터:</span>
                    <span className="text-foreground">{statistics.totalCount}건 ({dateRangeText})</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-foreground min-w-[50px]">첨부:</span>
                    <span className="text-foreground">{attachExcel ? excelFilename : '없음'}</span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendEmail}>
              <Send className="w-4 h-4 mr-1" />
              발송
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmailTab;
