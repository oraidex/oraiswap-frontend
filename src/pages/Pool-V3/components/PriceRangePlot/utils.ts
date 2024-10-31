import {
  TokenAmount,
  SwapError,
  alignTickToSpacing,
  calculateSqrtPrice,
  getMaxTick,
  getMinTick,
  Tickmap,
  LiquidityTick,
  Tick,
  Liquidity,
  getPriceScale
} from '@oraichain/oraiswap-v3';
import { TokenItemType } from '@oraichain/oraidex-common';
import SingletonOraiswapV3, { Token } from 'libs/contractSingleton';
import { ActiveLiquidityPerTickRange } from 'reducer/poolDetailV3';

export interface PlotTickData {
  x: number;
  y: number;
  index: number;
}

export type TickPlotPositionData = Omit<PlotTickData, 'y'>;

export interface IPriceRangePlot {
  data: PlotTickData[];
  midPrice?: TickPlotPositionData;
  leftRange: TickPlotPositionData;
  rightRange: TickPlotPositionData;
  onChangeRange?: (left: number, right: number) => void;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  plotMin: number;
  plotMax: number;
  zoomMinus: () => void;
  zoomPlus: () => void;
  loading?: boolean;
  isXtoY: boolean;
  xDecimal: number;
  yDecimal: number;
  tickSpacing: number;
  isDiscrete?: boolean;
  coverOnLoading?: boolean;
  hasError?: boolean;
  reloadHandler: () => void;
  showOnCreatePool?: boolean;
}

export const PRICE_SCALE = getPriceScale();
export const CONCENTRATION_FACTOR = 1.00001526069123;

export const getTickAtSqrtPriceDelta = (tickSpacing: number, minimumRange: number, concentration: number) => {
  const base = Math.pow(1.0001, -(tickSpacing / 4));
  const logArg = (1 - 1 / (concentration * CONCENTRATION_FACTOR)) / Math.pow(1.0001, (-tickSpacing * minimumRange) / 4);

  return Math.ceil(Math.log(logArg) / Math.log(base) / 2);
};

export const calculateConcentrationRange = (
  tickSpacing: number,
  concentration: number,
  minimumRange: number,
  currentTick: number,
  isXToY: boolean
) => {
  const tickDelta = getTickAtSqrtPriceDelta(tickSpacing, minimumRange, concentration);
  const lowerTick = currentTick - (minimumRange / 2 + tickDelta) * tickSpacing;
  const upperTick = currentTick + (minimumRange / 2 + tickDelta) * tickSpacing;

  return {
    leftRange: isXToY ? lowerTick : upperTick,
    rightRange: isXToY ? upperTick : lowerTick
  };
};

export const toMaxNumericPlaces = (num: number, places: number): string => {
  const log = Math.floor(Math.log10(num));

  if (log >= places) {
    return num.toFixed(0);
  }

  if (log >= 0) {
    return num.toFixed(places - log - 1);
  }

  return num.toFixed(places + Math.abs(log) - 1);
};

export const getPrimaryUnitsPrice = (price: number, isXtoY: boolean, xDecimal: number, yDecimal: number) => {
  const xToYPrice = isXtoY ? price : 1 / price;

  return xToYPrice * 10 ** (yDecimal - xDecimal);
};

export const logBase = (x: number, b: number): number => Math.log(x) / Math.log(b);

export const adjustToSpacing = (baseTick: number, spacing: number, isGreater: boolean): number => {
  const remainder = baseTick % spacing;

  if (Math.abs(remainder) === 0) {
    return baseTick;
  }

  let adjustment: number;
  if (isGreater) {
    if (baseTick >= 0) {
      adjustment = spacing - remainder;
    } else {
      adjustment = Math.abs(remainder);
    }
  } else {
    if (baseTick >= 0) {
      adjustment = -remainder;
    } else {
      adjustment = -(spacing - Math.abs(remainder));
    }
  }

  return baseTick + adjustment;
};

export const spacingMultiplicityLte = (arg: number, spacing: number): number => {
  return adjustToSpacing(arg, spacing, false);
};

export const spacingMultiplicityGte = (arg: number, spacing: number): number => {
  return adjustToSpacing(arg, spacing, true);
};

export const nearestSpacingMultiplicity = (centerTick: number, spacing: number) => {
  const greaterTick = spacingMultiplicityGte(centerTick, spacing);
  const lowerTick = spacingMultiplicityLte(centerTick, spacing);

  const nearestTick = Math.abs(greaterTick - centerTick) < Math.abs(lowerTick - centerTick) ? greaterTick : lowerTick;

  return Math.max(Math.min(nearestTick, Number(getMaxTick(spacing))), Number(getMinTick(spacing)));
};

export const getTickAtSqrtPriceFromBalance = (
  price: number,
  spacing: number,
  isXtoY: boolean,
  xDecimal: number,
  yDecimal: number
) => {
  const minTick = getMinTick(spacing);
  const maxTick = getMaxTick(spacing);

  const basePrice = Math.max(price, Number(calcPrice(isXtoY ? minTick : maxTick, isXtoY, xDecimal, yDecimal)));
  const primaryUnitsPrice = getPrimaryUnitsPrice(basePrice, isXtoY, Number(xDecimal), Number(yDecimal));
  const tick = Math.round(logBase(primaryUnitsPrice, 1.0001));

  return Math.max(Math.min(tick, Number(getMaxTick(spacing))), Number(getMinTick(spacing)));
};

export const calcPrice = (amountTickIndex: number, isXtoY: boolean, xDecimal: number, yDecimal: number): number => {
  const price = calcYPerXPriceByTickIndex(amountTickIndex, xDecimal, yDecimal);

  return isXtoY ? price : 1 / price;
};

export const calcYPerXPriceByTickIndex = (tickIndex: number, xDecimal: number, yDecimal: number): number => {
  const sqrt = +printBigint(calculateSqrtPrice(tickIndex), Number(PRICE_SCALE));

  const proportion = sqrt * sqrt;

  return proportion / 10 ** (yDecimal - xDecimal);
};

export const printBigint = (amount: TokenAmount, decimals: number): string => {
  const amountString = amount.toString();
  const isNegative = amountString.length > 0 && amountString[0] === '-';

  const balanceString = isNegative ? amountString.slice(1) : amountString;

  if (balanceString.length <= decimals) {
    return (isNegative ? '-' : '') + '0.' + '0'.repeat(decimals - balanceString.length) + balanceString;
  } else {
    return (
      (isNegative ? '-' : '') +
      trimZeros(
        balanceString.substring(0, balanceString.length - decimals) +
          '.' +
          balanceString.substring(balanceString.length - decimals)
      )
    );
  }
};

export const trimZeros = (numStr: string): string => {
  return numStr
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/^0+(\d)|(\d)0+$/gm, '$1$2')
    .replace(/\.$/, '');
};

export const nearestTickIndex = (
  price: number,
  spacing: number,
  isXtoY: boolean,
  xDecimal: number,
  yDecimal: number
) => {
  const tick = getTickAtSqrtPriceFromBalance(price, spacing, isXtoY, xDecimal, yDecimal);

  return nearestSpacingMultiplicity(tick, spacing);
};

export const getConcentrationArray = (tickSpacing: number, minimumRange: number, currentTick: number): number[] => {
  const concentrations: number[] = [];
  let counter = 0;
  let concentration = 0;
  let lastConcentration = calculateConcentration(tickSpacing, minimumRange, counter) + 1;
  let concentrationDelta = 1;

  while (concentrationDelta >= 1) {
    concentration = calculateConcentration(tickSpacing, minimumRange, counter);
    concentrations.push(concentration);
    concentrationDelta = lastConcentration - concentration;
    lastConcentration = concentration;
    counter++;
  }
  concentration = Math.ceil(concentrations[concentrations.length - 1]);

  while (concentration > 1) {
    concentrations.push(concentration);
    concentration--;
  }
  const maxTick = alignTickToSpacing(getMaxTick(1), tickSpacing);
  if ((minimumRange / 2) * tickSpacing > maxTick - Math.abs(currentTick)) {
    throw new Error(String(SwapError.TickLimitReached));
  }
  const limitIndex = (maxTick - Math.abs(currentTick) - (minimumRange / 2) * tickSpacing) / tickSpacing;

  return concentrations.slice(0, limitIndex);
};

export const calculateConcentration = (tickSpacing: number, minimumRange: number, n: number) => {
  const concentration = 1 / (1 - Math.pow(1.0001, (-tickSpacing * (minimumRange + 2 * n)) / 4));
  return concentration / CONCENTRATION_FACTOR;
};

export const calcTicksAmountInRange = (
  min: number,
  max: number,
  tickSpacing: number,
  isXtoY: boolean,
  xDecimal: number,
  yDecimal: number
): number => {
  const primaryUnitsMin = getPrimaryUnitsPrice(min, isXtoY, xDecimal, yDecimal);
  const primaryUnitsMax = getPrimaryUnitsPrice(max, isXtoY, xDecimal, yDecimal);
  const minIndex = logBase(primaryUnitsMin, 1.0001);
  const maxIndex = logBase(primaryUnitsMax, 1.0001);

  return Math.ceil(Math.abs(maxIndex - minIndex) / tickSpacing);
};

export const trimLeadingZeros = (amount: string): string => {
  const amountParts = amount.split('.');

  if (!amountParts.length) {
    return '0';
  }

  if (amountParts.length === 1) {
    return amountParts[0];
  }

  const reversedDec = Array.from(amountParts[1]).reverse();
  const firstNonZero = reversedDec.findIndex((char) => char !== '0');

  if (firstNonZero === -1) {
    return amountParts[0];
  }

  const trimmed = reversedDec.slice(firstNonZero, reversedDec.length).reverse().join('');

  return `${amountParts[0]}.${trimmed}`;
};

export const extractDenom = (tokenInfo: TokenItemType) => {
  return tokenInfo.contractAddress ? tokenInfo.contractAddress : tokenInfo.denom;
};

export enum PositionTokenBlock {
  None,
  A,
  B
}

export const determinePositionTokenBlock = (
  currentSqrtPrice: bigint,
  lowerTick: number,
  upperTick: number,
  isXtoY: boolean
) => {
  const lowerPrice = calculateSqrtPrice(lowerTick);
  const upperPrice = calculateSqrtPrice(upperTick);

  const isBelowLowerPrice = lowerPrice >= currentSqrtPrice;
  const isAboveUpperPrice = upperPrice <= currentSqrtPrice;

  if (isBelowLowerPrice) {
    return isXtoY ? PositionTokenBlock.B : PositionTokenBlock.A;
  }
  if (isAboveUpperPrice) {
    return isXtoY ? PositionTokenBlock.A : PositionTokenBlock.B;
  }

  return PositionTokenBlock.None;
};

export const createPlaceholderLiquidityPlot = (
  isXtoY: boolean,
  yValueToFill: number,
  tickSpacing: number,
  tokenXDecimal: number,
  tokenYDecimal: number
) => {
  const ticksData: PlotTickData[] = [];

  const min = getMinTick(tickSpacing);
  const max = getMaxTick(tickSpacing);

  const minPrice = calcPrice(min, isXtoY, tokenXDecimal, tokenYDecimal);

  ticksData.push({
    x: minPrice,
    y: yValueToFill,
    index: min
  });

  const maxPrice = calcPrice(max, isXtoY, tokenXDecimal, tokenYDecimal);

  ticksData.push({
    x: maxPrice,
    y: yValueToFill,
    index: max
  });

  return isXtoY ? ticksData : ticksData.reverse();
};

export const deserializeTickmap = (serializedTickmap: string): Tickmap => {
  const deserializedMap: Map<string, string> = new Map(JSON.parse(serializedTickmap));

  const parsedMap = new Map();
  for (const [key, value] of deserializedMap) {
    parsedMap.set(BigInt(key), BigInt(value));
  }

  return { bitmap: parsedMap };
};

export interface LiquidityBreakpoint {
  liquidity: Liquidity;
  index: bigint;
}

export const calculateLiquidityBreakpoints = (ticks: (Tick | LiquidityTick)[]): LiquidityBreakpoint[] => {
  let currentLiquidity = 0n;

  return ticks.map((tick) => {
    currentLiquidity = currentLiquidity + BigInt(tick.liquidity_change) * (tick.sign ? 1n : -1n);
    return {
      liquidity: currentLiquidity,
      index: BigInt(tick.index)
    };
  });
};

export const createLiquidityPlot = (
  rawTicks: LiquidityTick[],
  tickSpacing: number,
  isXtoY: boolean,
  tokenXDecimal: number,
  tokenYDecimal: number
): PlotTickData[] => {
  // sort tick
  const sortedTicks = rawTicks.sort((a, b) => Number(a.index - b.index));
  const parsedTicks = rawTicks.length ? calculateLiquidityBreakpoints(sortedTicks) : [];

  const ticks = rawTicks.map((raw, index) => ({
    ...raw,
    liqudity: parsedTicks[index].liquidity
  }));

  const ticksData: PlotTickData[] = [];

  const min = getMinTick(tickSpacing);
  const max = getMaxTick(tickSpacing);

  if (!ticks.length || ticks[0].index > min) {
    const minPrice = calcPrice(min, isXtoY, tokenXDecimal, tokenYDecimal);

    ticksData.push({
      x: minPrice,
      y: 0,
      index: min
    });
  }

  ticks.forEach((tick, i) => {
    const tickIndex = tick.index;
    if (i === 0 && tickIndex - tickSpacing > min) {
      const price = calcPrice(tickIndex - tickSpacing, isXtoY, tokenXDecimal, tokenYDecimal);
      ticksData.push({
        x: price,
        y: 0,
        index: tickIndex - tickSpacing
      });
    } else if (i > 0 && tickIndex - tickSpacing > ticks[i - 1].index) {
      const price = calcPrice(tickIndex - tickSpacing, isXtoY, tokenXDecimal, tokenYDecimal);
      ticksData.push({
        x: price,
        y: +printBigint(ticks[i - 1].liqudity, 12), // TODO use constant
        index: tickIndex - tickSpacing
      });
    }

    const price = calcPrice(tickIndex, isXtoY, tokenXDecimal, tokenYDecimal);
    ticksData.push({
      x: price,
      y: +printBigint(ticks[i].liqudity, 12), // TODO use constant
      index: tickIndex
    });
  });
  const lastTick = ticks[ticks.length - 1].index;
  if (!ticks.length) {
    const maxPrice = calcPrice(max, isXtoY, tokenXDecimal, tokenYDecimal);

    ticksData.push({
      x: maxPrice,
      y: 0,
      index: max
    });
  } else if (lastTick < max) {
    if (max - lastTick > tickSpacing) {
      const price = calcPrice(lastTick + tickSpacing, isXtoY, tokenXDecimal, tokenYDecimal);
      ticksData.push({
        x: price,
        y: 0,
        index: lastTick + tickSpacing
      });
    }

    const maxPrice = calcPrice(max, isXtoY, tokenXDecimal, tokenYDecimal);

    ticksData.push({
      x: maxPrice,
      y: 0,
      index: max
    });
  }

  return isXtoY ? ticksData : ticksData.reverse();
};

export type TokenDataOnChain = {
  symbol: string;
  address: string;
  name: string;
  decimals: number;
  balance: bigint;
};

export const getTokenDataByAddresses = async (tokens: string[], address?: string): Promise<Record<string, Token>> => {
  const tokenInfos: TokenDataOnChain[] = await SingletonOraiswapV3.getTokensInfo(tokens, address);

  const newTokens: Record<string, Token> = {};
  tokenInfos.forEach((token) => {
    newTokens[token.address] = {
      symbol: token.symbol ? (token.symbol as string) : 'UNKNOWN',
      address: token.address,
      name: token.name ? (token.name as string) : '',
      decimals: token.decimals,
      balance: token.balance,
      isUnknown: true
    };
  });
  return newTokens;
};

export async function handleGetCurrentPlotTicks({ poolKey, isXtoY, xDecimal, yDecimal }): Promise<PlotTickData[]> {
  try {
    const allTickmaps = await SingletonOraiswapV3.getFullTickmap(poolKey);

    const rawTicks = await SingletonOraiswapV3.getAllLiquidityTicks(poolKey, allTickmaps);

    if (rawTicks.length === 0) {
      const data = createPlaceholderLiquidityPlot(isXtoY, 0, poolKey.fee_tier.tick_spacing, xDecimal, yDecimal);
      return data;
    }

    const ticksData = createLiquidityPlot(rawTicks, poolKey.fee_tier.tick_spacing, isXtoY, xDecimal, yDecimal);
    return ticksData;
  } catch (error) {
    console.log(error);
    const data = createPlaceholderLiquidityPlot(isXtoY, 10, poolKey.fee_tier.tick_spacing, xDecimal, yDecimal);
    return data;
  }
}

export async function convertPlotTicks({
  poolKey,
  isXToY,
  xDecimal,
  yDecimal
}): Promise<ActiveLiquidityPerTickRange[]> {
  const plotTicks = await handleGetCurrentPlotTicks({ poolKey, isXtoY: isXToY, xDecimal, yDecimal });
  const activeLiquidity: ActiveLiquidityPerTickRange[] = [] as any;
  const maxTick = getMaxTick(poolKey.fee_tier.tick_spacing);
  plotTicks.forEach((plotTick, index) => {
    const { y, index: tickIndex } = plotTick;
    activeLiquidity.push({
      lowerTick: tickIndex,
      upperTick: plotTicks[index + 1] ? plotTicks[index + 1].index : maxTick,
      liquidityAmount: y
    });
  });
  // for (const plotTick of plotTicks) {
  //   const { y, index } = plotTick;
  //   activeLiquidity.push({
  //     lowerTick: index,
  //     upperTick: index + poolKey.fee_tier.tick_spacing,
  //     liquidityAmount: y
  //   });
  // }

  return activeLiquidity;
}
