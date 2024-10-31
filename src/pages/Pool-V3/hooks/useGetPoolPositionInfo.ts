import { useQuery } from '@tanstack/react-query';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import { AmountDeltaResult, calculateAmountDelta, calculateSqrtPrice } from '@oraichain/oraiswap-v3';
import { useEffect, useState } from 'react';
import { getPoolPositionsInfo, PoolPositionsInfo } from 'rest/graphClient';

export const useGetPoolPositionInfo = (prices: CoinGeckoPrices<string>) => {
  const [poolPositionInfo, setPoolPositionInfo] = useState<Record<string, number>>({});

  const { data, refetch: refetchPoolPositionInfo } = useQuery<PoolPositionsInfo[]>(
    ['pool-v3-pool-positions-info', prices],
    () => getPoolPositionsInfo(),
    {
      refetchOnWindowFocus: false,
      placeholderData: [],
      // cacheTime: 5 * 60 * 1000,
    }
  );

  useEffect(() => {
    if (data.length === 0) return;
    data.forEach((item) => {
      const inRangePositions = item.positions.nodes.filter(
        (position) =>
          Number(position.tickLower) <= Number(item.currentTick) &&
          Number(position.tickUpper) >= Number(item.currentTick)
      );
      let tokenXPrice = prices[item.tokenX.coingeckoId] ?? 0;
      let tokenYPrice = prices[item.tokenY.coingeckoId] ?? 0;
      let activeTvl = 0;
      inRangePositions.forEach((position) => {
        const res: AmountDeltaResult = calculateAmountDelta(
          item.currentTick,
          calculateSqrtPrice(item.currentTick),
          BigInt(position.liquidity),
          false,
          position.tickUpper,
          position.tickLower
        );
        activeTvl +=
          Number(res.x / 10n ** BigInt(item.tokenX.decimals)) * tokenXPrice +
          Number(res.y / 10n ** BigInt(item.tokenY.decimals)) * tokenYPrice;
      });
      setPoolPositionInfo((prevState) => ({
        ...prevState,
        [item.id]: activeTvl
      }));
    });
  }, [data, prices]);

  return {
    poolPositionInfo,
    refetchPoolPositionInfo
  };
};
