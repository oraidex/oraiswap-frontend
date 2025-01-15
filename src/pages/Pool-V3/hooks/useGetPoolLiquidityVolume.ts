import { useQuery } from '@tanstack/react-query';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import { useEffect, useState } from 'react';
import {
  getPoolsLiqudityAndVolumeAmount,
  getPoolsVolumeByTokenLatest24h,
  PoolLiquidityAndVolumeAmount
} from 'rest/graphClient';

export const useGetPoolLiquidityVolume = (prices: CoinGeckoPrices<string>) => {
  const [poolLiquidities, setPoolLiquidities] = useState<Record<string, number>>({});
  const [poolVolume, setPoolVolume] = useState<Record<string, number>>({});

  const { data, refetch: refetchPoolLiquidityVolume } = useQuery<PoolLiquidityAndVolumeAmount[]>(
    ['pool-v3-liquidty-volume-daily', prices],
    () => getPoolsLiqudityAndVolumeAmount(),
    {
      refetchOnWindowFocus: false,
      placeholderData: [],
      cacheTime: 5 * 60 * 1000
    }
  );

  const { data: dataHours } = useQuery<any[]>(
    ['pool-v3-liquidty-volume-hourly', prices],
    getPoolsVolumeByTokenLatest24h,
    {
      refetchOnWindowFocus: false,
      placeholderData: [],
      cacheTime: 5 * 60 * 1000
    }
  );

  useEffect(() => {
    if (data.length === 0 || Object.keys(prices).length === 0 || dataHours.length === 0) return;
    const newPoolLiquidities: Record<string, number> = {};
    const newPoolVolumes: Record<string, number> = {};

    data.forEach((item) => {
      newPoolLiquidities[item.id] =
        (item.totalValueLockedTokenX / 10 ** item.tokenX.decimals) * (prices[item.tokenX.coingeckoId] ?? 0) +
        (item.totalValueLockedTokenY / 10 ** item.tokenY.decimals) * (prices[item.tokenY.coingeckoId] ?? 0);

      let poolVolumeInUsd = 0;
      const poolHourData = dataHours.find((dataHour) => dataHour.id === item.id);
      if (poolHourData) {
        const volume24hByToken = poolHourData.poolHourData.aggregates.volume24hByToken ?? {
          volumeTokenX: 0,
          volumeTokenY: 0
        };

        poolVolumeInUsd =
          (Number(volume24hByToken.volumeTokenX) / 10 ** item.tokenX.decimals) *
            (prices[item.tokenX.coingeckoId] ?? 0) +
          (Number(volume24hByToken.volumeTokenY) / 10 ** item.tokenY.decimals) * (prices[item.tokenY.coingeckoId] ?? 0);
      }

      newPoolVolumes[item.id] = poolVolumeInUsd;
    });

    setPoolLiquidities(newPoolLiquidities);
    setPoolVolume(newPoolVolumes);
  }, [data, prices, dataHours]);

  return {
    poolLiquidities,
    poolVolume,
    refetchPoolLiquidityVolume
  };
};
