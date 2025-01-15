import { TokenInfo } from '@oraichain/oraidex-common';
import { useQuery } from '@tanstack/react-query';
import { fetchTokenInfo, getPairAmountInfo } from 'rest/api';
import { PoolDetail } from 'types/pool';

export const useGetPairInfo = ({ token1, token2, info: pairInfoData }: PoolDetail) => {
  const { data: lpTokenInfoData, refetch: refetchLpTokenInfoData } = useQuery(
    ['token-info', pairInfoData],
    () =>
      fetchTokenInfo({
        contractAddress: pairInfoData.liquidityAddr
      } as TokenInfo),
    {
      enabled: !!pairInfoData,
      refetchOnWindowFocus: false,
      // keepPreviousData: true,
      refetchOnMount: true
    }
  );

  const { data: pairAmountInfoData, refetch: refetchPairAmountInfo } = useQuery(
    ['pair-amount-info', token1, token2],
    () => {
      return getPairAmountInfo(token1, token2);
    },
    {
      enabled: !!token1 && !!token2,
      refetchOnWindowFocus: false,
      refetchInterval: 10000
    }
  );

  return { lpTokenInfoData, pairAmountInfoData, refetchPairAmountInfo, refetchLpTokenInfoData };
};
