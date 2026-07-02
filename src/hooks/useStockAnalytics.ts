import { useQuery } from '@tanstack/react-query';
import { loadAllAnalytics } from '../services/analytics';

export const useStockAnalytics = () => {
  const query = useQuery({
    queryKey: ['analytics'],
    queryFn: loadAllAnalytics,
    staleTime: 1000 * 60 * 30,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
