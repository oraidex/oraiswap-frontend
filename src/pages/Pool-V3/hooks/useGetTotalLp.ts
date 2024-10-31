import { useQuery } from '@tanstack/react-query';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import { useEffect, useState } from 'react';
import { getTotalLpDataV3 } from 'rest/graphClient';
import { toDisplay } from '@oraichain/oraidex-common';

interface PositionData {
  principalAmountX: string;
  principalAmountY: string;
  pool: {
    tokenX: {
      coingeckoId: string;
      decimals: number;
    };
    tokenY: {
      coingeckoId: string;
      decimals: number;
    };
  };
}

export const useGetTotalLpV3 = (address: string, prices: CoinGeckoPrices<string>) => {
  const [totalLpV3Info, setTotalLpV3Info] = useState<number>(0);

  const { data, refetch: refetchPositionTotalLpV3 } = useQuery<PositionData[]>(
    ['positions-v3-total-lp-info', address],
    () => getTotalLpDataV3(address),
    {
      refetchOnWindowFocus: true,
      placeholderData: [],
      cacheTime: 5 * 60 * 1000
    }
  );

  useEffect(() => {
    if (!address || !data?.length) {
      setTotalLpV3Info(0);
      return;
    }
    const totalLp = data.reduce((acc, cur) => {
      const { tokenX, tokenY } = cur.pool;
      let priceX = 0;
      let priceY = 0;
      if (tokenX?.coingeckoId && tokenX?.decimals) {
        priceX = toDisplay(cur.principalAmountX, tokenX.decimals) * (prices[tokenX.coingeckoId] || 0);
      }
      if (tokenY?.coingeckoId && tokenY?.decimals) {
        priceY = toDisplay(cur.principalAmountY, tokenY.decimals) * (prices[tokenY.coingeckoId] || 0);
      }
      return acc + priceX + priceY;
    }, 0);

    setTotalLpV3Info(totalLp);
  }, [data, address]);

  return {
    totalLpV3Info,
    refetchPositionTotalLpV3
  };
};
