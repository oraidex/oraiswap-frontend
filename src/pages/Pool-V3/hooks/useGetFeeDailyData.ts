import { useQuery } from '@tanstack/react-query';
import { PoolFeeAndLiquidityDaily } from 'libs/contractSingleton';
import { useEffect, useState } from 'react';
import { FeeDailyData, getFeeDailyData } from 'rest/graphClient';

export const useGetFeeDailyData = () => {
  const [feeDailyData, setFeeDailyData] = useState<PoolFeeAndLiquidityDaily[]>([]);
  const { data, refetch: refetchfeeDailyData } = useQuery<FeeDailyData[]>(['pool-v3-fee-daily-data'], getFeeDailyData, {
    refetchOnWindowFocus: false,
    placeholderData: [],
    // cacheTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (data.length === 0) return;
    const feeDailyData: PoolFeeAndLiquidityDaily[] = data.map((item) => {
      return {
        poolKey: item.poolId,
        feeDaily: item.feesInUSD,
        liquidityDaily: item.tvlUSD
      };
    });
    setFeeDailyData(feeDailyData);
  }, [data]);

  return {
    feeDailyData,
    refetchfeeDailyData
  };
};
