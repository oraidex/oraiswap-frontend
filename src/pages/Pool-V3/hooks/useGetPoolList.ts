import { parseAssetInfo } from '@oraichain/oraidex-common';
import { PoolWithPoolKey } from '@oraichain/oraidex-contracts-sdk/build/OraiswapV3.types';
import { useQuery } from '@tanstack/react-query';
import { inspectTokenFromOraiCommonApi } from 'helper';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import SingletonOraiswapV3 from 'libs/contractSingleton';
import { getPools } from 'pages/Pools/hooks';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToOraichainTokens } from 'reducer/token';
import { RootState } from 'store/configure';
import { PoolInfoResponse } from 'types/pool';
import { calcPrice } from '../components/PriceRangePlot/utils';
import { extractAddress, formatPoolData } from '../helpers/format';

export const useGetPoolList = (coingeckoPrices: CoinGeckoPrices<string>) => {
  const dispatch = useDispatch();
  const allOraichainTokens = useSelector((state: RootState) => state.token.allOraichainTokens || []);
  const [prices, setPrices] = useState<CoinGeckoPrices<string>>(coingeckoPrices);
  const [dataPool, setDataPool] = useState([...Array(0)]);
  const {
    data: poolList,
    refetch: refetchPoolList,
    isLoading: isLoadingGetPoolList
  } = useQuery<(PoolWithPoolKey | PoolInfoResponse)[]>(
    ['pool-v3-pools', Object.keys(coingeckoPrices).length],
    getPoolList,
    {
      refetchOnWindowFocus: false,
      cacheTime: 5 * 60 * 1000,
      enabled: Object.keys(coingeckoPrices).length > 0
    }
  );

  useEffect(() => {
    if (!poolList || poolList?.length === 0 || Object.keys(coingeckoPrices).length === 0) return;

    const newPrice = { ...coingeckoPrices };

    for (const pool of poolList) {
      if ('liquidityAddr' in pool) {
        continue;
      }

      const tokenX = allOraichainTokens.find((token) => extractAddress(token) === pool.pool_key.token_x);
      const tokenY = allOraichainTokens.find((token) => extractAddress(token) === pool.pool_key.token_y);

      if (!tokenX || !tokenY) continue;
      if (!prices[tokenX.coinGeckoId]) {
        if (prices[tokenY.coinGeckoId]) {
          // calculate price of X in Y from current sqrt price
          const price = calcPrice(pool.pool.current_tick_index, true, tokenX.decimals, tokenY.decimals);
          newPrice[tokenX.coinGeckoId || tokenX.denom] = price * prices[tokenY.coinGeckoId];
        }
      }

      if (!prices[tokenY.coinGeckoId]) {
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
    if (!poolList || poolList.length === 0) return;

    (async function formatListPools() {
      const tokenAddresses = new Set<string>();
      poolList.forEach((pool) => {
        if ('liquidityAddr' in pool) {
          tokenAddresses.add(parseAssetInfo(JSON.parse(pool.firstAssetInfo)));
          tokenAddresses.add(parseAssetInfo(JSON.parse(pool.secondAssetInfo)));
        } else {
          tokenAddresses.add(pool.pool_key.token_x);
          tokenAddresses.add(pool.pool_key.token_y);
        }
      });

      // loop through oraichainTokens, if token is already in oraichainTokens, remove it from tokenAddresses
      allOraichainTokens.forEach((token) => {
        if (tokenAddresses.has(extractAddress(token))) {
          tokenAddresses.delete(extractAddress(token));
        }
      });

      const HMSTR_DENOM = 'factory/orai17hyr3eg92fv34fdnkend48scu32hn26gqxw3hnwkfy904lk9r09qqzty42/HMSTR';
      if (tokenAddresses.has(HMSTR_DENOM)) tokenAddresses.delete(HMSTR_DENOM);
      if (tokenAddresses.size > 0) {
        const tokenAddressesArray = [...tokenAddresses];
        const tokenChunksPromise = [];
        for (let i = 0; i < tokenAddressesArray.length; i += 30) {
          const chunk = tokenAddressesArray.slice(i, i + 30);
          tokenChunksPromise.push(inspectTokenFromOraiCommonApi(chunk));
        }
        const tokens = await Promise.all(tokenChunksPromise);
        dispatch(addToOraichainTokens(tokens.flat()));
      }

      const listPools = (poolList || []).map((p) => formatPoolData(p));

      const fmtPools = (await Promise.all(listPools)).filter((e) => e.isValid);
      setDataPool(fmtPools);
    })();
  }, [poolList]);

  return {
    poolList: dataPool || [],
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
