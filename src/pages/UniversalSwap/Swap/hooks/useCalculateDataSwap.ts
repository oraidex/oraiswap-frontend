import {
  BigDecimal,
  calculateMinReceive,
  CW20_DECIMALS,
  parseTokenInfoRawDenom,
  toAmount
} from '@oraichain/oraidex-common';
import { OraiswapRouterQueryClient } from '@oraichain/oraidex-contracts-sdk';
import { useQuery } from '@tanstack/react-query';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useTokenFee, { useRelayerFeeToken } from 'hooks/useTokenFee';
import { network } from 'initCommon';
import { numberWithCommas } from 'pages/Pools/helpers';
import {
  getAverageRatio,
  getProtocolsSmartRoute,
  getRemoteDenom,
  isAllowAlphaIbcWasm,
  isAllowIBCWasm
} from 'pages/UniversalSwap/helpers';
import { useEffect, useState } from 'react';
import { fetchTokenInfos } from 'rest/api';
import { useSimulate } from './useSimulate';
import { useSwapFee } from './useSwapFee';
import useConfigReducer from 'hooks/useConfigReducer';

export const SIMULATE_INIT_AMOUNT = 1;

const splitsOSOR = {
  ORAICHAIN: 5,
  OTHERCHAIN: 1,
  DEFAULTCHAIN: 10
};

const useCalculateDataSwap = ({ originalFromToken, originalToToken, fromToken, toToken, userSlippage }) => {
  const { data: prices } = useCoinGeckoPrices();
  const { fee, isDependOnNetwork } = useSwapFee({
    fromToken: originalFromToken,
    toToken: originalToToken
  });

  const [tokenPoolPrices] = useConfigReducer('tokenPoolPrices');

  const remoteTokenDenomFrom = getRemoteDenom(originalFromToken);
  const remoteTokenDenomTo = getRemoteDenom(originalToToken);
  const fromTokenFee = useTokenFee(remoteTokenDenomFrom, fromToken.chainId, toToken.chainId);
  const toTokenFee = useTokenFee(remoteTokenDenomTo, fromToken.chainId, toToken.chainId);

  const useAlphaIbcWasm = isAllowAlphaIbcWasm(originalFromToken, originalToToken);
  const useIbcWasm = isAllowIBCWasm(originalFromToken, originalToToken);
  const isOraichain = originalFromToken.chainId === 'Oraichain' && originalToToken.chainId === 'Oraichain';
  const routerClient = new OraiswapRouterQueryClient(window.client, network.mixer_router);
  const protocols = getProtocolsSmartRoute(originalFromToken, originalToToken, { useIbcWasm, useAlphaIbcWasm });
  const maxSplits = isOraichain
    ? splitsOSOR.ORAICHAIN
    : useAlphaIbcWasm
    ? splitsOSOR.OTHERCHAIN
    : splitsOSOR.DEFAULTCHAIN;

  const simulateOption = {
    useAlphaIbcWasm,
    useIbcWasm,
    protocols,
    maxSplits,
    dontAllowSwapAfter: useAlphaIbcWasm ? [''] : undefined
  };

  const { relayerFee, relayerFeeInOraiToAmount: relayerFeeToken } = useRelayerFeeToken(
    originalFromToken,
    originalToToken
  );

  const [isAvgSimulate, setIsAvgSimulate] = useState({
    tokenFrom: originalFromToken.coinGeckoId,
    tokenTo: originalToToken.coinGeckoId,
    status: false
  });

  const {
    data: [fromTokenInfoData, toTokenInfoData]
  } = useQuery(['token-infos', fromToken, toToken], () => fetchTokenInfos([fromToken!, toToken!]), { initialData: [] });

  const {
    simulateData,
    setSwapAmount,
    fromAmountToken,
    toAmountToken,
    debouncedFromAmount,
    isPreviousSimulate,
    isRefetching
  } = useSimulate(
    'simulate-data',
    fromTokenInfoData,
    toTokenInfoData,
    originalFromToken,
    originalToToken,
    routerClient,
    null,
    {
      ...simulateOption
    }
  );

  const { simulateData: averageSimulateData, isPreviousSimulate: isAveragePreviousSimulate } = useSimulate(
    'average-simulate-data',
    fromTokenInfoData,
    toTokenInfoData,
    originalFromToken,
    originalToToken,
    routerClient,
    SIMULATE_INIT_AMOUNT,
    {
      ...simulateOption,
      ignoreFee: true,
      isAvgSimulate: true
    }
  );

  useEffect(() => {
    const { tokenFrom: currentFrom, tokenTo: currentTo, status: currentStatus } = isAvgSimulate;
    const { coinGeckoId: fromTokenId } = originalFromToken;
    const { coinGeckoId: toTokenId } = originalToToken;

    const shouldUpdate = currentFrom !== fromTokenId || currentTo !== toTokenId;

    if (shouldUpdate) {
      setIsAvgSimulate({
        tokenFrom: fromTokenId,
        tokenTo: toTokenId,
        status: false
      });
    }

    if (currentStatus || !averageSimulateData?.amount) return;

    setIsAvgSimulate({
      tokenFrom: fromTokenId,
      tokenTo: toTokenId,
      status: true
    });
  }, [averageSimulateData, originalFromToken, originalToToken]);

  const fromAmountTokenBalance =
    fromTokenInfoData &&
    toAmount(fromAmountToken, originalFromToken?.decimals || fromTokenInfoData?.decimals || CW20_DECIMALS);

  const { averageRatio } = getAverageRatio(simulateData, averageSimulateData, fromAmountToken, originalFromToken);

  const tokenFromPrice =
    prices?.[originalFromToken?.coinGeckoId] ?? tokenPoolPrices[parseTokenInfoRawDenom(originalFromToken)] ?? 0;
  const usdPriceShowFrom = (tokenFromPrice * fromAmountToken).toFixed(6);

  const tokenToPrice =
    prices?.[originalToToken?.coinGeckoId] ?? tokenPoolPrices[parseTokenInfoRawDenom(originalToToken)] ?? 0;
  const usdPriceShowTo = (tokenToPrice * simulateData?.displayAmount).toFixed(6);

  const isAverageRatio = averageRatio?.amount;
  const isSimulateDataDisplay = simulateData?.displayAmount;
  const minimumReceive =
    isAverageRatio && fromAmountTokenBalance
      ? calculateMinReceive(
          // @ts-ignore
          new BigDecimal(averageRatio.amount).div(SIMULATE_INIT_AMOUNT).toString(),
          fromAmountTokenBalance.toString(),
          userSlippage,
          originalFromToken.decimals
        )
      : '0';
  const isWarningSlippage = +minimumReceive > +simulateData?.amount;
  const simulateDisplayAmount = simulateData && simulateData.displayAmount ? simulateData.displayAmount : 0;
  const bridgeTokenFee =
    simulateDisplayAmount && (fromTokenFee || toTokenFee)
      ? new BigDecimal(simulateDisplayAmount)
          .mul(fromTokenFee)
          .add(new BigDecimal(simulateDisplayAmount).mul(toTokenFee).toString())
          .div(100)
          .toNumber()
      : 0;

  const minimumReceiveDisplay = isSimulateDataDisplay
    ? new BigDecimal(simulateDisplayAmount)
        .sub(new BigDecimal(simulateDisplayAmount).mul(userSlippage).div(100).toString())
        // TODO:  Fee has been deducted from simulated price
        // .sub(relayerFee)
        .sub(bridgeTokenFee)
        .toNumber()
    : 0;

  const expectOutputDisplay = isSimulateDataDisplay
    ? numberWithCommas(simulateData.displayAmount, undefined, { minimumFractionDigits: 6 })
    : 0;
  const estSwapFee = new BigDecimal(simulateDisplayAmount || 0).mul(fee || 0).toNumber();
  const totalFeeEst = new BigDecimal(bridgeTokenFee).add(relayerFee).add(estSwapFee).toNumber() || 0;

  return {
    fees: {
      estSwapFee,
      isDependOnNetwork,
      totalFeeEst,
      bridgeTokenFee,
      relayerFeeToken,
      relayerFee,
      fromTokenFee,
      toTokenFee
    },

    outputs: {
      expectOutputDisplay,
      minimumReceiveDisplay,
      isWarningSlippage,
      minimumReceive
    },

    tokenInfos: {
      fromAmountTokenBalance,
      usdPriceShowFrom,
      usdPriceShowTo
    },

    averageSimulateDatas: {
      averageRatio,
      averageSimulateData,
      isAveragePreviousSimulate
    },

    simulateDatas: {
      simulateData,
      setSwapAmount,
      fromAmountToken,
      toAmountToken,
      debouncedFromAmount,
      isPreviousSimulate,
      isRefetching
    }
  };
};

export default useCalculateDataSwap;
