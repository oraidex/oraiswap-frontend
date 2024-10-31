import { CosmWasmClient, fromBinary, SigningCosmWasmClient, toBinary } from '@cosmjs/cosmwasm-stargate';
import {
  Tickmap,
  getMaxTick,
  getMinTick,
  PoolKey,
  LiquidityTick,
  positionToTick,
  calculateSqrtPrice,
  getChunkSize,
  getLiquidityTicksLimit,
  getMaxTickmapQuerySize,
  OraiswapV3Handler,
  parsePoolKey,
  calculateAmountDelta
} from '@oraichain/oraiswap-v3';
import { network } from 'config/networks';
import {
  AssetInfo,
  OraiswapTokenClient,
  OraiswapTokenQueryClient,
  OraiswapV3Client,
  OraiswapV3QueryClient
} from '@oraichain/oraidex-contracts-sdk';
import {
  ArrayOfAsset,
  ArrayOfPosition,
  ArrayOfTupleOfUint16AndUint64,
  FeeTier,
  Pool,
  PoolWithPoolKey,
  Position,
  Tick
} from '@oraichain/oraidex-contracts-sdk/build/OraiswapV3.types';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import { TokenDataOnChain } from 'pages/Pool-V3/components/PriceRangePlot/utils';
import Axios from 'axios';
import { throttleAdapterEnhancer, retryAdapterEnhancer } from 'axios-extensions';
import { AXIOS_TIMEOUT, AXIOS_THROTTLE_THRESHOLD, toDisplay } from '@oraichain/oraidex-common';
import { CoinGeckoId } from '@oraichain/oraidex-common';
import { oraichainTokens } from '@oraichain/oraidex-common';
import { getPools } from 'rest/graphClient';
import { MulticallQueryClient } from '@oraichain/common-contracts-sdk';
import { extractAddress } from 'pages/Pool-V3/helpers/format';
import { PoolInfoResponse } from 'types/pool';

export const ALL_FEE_TIERS_DATA: FeeTier[] = [
  { fee: 100000000, tick_spacing: 1 },
  { fee: 500000000, tick_spacing: 10 },
  { fee: 3000000000, tick_spacing: 100 },
  { fee: 10000000000, tick_spacing: 100 }
];

export interface Token {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
  balance?: bigint;
  coingeckoId?: string;
  isUnknown?: boolean;
}

const defaultState = {
  dexAddress: network.pool_v3
};

export const parse = (value: any) => {
  if (isArray(value)) {
    return value.map((element: any) => parse(element));
  }

  if (isObject(value)) {
    const newValue: { [key: string]: any } = {};

    Object.entries(value as { [key: string]: any }).forEach(([key, value]) => {
      newValue[key] = parse(value);
    });

    return newValue;
  }

  if (isBoolean(value) || isNumber(value)) {
    return value;
  }

  try {
    return BigInt(value);
  } catch (e) {
    return value;
  }
};

const isBoolean = (value: any): boolean => {
  return typeof value === 'boolean';
};

const isNumber = (value: any): boolean => {
  return typeof value === 'number';
};

const isArray = (value: any): boolean => {
  return Array.isArray(value);
};

const isObject = (value: any): boolean => {
  return typeof value === 'object' && value !== null;
};

export const CHUNK_SIZE = getChunkSize();
export const LIQUIDITY_TICKS_LIMIT = getLiquidityTicksLimit();
export const MAX_TICKMAP_QUERY_SIZE = getMaxTickmapQuerySize();

export const poolKeyToString = (poolKey: PoolKey): string => {
  return poolKey.token_x + '-' + poolKey.token_y + '-' + poolKey.fee_tier.fee + '-' + poolKey.fee_tier.tick_spacing;
};

export const stringToPoolKey = (str: string): PoolKey => {
  try {
    const [token_x, token_y, fee, tick_spacing] = str.split('-');

    if (!token_x || !token_y || !fee || !tick_spacing) {
      throw 'Cannot convert string to pool_key';
    }

    return {
      token_x,
      token_y,
      fee_tier: {
        fee: Number(fee),
        tick_spacing: Number(tick_spacing)
      }
    };
  } catch (error) {
    console.log('error', error);
    return null;
  }
};

export const assert = (condition: boolean, message?: string) => {
  if (!condition) {
    throw new Error(message || 'assertion failed');
  }
};

export const integerSafeCast = (value: bigint): number => {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new Error('Integer value is outside the safe range for Numbers');
  }
  return Number(value);
};

export interface PoolInfo {
  id: string;
  currentTick: string;
  tokenXId: string;
  tokenYId: string;
  fee: string;
  tickSpacing: number;
  sqrtPrice: string;
  liquidity: string;
  totalValueLockedTokenX: string;
  totalValueLockedTokenY: string;
  totalValueLockedUSD: string; // 0
  updatedAt: string;
  createdAt: string;
}

export interface PositionInfo {
  id: string;
  tokenId: number;
  poolId: string;
  status: boolean;
  liquidity: string;
  tickLower: string;
  tickUpper: string;
  principalAmountX: string;
  principalAmountY: string;
  createdAt: string;
}

// this should be moved to redux
export default class SingletonOraiswapV3 {
  private static _dex: OraiswapV3Client;
  private static _cosmwasmClient: CosmWasmClient;
  private static _handler: OraiswapV3Handler;
  private static _sender: string;

  public static get dex() {
    return this._dex;
  }

  public static get cosmwasmClient() {
    return this._cosmwasmClient;
  }

  private constructor() {}

  public static async load(signingClient: SigningCosmWasmClient, sender: string) {
    if (!this._cosmwasmClient) {
      this._cosmwasmClient = await CosmWasmClient.connect(network.rpc);
    }
    if (!this._dex) {
      this._dex = new OraiswapV3Client(signingClient, sender, defaultState.dexAddress);
    }
    if (this._sender !== sender) {
      this._sender = sender;
      this._dex = new OraiswapV3Client(signingClient, sender, defaultState.dexAddress);
    }
    this.loadHandler();
  }

  public static async loadCosmwasmClient() {
    if (!this._cosmwasmClient) {
      this._cosmwasmClient = await CosmWasmClient.connect(network.rpc);
    }
  }

  public static async loadHandler() {
    await this.loadCosmwasmClient();
    if (!this._handler) {
      this._handler = new OraiswapV3Handler(this._cosmwasmClient, network.pool_v3);
    }
  }

  public static async queryBalance(address: string, tokenDenom: string = 'orai') {
    const { amount } = await this._cosmwasmClient.getBalance(address, tokenDenom);
    return amount;
  }

  public static async getRawTickmap(
    poolKey: PoolKey,
    lowerTick: number,
    upperTick: number,
    xToY: boolean
  ): Promise<ArrayOfTupleOfUint16AndUint64> {
    await this.loadHandler();
    const tickmaps = await this._handler.tickMap(poolKey, lowerTick, upperTick, xToY);
    return tickmaps as any;
  }

  public static async getTokensInfo(tokens: string[], address?: string): Promise<TokenDataOnChain[]> {
    return await Promise.all(
      tokens.map(async (token) => {
        if (token.includes('ibc') || token == 'orai') {
          const balance = address ? BigInt(await this.queryBalance(address, token)) : 0n;
          return {
            address: token,
            balance: balance,
            symbol: token == 'orai' ? 'ORAI' : 'IBC',
            decimals: 6,
            name: token == 'orai' ? 'ORAI' : 'IBC Token'
          };
        }

        const queryClient = new OraiswapTokenQueryClient(this._cosmwasmClient, token);
        const balance = address ? await queryClient.balance({ address: address }) : { balance: '0' };
        const tokenInfo = await queryClient.tokenInfo();
        const symbol = tokenInfo.symbol;
        const decimals = tokenInfo.decimals;
        const name = tokenInfo.name;

        return {
          address: token,
          balance: BigInt(balance.balance),
          symbol: symbol,
          decimals,
          name: name
        };
      })
    );
  }

  public static async getPools(): Promise<PoolWithPoolKey[]> {
    await this.loadHandler();
    try {
      return await this._handler.getPools();
    } catch (error) {
      console.log('error', error);
      const pools = await getPools();
      return pools.map((pool) => {
        const poolKey = parsePoolKey(pool.id);
        return {
          pool_key: {
            token_x: poolKey.token_x,
            token_y: poolKey.token_y,
            fee_tier: {
              fee: poolKey.fee_tier.fee,
              tick_spacing: poolKey.fee_tier.tick_spacing
            }
          },
          pool: {
            liquidity: pool.liquidity,
            sqrt_price: calculateSqrtPrice(pool.currentTick),
            current_tick_index: pool.currentTick,
            fee_growth_global_x: '0',
            fee_growth_global_y: '0',
            fee_protocol_token_x: '0',
            fee_protocol_token_y: '0',
            fee_receiver: '',
            last_timestamp: Date.now(),
            start_timestamp: 0,
            incentives: []
          }
        };
      });
    }
  }

  public static async getIncentivesPosition(positionIndex: number, ownerId: string): Promise<ArrayOfAsset> {
    await this.loadHandler();
    return await this._handler.positionIncentives(positionIndex, ownerId);
  }

  public static async getTicks(tickIndex: number, poolKey: PoolKey): Promise<Tick> {
    return await this._handler.getTick(poolKey, tickIndex);
  }

  public static async getPool(poolKey: PoolKey): Promise<PoolWithPoolKey> {
    try {
      await this.loadHandler();
      const pool = await this._handler.getPool(poolKey);
      return pool;
    } catch (error) {
      return null;
    }
  }

  public static async getPosition(address: string): Promise<ArrayOfPosition> {
    await this.loadHandler();
    const position = await this._handler.getPositions(address);
    return position;
  }

  public static async getFullTickmap(poolKey: PoolKey): Promise<Tickmap> {
    const minTick = getMinTick(poolKey.fee_tier.tick_spacing);
    const maxTick = getMaxTick(poolKey.fee_tier.tick_spacing);
    const tickmap = await this._handler.tickMap(poolKey, minTick, maxTick, true);
    const bitmap = new Map<bigint, bigint>();
    tickmap.forEach((t) => {
      bitmap.set(BigInt(t[0].toString()), BigInt(t[1].toString()));
    });
    return { bitmap };
  }

  // simulate how much incentive reward user can have in 1 seconds
  public static async simulateIncentiveReward(owner: string, positionIndex: number): Promise<Record<string, number>> {
    await this.loadHandler();
    const incentiveSimulations: Record<string, number> = {};
    const startTime = Date.now();
    const rewardBefore = await this._handler.positionIncentives(positionIndex, owner);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const rewardAfter = await this._handler.positionIncentives(positionIndex, owner);
    const endTime = Date.now();
    const timeDiff = (endTime - startTime) / 1000;
    rewardAfter.forEach((reward) => {
      const token = parseAssetInfo(reward.info);
      const before = rewardBefore.find((r) => parseAssetInfo(r.info) === token);
      const rewardAmount = BigInt(reward.amount) - BigInt(before.amount);
      incentiveSimulations[token] =
        Math.round(Number(rewardAmount) / timeDiff) < 0 ? 0 : Math.round(Number(rewardAmount) / timeDiff);
    });

    return incentiveSimulations;
  }

  public static async getAllLiquidityTicks(poolKey: PoolKey, tickmap: Tickmap): Promise<LiquidityTick[]> {
    const tickIndexes: number[] = [];
    for (const [chunkIndex, chunk] of tickmap.bitmap.entries()) {
      for (let bit = 0; bit < CHUNK_SIZE; bit++) {
        const checkedBit = chunk & (1n << BigInt(bit));
        if (checkedBit !== 0n) {
          const tickIndex = positionToTick(Number(chunkIndex), bit, poolKey.fee_tier.tick_spacing);
          tickIndexes.push(tickIndex);
        }
      }
    }

    const tickResults = await this._handler.liquidityTicks(poolKey, tickIndexes);

    return tickResults.map((tick) => {
      return {
        ...tick,
        liquidity_change: BigInt(tick.liquidity_change)
      };
    });
  }

  public static approveToken = async (token: string, amount: bigint, address: string) => {
    const tokenClient = new OraiswapTokenClient(this._dex.client, address, token);

    return await tokenClient.increaseAllowance({
      amount: amount.toString(),
      spender: this._dex.contractAddress
    });
  };

  public static getTicksAndIncentivesInfo = async (
    lowerTick: number,
    upperTick: number,
    positionIndex: number,
    user: string,
    poolKey: PoolKey
  ) => {
    try {
      await this.loadCosmwasmClient();
      const multicallClient = new MulticallQueryClient(this._cosmwasmClient, network.multicall);
      const res = await multicallClient.aggregate({
        queries: [
          {
            address: network.pool_v3,
            data: toBinary({
              tick: {
                index: lowerTick,
                key: poolKey
              }
            })
          },
          {
            address: network.pool_v3,
            data: toBinary({
              tick: {
                index: upperTick,
                key: poolKey
              }
            })
          },
          {
            address: network.pool_v3,
            data: toBinary({
              position_incentives: {
                index: positionIndex,
                owner_id: user
              }
            })
          }
        ]
      });

      const lowerTickData = fromBinary(res.return_data[0].data);
      const upperTickData = fromBinary(res.return_data[1].data);
      const incentivesData = fromBinary(res.return_data[2].data);

      return {
        lowerTickData,
        upperTickData,
        incentivesData
      };
    } catch (error) {
      console.log('error', error);
      return null;
    }
  };

  public static getLiquidityByPool = async (
    pool: PoolWithPoolKey,
    prices: CoinGeckoPrices<string>,
    positions: Position[]
  ): Promise<any> => {
    const poolKey = pool.pool_key;
    const tokenX = oraichainTokens.find((token) => extractAddress(token) === poolKey.token_x);
    const tokenY = oraichainTokens.find((token) => extractAddress(token) === poolKey.token_y);

    await this.loadHandler();
    const res = await this._handler.getPairLiquidityValues(pool, positions);
    const tvlX = res.liquidityX;
    const tvlY = res.liquidityY;

    const xUsd = (prices[tokenX.coinGeckoId] * Number(tvlX)) / 10 ** tokenX.decimals;
    const yUsd = (prices[tokenY.coinGeckoId] * Number(tvlY)) / 10 ** tokenY.decimals;

    const tvlLockedUSD = xUsd + yUsd;

    const xAddress = extractAddress(tokenX);
    const yAddress = extractAddress(tokenY);

    const allocation = {
      [xAddress]: {
        address: xAddress,
        balance: toDisplay(tvlX, tokenX.decimals),
        usdValue: xUsd
      },
      [yAddress]: {
        address: yAddress,
        balance: toDisplay(tvlY, tokenY.decimals),
        usdValue: yUsd
      }
    };

    return {
      total: tvlLockedUSD,
      allocation
    };
  };

  public static async getAllPosition(): Promise<Position[]> {
    await this.loadHandler();
    const positions = await this._handler.allPositions();
    return positions;
  }

  // public static async queryPosition(): Promise<PositionInfo[]> {
  //   const positionInfo: PositionInfo[] = [];

  //   const allPools: PoolWithPoolKey[] = await this.getPools();

  //   const poolList: Record<string, PoolWithPoolKey> = {};
  //   allPools.forEach((pool) => {
  //     poolList[poolKeyToString(pool.pool_key)] = pool;
  //   });

  //   await this.loadHandler();
  //   const allPosition = await this._handler.allPositions();

  //   for (const position of allPosition) {
  //     const positionData = position;
  //     const poolKey = position.pool_key;
  //     const res = calculateTokenAmounts(poolList[poolKeyToString(poolKey)].pool as any, position as any);

  //     const positionInfoData: PositionInfo = {
  //       id: `${poolKeyToString(poolKey)}-${positionData.token_id}`,
  //       tokenId: positionData.token_id,
  //       poolId: poolKeyToString(poolKey),
  //       status: true,
  //       liquidity: BigInt(positionData.liquidity).toString(),
  //       tickLower: positionData.lower_tick_index.toString(),
  //       tickUpper: positionData.upper_tick_index.toString(),
  //       principalAmountX: res.x.toString(),
  //       principalAmountY: res.y.toString(),
  //       createdAt: BigInt(Date.now()).toString()
  //     };

  //     positionInfo.push(positionInfoData);
  //   }

  //   return positionInfo;
  // }

  public static getPoolLiquidities = async (
    pools: PoolWithPoolKey[],
    prices: CoinGeckoPrices<string>
  ): Promise<Record<string, number>> => {
    const poolLiquidities: Record<string, number> = {};
    await this.loadHandler();

    for (const pool of pools) {
      const poolKey = pool.pool_key;
      const tokenX = oraichainTokens.find((token) => extractAddress(token) === poolKey.token_x);
      const tokenY = oraichainTokens.find((token) => extractAddress(token) === poolKey.token_y);

      const res = await this._handler.getPairLiquidityValues(pool);
      const tvlX = res.liquidityX;
      const tvlY = res.liquidityY;

      const tvlLockedUSD =
        (prices[tokenX.coinGeckoId] * Number(tvlX)) / 10 ** tokenX.decimals +
        (prices[tokenY.coinGeckoId] * Number(tvlY)) / 10 ** tokenY.decimals;

      poolLiquidities[poolKeyToString(poolKey)] = tvlLockedUSD;
    }

    return poolLiquidities;
  };

  public static getTotalLiquidityValue = async (): Promise<number> => {
    return 1;
  };
}

export interface PositionTest {
  liquidity: bigint;
  upper_tick_index: number;
  lower_tick_index: number;
}

export interface VirtualRange {
  lowerTick: number;
  upperTick: number;
}

export const calculateLiquidityForPair = async (positions: PositionTest[], sqrt_price: bigint) => {
  let liquidityX = 0n;
  let liquidityY = 0n;
  for (const position of positions) {
    let xVal, yVal;

    try {
      xVal = getX(
        position.liquidity,
        calculateSqrtPrice(position.upper_tick_index),
        sqrt_price,
        calculateSqrtPrice(position.lower_tick_index)
      );
    } catch (error) {
      xVal = 0n;
    }

    try {
      yVal = getY(
        position.liquidity,
        calculateSqrtPrice(position.upper_tick_index),
        sqrt_price,
        calculateSqrtPrice(position.lower_tick_index)
      );
    } catch (error) {
      yVal = 0n;
    }

    liquidityX = liquidityX + xVal;
    liquidityY = liquidityY + yVal;
  }

  return { liquidityX, liquidityY };
};

export const LIQUIDITY_SCALE = 6n;
export const PRICE_SCALE = 24n;
export const LIQUIDITY_DENOMINATOR = 10n ** LIQUIDITY_SCALE;
export const PRICE_DENOMINATOR = 10n ** PRICE_SCALE;

export const getX = (
  liquidity: bigint,
  upperSqrtPrice: bigint,
  currentSqrtPrice: bigint,
  lowerSqrtPrice: bigint
): bigint => {
  if (upperSqrtPrice <= 0n || currentSqrtPrice <= 0n || lowerSqrtPrice <= 0n) {
    throw new Error('Price cannot be lower or equal 0');
  }

  let denominator: bigint;
  let nominator: bigint;

  if (currentSqrtPrice >= upperSqrtPrice) {
    return 0n;
  } else if (currentSqrtPrice < lowerSqrtPrice) {
    denominator = (lowerSqrtPrice * upperSqrtPrice) / PRICE_DENOMINATOR;
    nominator = upperSqrtPrice - lowerSqrtPrice;
  } else {
    denominator = (upperSqrtPrice * currentSqrtPrice) / PRICE_DENOMINATOR;
    nominator = upperSqrtPrice - currentSqrtPrice;
  }

  return (liquidity * nominator) / denominator / LIQUIDITY_DENOMINATOR;
};
export const getY = (
  liquidity: bigint,
  upperSqrtPrice: bigint,
  currentSqrtPrice: bigint,
  lowerSqrtPrice: bigint
): bigint => {
  if (lowerSqrtPrice <= 0n || currentSqrtPrice <= 0n || upperSqrtPrice <= 0n) {
    throw new Error('Price cannot be 0');
  }

  let difference: bigint;
  if (currentSqrtPrice <= lowerSqrtPrice) {
    return 0n;
  } else if (currentSqrtPrice >= upperSqrtPrice) {
    difference = upperSqrtPrice - lowerSqrtPrice;
  } else {
    difference = currentSqrtPrice - lowerSqrtPrice;
  }

  return (liquidity * difference) / PRICE_DENOMINATOR / LIQUIDITY_DENOMINATOR;
};

function calculateLiquidityForRanges(liquidityChanges: LiquidityTick[], tickRanges: VirtualRange[]): PositionTest[] {
  let currentLiquidity = 0n;
  const rangeLiquidity = [];

  liquidityChanges.forEach((change) => {
    let liquidityChange = change.liquidity_change;
    if (!change.sign) {
      liquidityChange = -liquidityChange;
    }
    currentLiquidity += liquidityChange;

    tickRanges.forEach((range, index) => {
      if (change.index >= range.lowerTick && change.index < range.upperTick) {
        if (!rangeLiquidity[index]) {
          rangeLiquidity[index] = 0;
        }
        rangeLiquidity[index] = currentLiquidity;
      }
    });
  });

  return rangeLiquidity.map((liquidity, index) => ({
    lower_tick_index: tickRanges[index].lowerTick,
    upper_tick_index: tickRanges[index].upperTick,
    liquidity: liquidity
  }));
}

const axios = Axios.create({
  timeout: AXIOS_TIMEOUT,
  retryTimes: 3,
  // cache will be enabled by default in 2 seconds
  adapter: retryAdapterEnhancer(
    throttleAdapterEnhancer(Axios.defaults.adapter!, {
      threshold: AXIOS_THROTTLE_THRESHOLD
    })
  ),
  baseURL: 'https://api-staging.oraidex.io/v1/'
});

export type PositionAprInfo = {
  swapFee: number;
  incentive: number;
  total: number;
};

export interface PoolFeeAndLiquidityDaily {
  poolKey: string;
  feeDaily: number;
  liquidityDaily: number;
}

function parseAssetInfo(assetInfo: AssetInfo): string {
  if ('native_token' in assetInfo) {
    return assetInfo.native_token.denom;
  } else {
    return assetInfo.token.contract_addr;
  }
}

export async function fetchPositionAprInfo(
  pool: PoolWithPoolKey,
  position: Position,
  prices: CoinGeckoPrices<CoinGeckoId>,
  tokenXLiquidityInUsd: number,
  tokenYLiquidityInUsd: number,
  isInRange: boolean,
  feeAndLiquidityInfo: PoolFeeAndLiquidityDaily[]
): Promise<PositionAprInfo> {
  const avgFeeAPRs = feeAndLiquidityInfo.map((pool) => {
    const feeAPR = (pool.feeDaily * 365) / pool.liquidityDaily;
    return {
      poolKey: pool.poolKey,
      feeAPR
    };
  });
  const feeAPR = avgFeeAPRs.find((fee) => fee.poolKey === poolKeyToString(position.pool_key))?.feeAPR;

  if (pool === undefined) {
    const poolInfo = await SingletonOraiswapV3.getPool(position.pool_key);
    pool = poolInfo;
  }
  const incentives = pool.pool.incentives;

  let sumIncentivesApr = 0;

  if (!isInRange) {
    return {
      swapFee: feeAPR ? feeAPR : 0,
      incentive: sumIncentivesApr,
      total: feeAPR ? feeAPR : 0
    };
  }

  for (const incentive of incentives) {
    const token = oraichainTokens.find((token) => extractAddress(token) === parseAssetInfo(incentive.reward_token));
    const rewardsPerSec = incentive.reward_per_sec;
    const rewardInUsd = prices[token.coinGeckoId];
    const currentLiquidity = pool.pool.liquidity;
    const positionLiquidity = position.liquidity;
    const totalPositionLiquidity = tokenXLiquidityInUsd + tokenYLiquidityInUsd;
    const rewardPerYear = (rewardInUsd * Number(rewardsPerSec) * 86400 * 365) / 10 ** token.decimals;
    sumIncentivesApr +=
      (Number(positionLiquidity) * rewardPerYear) / (Number(currentLiquidity) * totalPositionLiquidity);
  }
  return {
    swapFee: feeAPR ? feeAPR : 0,
    incentive: sumIncentivesApr,
    total: sumIncentivesApr + (feeAPR ? feeAPR : 0)
  };
}

export function simulateAprPosition(
  pool: Pool,
  poolKey: PoolKey,
  prices: CoinGeckoPrices<string>,
  totalLiquidity: number
) {
  const incentives = pool.incentives;

  // calculate APR for the best, position liquidity is 10% of total liquidity
  let sumMaxIncentivesApr = 0;
  const positionLiquidity = 10 ** 24;
  // const totalPositionLiquidity = (totalLiquidity * 0.5) / 100;
  const tick_spacing = poolKey.fee_tier.tick_spacing;

  const res = calculateAmountDelta(
    pool.current_tick_index,
    BigInt(pool.sqrt_price),
    BigInt(positionLiquidity),
    false,
    pool.current_tick_index + tick_spacing,
    pool.current_tick_index ? pool.current_tick_index : 0
  );

  const tokenX = oraichainTokens.find((token) => extractAddress(token) === poolKey.token_x);
  const tokenY = oraichainTokens.find((token) => extractAddress(token) === poolKey.token_y);

  const positionLiquidityUsdX = ((prices[tokenX?.coinGeckoId] ?? 0) * Number(res.x)) / 10 ** tokenX.decimals;
  const positionLiquidityUsdY = ((prices[tokenY?.coinGeckoId] ?? 0) * Number(res.y)) / 10 ** tokenY.decimals;
  const totalPositionLiquidityUsd = positionLiquidityUsdX + positionLiquidityUsdY;

  for (const incentive of incentives) {
    const token = oraichainTokens.find((token) => extractAddress(token) === parseAssetInfo(incentive.reward_token));
    const rewardsPerSec = incentive.reward_per_sec;
    const rewardInUsd = prices[token.coinGeckoId];
    const rewardPerYear = (rewardInUsd * Number(rewardsPerSec) * 86400 * 365) / 10 ** token.decimals;
    const apr = (positionLiquidity * rewardPerYear) / (totalPositionLiquidityUsd * Number(pool.liquidity));
    sumMaxIncentivesApr += apr;
  }

  // calculate APR for the worst, position liquidity is 2% of total liquidity
  let sumMinIncentivesApr = 0;
  const positionLiquidity2 = 10 ** 24;

  const res2 = calculateAmountDelta(
    pool.current_tick_index,
    BigInt(pool.sqrt_price),
    BigInt(positionLiquidity2),
    false,
    getMaxTick(tick_spacing),
    getMinTick(tick_spacing)
  );

  const positionLiquidityUsdX2 = ((prices[tokenX.coinGeckoId] ?? 0) * Number(res2.x)) / 10 ** tokenX.decimals;
  const positionLiquidityUsdY2 = ((prices[tokenY.coinGeckoId] ?? 0) * Number(res2.y)) / 10 ** tokenY.decimals;
  const totalPositionLiquidityUsd2 = positionLiquidityUsdX2 + positionLiquidityUsdY2;

  for (const incentive of incentives) {
    const token = oraichainTokens.find((token) => extractAddress(token) === parseAssetInfo(incentive.reward_token));
    const rewardsPerSec = incentive.reward_per_sec;
    const rewardInUsd = prices[token.coinGeckoId];
    const rewardPerYear = (rewardInUsd * Number(rewardsPerSec) * 86400 * 365) / 10 ** token.decimals;
    const apr = (positionLiquidity2 * rewardPerYear) / (totalPositionLiquidityUsd2 * Number(pool.liquidity));
    sumMinIncentivesApr += apr;
  }

  return {
    min: sumMinIncentivesApr,
    max: sumMaxIncentivesApr
  };
}

export type PoolAprInfo = {
  apr: {
    min: number;
    max: number;
  };
  incentives: string[];
  swapFee: number;
  incentivesApr: {
    min: number;
    max: number;
  };
};

export async function fetchPoolAprInfo(
  pools: (PoolWithPoolKey | PoolInfoResponse)[],
  prices: CoinGeckoPrices<CoinGeckoId>,
  poolLiquidities: Record<string, number>,
  feeAndLiquidityInfo: PoolFeeAndLiquidityDaily[]
): Promise<Record<string, PoolAprInfo>> {
  const avgFeeAPRs = feeAndLiquidityInfo.map((pool) => {
    const feeAPR = (pool.feeDaily * 365) / pool.liquidityDaily;
    return {
      poolKey: pool.poolKey,
      feeAPR
    };
  });

  const poolAprs: Record<string, PoolAprInfo> = {};
  for (const item of pools) {
    if ('liquidityAddr' in item) {
      const { apr, aprBoost, liquidityAddr } = item;

      poolAprs[liquidityAddr] = {
        apr: {
          min: aprBoost || 0,
          max: aprBoost || 0
        },
        incentives: [],
        swapFee: apr,
        incentivesApr: {
          min: 0,
          max: 0
        }
      };
      continue;
    }

    const { pool, pool_key } = item;
    const feeAPR = avgFeeAPRs.find((fee) => fee.poolKey === poolKeyToString(pool_key))?.feeAPR;

    if (pool.incentives === undefined) {
      const poolInfo = await SingletonOraiswapV3.getPool(pool_key);
      pool.incentives = poolInfo.pool.incentives;
    }

    const res = simulateAprPosition(pool, pool_key, prices, poolLiquidities[poolKeyToString(pool_key)]);

    poolAprs[poolKeyToString(pool_key)] = {
      apr: {
        min: res.min + (feeAPR ? feeAPR : 0),
        max: res.max + (feeAPR ? feeAPR : 0)
      },
      incentives: pool.incentives.map((incentive) => {
        const token = oraichainTokens.find((token) => extractAddress(token) === parseAssetInfo(incentive.reward_token));
        return token.denom.toUpperCase();
      }),
      swapFee: feeAPR ? feeAPR : 0,
      incentivesApr: {
        min: res.min,
        max: res.max
      }
    };
  }

  return poolAprs;
}
