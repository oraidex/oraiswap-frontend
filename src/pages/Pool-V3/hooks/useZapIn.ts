import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { BigDecimal, MULTICALL_CONTRACT, TokenItemType, ZAPPER_CONTRACT } from '@oraichain/oraidex-common';
import { ZapperQueryClient } from '@oraichain/oraidex-contracts-sdk';
import { Pool, PoolKey } from '@oraichain/oraidex-contracts-sdk/build/OraiswapV3.types';
import {
  poolKeyToString,
  RouteNoLiquidity,
  RouteNotFoundError,
  SpamTooManyRequestsError,
  ZapConsumer,
  ZapInLiquidityResponse
} from '@oraichain/oraiswap-v3';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import { useDebounce } from 'hooks/useDebounce';
import { network, oraichainTokens, oraidexCommon } from 'initCommon';
import { fetchPositionAprInfo, PoolFeeAndLiquidityDaily } from 'libs/contractSingleton';
import mixpanel from 'mixpanel-browser';
import { useEffect, useState } from 'react';
import useZap from './useZap';

const useZapIn = (
  pool: Pool,
  poolKey: PoolKey,
  extendPrices: CoinGeckoPrices<string>,
  tokenX: TokenItemType,
  tokenY: TokenItemType,
  toggleZap: boolean,
  minTick: number,
  maxTick: number,
  feeDailyData: PoolFeeAndLiquidityDaily[]
) => {
  const [tokenZap, setTokenZap] = useState<TokenItemType>(oraichainTokens.find((token) => token.name === 'USDT'));
  const [zapAmount, setZapAmount] = useState<number>(0);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [zapError, setZapError] = useState<string>('');
  const [zapInResponse, setZapInResponse] = useState<ZapInLiquidityResponse>();
  const [zapImpactPrice, setZapImpactPrice] = useState<number>(0);
  const [matchRate, setMatchRate] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [swapFee, setSwapFee] = useState<number>(0);
  const [totalFee, setTotalFee] = useState<number>(0);
  const [amountX, setAmountX] = useState<number>(0);
  const [amountY, setAmountY] = useState<number>(0);
  const [zapFee, setZapFee] = useState<number>(0);
  const [zapLoading, setZapLoading] = useState<boolean>(false);
  const [zapApr, setZapApr] = useState<number>(0);

  const { zapIn } = useZap();

  const debounceZapAmount = useDebounce(zapAmount, 1000);
  const debounceLowerTick = useDebounce(minTick, 1000);
  const debounceUpperTick = useDebounce(maxTick, 1000);

  const xUsd =
    zapInResponse &&
    tokenX &&
    ((extendPrices?.[tokenX?.coinGeckoId] * (amountX || 0)) / 10 ** tokenX.decimals).toFixed(6);
  const yUsd =
    zapInResponse &&
    tokenX &&
    ((extendPrices?.[tokenY?.coinGeckoId] * (amountY || 0)) / 10 ** tokenY.decimals).toFixed(6);
  const zapUsd = extendPrices?.[tokenZap?.coinGeckoId]
    ? (extendPrices[tokenZap.coinGeckoId] * Number(zapAmount || 0)).toFixed(6)
    : '0';

  useEffect(() => {
    (async () => {
      if (!zapInResponse) return;
      if (pool && poolKey && tokenX && tokenY) {
        const apr = await fetchPositionAprInfo(
          {
            pool,
            pool_key: poolKey
          },
          {
            liquidity: zapInResponse.minimumLiquidity,
            pool_key: poolKey
          } as any,
          extendPrices,
          Number(xUsd),
          Number(yUsd),
          zapInResponse.amountX !== '0' && zapInResponse.amountY !== '0',
          feeDailyData
        );
        if (apr.total && zapInResponse.amountX !== '0' && zapInResponse.amountY !== '0') {
          setZapApr(apr.total * 100);
        }
        if (zapInResponse.amountX === '0' || zapInResponse.amountY === '0') {
          setZapApr(0);
        }
      }
    })();
  }, [pool, poolKey, tokenX, tokenY, xUsd, yUsd, zapInResponse]);

  useEffect(() => {
    if (Number(zapAmount) > 0 && toggleZap) {
      handleSimulateZapIn();
    }
  }, [debounceZapAmount, debounceLowerTick, debounceUpperTick]);

  useEffect(() => {
    if (Number(zapAmount) > 0 && !zapInResponse && !simulating) {
      setSimulating(true);
    }
    if (Number(zapAmount) === 0 || !zapAmount) {
      setZapInResponse(null);
    }
  }, [zapAmount, debounceZapAmount]);

  const handleZapIn = async (walletAddress: string, onSuccess: (tx: string) => void, onFailed: any) => {
    try {
      if (tokenZap && zapAmount) {
        setZapLoading(true);
        await zapIn(
          {
            tokenZap,
            zapAmount: new BigDecimal(zapAmount, tokenZap.decimals).mul(10n ** BigInt(tokenZap.decimals)).toString(),
            zapInResponse
          },
          walletAddress,
          onSuccess,
          onFailed
        );
      }
    } catch (error) {
      console.log('error', error);
    } finally {
      setZapLoading(false);
      if (process.env.REACT_APP_SENTRY_ENVIRONMENT === 'production') {
        const logEvent = {
          address: walletAddress,
          tokenZap: tokenZap.name,
          tokenFrom: tokenX.name,
          tokenTo: tokenY.name,
          poolData: poolKeyToString(poolKey),
          zapAmount,
          zapUsd,
          type: 'ZapIn'
        };
        mixpanel.track('Zap PoolV3 oraiDEX', logEvent);
      }
    }
  };

  const handleSimulateZapIn = async () => {
    setSimulating(true);
    setZapLoading(true);
    let zapFee = 0;
    let client: CosmWasmClient;
    try {
      client = await CosmWasmClient.connect(network.rpc);
      const zap = new ZapperQueryClient(client, ZAPPER_CONTRACT);
      zapFee = Number((await zap.protocolFee()).percent);
    } catch (error) {
      // console.error('Error handleSimulateZapIn fee:', error);
    }

    try {
      const amountAfterFee = Number(zapAmount) * (1 - zapFee);

      const routerApi = 'https://osor.oraidex.io/smart-router/alpha-router';

      const zapper = new ZapConsumer({
        client,
        deviation: 0,
        dexV3Address: network.pool_v3,
        multiCallAddress: MULTICALL_CONTRACT,
        routerApi,
        smartRouteConfig: {
          swapOptions: {
            protocols: ['OraidexV3'],
            maxSplits: 1
          }
        },
        oraidexCommon: oraidexCommon
      });

      const amountIn = Math.round(amountAfterFee * 10 ** tokenZap.decimals).toString();
      const amountFee = Math.floor(zapFee * Number(zapAmount) * 10 ** tokenZap.decimals);

      setZapFee(amountFee);
      const lowerTick = Math.min(debounceLowerTick, debounceUpperTick);
      const upperTick = Math.max(debounceLowerTick, debounceUpperTick);

      const result = await zapper.processZapInPositionLiquidity({
        poolKey: poolKey,
        tokenIn: tokenZap,
        amountIn: amountIn,
        lowerTick,
        upperTick,
        tokenX: tokenX,
        tokenY: tokenY
      });

      setAmountX(Number(result?.amountX));
      setAmountY(Number(result?.amountY));
      setSwapFee(result.swapFee * 100);
      const inputUsd = extendPrices?.[tokenZap.coinGeckoId] * Number(amountAfterFee);
      const outputUsd =
        extendPrices?.[tokenX.coinGeckoId] * (Number(result.amountX) / 10 ** tokenX.decimals) +
        extendPrices?.[tokenY.coinGeckoId] * (Number(result.amountY) / 10 ** tokenY.decimals);

      const priceImpact = (Math.abs(inputUsd - outputUsd) / inputUsd) * 100;
      const matchRate = 100 - priceImpact;

      const swapFeeInUsd = amountAfterFee * result.swapFee * extendPrices?.[tokenZap.coinGeckoId];
      const zapFeeInUsd = (Number(zapAmount) - amountAfterFee) * extendPrices?.[tokenZap.coinGeckoId];
      const totalFeeInUsd = swapFeeInUsd + zapFeeInUsd;

      setTotalFee(totalFeeInUsd);
      setZapImpactPrice(priceImpact);
      setMatchRate(matchRate);
      setZapInResponse(result);
      setSimulating(false);
    } catch (error) {
      console.log('error', error);

      if (error instanceof RouteNotFoundError) {
        setZapError('No route found, try other tokens or other amount');
      } else if (error instanceof RouteNoLiquidity) {
        setZapError('No liquidity found for the swap route. Cannot proceed with the swap.');
      } else if (error instanceof SpamTooManyRequestsError) {
        setZapError('Too many requests, please try again later, after 1 minute');
      } else {
        console.error('Unexpected error during zap simulation:', error);
        setZapError('An unexpected error occurred, please try again later.');
      }
    } finally {
      setSimulating(false);
      setZapLoading(false);
    }
  };

  return {
    tokenZap,
    zapAmount,
    zapInResponse,
    zapImpactPrice,
    matchRate,
    isVisible,
    zapFee,
    totalFee,
    swapFee,
    amountX,
    amountY,
    zapLoading,
    zapError,
    simulating,
    xUsd,
    yUsd,
    zapUsd,
    zapApr,
    setZapApr,
    setTokenZap,
    setZapAmount,
    setAmountX,
    setAmountY,
    handleZapIn,
    handleSimulateZapIn
  };
};

export default useZapIn;
