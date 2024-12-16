import { PoolWithPoolKey } from '@oraichain/oraidex-contracts-sdk/build/OraiswapV3.types';
import { useQuery } from '@tanstack/react-query';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import useTheme from 'hooks/useTheme';
import { oraichainTokens } from 'initCommon';
import SingletonOraiswapV3 from 'libs/contractSingleton';
import { getPools } from 'pages/Pools/hooks';
import { useCallback, useEffect, useState } from 'react';
import { PoolInfoResponse } from 'types/pool';
import { calcPrice } from '../components/PriceRangePlot/utils';
import { extractAddress, formatPoolData } from '../helpers/format';

export const useGetPoolList = (coingeckoPrices: CoinGeckoPrices<string>) => {
  const theme = useTheme();
  const [prices, setPrices] = useState<CoinGeckoPrices<string>>(coingeckoPrices);
  const [cachePrices, setCachePrices] = useConfigReducer('coingecko');
  const [loading, setLoading] = useState(false);
  const [dataPool, setDataPool] = useState([...Array(0)]);

  const formatPoolDataCallback = useCallback(
    (p) => {
      const isLight = theme === 'light';
      return formatPoolData(p, isLight);
    },
    [theme]
  );

  const {
    data: poolList,
    refetch: refetchPoolList,
    isLoading: isLoadingGetPoolList
  } = useQuery<(PoolWithPoolKey | PoolInfoResponse)[]>(['pool-v3-pools', coingeckoPrices], () => getPoolList(), {
    refetchOnWindowFocus: false,
    placeholderData: []
    // cacheTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (poolList.length === 0 || Object.keys(coingeckoPrices).length === 0) return;

    const newPrice = { ...coingeckoPrices };

    for (const pool of poolList) {
      if ('liquidityAddr' in pool) {
        continue;
      }

      const tokenX = oraichainTokens.find((token) => extractAddress(token) === pool.pool_key.token_x);
      const tokenY = oraichainTokens.find((token) => extractAddress(token) === pool.pool_key.token_y);

      if (!tokenX || !tokenY) continue;
      if (tokenX && !prices[tokenX.coinGeckoId]) {
        if (prices[tokenY.coinGeckoId]) {
          // calculate price of X in Y from current sqrt price
          const price = calcPrice(pool.pool.current_tick_index, true, tokenX.decimals, tokenY.decimals);
          newPrice[tokenX.coinGeckoId || tokenX.denom] = price * prices[tokenY.coinGeckoId];
        }
      }

      if (tokenY && !prices[tokenY.coinGeckoId]) {
        if (prices[tokenX.coinGeckoId]) {
          // calculate price of Y in X from current sqrt price
          const price = calcPrice(pool.pool.current_tick_index, false, tokenX.decimals, tokenY.decimals);
          newPrice[tokenY.coinGeckoId || tokenY.denom] = price * prices[tokenX.coinGeckoId];
        }
      }
    }

    setPrices(newPrice);
  }, [poolList]);

  useEffect(() => {
    if (poolList.length === 0 || Object.keys(coingeckoPrices).length === 0) return;

    (async function formatListPools() {
      const listPools = (poolList || []).map(formatPoolDataCallback);
      console.log({ listPools });
      const fmtPools = (await Promise.all(listPools)).filter((e) => e.isValid);
      console.log({ fmtPools });
      // const fmtPools = (poolList || []).map(formatPoolDataCallback).filter(async (e) => (await e).isValid);
      setDataPool(fmtPools);
    })();
  }, [poolList, coingeckoPrices]);

  return {
    poolList: dataPool,
    poolPrice: prices,
    isLoadingGetPoolList,
    refetchPoolList,
    loading: isLoadingGetPoolList
  };
};

const getPoolList = async (): Promise<PoolWithPoolKey[]> => {
  try {
    const [poolV3, poolV2] = await Promise.allSettled([SingletonOraiswapV3.getPools(), getPools()]);

    const res = [...(poolV3['value'] || []), ...(poolV2['value'] || [])];

    return res;
  } catch (error) {
    console.error('Failed to fetch all positions:', error);
    return [];
  }
};
