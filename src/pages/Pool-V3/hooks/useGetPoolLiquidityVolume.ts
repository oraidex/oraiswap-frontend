import { poolKeyToString } from 'libs/contractSingleton';
import { parsePoolKey } from '@oraichain/oraiswap-v3';
import { useQuery } from '@tanstack/react-query';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import { useEffect, useState } from 'react';
import { getPoolsLiqudityAndVolumeAmount, PoolLiquidityAndVolumeAmount } from 'rest/graphClient';
import axios from 'rest/request';
import { store } from 'store/configure';
import SingletonOraiswapV3 from 'libs/contractSingleton';
import useConfigReducer from 'hooks/useConfigReducer';

const AMM_V3_QUERY_SERVICE_URL = import.meta.env.AMM_V3_QUERY_SERVICE_URL ?? 'https://ammv3-query.oraidex.io';
export const getPoolsVolumeByTokenLatest24hFromIndexer = async (poolIds: string[]) => {
  try {
    const response = await axios.post(
      'v1/pool/volume-24h-by-token',
      { poolIds },
      { baseURL: AMM_V3_QUERY_SERVICE_URL }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error getPoolsVolumeByTokenLatest24hFromIndexer', error);
    return [];
  }
};

export const useGetPoolLiquidityVolume = (prices: CoinGeckoPrices<string>) => {
  const [poolLiquidities, setPoolLiquidities] = useState<Record<string, number>>({});
  const [poolVolume, setPoolVolume] = useState<Record<string, number>>({});
  const [poolV3Ids, setPoolV3Ids] = useConfigReducer('poolV3Ids') ?? [];
  const [poolV3TvlByTokens, setPoolV3TvlByTokens] = useConfigReducer('poolV3TvlByTokens') ?? [];

  useEffect(() => {
    (async () => {
      const poolV3 = await SingletonOraiswapV3.getPools();
      const poolV3Ids = poolV3.map((pool) => poolKeyToString(pool.pool_key));
      setPoolV3Ids(poolV3Ids);
    })();
  }, []);

  const { data, refetch: refetchPoolLiquidityVolume } = useQuery<PoolLiquidityAndVolumeAmount[]>(
    ['pool-v3-liquidty-volume-daily', prices],
    getPoolsLiqudityAndVolumeAmount,
    {
      refetchOnWindowFocus: false,
      placeholderData: [],
      cacheTime: 5 * 60 * 1000
    }
  );

  useEffect(() => {
    if (data.length > 0) setPoolV3TvlByTokens(data);
  }, [data]);

  const { data: dataHoursFromIndexer } = useQuery<any[]>(
    ['pool-v3-liquidty-volume-hourly-from-indexer', prices, poolV3Ids.length],
    () => getPoolsVolumeByTokenLatest24hFromIndexer(poolV3Ids),
    {
      refetchOnWindowFocus: false,
      placeholderData: [],
      cacheTime: 5 * 60 * 1000,
      enabled: poolV3Ids.length > 0
    }
  );
  useEffect(() => {
    if (poolV3Ids.length === 0 || Object.keys(prices).length === 0 || dataHoursFromIndexer.length === 0) return;
    const newPoolLiquidities: Record<string, number> = {};
    const newPoolVolumes: Record<string, number> = {};

    poolV3Ids.forEach((item) => {
      const poolTvl = poolV3TvlByTokens.find((d) => d.id === item);
      const { token_x, token_y } = parsePoolKey(item);
      const storage = store.getState();
      const allOraichainTokens = storage.token.allOraichainTokens || [];

      const [tokenXInfo, tokenYInfo] = [
        allOraichainTokens.find((t) => t.contractAddress === token_x || t.denom === token_x),
        allOraichainTokens.find((t) => t.contractAddress === token_y || t.denom === token_y)
      ];

      // skip for unknown token
      if (!tokenXInfo || !tokenYInfo) return;

      // TOODO: fallback price pool
      newPoolLiquidities[item] =
        (poolTvl?.totalValueLockedTokenX / 10 ** tokenXInfo?.decimals) * (prices[tokenXInfo?.coinGeckoId] ?? 0) +
        (poolTvl?.totalValueLockedTokenY / 10 ** tokenYInfo?.decimals) * (prices[tokenYInfo?.coinGeckoId] ?? 0);

      let poolVolumeInUsd = 0;
      const poolHourData = dataHoursFromIndexer.find((dataHour) => dataHour.id === item);
      if (poolHourData) {
        poolVolumeInUsd =
          // TOODO: fallback price pool
          (Number(poolHourData.volumeTokenX) / 10 ** tokenXInfo?.decimals) * (prices[tokenXInfo?.coinGeckoId] ?? 0) +
          (Number(poolHourData.volumeTokenY) / 10 ** tokenYInfo?.decimals) * (prices[tokenYInfo?.coinGeckoId] ?? 0);
      }

      newPoolVolumes[item] = poolVolumeInUsd;
    });

    setPoolLiquidities(newPoolLiquidities);
    setPoolVolume(newPoolVolumes);
  }, [poolV3TvlByTokens, prices, dataHoursFromIndexer, poolV3Ids]);

  return {
    poolLiquidities,
    poolVolume,
    refetchPoolLiquidityVolume
  };
};
