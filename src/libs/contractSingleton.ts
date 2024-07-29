import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
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
  getMaxTickmapQuerySize
} from '../pages/Pool-V3/packages/wasm';
// import {
//   CHUNK_SIZE,
//   LIQUIDITY_TICKS_LIMIT,
//   MAX_TICKMAP_QUERY_SIZE,
//   TokenDataOnChain,
//   getCoingeckoTokenPriceV2,
//   parse,
//   poolKeyToString
//   // parse
// } from '@store/consts/utils';
import { network } from 'config/networks';
import { OraiswapTokenClient, OraiswapV3Client, OraiswapV3QueryClient } from '@oraichain/oraidex-contracts-sdk';
import {
  ArrayOfTupleOfUint16AndUint64,
  FeeTier,
  PoolWithPoolKey
} from '@oraichain/oraidex-contracts-sdk/build/OraiswapV3.types';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import { ArrayOfPosition, Tick } from 'pages/Pool-V3/packages/sdk/OraiswapV3.types';
// import { defaultState } from '@store/reducers/connection';

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

export const OCH: Token = {
  symbol: 'OCH',
  address: 'orai1hn8w33cqvysun2aujk5sv33tku4pgcxhhnsxmvnkfvdxagcx0p8qa4l98q',
  decimals: 6,
  name: 'Orchai Token',

  coingeckoId: 'och'
};

export const USDT: Token = {
  symbol: 'USDT',
  address: 'orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh',
  decimals: 6,
  name: 'USDC',
  coingeckoId: 'tether'
};

export const USDC: Token = {
  symbol: 'USDC',
  address: 'orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd',
  decimals: 6,
  name: 'USDC',

  coingeckoId: 'usd-coin'
};

export const ORAI: Token = {
  symbol: 'ORAI',
  address: 'orai',
  decimals: 6,
  name: 'Orai Token',
  // logoURI: 'https://assets.coingecko.com/coins/images/12931/standard/orai.png',
  coingeckoId: 'oraichain-token'
};

export const ORAIX: Token = {
  symbol: 'ORAIX',
  address: 'orai1lus0f0rhx8s03gdllx2n6vhkmf0536dv57wfge',
  decimals: 6,
  name: 'ORAIX',
  // logoURI: 'https://i.ibb.co/VmMJtf7/oraix.png',
  coingeckoId: 'oraidex'
};

const FAUCET_LIST_TOKEN = [ORAIX, USDT, USDC, OCH, ORAI];
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

// export let CHUNK_SIZE = getChunkSize();
// export let LIQUIDITY_TICKS_LIMIT = getLiquidityTicksLimit();
// export let MAX_TICKMAP_QUERY_SIZE = getMaxTickmapQuerySize();

export const loadChunkSize = () => {
  const chunkSize = getChunkSize();
  return chunkSize;
};

export const loadLiquidityTicksLimit = () => {
  const liquidityTicksLimit = getLiquidityTicksLimit();
  return liquidityTicksLimit;
};

export const loadMaxTickmapQuerySize = () => {
  const maxTickmapQuerySize = getMaxTickmapQuerySize();
  return maxTickmapQuerySize;
};

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

export default class SingletonOraiswapV3 {
  private static _tokens: { [key: string]: OraiswapTokenClient } = {};
  private static _nativeTokens: { [key: string]: string } = {};
  private static _dex: OraiswapV3Client;
  private static _dexQuerier: OraiswapV3QueryClient;

  private constructor() {}

  public static get dex() {
    return this._dex;
  }

  public static get dexQuerier() {
    return this._dexQuerier;
  }

  public static get tokens() {
    return this._tokens;
  }

  public static get nativeTokens() {
    return this._nativeTokens;
  }

  public static async load(signingClient: SigningCosmWasmClient, sender: string) {
    if (!this.dex) {
      this._dex = new OraiswapV3Client(signingClient, sender, defaultState.dexAddress);
    }
    const client = await CosmWasmClient.connect(network.rpc);
    this._dexQuerier = new OraiswapV3QueryClient(client, defaultState.dexAddress);
  }

  public static async loadCw20(sender: string, contractAddress: string) {
    this._tokens[contractAddress] = new OraiswapTokenClient(this._dex.client, sender, contractAddress);
  }

  public static async loadNative(tokenDenom: string) {
    this._nativeTokens[tokenDenom] = tokenDenom;
  }

  public static async queryBalance(address: string, tokenDenom: string = 'orai') {
    if (!address) return '0';
    const client = await CosmWasmClient.connect(network.rpc);
    const { amount } = await client.getBalance(address, tokenDenom);
    return amount;
  }

  public static async getRawTickmap(
    poolKey: PoolKey,
    lowerTick: number,
    upperTick: number,
    xToY: boolean
  ): Promise<ArrayOfTupleOfUint16AndUint64> {
    const client = await CosmWasmClient.connect(network.rpc);
    const queryClient = new OraiswapV3QueryClient(client, defaultState.dexAddress);

    const tickmaps = await queryClient.tickMap({
      lowerTickIndex: lowerTick,
      upperTickIndex: upperTick,
      xToY,
      poolKey
    });
    return tickmaps;
  }

  public static async getPools(): Promise<PoolWithPoolKey[]> {
    const client = await CosmWasmClient.connect(network.rpc);
    const queryClient = new OraiswapV3QueryClient(client, defaultState.dexAddress);
    return await queryClient.pools({});
  }

  public static async getTicks(index, key): Promise<Tick> {
    const client = await CosmWasmClient.connect(network.rpc);
    const queryClient = new OraiswapV3QueryClient(client, defaultState.dexAddress);
    return await queryClient.tick({ index, key });
  }

  public static async getPool(poolKey: PoolKey): Promise<PoolWithPoolKey> {
    try {
      const client = await CosmWasmClient.connect(network.rpc);
      const queryClient = new OraiswapV3QueryClient(client, defaultState.dexAddress);
      const pool = await queryClient.pool({
        feeTier: poolKey.fee_tier,
        token0: poolKey.token_x,
        token1: poolKey.token_y
      });
      return {
        pool: pool,
        pool_key: poolKey
      };
    } catch (error) {
      return null;
    }
  }

  public static async getAllPosition(address: string, limit?: number, offset?: number): Promise<ArrayOfPosition> {
    const client = await CosmWasmClient.connect(network.rpc);
    const queryClient = new OraiswapV3QueryClient(client, defaultState.dexAddress);
    const position = await queryClient.positions({
      ownerId: address,
      limit,
      offset
    });
    return position;
  }

  public static async getFullTickmap(poolKey: PoolKey): Promise<Tickmap> {
    const maxTick = getMaxTick(poolKey.fee_tier.tick_spacing);
    let lowerTick = getMinTick(poolKey.fee_tier.tick_spacing);

    const xToY = false;

    const promises = [];
    const tickSpacing = poolKey.fee_tier.tick_spacing;
    assert(tickSpacing <= 100);

    assert(loadMaxTickmapQuerySize() > 3);
    assert(loadChunkSize() * 2 > tickSpacing);
    // move back 1 chunk since the range is inclusive
    // then move back additional 2 chunks to ensure that adding tickspacing won't exceed the query limit
    const jump = (loadMaxTickmapQuerySize() - 3) * loadChunkSize();

    while (lowerTick <= maxTick) {
      let nextTick = lowerTick + jump;
      const remainder = nextTick % tickSpacing;

      if (remainder > 0) {
        nextTick += tickSpacing - remainder;
      } else if (remainder < 0) {
        nextTick -= remainder;
      }

      let upperTick = nextTick;

      if (upperTick > maxTick) {
        upperTick = maxTick;
      }

      assert(upperTick % tickSpacing === 0);
      assert(lowerTick % tickSpacing === 0);

      const result = this.getRawTickmap(poolKey, lowerTick, upperTick, xToY).then(
        (tickmap) => tickmap.map(([a, b]) => [BigInt(a), BigInt(b)]) as [bigint, bigint][]
      );
      promises.push(result);

      lowerTick = upperTick + tickSpacing;
    }

    const fullResult = (await Promise.all(promises)).flat(1);

    const storedTickmap = new Map<bigint, bigint>(fullResult);

    return { bitmap: storedTickmap };
  }

  public static async getAllLiquidityTicks(poolKey: PoolKey, tickmap: Tickmap): Promise<LiquidityTick[]> {
    const tickIndexes: number[] = [];
    for (const [chunkIndex, chunk] of tickmap.bitmap.entries()) {
      for (let bit = 0; bit < loadChunkSize(); bit++) {
        const checkedBit = chunk & (1n << BigInt(bit));
        if (checkedBit) {
          const tickIndex = positionToTick(Number(chunkIndex), bit, poolKey.fee_tier.tick_spacing);
          tickIndexes.push(tickIndex);
        }
      }
    }
    const tickLimit = loadLiquidityTicksLimit();
    const promises: Promise<LiquidityTick[]>[] = [];
    const client = await CosmWasmClient.connect(network.rpc);
    this._dexQuerier = new OraiswapV3QueryClient(client, defaultState.dexAddress);
    for (let i = 0; i < tickIndexes.length; i += tickLimit) {
      promises.push(
        this.dexQuerier
          .liquidityTicks({
            poolKey,
            tickIndexes: tickIndexes.slice(i, i + tickLimit).map(Number)
          })
          .then(parse)
      );
    }

    const tickResults = await Promise.all(promises);
    return tickResults.flat(1);
  }

  public static approveToken = async (token: string, amount: bigint, address: string) => {
    const tokenClient = new OraiswapTokenClient(this.dex.client, address, token);

    return await tokenClient.increaseAllowance({
      amount: amount.toString(),
      spender: this.dex.contractAddress
    });
  };

  public static getLiquidityByPool = async (pool: PoolWithPoolKey, prices: CoinGeckoPrices<string>): Promise<any> => {
    const tickmap = await this.getFullTickmap(pool.pool_key);

    const liquidityTicks = await this.getAllLiquidityTicks(pool.pool_key, tickmap);

    const tickIndexes: number[] = [];
    for (const [chunkIndex, chunk] of tickmap.bitmap.entries()) {
      for (let bit = 0; bit < loadChunkSize(); bit++) {
        const checkedBit = chunk & (1n << BigInt(bit));
        if (checkedBit) {
          const tickIndex = positionToTick(Number(chunkIndex), bit, pool.pool_key.fee_tier.tick_spacing);
          tickIndexes.push(tickIndex);
        }
      }
    }

    const tickArray: VirtualRange[] = [];

    for (let i = 0; i < tickIndexes.length - 1; i++) {
      tickArray.push({
        lowerTick: tickIndexes[i],
        upperTick: tickIndexes[i + 1]
      });
    }

    const posTest: PositionTest[] = calculateLiquidityForRanges(liquidityTicks, tickArray);

    const res = await calculateLiquidityForPair(posTest, BigInt(pool.pool.sqrt_price));

    const tokens = [pool.pool_key.token_x, pool.pool_key.token_y];

    const tokenInfos = await Promise.all(
      tokens.map(async (token) => {
        if (FAUCET_LIST_TOKEN.filter((item) => item.address === token).length > 0) {
          const info = FAUCET_LIST_TOKEN.filter((item) => item.address === token)[0];

          return { info, price: prices[info.coingeckoId] };
        }
      })
    );

    const tokenWithLiquidities = [
      {
        address: pool.pool_key.token_x,
        balance: res.liquidityX
      },
      {
        address: pool.pool_key.token_y,
        balance: res.liquidityY
      }
    ];

    const allocation = {};
    const tokenWithUSDValue = tokenWithLiquidities.map((token) => {
      const tokenInfo = tokenInfos.filter((item) => item.info.address === token.address)[0];

      const data = {
        address: token.address,
        balance: Number(token.balance) / 10 ** 6,
        usdValue: (Number(token.balance) / 10 ** 6) * tokenInfo.price
      };
      allocation[token.address] = data;

      return data;
    });

    const totalValue = tokenWithUSDValue.reduce((acc, item) => acc + item.usdValue, 0);

    return {
      total: totalValue,
      allocation
    };
  };

  public static getPoolLiquidities = async (
    pools: PoolWithPoolKey[],
    prices: CoinGeckoPrices<string>
  ): Promise<Record<string, number>> => {
    const poolLiquidities: Record<string, number> = {};
    for (const pool of pools) {
      const tickmap = await this.getFullTickmap(pool.pool_key);

      const liquidityTicks = await this.getAllLiquidityTicks(pool.pool_key, tickmap);

      const tickIndexes: number[] = [];
      for (const [chunkIndex, chunk] of tickmap.bitmap.entries()) {
        for (let bit = 0; bit < loadChunkSize(); bit++) {
          const checkedBit = chunk & (1n << BigInt(bit));
          if (checkedBit) {
            const tickIndex = positionToTick(Number(chunkIndex), bit, pool.pool_key.fee_tier.tick_spacing);
            tickIndexes.push(tickIndex);
          }
        }
      }

      const tickArray: VirtualRange[] = [];

      for (let i = 0; i < tickIndexes.length - 1; i++) {
        tickArray.push({
          lowerTick: tickIndexes[i],
          upperTick: tickIndexes[i + 1]
        });
      }

      const posTest: PositionTest[] = calculateLiquidityForRanges(liquidityTicks, tickArray);

      const res = await calculateLiquidityForPair(posTest, BigInt(pool.pool.sqrt_price));

      const tokens = [pool.pool_key.token_x, pool.pool_key.token_y];

      const tokenInfos = await Promise.all(
        tokens.map(async (token) => {
          if (FAUCET_LIST_TOKEN.filter((item) => item.address === token).length > 0) {
            const info = FAUCET_LIST_TOKEN.filter((item) => item.address === token)[0];

            return { info, price: prices[info.coingeckoId] };
          }
        })
      );

      const tokenWithLiquidities = [
        {
          address: pool.pool_key.token_x,
          balance: res.liquidityX
        },
        {
          address: pool.pool_key.token_y,
          balance: res.liquidityY
        }
      ];

      const tokenWithUSDValue = tokenWithLiquidities.map((token) => {
        const tokenInfo = tokenInfos.filter((item) => item.info.address === token.address)[0];
        return {
          address: token.address,
          usdValue: (Number(token.balance) / 10 ** 6) * tokenInfo.price
        };
      });

      const totalValue = tokenWithUSDValue.reduce((acc, item) => acc + item.usdValue, 0);

      poolLiquidities[poolKeyToString(pool.pool_key)] = totalValue;
    }

    return poolLiquidities;
  };

  public static getTotalLiquidityValue = async (): Promise<number> => {
    const pools = await this._dexQuerier.pools({}); // get pools from state

    const totalLiquidity = await Promise.all(
      pools.map(async (pool) => {
        const tickmap = await this.getFullTickmap(pool.pool_key);

        const liquidityTicks = await this.getAllLiquidityTicks(pool.pool_key, tickmap);

        // console.log({ liquidityTicks });

        const tickIndexes: number[] = [];
        for (const [chunkIndex, chunk] of tickmap.bitmap.entries()) {
          for (let bit = 0; bit < loadChunkSize(); bit++) {
            const checkedBit = chunk & (1n << BigInt(bit));
            if (checkedBit) {
              const tickIndex = positionToTick(Number(chunkIndex), bit, pool.pool_key.fee_tier.tick_spacing);
              tickIndexes.push(tickIndex);
            }
          }
        }

        const tickArray: VirtualRange[] = [];

        for (let i = 0; i < tickIndexes.length - 1; i++) {
          tickArray.push({
            lowerTick: tickIndexes[i],
            upperTick: tickIndexes[i + 1]
          });
        }

        const posTest: PositionTest[] = calculateLiquidityForRanges(liquidityTicks, tickArray);

        const res = await calculateLiquidityForPair(posTest, BigInt(pool.pool.sqrt_price));

        return [
          { address: pool.pool_key.token_x, balance: res.liquidityX },
          { address: pool.pool_key.token_y, balance: res.liquidityY }
        ];
      })
    );

    const flattenArray = totalLiquidity.flat(1);

    // get all tokens and remove duplicate
    const tokens = flattenArray
      .map((item) => item.address)
      .filter((value, index, self) => self.indexOf(value) === index);

    // get token info
    const tokenInfos = await Promise.all(
      tokens.map(async (token) => {
        if (FAUCET_LIST_TOKEN.filter((item) => item.address === token).length > 0) {
          const info = FAUCET_LIST_TOKEN.filter((item) => item.address === token)[0];
          return {
            info,
            price: {
              price: 0
            }
          };
          // return { info, price: await getCoingeckoTokenPriceV2(info.coingeckoId) };
        }
      })
    );

    // console.log({ tokenInfos });

    const tokenWithLiquidities = tokens.map((token) => {
      const liquidity = flattenArray
        .filter((item) => item.address === token)
        .reduce((acc, item) => acc + item.balance, 0n);
      return { address: token, balance: liquidity };
    });

    // tokenWithUSDValue
    const tokenWithUSDValue = tokenWithLiquidities.map((token) => {
      const tokenInfo = tokenInfos.filter((item) => item.info.address === token.address)[0];
      return {
        address: token.address,
        usdValue: (Number(token.balance) / 10 ** 6) * tokenInfo.price.price
      };
    });

    // console.log({ tokenWithUSDValue });

    const totalValue = tokenWithUSDValue.reduce((acc, item) => acc + item.usdValue, 0);

    return totalValue;
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
