import { useQuery } from '@tanstack/react-query';
import useConfigReducer from './useConfigReducer';
import axios from 'rest/request';

/**
 * Fetches prices of tokens from pools oraiDEX backend.
 * @returns The pool prices.
 */
export const useGetTokenPoolPrices = () => {
  // use cached first then update by query, if is limited then return cached version
  const [tokenPoolPrices, setTokenPoolPrices] = useConfigReducer('tokenPoolPrices');

  return useQuery({
    initialData: tokenPoolPrices,
    // make unique
    queryKey: ['tokenPoolPrices'],
    queryFn: async () => {
      const prices = await getTokenPrices();
      if (Object.keys(prices).length === 0) return tokenPoolPrices;
      setTokenPoolPrices(prices);
      return prices;
    }
  });
};

export const getTokenPrices = async () => {
  const res = await axios.get('/prices/pool-tokens');
  return res.data;
};

getTokenPrices();
