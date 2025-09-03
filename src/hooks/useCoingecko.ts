import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import useConfigReducer from './useConfigReducer';
import { CoinGeckoId } from '@oraichain/oraidex-common';
import { cosmosTokens, evmTokens } from 'initCommon';

/**
 * Chunks an array into smaller arrays of specified size
 * @param array - The array to chunk
 * @param chunkSize - The size of each chunk
 * @returns Array of chunks
 */
const chunkArray = <T>(array: readonly T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Constructs the URL to retrieve prices from CoinGecko.
 * @param tokens
 * @returns
 */
export const buildCoinGeckoPricesURL = (tokens: readonly string[]): string =>
  // `https://api.coingecko.com/api/v3/simple/price?ids=${tokens.join('%2C')}&vs_currencies=usd`;
  `https://price.market.orai.io/simple/price?ids=${tokens.join('%2C')}&vs_currencies=usd&include_24hr_vol=true`;

/**
 * Prices of each token.
 */
export type CoinGeckoPrices<T extends string> = {
  [C in T]: number | null;
};

/**
 * Fetches prices of tokens from CoinGecko.
 * @returns The CoinGecko prices.
 */
export const useCoinGeckoPrices = <T extends CoinGeckoId>(
  options: Omit<UseQueryOptions<CoinGeckoPrices<T>, unknown, CoinGeckoPrices<T>, string[]>, 'queryKey' | 'queryFn'> = {}
): UseQueryResult<CoinGeckoPrices<T>, unknown> => {
  const tokens = [...new Set([...cosmosTokens, ...evmTokens].map((t) => t.coinGeckoId))];
  tokens.sort();

  // use cached first then update by query, if is limited then return cached version
  const [cachePrices, setCachePrices] = useConfigReducer('coingecko');
  const [tokenRank, setTokenRank] = useConfigReducer('tokenRank');

  return useQuery({
    initialData: cachePrices,
    ...options,
    // make unique
    queryKey: ['coinGeckoPrices', ...tokens],
    queryFn: async ({ signal }) => {
      const { prices, ranks } = await getCoingeckoPrices(tokens, cachePrices, tokenRank, signal);
      setCachePrices(prices);
      setTokenRank(ranks);

      return Object.fromEntries(tokens.map((token) => [token, prices[token]])) as CoinGeckoPrices<T>;
    }
  });
};

export const getCoingeckoPrices = async <T extends CoinGeckoId>(
  tokens: string[],
  cachePrices?: CoinGeckoPrices<string>,
  cacheRank?: CoinGeckoPrices<string>,
  signal?: AbortSignal
): Promise<{ prices: CoinGeckoPrices<string>; ranks: CoinGeckoPrices<string> }> => {
  const CHUNK_SIZE = 40; // Maximum tokens per API call
  const tokenChunks = chunkArray(tokens, CHUNK_SIZE);

  const prices = { ...cachePrices };
  const ranks = { ...cacheRank };

  // Fetch prices for each chunk
  const fetchPromises = tokenChunks.map(async (chunk) => {
    try {
      const coingeckoPricesURL = buildCoinGeckoPricesURL(chunk);
      const resp = await fetch(coingeckoPricesURL, { signal });
      const rawData = (await resp.json()) as {
        [C in T]?: {
          usd: number;
          usd_24h_vol: number;
        };
      };

      // Update cached data
      for (const key in rawData) {
        prices[key] = rawData[key].usd;
        ranks[key] = rawData[key].usd_24h_vol || 0;
      }
    } catch (error) {
      console.log(`Error fetching prices for chunk: ${chunk.join(', ')}`, error);
    }
  });

  // Wait for all chunks to complete (using allSettled to avoid crashes)
  await Promise.allSettled(fetchPromises);

  return { prices, ranks };
};
