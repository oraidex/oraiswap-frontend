import { TokenItemType } from '@oraichain/oraidex-common';
import { OraiswapRouterReadOnlyInterface } from '@oraichain/oraidex-contracts-sdk';
import { UniversalSwapHelper } from '@oraichain/oraidex-universal-swap';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { TokenInfo } from 'types/token';
import { useDebounce } from 'hooks/useDebounce';
import { handleErrorRateLimit } from 'helper';
import { flattenTokens, oraichainTokens } from 'initCommon';

export const getRouterConfig = (options?: {
  path?: string;
  protocols?: string[];
  dontAllowSwapAfter?: string[];
  maxSplits?: number;
  ignoreFee?: boolean;
}) => {
  return {
    url: 'https://osor.oraidex.io',
    path: options?.path ?? '/smart-router/alpha-router',
    protocols: options?.protocols ?? ['Oraidex', 'OraidexV3'],
    dontAllowSwapAfter: options?.dontAllowSwapAfter ?? ['Oraidex', 'OraidexV3'],
    maxSplits: options?.maxSplits,
    ignoreFee: options?.ignoreFee ?? false
  };
};

/**
 * Simulate ratio between fromToken & toToken
 * @param queryKey
 * @param fromTokenInfoData
 * @param toTokenInfoData
 * @param initAmount
 * @returns
 */
export const useSimulate = (
  queryKey: string,
  fromTokenInfoData: TokenInfo,
  toTokenInfoData: TokenInfo,
  originalFromTokenInfo: TokenItemType,
  originalToTokenInfo: TokenItemType,
  routerClient: OraiswapRouterReadOnlyInterface,
  initAmount?: number,
  simulateOption?: {
    useAlphaSmartRoute?: boolean;
    useIbcWasm?: boolean;
    useAlphaIbcWasm?: boolean;
    isAvgSimulate?: boolean;
    path?: string;
    protocols?: string[];
    dontAllowSwapAfter?: string[];
    maxSplits?: number;
    ignoreFee?: boolean;
    keepPreviousData?: boolean;
  }
) => {
  const [[fromAmountToken, toAmountToken], setSwapAmount] = useState([initAmount || null, 0]);
  const debouncedFromAmount = useDebounce(fromAmountToken, 800);
  const enabled = !!fromTokenInfoData && !!toTokenInfoData && !!debouncedFromAmount && fromAmountToken > 0;
  let refetchInterval: number | boolean = 10000;
  if (simulateOption?.isAvgSimulate) refetchInterval = false;
  const {
    data: simulateData,
    isPreviousData: isPreviousSimulate,
    isRefetching
  } = useQuery(
    [queryKey, fromTokenInfoData, toTokenInfoData, debouncedFromAmount],
    async () => {
      try {
        const res = await UniversalSwapHelper.handleSimulateSwap({
          flattenTokens: flattenTokens,
          oraichainTokens: oraichainTokens,
          originalFromInfo: originalFromTokenInfo,
          originalToInfo: originalToTokenInfo,
          originalAmount: debouncedFromAmount,
          routerClient,
          routerOption: {
            useAlphaIbcWasm: simulateOption?.useAlphaIbcWasm,
            useIbcWasm: simulateOption?.useIbcWasm
          },
          routerConfig: getRouterConfig(simulateOption)
        });

        if (res.routes?.error) {
          const error = res.routes?.error || {};
          const errorMsg = error.message || '';

          handleErrorRateLimit(errorMsg);
        }

        return res;
      } catch (error) {
        console.log('error simulate FE', error);
      }
    },
    {
      keepPreviousData: !simulateOption?.keepPreviousData,
      refetchInterval,
      staleTime: 3000,
      enabled,
      onError: (error) => {
        console.log('isAvgSimulate:', simulateOption?.isAvgSimulate, 'error when simulate: ', error);
      }
    }
  );

  useEffect(() => {
    // initAmount used for simulate averate ratio
    const fromAmount = initAmount ?? fromAmountToken;
    setSwapAmount([fromAmount ?? null, !!fromAmount ? Number(simulateData?.displayAmount) : 0]);
  }, [simulateData, fromAmountToken, fromTokenInfoData, toTokenInfoData]);

  return {
    simulateData,
    fromAmountToken,
    toAmountToken,
    setSwapAmount,
    debouncedFromAmount,
    isPreviousSimulate,
    isRefetching
  };
};
