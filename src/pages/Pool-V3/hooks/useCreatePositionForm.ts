import usePoolDetailV3Reducer from 'hooks/usePoolDetailV3Reducer';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  ActiveLiquidityPerTickRange,
  fetchActiveLiquidityData,
  fetchHistoricalPriceData1M,
  fetchHistoricalPriceData1Y,
  fetchHistoricalPriceData3M,
  fetchHistoricalPriceData7D,
  fetchLiquidityTicks,
  fetchPool,
  fetchTickMap,
  setHistoricalRange,
  setIsXToY,
  setLiquidityChartData,
  setPoolId,
  setXRange,
  setYRange,
  setZoom,
  TimeDuration
} from 'reducer/poolDetailV3';
import { BigDecimal } from '@oraichain/oraidex-common';
import { PoolFeeAndLiquidityDaily, PRICE_SCALE } from 'libs/contractSingleton';
import { getMaxTick, getMinTick, getTickAtSqrtPrice } from '@oraichain/oraiswap-v3';
import { calcPrice } from '../components/PriceRangePlot/utils';
import useCreatePosition from './useCreatePosition';
import { CoinGeckoPrices } from 'hooks/useCoingecko';

const ZOOM_STEP = 0.05;

export enum OptionType {
  CUSTOM = 'Set your own price range for liquidity. Balance fee potential and risk based on market conditions.',
  WIDE = 'Adds liquidity to a wider range, balancing fees and risk. Stays active longer than narrow ranges but may earn lower fees.',
  NARROW = 'Adds liquidity to a specific price range. Earns the most fees when the price stays in range but stops earning if the price moves out',
  FULL_RANGE = 'Adds liquidity for the full price range. Stays active regardless of price changes, but may earn lower fees.'
}

const TICK_SPACING_TO_RANGE = {
  '100': 3,
  '10': 300,
  '1': 500
};

const useCreatePositionForm = (
  poolString: string,
  slippage: number,
  extendPrices: CoinGeckoPrices<string>,
  feeDailyData: PoolFeeAndLiquidityDaily[],
  toggleZap: boolean
) => {
  const dispatch = useDispatch();
  const [hoverPrice, setHoverPrice] = useState<number>(0);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [lowerTick, setLowerTick] = useState<number>(0);
  const [higherTick, setHigherTick] = useState<number>(0);
  const [optionType, setOptionType] = useState<OptionType>(OptionType.CUSTOM);
  const [isFullRange, setIsFullRange] = useState<boolean>(false);
  const [isSuperNarrow, setIsSuperNarrow] = useState<boolean>(false);

  const poolId = usePoolDetailV3Reducer('poolId');
  const poolKey = usePoolDetailV3Reducer('poolKey');
  const pool = usePoolDetailV3Reducer('pool');
  const tokenX = usePoolDetailV3Reducer('tokenX');
  const tokenY = usePoolDetailV3Reducer('tokenY');
  const historicalRange = usePoolDetailV3Reducer('historicalRange');
  const cache3Month = usePoolDetailV3Reducer('cache3Month');
  const cache7Day = usePoolDetailV3Reducer('cache7Day');
  const cache1Month = usePoolDetailV3Reducer('cache1Month');
  const cache1Year = usePoolDetailV3Reducer('cache1Year');
  const historicalChartData = usePoolDetailV3Reducer('historicalChartData');
  const fullRange = usePoolDetailV3Reducer('fullRange');
  const xRange = usePoolDetailV3Reducer('xRange');
  const yRange = usePoolDetailV3Reducer('yRange');
  const currentPrice = usePoolDetailV3Reducer('currentPrice');
  const liquidityChartData = usePoolDetailV3Reducer('liquidityChartData');
  const fullTickMap = usePoolDetailV3Reducer('fullTickMap');
  const liquidityTicks = usePoolDetailV3Reducer('liquidityTicks');
  const zoom = usePoolDetailV3Reducer('zoom');
  const range = usePoolDetailV3Reducer('range');
  const isXToY = usePoolDetailV3Reducer('isXToY');

  const {
    amountX,
    amountY,
    isXBlocked,
    isYBlocked,
    focusId,
    liquidity,
    loading,
    apr,
    tokenZap,
    zapAmount,
    zapInResponse,
    zapImpactPrice,
    matchRate,
    isVisible,
    zapFee,
    totalFee,
    swapFee,
    amountXZap,
    amountYZap,
    zapLoading,
    zapError,
    simulating,
    zapXUsd,
    zapYUsd,
    zapUsd,
    zapApr,
    setZapApr,
    setApr,
    addLiquidity,
    changeRangeHandler,
    setAmountX,
    setAmountY,
    setFocusId,
    setTokenZap,
    setZapAmount,
    setAmountXZap,
    setAmountYZap,
    handleZapIn,
    handleSimulateZapIn,
    setLoading
  } = useCreatePosition(
    pool,
    poolKey,
    lowerTick,
    higherTick,
    isXToY,
    tokenX,
    tokenY,
    slippage,
    extendPrices,
    feeDailyData,
    toggleZap
  );

  // when have pool string, we set to pool id
  // can get: poolKey, tokenX, tokenY
  useEffect(() => {
    if (poolString) {
      setApr(0);
      setZapApr(0);
      dispatch(setPoolId(poolString));
    }
  }, [poolString, dispatch]);

  // when have pool key, we fetch pool data, after that we can get:
  // pool, currentPrice,
  useEffect(() => {
    if (poolKey) {
      dispatch<any>(fetchPool(poolKey));
      dispatch<any>(fetchTickMap(poolKey));
    }
  }, [poolKey, dispatch]);

  useEffect(() => {
    if (fullTickMap) {
      dispatch<any>(
        fetchLiquidityTicks({
          poolKey,
          tickMap: fullTickMap
        })
      );
    }
  }, [fullTickMap, poolKey, dispatch]);

  useEffect(() => {
    if (liquidityTicks && poolKey && tokenX && tokenY && yRange) {
      dispatch(setLiquidityChartData());
    }
  }, [liquidityTicks, isXToY, poolKey, tokenX, tokenY, yRange, dispatch]);

  // when we have poolId, poolKey, tokenX, tokenY, we can get:
  // historicalChartData, activeLiquidity, cache3Month, cache7Day, cache1Month, cache1Year
  useEffect(() => {
    if (poolKey && tokenX && tokenY && currentPrice) {
      dispatch<any>(fetchHistoricalPriceData7D(poolId));
      dispatch<any>(fetchHistoricalPriceData1M(poolId));
      dispatch<any>(fetchHistoricalPriceData3M(poolId));
      dispatch<any>(fetchHistoricalPriceData1Y(poolId));
      dispatch<any>(
        fetchActiveLiquidityData({
          poolKey,
          xDecimal: tokenX.decimals,
          yDecimal: tokenY.decimals,
          isXToY: isXToY
        })
      );
    }
  }, [poolId, poolKey, tokenX, tokenY, isXToY, currentPrice, dispatch]);

  // when have historicalChartData, currentPrice, we can get yRange
  useEffect(() => {
    if (historicalChartData && currentPrice) {
      const data = historicalChartData?.map(({ time, close }) => ({
        time,
        price: close
      }));

      data.push({
        time: Date.now(),
        price: currentPrice
      })

      const padding = 0.1;

      const prices = data.map((d) => d.price);

      let chartMin = historicalChartData?.length > 0 ? Math.max(0, Math.min(...prices)) : currentPrice * 0.5;
      let chartMax = historicalChartData?.length > 0 ? Math.max(...prices) : currentPrice * 1.5;

      if (chartMin === chartMax) {
        chartMin = currentPrice * 0.5;
        chartMax = currentPrice * 1.5;
      }

      const absMax = range ? Math.max(Number(range[1].toString()), chartMax) : chartMax;
      const absMin = range ? Math.min(Number(range[0].toString()), chartMin) : chartMin;

      const delta = Math.abs(absMax - absMin);

      const minWithPadding = Math.max(0, absMin - delta * padding);
      const maxWithPadding = absMax + delta * padding;

      const zoomAdjustedMin = zoom > 1 ? absMin / zoom : absMin * zoom;
      const zoomAdjustedMax = absMax * zoom;

      let finalMin = minWithPadding;
      let finalMax = maxWithPadding;

      if (zoomAdjustedMin < minWithPadding) finalMin = zoomAdjustedMin;
      if (zoomAdjustedMax > maxWithPadding) finalMax = zoomAdjustedMax;

      dispatch(setYRange([finalMin, finalMax]));
    }
  }, [historicalChartData, zoom, currentPrice, range, dispatch]);

  // when have liquidityChartData, we can get xRange
  useEffect(() => {
    if (liquidityChartData) {
      const xRange = [0, Math.max(...liquidityChartData.map((d) => d.depth))];
      dispatch(setXRange(xRange as [number, number]));
    }
  }, [liquidityChartData, dispatch]);

  useEffect(() => {
    if (currentPrice) {
      setHoverPrice(currentPrice);
    }
  }, [currentPrice]);

  useEffect(() => {
    if (poolKey && pool && tokenX && tokenY) {
      resetPlot();
    }
  }, [poolKey, pool, tokenX, tokenY, isXToY]);

  // when change min max price of range, get the corresponding tick
  useEffect(() => {
    if (!tokenX && !tokenY) return;
    if (minPrice !== 0 || maxPrice !== 0) {
      const minPriceTrue = isXToY ? minPrice : 1 / maxPrice;
      const maxPriceTrue = isXToY ? maxPrice : 1 / minPrice;
      getCorrespondingTickRange(minPriceTrue, maxPriceTrue);
    }
  }, [minPrice, maxPrice, tokenX, tokenY]);

  useEffect(() => {
    if (optionType === OptionType.CUSTOM) {
      if (minPrice === 0) {
        resetRange();
      }
    }
  }, [optionType]);

  const changeHistoricalRange = (range: TimeDuration) => {
    dispatch(setHistoricalRange(range));
  };

  const flipToken = () => {
    dispatch(setIsXToY(!isXToY));
  };

  const zoomIn = () => {
    dispatch(setZoom(zoom - ZOOM_STEP));
  };

  const zoomOut = () => {
    dispatch(setZoom(zoom + ZOOM_STEP));
  };

  const resetRange = () => {
    dispatch(setZoom(1.1));
    resetPlot();
    setOptionType(OptionType.CUSTOM);
    setApr(0);
  };

  const swapBaseToX = () => {
    if (!isXToY) {
      setOptionType(OptionType.CUSTOM);
      dispatch(setIsXToY(true));
    }
  };

  const swapBaseToY = () => {
    if (isXToY) {
      setOptionType(OptionType.CUSTOM);
      dispatch(setIsXToY(false));
    }
  };

  const resetPlot = () => {
    if (!pool) return;
    if (!poolKey) return;
    changeHistoricalRange('7d');
    const higherTick = Math.max(
      Number(getMinTick(Number(poolKey.fee_tier.tick_spacing))),
      Number(pool.current_tick_index) +
      Number(poolKey.fee_tier.tick_spacing) * TICK_SPACING_TO_RANGE[poolKey.fee_tier.tick_spacing]
    );

    const lowerTick = Math.min(
      Number(getMaxTick(Number(poolKey.fee_tier.tick_spacing))),
      Number(pool.current_tick_index) -
      Number(poolKey.fee_tier.tick_spacing) * TICK_SPACING_TO_RANGE[poolKey.fee_tier.tick_spacing]
    );

    const minPrice = calcPrice(lowerTick, isXToY, tokenX.decimals, tokenY.decimals);

    const maxPrice = calcPrice(higherTick, isXToY, tokenX.decimals, tokenY.decimals);

    setMinPrice(minPrice);
    setMaxPrice(maxPrice);

    setAmountX(0);
    setAmountY(0);
  };

  const handleOptionCustom = () => {
    changeHistoricalRange('7d');
    resetPlot();
  };

  // wide: take the price range of prices in 3m
  const handleOptionWide = () => {
    setIsFullRange(false);
    setIsSuperNarrow(false);
    changeHistoricalRange('3mo');
    const data = cache3Month?.map(({ time, close }) => ({
      time,
      price: close
    }));
    data.push({
      time: Date.now(),
      price: currentPrice
    });
    const prices = data.map((d) => d.price);

    const chartMin = cache3Month?.length > 0 ? Math.max(0, Math.min(...prices)) : currentPrice * 0.5;
    const chartMax = cache3Month?.length > 0 ? Math.max(...prices) : currentPrice * 1.5;

    if (isXToY) {
      setMinPrice(chartMin);
      setMaxPrice(chartMax);
    } else {
      setMinPrice(chartMax);
      setMaxPrice(chartMin);
    }
  };

  // narrow: take the price range of prices in 7d
  const handleOptionNarrow = () => {
    setIsFullRange(false);
    changeHistoricalRange('7d');
    setIsSuperNarrow(true);
    // const data = cache7Day?.map(({ time, close }) => ({
    //   time,
    //   price: close
    // }));
    // data.push({
    //   time: Date.now(),
    //   price: currentPrice
    // });
    // const prices = data.map((d) => d.price);

    // const chartMin = cache7Day?.length > 0 ? Math.max(0, Math.min(...prices)) : currentPrice * 0.5;
    // const chartMax = cache7Day?.length > 0 ? Math.max(...prices) : currentPrice * 1.5;

    // if (isXToY) {
    //   setMinPrice(chartMin);
    //   setMaxPrice(chartMax);
    // } else {
    //   setMinPrice(chartMax);
    //   setMaxPrice(chartMin);
    // }

    setLowerTick(Number(pool.current_tick_index));
    setHigherTick(Number(pool.current_tick_index) + Number(poolKey.fee_tier.tick_spacing));
    if (isXToY) {
      setMinPrice(currentPrice);
      setMaxPrice(currentPrice);
    } else {
      setMinPrice(currentPrice);
      setMaxPrice(currentPrice);
    }
  };

  // full range: just set full range
  const handleOptionFullRange = () => {
    const maxTick = getMaxTick(Number(poolKey.fee_tier.tick_spacing));
    const maxPrice = calcPrice(maxTick, isXToY, tokenX.decimals, tokenY.decimals);
    if (isXToY) {
      setMinPrice(0);
      setMaxPrice(maxPrice);
    } else {
      setMinPrice(maxPrice);
      setMaxPrice(0);
    }
    setIsFullRange(true);
  };

  const getCorrespondingTickRange = (priceMin: number, priceMax: number) => {
    try {
      if (isSuperNarrow) return;
      if (isFullRange) {
        setLowerTick(getMinTick(Number(poolKey.fee_tier.tick_spacing)));
        setHigherTick(getMaxTick(Number(poolKey.fee_tier.tick_spacing)));
        return;
      }

      const sqrtPriceMin = priceToSqrtPriceBigInt(priceMin, tokenX.decimals - tokenY.decimals);
      const sqrtPriceMax = priceToSqrtPriceBigInt(priceMax, tokenX.decimals - tokenY.decimals);
      const lowerTick = getTickAtSqrtPrice(sqrtPriceMin, poolKey.fee_tier.tick_spacing);
      const higherTick = getTickAtSqrtPrice(sqrtPriceMax, poolKey.fee_tier.tick_spacing);
      if (isXToY) {
        if (lowerTick >= higherTick) {
          // set lower tick: higher tick - tick spacing, change to corresponding price
          const minPrice = calcPrice(
            lowerTick - poolKey.fee_tier.tick_spacing * 10,
            isXToY,
            tokenX.decimals,
            tokenY.decimals
          );
          setMinPrice(minPrice);
          return;
        }
      } else {
        if (lowerTick <= higherTick) {
          // set higher tick: lower tick + tick spacing, change to corresponding price
          const maxPrice = calcPrice(
            higherTick + poolKey.fee_tier.tick_spacing * 10,
            isXToY,
            tokenX.decimals,
            tokenY.decimals
          );
          setMaxPrice(maxPrice);
          return;
        }
      }

      setLowerTick(Math.min(lowerTick, higherTick));
      setHigherTick(Math.max(lowerTick, higherTick));
    } catch (error) {
      console.log('error', error);
    }
  };

  useEffect(() => {
    if (isXBlocked || isYBlocked) {
      setApr(0);
      setZapApr(0);
    }
  }, [isXBlocked, isYBlocked]);

  return {
    poolId,
    poolKey,
    pool,
    tokenX,
    tokenY,
    historicalRange,
    cache3Month,
    cache7Day,
    cache1Month,
    cache1Year,
    historicalChartData,
    fullRange,
    xRange,
    yRange,
    currentPrice,
    liquidityChartData,
    zoom,
    range,
    hoverPrice,
    minPrice,
    maxPrice,
    lowerTick,
    higherTick,
    isXToY,
    optionType,
    amountX,
    amountY,
    isXBlocked,
    isYBlocked,
    focusId,
    liquidity,
    loading,
    apr,
    tokenZap,
    zapAmount,
    zapInResponse,
    zapImpactPrice,
    matchRate,
    isVisible,
    zapFee,
    totalFee,
    swapFee,
    amountXZap,
    amountYZap,
    zapLoading,
    zapError,
    simulating,
    zapXUsd,
    zapYUsd,
    zapUsd,
    zapApr,
    setIsFullRange,
    setIsSuperNarrow,
    setApr,
    setZapApr,
    handleOptionCustom,
    handleOptionWide,
    handleOptionNarrow,
    handleOptionFullRange,
    setTokenZap,
    setZapAmount,
    setAmountXZap,
    setAmountYZap,
    handleZapIn,
    handleSimulateZapIn,
    addLiquidity,
    changeRangeHandler,
    setAmountX,
    setAmountY,
    setFocusId,
    setOptionType,
    setLowerTick,
    setHigherTick,
    setMinPrice,
    setMaxPrice,
    setHoverPrice,
    changeHistoricalRange,
    zoomIn,
    zoomOut,
    resetRange,
    flipToken,
    swapBaseToX,
    swapBaseToY,
    setLoading
  };
};

export function getLiqFrom(target: number, list: ActiveLiquidityPerTickRange[]): number {
  for (let i = 0; i < list.length; i++) {
    if (list[i].lowerTick <= target && list[i].upperTick >= target) {
      return Number(list[i].liquidityAmount.toString());
    }
  }
  return 0;
}

function numberExponentToLarge(numIn) {
  numIn += ''; // To cater to numric entries
  var sign = ''; // To remember the number sign
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  numIn.charAt(0) == '-' && ((numIn = numIn.substring(1)), (sign = '-')); // remove - sign & remember it
  var str = numIn.split(/[eE]/g); // Split numberic string at e or E
  if (str.length < 2) return sign + numIn; // Not an Exponent Number? Exit with orginal Num back
  var power = str[1]; // Get Exponent (Power) (could be + or -)

  var deciSp = (1.1).toLocaleString().substring(1, 2); // Get Deciaml Separator
  str = str[0].split(deciSp); // Split the Base Number into LH and RH at the decimal point
  var baseRH = str[1] || '', // RH Base part. Make sure we have a RH fraction else ""
    baseLH = str[0]; // LH base part.

  if (power >= 0) {
    // ------- Positive Exponents (Process the RH Base Part)
    if (power > baseRH.length) baseRH += '0'.repeat(power - baseRH.length); // Pad with "0" at RH
    baseRH = baseRH.slice(0, power) + deciSp + baseRH.slice(power); // Insert decSep at the correct place into RH base
    if (baseRH.charAt(baseRH.length - 1) == deciSp) baseRH = baseRH.slice(0, -1); // If decSep at RH end? => remove it
  } else {
    // ------- Negative exponents (Process the LH Base Part)
    let num = Math.abs(power) - baseLH.length; // Delta necessary 0's
    if (num > 0) baseLH = '0'.repeat(num) + baseLH; // Pad with "0" at LH
    baseLH = baseLH.slice(0, power) + deciSp + baseLH.slice(power); // Insert "." at the correct place into LH base
    if (baseLH.charAt(0) == deciSp) baseLH = '0' + baseLH; // If decSep at LH most? => add "0"
  }
  // Remove leading and trailing 0's and Return the long number (with sign)
  return sign + (baseLH + baseRH).replace(/^0*(\d+|\d+\.\d+?)\.?0*$/, '$1');
}

export function priceToSqrtPriceBigInt(price: number, diffDecimal: number): bigint {
  const priceBigInt = new BigDecimal(numberExponentToLarge(price * 10 ** diffDecimal), 0)
    .sqrt()
    .mul(10n ** PRICE_SCALE)
    .div(10 ** diffDecimal)
    .toString();

  return BigInt(trimDecimals(priceBigInt));
}

export function trimDecimals(number: string): string {
  return number.split('.')[0];
}

export default useCreatePositionForm;
