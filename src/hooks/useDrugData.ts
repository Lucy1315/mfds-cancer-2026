import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DrugApproval } from '@/data/drugData';
import { toast } from '@/hooks/use-toast';

interface FetchDrugDataResponse {
  success: boolean;
  data: DrugApproval[];
  totalCount: number;
  originalCount: number;
  error?: string;
}

export function useDrugData() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiDrugs, setApiDrugs] = useState<DrugApproval[]>([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchDrugs = useCallback(async (searchTerm?: string, fetchAll = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<FetchDrugDataResponse>(
        'fetch-drug-data',
        {
          body: {
            searchType: fetchAll ? 'all' : 'list',
            searchTerm: searchTerm || '',
            fetchAll,
          },
        }
      );

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || '데이터를 가져오는데 실패했습니다.');
      }

      setApiDrugs(data.data);
      setHasLoadedOnce(true);
      
      toast({
        title: '데이터 로드 완료',
        description: `공공데이터 API에서 ${data.data.length}개의 항암제 정보를 가져왔습니다.`,
      });

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(message);
      toast({
        title: '데이터 로드 실패',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    apiDrugs,
    hasLoadedOnce,
    fetchDrugs,
  };
}
