import { useQuery } from '@tanstack/react-query';
import axios from 'rest/request';

export const useTransactionHistory = (offerDenom: string, askDenom: string) => {
  const {
    data: txHistories,
    isLoading,
    isFetched,
    refetch: refetchTxHistories
  } = useQuery(['tx-histories-info-v2', offerDenom, askDenom], () => getDataSwapHistorical(offerDenom, askDenom), {
    refetchOnWindowFocus: true,
    placeholderData: [],
    enabled: !!offerDenom && !!askDenom
  });

  return { txHistories, isLoading, isFetched, refetchTxHistories };
};

export const LIMIT_TXS = 20;

export const getDataSwapHistorical = async (offerDenom: string, askDenom: string) => {
  try {
    const res = await axios.get('/v1/swap/historical', {
      params: {
        offerDenom,
        askDenom,
        limit: LIMIT_TXS
      }
    });
    return res.data;
  } catch (e) {
    console.error('getDataSwapHistorical', e);
    return [];
  }
};
