import { useQuery } from '@tanstack/react-query';
import { getSwapTransactionData } from 'rest/graphClient';

export const useTransactionHistory = (poolKey: string) => {
  const {
    data: txHistories,
    isLoading,
    isFetching,
    isFetched,
    refetch: refetchTxHistories
  } = useQuery(['tx-histories-info-indexer', poolKey], () => getDataSwapHistorical(poolKey), {
    refetchOnWindowFocus: true,
    placeholderData: [],
    enabled: !!poolKey
  });

  return { txHistories, isLoading, refetchTxHistories, isFetching, isFetched };
};

export const LIMIT_TXS = 20;

export const getDataSwapHistorical = async (poolKey: string) => {
  try {
    const data = await getSwapTransactionData(poolKey);

    if (!Array.isArray(data)) {
      console.log('Expected data to be an array, but got:', data);
      return [];
    }

    return data.map((e) => {
      const { id, timestamp, swap } = e;

      const { senderId, swapRoutes = {} } = swap.nodes[0] || {};

      const { poolId, amountIn, amountOut, volumeUSD, xToY, feeUSD } = swapRoutes.nodes[0] || {};
      const [tokenX, tokenY, fee, spread] = poolId?.split('-') || [];

      const askDenom = xToY ? tokenY : tokenX;
      const returnAmount = amountOut;

      const offerAmount = amountIn;
      const offerDenom = xToY ? tokenX : tokenY;

      return {
        askDenom,
        commissionAmount: feeUSD,
        direction: xToY ? 'Sell' : 'Buy',
        offerAmount,
        offerDenom,
        volumeUSD,
        returnAmount,
        sender: senderId,
        spreadAmount: '0',
        taxAmount: '0',
        timestamp: Number(timestamp),
        txhash: id,
        txheight: 0,
        uniqueKey: id
      };
    });
  } catch (e) {
    console.error('getDataSwapHistorical', e);
    return [];
  }
};
