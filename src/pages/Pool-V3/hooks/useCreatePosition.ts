import { useEffect, useState } from 'react';
import {
  determinePositionTokenBlock,
  PositionTokenBlock,
  printBigint,
  trimLeadingZeros
} from '../components/PriceRangePlot/utils';
import { Pool, PoolKey, TokenAmount } from '@oraichain/oraidex-contracts-sdk/build/OraiswapV3.types';
import { toAmount, TokenItemType } from '@oraichain/oraidex-common';
import { extractAddress, getLiquidityByX, getLiquidityByY } from '@oraichain/oraiswap-v3';
import { calculateTokenAmountsWithSlippage, InitPositionData } from '../helpers/helper';
import { convertBalanceToBigint } from '../helpers/number';
import useAddLiquidity from './useAddLiquidity';
import { fetchPositionAprInfo, PoolFeeAndLiquidityDaily } from 'libs/contractSingleton';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import useZapIn from './useZapIn';

const useCreatePosition = (
  pool: Pool,
  poolKey: PoolKey,
  minTick: number,
  maxTick: number,
  isXToY: boolean,
  tokenX: TokenItemType,
  tokenY: TokenItemType,
  slippage: number,
  extendPrices: CoinGeckoPrices<string>,
  feeDailyData: PoolFeeAndLiquidityDaily[],
  toggleZap: boolean
) => {
  const [amountX, setAmountX] = useState<number>(0);
  const [amountY, setAmountY] = useState<number>(0);

  const [liquidity, setLiquidity] = useState<bigint>(BigInt(0));

  const [isXBlocked, setIsXBlocked] = useState<boolean>(false);
  const [isYBlocked, setIsYBlocked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [apr, setApr] = useState<number>(0);

  const [focusId, setFocusId] = useState<'zap' | 'x' | 'y'>(null);

  const { handleInitPosition } = useAddLiquidity();

  const addLiquidity = async ({
    data,
    walletAddress,
    callBackSuccess,
    callBackFailed
  }: {
    data: InitPositionData;
    walletAddress: string;
    callBackSuccess: (tx: string) => void;
    callBackFailed: (e: any) => void;
  }) => {
    setLoading(true);
    try {
      await handleInitPosition(data, walletAddress, callBackSuccess, callBackFailed);
    } catch (error) {
      console.log('error', error);
    } finally {
      setLoading(false);
    }
  };

  const xUsd = tokenX && (extendPrices?.[tokenX.coinGeckoId] * amountX).toFixed(6);
  const yUsd = tokenY && (extendPrices?.[tokenY.coinGeckoId] * amountY).toFixed(6);

  useEffect(() => {
    (async () => {
      if (amountX === 0 && amountY === 0) {
        setApr(0);
        return;
      }
      if (pool && poolKey && tokenX && tokenY) {
        const apr = await fetchPositionAprInfo(
          {
            pool,
            pool_key: poolKey
          },
          {
            liquidity,
            pool_key: poolKey
          } as any,
          extendPrices,
          Number(xUsd),
          Number(yUsd),
          !isXBlocked && !isYBlocked,
          feeDailyData
        );
        if (apr.total && !isXBlocked && !isYBlocked) {
          setApr(apr.total * 100);
        }
      }
    })();
  }, [pool, poolKey, tokenX, tokenY, xUsd, yUsd, amountX, amountY, minTick, maxTick]);

  useEffect(() => {
    if (!(pool && minTick && maxTick)) return;
    const fromBlocked =
      determinePositionTokenBlock(BigInt(pool.sqrt_price), minTick, maxTick, isXToY) === PositionTokenBlock.A;

    const toBlocked =
      determinePositionTokenBlock(BigInt(pool.sqrt_price), minTick, maxTick, isXToY) === PositionTokenBlock.B;

    setIsXBlocked(fromBlocked);
    setIsYBlocked(toBlocked);
  }, [minTick, maxTick, pool, isXToY]);

  useEffect(() => {
    if (!tokenX) return;
    if (focusId === 'x') {
      setAmountY(
        Number(
          getOtherTokenAmount(toAmount(amountX, tokenX.decimals).toString(), Number(minTick), Number(maxTick), true)
        )
      );
    }
  }, [amountX, focusId]);

  useEffect(() => {
    if (!tokenY) return;
    if (focusId === 'y') {
      setAmountX(
        Number(
          getOtherTokenAmount(toAmount(amountY, tokenY.decimals).toString(), Number(minTick), Number(maxTick), false)
        )
      );
    }
  }, [amountY, focusId]);

  useEffect(() => {
    if (isXBlocked) {
      setAmountX(0);
    }
  }, [isXBlocked]);

  useEffect(() => {
    if (isYBlocked) {
      setAmountY(0);
    }
  }, [isYBlocked]);

  useEffect(() => {
    if ((minTick !== 0 || maxTick !== 0) && pool && tokenX && tokenY) {
      changeRangeHandler();
    }
  }, [minTick, maxTick, pool, tokenX, tokenY]);

  const {
    tokenZap,
    zapAmount,
    zapInResponse,
    zapImpactPrice,
    matchRate,
    isVisible,
    zapFee,
    totalFee,
    swapFee,
    zapApr,
    amountX: amountXZap,
    amountY: amountYZap,
    xUsd: zapXUsd,
    yUsd: zapYUsd,
    zapUsd,
    zapLoading,
    zapError,
    simulating,
    setZapApr,
    setTokenZap,
    setZapAmount,
    setAmountX: setAmountXZap,
    setAmountY: setAmountYZap,
    handleZapIn,
    handleSimulateZapIn
  } = useZapIn(pool, poolKey, extendPrices, tokenX, tokenY, toggleZap, minTick, maxTick, feeDailyData);

  const changeRangeHandler = () => {
    if (tokenX && maxTick > pool.current_tick_index) {
      const deposit = amountX;
      const amount = getOtherTokenAmount(
        convertBalanceToBigint((deposit || '0').toString(), tokenX.decimals).toString(),
        Number(minTick),
        Number(maxTick),
        true
      );

      if (tokenY && +deposit !== 0) {
        setAmountX(deposit);
        setAmountY(Number(amount));
        return;
      }
    }

    if (tokenY && minTick < pool.current_tick_index) {
      const deposit = amountY;
      const amount = getOtherTokenAmount(
        convertBalanceToBigint((deposit || '0').toString(), tokenY.decimals).toString(),
        Number(minTick),
        Number(maxTick),
        false
      );

      if (tokenX && +deposit !== 0) {
        setAmountY(deposit);
        setAmountX(Number(amount));
      }
    }
  };

  const calcAmount = (amount: TokenAmount, left: number, right: number, tokenAddress: string) => {
    if (!pool) return BigInt(0);
    if (!tokenX || !tokenY || isNaN(left) || isNaN(right)) {
      return BigInt(0);
    }

    const byX = tokenAddress === extractAddress(tokenX);

    const lowerTick = Math.min(left, right);
    const upperTick = Math.max(left, right);

    try {
      if (byX) {
        const { amount: tokenYAmount, l: positionLiquidity } = getLiquidityByX(
          BigInt(amount),
          lowerTick,
          upperTick,
          BigInt(pool.sqrt_price),
          true
        );

        let [, yAmountWithSlippage] = calculateTokenAmountsWithSlippage(
          poolKey.fee_tier.tick_spacing,
          BigInt(pool.sqrt_price),
          positionLiquidity,
          lowerTick,
          upperTick,
          Number(slippage),
          true
        );
        const finalYAmount = yAmountWithSlippage > tokenYAmount ? yAmountWithSlippage : tokenYAmount;

        setLiquidity(positionLiquidity);

        return finalYAmount;
      }

      const { amount: tokenXAmount, l: positionLiquidity } = getLiquidityByY(
        BigInt(amount),
        lowerTick,
        upperTick,
        BigInt(pool.sqrt_price),
        true
      );

      let [xAmountWithSlippage] = calculateTokenAmountsWithSlippage(
        poolKey.fee_tier.tick_spacing,
        BigInt(pool.sqrt_price),
        positionLiquidity,
        lowerTick,
        upperTick,
        Number(slippage),
        true
      );
      const finalXAmount = xAmountWithSlippage > tokenXAmount ? xAmountWithSlippage : tokenXAmount;

      setLiquidity(positionLiquidity);

      return finalXAmount;
    } catch (error) {
      console.log('error', error);
      const result = (byX ? getLiquidityByY : getLiquidityByX)(
        BigInt(amount),
        lowerTick,
        upperTick,
        BigInt(pool.sqrt_price),
        true
      );

      let [xAmountWithSlippage, yAmountWithSlippage] = calculateTokenAmountsWithSlippage(
        poolKey.fee_tier.tick_spacing,
        BigInt(pool.sqrt_price),
        result.l,
        lowerTick,
        upperTick,
        Number(slippage),
        true
      );

      setLiquidity(result.l);

      if (byX) {
        return yAmountWithSlippage > result.amount ? yAmountWithSlippage : result.amount;
      } else {
        return xAmountWithSlippage > result.amount ? xAmountWithSlippage : result.amount;
      }
    }
  };

  const getOtherTokenAmount = (amount: TokenAmount, left: number, right: number, byFirst: boolean) => {
    const [printToken, calcToken] = byFirst ? [tokenY, tokenX] : [tokenX, tokenY];

    if (!printToken || !calcToken) {
      return '0.0';
    }

    const result = calcAmount(amount, left, right, extractAddress(calcToken));

    return trimLeadingZeros(printBigint(result, printToken.decimals));
  };

  return {
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
    setApr,
    setZapApr,
    setLoading,
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
    handleSimulateZapIn
  };
};

export default useCreatePosition;
