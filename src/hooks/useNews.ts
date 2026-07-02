import { useQuery } from '@tanstack/react-query';
import { fetchNewsDigest } from '../services/news';

export const useNews = () =>
  useQuery({
    queryKey: ['news'],
    queryFn: fetchNewsDigest,
    staleTime: 1000 * 60 * 60,
  });
