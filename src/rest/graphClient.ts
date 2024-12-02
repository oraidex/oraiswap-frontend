import { gql, GraphQLClient } from 'graphql-request';
import { network } from 'index';
import { PRICE_SCALE } from 'libs/contractSingleton';
import { printBigint } from 'pages/Pool-V3/components/PriceRangePlot/utils';
import { TimeDuration, TokenPairHistoricalPrice } from 'reducer/poolDetailV3';
import axios from './request';

export const INDEXER_V3_URL = network.indexer_v3 ?? 'https://staging-ammv3-indexer.oraidex.io/';
export const graphqlClient = new GraphQLClient(INDEXER_V3_URL);

export const HOURS_PER_DAY = 24;
export const MILIS_PER_HOUR = 60 * 60 * 1000;
export const MILIS_PER_DAY = HOURS_PER_DAY * MILIS_PER_HOUR;

const CHUNK_QUERY = 100;

export const getFeeClaimData = async (address: string) => {
  try {
    const document = gql`
        {
          query {
            positions(
                filter: {
                    ownerId: { equalTo: "${address}" }
                    status: { equalTo: true }
                }
            ) {
                nodes {
                    id
                    poolId
                    status
                    principalAmountX
                    principalAmountY
                    fees {
                        nodes {
                            amountInUSD
                            amountX
                            amountY
                            claimFeeIncentiveTokens {
                                nodes {
                                    id
                                    tokenId
                                    token {
                                        id
                                        denom
                                        name
                                        logo
                                    }
                                    rewardAmount
                                }
                            }
                        }
                    }
                }
            }
          }
        }
      `;
    const result = await graphqlClient.request<any>(document);
    return result.query.positions.nodes || [];
  } catch (error) {
    console.log('error', error);
    return [];
  }
};

export const getSwapTransactionData = async (poolKey: string, limit: number = 20) => {
  try {
    const document = gql`
      {
        query {
          transactions (
            first: ${limit}
            orderBy: TIMESTAMP_DESC
            filter: { swapExist: true, swap: { every: { swapRoutes: { every: { poolId: { equalTo: "${poolKey}" } } } } } }
          ) {
            nodes {
              id
              timestamp
              swap {
                nodes {
                  senderId
                  swapRoutes {
                    nodes {
                      poolId
                      amountIn
                      amountOut
                      volumeUSD
                      xToY
                      feeUSD
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
    const result = await graphqlClient.request<any>(document);

    return result.query.transactions.nodes || [];
  } catch (error) {
    console.log('error', error);
    return [];
  }
};

export type PoolDayDataV3 = {
  keys: string[];
  sum: {
    tvlUSD: number;
    volumeInUSD: number;
    feesInUSD: number;
  };
};

export type PoolDayDataV3Raw = {
  query: {
    poolDayData: {
      groupedAggregates: PoolDayDataV3[];
    };
  };
};

export const getPoolDayDataV3 = async () => {
  try {
    const document = gql`
      {
        query {
          poolDayData {
            groupedAggregates(groupBy: DAY_INDEX) {
              keys
              sum {
                tvlUSD
                volumeInUSD
                feesInUSD
              }
            }
          }
        }
      }
    `;
    const result = await graphqlClient.request<PoolDayDataV3Raw>(document);
    return result.query.poolDayData.groupedAggregates || [];
  } catch (error) {
    console.log('error getPoolDayDataV3', error);
    return [];
  }
};

export const getTotalLpDataV3 = async (address: string) => {
  try {
    const document = gql`
      {
        query {
            positions(
              filter: {
                  owner: { id: { equalTo: "${address}" } }
                  status: { equalTo: true }
              }
            ) {
                nodes {
                    principalAmountX
                    principalAmountY
                    pool {
                        tokenX {
                            coingeckoId
                            decimals
                        }
                        tokenY {
                            coingeckoId
                            decimals
                        }
                    }
                }
            }
        }
      }
    `;
    const result = await graphqlClient.request<any>(document);
    return result.query.positions.nodes || [];
  } catch (error) {
    console.log('error getTotalLpDataV3', error);
    return [];
  }
};

export type FeeDailyData = {
  poolId: string;
  tvlUSD: number;
  feesInUSD: number;
};

export const getFeeDailyData = async (): Promise<FeeDailyData[]> => {
  const yesterdayIndex = Math.floor(Date.now() / MILIS_PER_DAY) - 1;
  try {
    const document = gql`
      {
        query {
          poolDayData(filter: { dayIndex: { equalTo: ${yesterdayIndex} } }) {
            nodes {
              poolId
              tvlUSD
              volumeInUSD
              feesInUSD
            }
          }
        }
      }
    `;
    const result = await graphqlClient.request<any>(document);
    return result.query.poolDayData.nodes || [];
  } catch (error) {
    console.log('error getPoolDayDataV3', error);
    return [];
  }
};

export type PoolLiquidityAndVolume = {
  id: string;
  totalValueLockedInUSD: number;
  poolDayData: {
    aggregates: {
      sum: {
        feesInUSD: number;
        volumeInUSD: number;
      };
    };
  };
};

export const getPoolsLiquidityAndVolume = async (): Promise<PoolLiquidityAndVolume[]> => {
  const yesterdayIndex = Math.floor(Date.now() / MILIS_PER_DAY) - 1;
  try {
    const document = gql`
      query {
        pools {
          nodes {
            id
            totalValueLockedInUSD
            poolDayData(filter: { dayIndex: { equalTo: ${yesterdayIndex} } }) {
              aggregates {
                sum {
                  feesInUSD
                  volumeInUSD
                }
              }
            }
          }
        }
      }
    `;
    const result = await graphqlClient.request<any>(document);
    return result.pools.nodes || [];
  } catch (error) {
    console.log('error getPoolsLiquidityAndVolume', error);
    return [];
  }
};

export type PoolLiquidityAndVolumeAmount = {
  id: string;
  tokenX: {
    coingeckoId: string;
    decimals: number;
  };
  tokenY: {
    coingeckoId: string;
    decimals: number;
  };
  totalValueLockedInUSD: number;
  totalValueLockedTokenX: number;
  totalValueLockedTokenY: number;
  poolDayData: {
    nodes: {
      volumeTokenX: number;
      volumeTokenY: number;
    }[];
  };
};

export const getPoolsLiqudityAndVolumeAmount = async (): Promise<PoolLiquidityAndVolumeAmount[]> => {
  const yesterdayIndex = Math.floor(Date.now() / MILIS_PER_DAY) - 1;
  try {
    const document = gql`
      query {
        pools {
          nodes {
            id
            tokenX {
                    coingeckoId
                    decimals
                }
                tokenY {
                    coingeckoId
                    decimals
                }
            totalValueLockedInUSD
            totalValueLockedTokenX
            totalValueLockedTokenY
            poolDayData(filter: { dayIndex: { equalTo: ${yesterdayIndex} } }, distinct: [ID]) {
              nodes {
                volumeTokenX
                volumeTokenY
              }
            }
          }
        }
      }
    `;
    const result = await graphqlClient.request<any>(document);
    return result.pools.nodes || [];
  } catch (error) {
    console.log('error getPoolsLiqudityAndVolumeAmount', error);
    return [];
  }
};

export const getPoolsVolumeByTokenLatest24h = async (): Promise<PoolLiquidityAndVolumeAmount[]> => {
  const currentHour = Math.floor(Date.now() / MILIS_PER_HOUR);
  const twentyHourBefore = currentHour - HOURS_PER_DAY;
  try {
    const document = gql`
      query Pools {
        pools {
          nodes {
            id
            tokenXId
            tokenYId
            tokenX {
              coingeckoId
              decimals
            }
            tokenY {
              coingeckoId
              decimals
            }
            poolHourData(filter: { hourIndex: { greaterThan: ${twentyHourBefore}, lessThanOrEqualTo: ${currentHour} } }, distinct: [ID]) {
              aggregates {
                volume24hByToken: sum {
                  volumeTokenX
                  volumeTokenY
                }
              }
            }
          }
        }
      }
    `;
    const result = await graphqlClient.request<any>(document);
    return result.pools.nodes || [];
  } catch (error) {
    console.log('error getPoolsLiqudityAndVolumeAmountHourly', error);
    return [];
  }
};

export const getChartPoolsV3ByDay = async (): Promise<any[]> => {
  try {
    const document = gql`
      query PoolDayData {
        poolDayData(orderBy: DAY_INDEX_DESC) {
          groupedAggregates(groupBy: DAY_INDEX) {
            keys
            sum {
              tvlUSD
              volumeInUSD
            }
          }
        }
      }
    `;
    const result = await graphqlClient.request<any>(document);
    return result.poolDayData.groupedAggregates || [];
  } catch (error) {
    console.log('error getChartPoolsVolumeByDay: ', error);
    return [];
  }
};

export type PositionInfo = {
  liquidity: string;
  tickLower: number;
  tickUpper: number;
};

export type PoolPositionsInfo = {
  id: string;
  currentTick: number;
  sqrtPrice: string;
  tokenX: {
    coingeckoId: string;
    decimals: number;
  };
  tokenY: {
    coingeckoId: string;
    decimals: number;
  };
  positions: {
    nodes: PositionInfo[];
  };
};

export const getPoolPositionsInfo = async (): Promise<PoolPositionsInfo[]> => {
  try {
    const document = gql`
      {
        query {
          pools {
            nodes {
              id
              currentTick
              sqrtPrice
              tokenX {
                coingeckoId
                decimals
              }
              tokenY {
                coingeckoId
                decimals
              }
              positions(filter: { status: { equalTo: true } }) {
                nodes {
                  liquidity
                  tickLower
                  tickUpper
                }
              }
            }
          }
        }
      }
    `;
    const result = await graphqlClient.request<any>(document);
    // console.log({ result });
    return result.query.pools.nodes || [];
  } catch (error) {
    console.log('error getPoolPositionsInfo', error);
    return [];
  }
};

export type Pool = {
  id: string;
  currentTick: number;
  liquidity: string;
};

export const getPools = async (): Promise<Pool[]> => {
  try {
    const document = gql`
      {
        query {
          pools {
            nodes {
              id
              currentTick
              liquidity
            }
          }
        }
      }
    `;
    const result = await graphqlClient.request<any>(document);
    return result.query.pools.nodes || [];
  } catch (error) {
    console.log('error getPools', error);
    return [];
  }
};

export type PoolDetail = {
  id: string;
  tokenX: {
    id: string;
    decimals: number;
    coingeckoId: string;
  };
  tokenY: {
    id: string;
    decimals: number;
    coingeckoId: string;
  };
  totalValueLockedTokenX: string;
  totalValueLockedTokenY: string;
  totalValueLockedInUSD: string;
};

export const getPoolDetail = async (poolId: string): Promise<PoolDetail> => {
  try {
    const document = gql`
      {
        query {
          pools(
            filter: {
              id: { equalTo: "${poolId}" }
            }
            first: 1
          ) {
            nodes {
              id
              tokenX {
                id
                decimals
                coingeckoId
              }
              tokenY {
                id
                decimals
                coingeckoId
              }
              totalValueLockedTokenX
              totalValueLockedTokenY
              totalValueLockedInUSD
            }
          }
        }
      }
    `;
    const result = await graphqlClient.request<any>(document);
    return result.query.pools.nodes[0] || null;
  } catch (error) {
    console.log('error getPoolDetail', error);
    return null;
  }
};

export const getPoolDetailFromBackend = async (poolId: string): Promise<PoolDetail> => {
  try {
    const res = await axios.get<PoolDetail[]>(`/v1/pool-v3/liquidity`);
    return res.data.find((pool) => pool.id === poolId) || null;
  } catch (error) {
    console.log('error getPoolDetail', error);
    return null;
  }
};

export type HistoricalPriceResponse = {
  poolId: string;
  sqrtPrice: string;
  hourIndex: number;
  pool: {
    tokenX: {
      decimals: number;
    };
    tokenY: {
      decimals: number;
    };
  };
};

export const getHistoricalPriceDataInHour = async (
  poolId: string,
  timeRange: TimeDuration = '7d'
): Promise<{ data: TokenPairHistoricalPrice[]; poolId: string }> => {
  try {
    let hourIndex = 0;
    const currentIndex = Math.floor(Date.now() / MILIS_PER_HOUR);
    switch (timeRange) {
      case '7d':
        hourIndex = currentIndex - 24 * 7;
        break;
      case '1mo':
        hourIndex = currentIndex - 24 * 30;
        break;
      case '3mo':
        hourIndex = currentIndex - 24 * 90;
        break;
      case '1y':
        hourIndex = currentIndex - 24 * 365;
        break;
      default:
        hourIndex = currentIndex - 24 * 7;
    }

    // create array of chunkOffset: [hourIndex, hourIndex + CHUNK_QUERY, ...] to current Index
    const length = Math.ceil((currentIndex - hourIndex) / CHUNK_QUERY);
    const chunkOffset = Array.from({ length }, (_, i) => hourIndex + i * CHUNK_QUERY);
    // if (currentIndex > chunkOffset[length - 1]) chunkOffset.push(currentIndex);
    let finalResult = [];

    // const before = performance.now();
    const historicalData = await Promise.all(
      chunkOffset.map((offset) => {
        const document = gql`
      {
        query {
          poolHourData(
            filter: {
              poolId: { equalTo: "${poolId}" }
              hourIndex: { greaterThanOrEqualTo: ${offset} lessThan: ${offset + CHUNK_QUERY} }
              }
              orderBy: [HOUR_INDEX_ASC]
              distinct: [HOUR_INDEX]
              ) {
                nodes {
                  poolId
                  sqrtPrice
                  hourIndex
                  pool {
                    tokenX {
                        decimals
                      }
                      tokenY {
                        decimals
                      }
                    }
                  }
                }
              }
          }
        `;
        return graphqlClient.request<any>(document);
      })
    );
    finalResult = historicalData.flatMap((item) => item.query.poolHourData.nodes);

    // if (timeRange === '1y') console.log('getHistoricalPriceData', after - before);

    const res = {
      data: finalResult
        .map((item: HistoricalPriceResponse) => {
          const sqrt = +printBigint(BigInt(item.sqrtPrice), Number(PRICE_SCALE));

          const proportion = sqrt * sqrt;

          const price = proportion / 10 ** (item.pool.tokenY.decimals - item.pool.tokenX.decimals);

          return {
            close: price,
            time: item.hourIndex * MILIS_PER_HOUR
          };
        })
        .sort((a, b) => a.time - b.time), // sort by time
      poolId
    };

    return res;
  } catch (error) {
    console.log('error getHistoricalPriceData', error);
    return {
      data: [],
      poolId
    };
  }
};

export type HistoricalPriceInDayResponse = {
  poolId: string;
  sqrtPrice: string;
  dayIndex: number;
  pool: {
    tokenX: {
      decimals: number;
    };
    tokenY: {
      decimals: number;
    };
  };
};

export const getHistoricalPriceDataInDay = async (
  poolId: string,
  timeRange: TimeDuration = '7d'
): Promise<{ data: TokenPairHistoricalPrice[]; poolId: string }> => {
  try {
    let dayIndex = 0;
    const currentIndex = Math.floor(Date.now() / MILIS_PER_DAY);
    switch (timeRange) {
      case '7d':
        dayIndex = currentIndex - 7;
        break;
      case '1mo':
        dayIndex = currentIndex - 30;
        break;
      case '3mo':
        dayIndex = currentIndex - 90;
        break;
      case '1y':
        dayIndex = currentIndex - 365;
        break;
      default:
        dayIndex = currentIndex - 7;
    }
    
    // create array of chunkOffset: [dayIndex, dayIndex + CHUNK_QUERY, ...] to current Index
    const length = Math.ceil((currentIndex - dayIndex) / CHUNK_QUERY);
    const chunkOffset = Array.from({ length }, (_, i) => dayIndex + i * CHUNK_QUERY);
    // if (currentIndex > chunkOffset[length - 1]) chunkOffset.push(currentIndex);

    let finalResult = [];

    // const before = performance.now();
    const historicalData = await Promise.all(
      chunkOffset.map((offset) => {
        const document = gql`
      {
        query {
          poolDayData(
            filter: {
              poolId: { equalTo: "${poolId}" }
              dayIndex: { greaterThanOrEqualTo: ${offset} lessThan: ${offset + CHUNK_QUERY} }
              }
              orderBy: [DAY_INDEX_ASC]
              distinct: [DAY_INDEX]
              ) {
                nodes {
                  poolId
                  sqrtPrice
                  dayIndex
                  pool {
                    tokenX {
                        decimals
                      }
                      tokenY {
                        decimals
                      }
                    }
                  }
                }
              }
          }
        `;
        return graphqlClient.request<any>(document);
      })
    );
    // const after = performance.now();

    finalResult = historicalData.flatMap((item) => item.query.poolDayData.nodes);

    // if (timeRange === '1y') console.log('getHistoricalPriceData', after - before);

    const res = {
      data: finalResult
        .map((item: HistoricalPriceInDayResponse) => {
          const sqrt = +printBigint(BigInt(item.sqrtPrice), Number(PRICE_SCALE));

          const proportion = sqrt * sqrt;

          const price = proportion / 10 ** (item.pool.tokenY.decimals - item.pool.tokenX.decimals);

          return {
            close: price,
            time: item.dayIndex * MILIS_PER_DAY
          };
        })
        .sort((a, b) => a.time - b.time), // sort by time
      poolId
    };

    // remove the last record and use the latest price
    res.data.pop();

    return res;
  } catch (error) {
    console.log('error getHistoricalPriceData', error);
    return {
      data: [],
      poolId
    };
  }
};
