import { useQuery } from '@tanstack/react-query';
import { fetchLedger } from '../services/ledger';

export const useLedger = () =>
  useQuery({
    queryKey: ['ledger'],
    queryFn: fetchLedger,
    staleTime: 1000 * 60 * 30,
  });
