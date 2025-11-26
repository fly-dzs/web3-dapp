// src/hooks/useEthPrice.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchEthPriceUSD } from '@/lib/coingecko';

export function useEthPrice() {
  return useQuery({
    queryKey: ['eth-price', 'usd'],
    queryFn: fetchEthPriceUSD,
    staleTime: 30 * 1000,         // 30s 内认为是“新鲜”的
    refetchInterval: 30 * 1000,   // 30s 自动刷新一次，按需调
  });
}
