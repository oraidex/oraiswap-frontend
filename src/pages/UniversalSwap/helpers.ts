import { CwIcs20LatestQueryClient, Uint128 } from '@oraichain/common-contracts-sdk';
import { Ratio } from '@oraichain/common-contracts-sdk/build/CwIcs20Latest.types';
import {
  CoinGeckoId,
  IBC_WASM_CONTRACT,
  ORAI_BRIDGE_EVM_DENOM_PREFIX,
  ORAI_BRIDGE_EVM_ETH_DENOM_PREFIX,
  ORAI_BRIDGE_EVM_TRON_DENOM_PREFIX,
  TokenItemType,
  getTokenOnOraichain,
  BigDecimal,
  toAmount,
  OraiIcon
} from '@oraichain/oraidex-common';
import {
  getSwapFromTokens,
  getSwapToTokens,
  UniversalSwapHelper
  // swapFromTokens,
  // swapToTokens
} from '@oraichain/oraidex-universal-swap';
import { isMobile } from '@walletconnect/browser-utils';
import { networks } from 'helper';
import { generateError } from 'libs/utils';
import DefaultIcon from 'assets/icons/tokens.svg?react';
import { TIMER } from 'pages/CoHarvest/constants';
import { formatDate, formatTimeWithPeriod } from 'pages/CoHarvest/helpers';
import { endOfMonth, endOfWeek } from 'pages/Pools/helpers';
import { FILTER_TIME_CHART, PairToken } from 'reducer/type';
import { assets } from 'chain-registry';
import {
  chainInfos,
  flattenTokens,
  flattenTokensWithIcon,
  oraichainTokens,
  oraichainTokensWithIcon,
  tokenMap
} from 'initCommon';
import { NetworkChainId } from '@oraichain/common';
import { store } from 'store/configure';

export enum SwapDirection {
  From,
  To
}

export interface SimulateResponse {
  amount: Uint128;
  displayAmount: number;
}

export interface SwapData {
  metamaskAddress?: string;
  tronAddress?: string;
}

export const TYPE_TAB_HISTORY = {
  ASSETS: 'assets',
  HISTORY: 'history'
};

export interface NetworkFilter {
  label?: string;
  value?: string;
  Icon?: any;
  IconLight?: any;
  chainSymbolImageUrl?: string;
}

export const initNetworkFilter = { label: 'All networks', value: '', Icon: undefined, IconLight: undefined };

/**
 * Get transfer token fee when universal swap
 * @param param0
 * @returns
 */
export const getTransferTokenFee = async ({ remoteTokenDenom }): Promise<Ratio | undefined> => {
  try {
    const ibcWasmContractAddress = IBC_WASM_CONTRACT;
    const ibcWasmContract = new CwIcs20LatestQueryClient(window.client, ibcWasmContractAddress);
    const ratio = await ibcWasmContract.getTransferTokenFee({ remoteTokenDenom });
    return ratio;
  } catch (error) {
    console.log({ error });
  }
};

// FIXME: hard code function for test compatibility
export const getTokenOnSpecificChainId = (coingeckoId: CoinGeckoId, chainId: string): TokenItemType | undefined => {
  return flattenTokens.find((t) => t.coinGeckoId === coingeckoId && t.chainId === chainId);
};

export function filterNonPoolEvmTokens(
  chainId: string,
  coingeckoId: CoinGeckoId,
  denom: string,
  searchTokenName: string,
  direction: SwapDirection // direction = to means we are filtering to tokens
) {
  // basic filter. Dont include itself & only collect tokens with searched letters
  let listTokens = direction === SwapDirection.From ? getSwapFromTokens(flattenTokens) : getSwapToTokens(flattenTokens);
  let filteredToTokens = listTokens.filter((token) => token.name.toLowerCase().includes(searchTokenName.toLowerCase()));

  // special case for tokens not having a pool on Oraichain
  if (UniversalSwapHelper.isSupportedNoPoolSwapEvm(coingeckoId)) {
    const swappableTokens = Object.keys(UniversalSwapHelper.swapEvmRoutes[chainId]).map((key) => key.split('-')[1]);
    const filteredTokens = filteredToTokens.filter((token) => swappableTokens.includes(token.contractAddress));

    // tokens that dont have a pool on Oraichain like WETH or WBNB cannot be swapped from a token on Oraichain
    if (direction === SwapDirection.To)
      return [
        ...new Set(
          filteredTokens.concat(filteredTokens.map((token) => getTokenOnOraichain(token.coinGeckoId, oraichainTokens)))
        )
      ];
    filteredToTokens = filteredTokens;
  }
  // special case filter. Tokens on networks other than supported evm cannot swap to tokens, so we need to remove them
  if (!UniversalSwapHelper.isEvmNetworkNativeSwapSupported(chainId as NetworkChainId)) {
    return filteredToTokens.filter((t) => {
      // one-directional swap. non-pool tokens of evm network can swap be swapped with tokens on Oraichain, but not vice versa
      const isSupported = UniversalSwapHelper.isSupportedNoPoolSwapEvm(t.coinGeckoId);

      if (direction === SwapDirection.To) return !isSupported;
      if (isSupported) {
        // if we cannot find any matched token then we dont include it in the list since it cannot be swapped
        const sameChainId = getTokenOnSpecificChainId(coingeckoId, t.chainId as NetworkChainId);
        if (!sameChainId) return false;
        return true;
      }
      return true;
    });
  }

  return filteredToTokens.filter((t) => {
    // filter out to tokens that are on a different network & with no pool because we are not ready to support them yet. TODO: support
    if (UniversalSwapHelper.isSupportedNoPoolSwapEvm(t.coinGeckoId)) return t.chainId === chainId;
    return true;
  });
}

export const checkEvmAddress = (chainId: NetworkChainId, metamaskAddress?: string, tronAddress?: string | boolean) => {
  switch (chainId) {
    case '0x01':
    case '0x38':
      if (!metamaskAddress) {
        throw generateError('Please login EVM wallet!');
      }
      break;
    case '0x2b6653dc':
      if (!tronAddress) {
        throw generateError('Please login Tron wallet!');
      }
  }
};

export const relayerFeeInfo = {
  [ORAI_BRIDGE_EVM_DENOM_PREFIX]: 6,
  [ORAI_BRIDGE_EVM_ETH_DENOM_PREFIX]: 6,
  [ORAI_BRIDGE_EVM_TRON_DENOM_PREFIX]: 6
};

export const AMOUNT_BALANCE_ENTRIES: [number, string, string][] = [
  [0.25, '25%', 'one-quarter'],
  [0.5, '50%', 'half'],
  [0.75, '75%', 'three-quarters'],
  [1, '100%', 'max']
];

export type SwapType = 'Swap' | 'Bridge' | 'Universal Swap';
export const getSwapType = ({
  fromChainId,
  toChainId,
  fromCoingeckoId,
  toCoingeckoId
}: {
  fromChainId: NetworkChainId;
  toChainId: NetworkChainId;
  fromCoingeckoId: CoinGeckoId;
  toCoingeckoId: CoinGeckoId;
}): SwapType => {
  if (fromChainId === 'Oraichain' && toChainId === 'Oraichain') return 'Swap';

  if (fromCoingeckoId === toCoingeckoId) return 'Bridge';

  return 'Universal Swap';
};

export const getExplorerScan = (chainId: NetworkChainId) => {
  switch (chainId) {
    case '0x01':
      return 'https://etherscan.io/tx';
    case '0x38':
      return 'https://bscscan.com/tx';
    case '0x2b6653dc':
      return 'https://tronscan.org/#/transaction';
    case '0x1ae6':
      return 'https://scan.kawaii.global/tx';
    case 'Oraichain':
      return 'https://scanium.io/Oraichain/tx';
    case 'osmosis-1':
      return 'https://www.mintscan.io/osmosis/tx';
    case 'cosmoshub-4':
      return 'https://www.mintscan.io/cosmos/tx';
    case 'injective-1':
      return 'https://explorer.injective.network/transaction';
    case 'kawaii_6886-1':
      return 'https://scan.kawaii.global/tx';
    case 'noble-1':
      return 'https://www.mintscan.io/noble/tx';
    case 'ton':
      return 'https://tonscan.org/address';
    default:
      return 'https://scanium.io/Oraichain/tx';
  }
};

export const calculateFinalPriceChange = (
  isPairReverseSymbol: boolean,
  currentPrice: number,
  percentPriceChange: number
) => {
  if (!isPairReverseSymbol) return percentPriceChange;

  if (currentPrice === 0) return 0;
  return (currentPrice / (1 + percentPriceChange) - currentPrice) / currentPrice;
};

// generate chain base on to token in universal-swap
export const genCurrentChain = ({
  toToken,
  currentToChain
}: {
  toToken: TokenItemType;
  currentToChain: string | '';
}): string | '' => {
  let newCurrentToChain: string | '' = currentToChain;

  newCurrentToChain = networks?.find((chain) => chain.chainId === toToken.chainId)?.chainName || '';

  return newCurrentToChain;
};

export const formatTimeDataChart = (
  time: number | string,
  type: FILTER_TIME_CHART,
  lastDate: number,
  currentText: string = 'Now'
) => {
  if (!time) {
    return currentText;
  }

  const fmtTime = typeof time === 'string' ? new Date(time).getTime() : time * TIMER.MILLISECOND;
  return time === lastDate ? currentText : `${formatDate(fmtTime)} ${formatTimeWithPeriod(fmtTime)}`;
};

export const getTokenIcon = (token: TokenItemType, theme: string) => {
  let tokenIcon;
  const tokenInfo = oraichainTokensWithIcon.find((e) => e.coinGeckoId === token?.coinGeckoId);

  if (tokenInfo && Object.keys(tokenInfo.IconLight || tokenInfo.Icon || {}).length > 0) {
    tokenIcon = theme === 'light' ? tokenInfo?.iconLight : tokenInfo?.icon;
  }
  return tokenIcon;
};

export const refreshBalances = async (
  loadingRefresh: boolean,
  setLoadingRefresh: (boolean) => void,
  { metamaskAddress, tronAddress, oraiAddress, btcAddress, solAddress, tonAddress },
  callback
) => {
  try {
    if (loadingRefresh) return;
    setLoadingRefresh(true);
    await callback({ metamaskAddress, tronAddress, oraiAddress, btcAddress, solAddress, tonAddress });
  } catch (err) {
    console.log({ err });
  } finally {
    setTimeout(() => {
      setLoadingRefresh(false);
    }, 2000);
  }
};

export const getFromToToken = (
  originalFromToken: TokenItemType,
  originalToToken: TokenItemType,
  fromTokenDenomSwap: string,
  toTokenDenomSwap: string,
  onchainTokens: TokenItemType[]
) => {
  const isEvmSwap = UniversalSwapHelper.isEvmSwappable({
    fromChainId: originalFromToken?.chainId,
    toChainId: originalToToken?.chainId,
    fromContractAddr: originalFromToken?.contractAddress,
    toContractAddr: originalToToken?.contractAddress
  });

  const storage = store.getState();
  const allOraichainTokens = storage.token.allOraichainTokens || [];
  const fromToken =
    (isEvmSwap
      ? tokenMap[fromTokenDenomSwap]
      : allOraichainTokens.find(
          (token) => token.denom === fromTokenDenomSwap || token.contractAddress === fromTokenDenomSwap
        ) ?? tokenMap[fromTokenDenomSwap]) || onchainTokens.find((token) => token.denom === fromTokenDenomSwap);
  const toToken = isEvmSwap
    ? tokenMap[toTokenDenomSwap]
    : allOraichainTokens.find(
        (token) => token.denom === toTokenDenomSwap || token.contractAddress === toTokenDenomSwap
      ) ?? tokenMap[toTokenDenomSwap];
  onchainTokens.find((token) => token.denom === toTokenDenomSwap);
  return { fromToken, toToken };
};

export const getRemoteDenom = (originalToken: TokenItemType) => {
  return originalToken.contractAddress ? originalToken.prefix + originalToken.contractAddress : originalToken.denom;
};

export const getTokenBalance = (originalToken: TokenItemType, amounts: AmountDetails, subAmount: bigint) => {
  return originalToken ? BigInt(amounts[originalToken.denom] ?? '0') + subAmount : BigInt(0);
};

export const getDisableSwap = ({
  originalToToken,
  walletByNetworks,
  swapLoading,
  fromAmountToken,
  toAmountToken,
  fromAmountTokenBalance,
  fromTokenBalance,
  addressTransfer,
  validAddress,
  simulateData,
  isLoadingSimulate
}) => {
  const disabledSwapBtn =
    swapLoading ||
    !fromAmountToken ||
    !toAmountToken ||
    fromAmountTokenBalance > fromTokenBalance || // insufficent fund
    !addressTransfer ||
    !validAddress.isValid ||
    isLoadingSimulate;

  let disableMsg: string;
  if (!validAddress.isValid) disableMsg = `Recipient address not found`;
  if (!addressTransfer) disableMsg = `Recipient address not found`;
  if (!simulateData || simulateData.displayAmount <= 0) disableMsg = 'Enter an amount';
  if (fromAmountTokenBalance > fromTokenBalance) disableMsg = `Insufficient funds`;
  if (isLoadingSimulate) disableMsg = `Swap`;
  return { disabledSwapBtn, disableMsg };
};

/**
 * This function return protocols of smart route
 * Example: if has chainId is Cosmos at fromToken or toToken then return ['Oraidex', 'OraidexV3','Osmosis']
 * @param toToken
 * @param useIbcWasm
 * @returns string
 */
export const getProtocolsSmartRoute = (
  fromToken: TokenItemType,
  toToken: TokenItemType,
  { useAlphaIbcWasm, useIbcWasm }
) => {
  const protocols = ['Oraidex', 'OraidexV3'];
  if (useIbcWasm && !useAlphaIbcWasm) return protocols;
  if (fromToken?.chainId === 'noble-1' || toToken?.chainId === 'noble-1') return protocols;

  const allowOsmosisProtocols = ['injective-1', 'Neutaro-1', 'noble-1', 'osmosis-1', 'cosmoshub-4', 'celestia'];
  const isAllowOsmosisProtocol =
    allowOsmosisProtocols.includes(fromToken?.chainId) || allowOsmosisProtocols.includes(toToken?.chainId);

  if (isAllowOsmosisProtocol) return [...protocols, 'Osmosis'];
  return protocols;
};

export const isAllowAlphaIbcWasm = (fromToken: TokenItemType, toToken: TokenItemType) => {
  // FIXME: fix case inj oraichain -> x oraichain
  if (
    fromToken &&
    fromToken.coinGeckoId === 'injective-protocol' &&
    fromToken.chainId === toToken.chainId &&
    fromToken.chainId === 'Oraichain'
  ) {
    return false;
  }
  return true;
};

/**
 * This function check status using ibc wasm
 * Example:  Oraichain -> Oraichain + Cosmos (false) | Oraichain -> Evm (true) | Evm -> Evm + Oraichain + Cosmos (true) | Cosmos -> Cosmos + Oraichain (false) | Cosmos -> Evm (true)
 * @param fromToken
 * @param toToken
 * @returns boolean
 */
export const isAllowIBCWasm = (fromToken: TokenItemType, toToken: TokenItemType) => {
  // FIXME: fix case inj oraichain -> x oraichain
  if (
    fromToken &&
    fromToken.coinGeckoId === 'injective-protocol' &&
    fromToken.chainId === toToken.chainId &&
    fromToken.chainId === 'Oraichain'
  ) {
    return true;
  }
  return false;
};

export const getAverageRatio = (
  simulateData: SimulateResponse,
  averageSimulateData: SimulateResponse,
  fromAmountToken: number,
  originalFromToken: TokenItemType
) => {
  let averageRatio = undefined;
  if (simulateData && fromAmountToken) {
    const displayAmount = new BigDecimal(simulateData.displayAmount).div(fromAmountToken).toNumber();
    averageRatio = {
      amount: toAmount(displayAmount ? displayAmount : averageSimulateData?.displayAmount, originalFromToken.decimals),
      displayAmount: displayAmount ? displayAmount : averageSimulateData?.displayAmount ?? 0
    };
  }
  return { averageRatio };
};

export const findKeyByValue = (obj, value: string) => Object.keys(obj).find((key) => obj[key] === value);

export const transformSwapInfo = (data) => {
  const transformedData = JSON.parse(JSON.stringify(data));
  transformedData.swapInfo = transformedData.swapInfo.map((swap, index) => {
    swap.tokenIn = transformedData.swapInfo[index ? index - 1 : index].tokenOut;
    return swap;
  });
  return transformedData;
};

export const getPathInfo = (path, assets) => {
  let [NetworkFromIcon, NetworkToIcon] = [OraiIcon, OraiIcon];

  const pathChainId = path.chainId.split('-')[0].toLowerCase();

  if (path.chainId) {
    const chainFrom = chainInfos.find((cosmos) => cosmos.chainId === path.chainId);
    NetworkFromIcon = chainFrom ? chainFrom.chainSymbolImageUrl : OraiIcon;
  }

  if (path.tokenOutChainId) {
    const chainTo = chainInfos.find((cosmos) => cosmos.chainId === path.tokenOutChainId);
    NetworkToIcon = chainTo ? chainTo.chainSymbolImageUrl : OraiIcon;
  }
  return { NetworkFromIcon, NetworkToIcon, pathChainId };
};

export const getTokenIconWithChainRegistry = (baseDenom: string) => {
  if (!baseDenom) return undefined;

  const supportedChains = new Set([
    'osmosis',
    'cosmoshub',
    'injective',
    'noble',
    'celestia',
    'oraichain',
    'neutaro',
    'binancesmartchain',
    'bitcoin',
    'ethereum',
    'tron',
    'ton'
  ]);

  const baseDenomUpper = baseDenom.toUpperCase();

  const assetList = assets.flatMap(({ chain_name, assets }) => (supportedChains.has(chain_name) ? assets : []));

  const isMatchingAsset = (asset) => {
    const [token, tokenCw20] = asset.base.split(':');
    const tokenAddressMatch = asset?.address?.toUpperCase() === baseDenomUpper;
    const denomMatch = (tokenCw20 || token).toUpperCase() === baseDenomUpper;

    return denomMatch || tokenAddressMatch;
  };

  return assetList.find(isMatchingAsset);
};

export const getTokenIconWithCommon = (baseDenom: string) => {
  return flattenTokensWithIcon.find((token) =>
    [token?.contractAddress, token.denom].filter(Boolean).includes(baseDenom)
  );
};

export const getTokenIsStableCoin = (originalToken) => {
  return originalToken && ['tether', 'usd-coin'].includes(originalToken.coinGeckoId);
};
