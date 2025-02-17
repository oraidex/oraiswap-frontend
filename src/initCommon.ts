import { OraidexCommon, TokenItemType } from '@oraichain/oraidex-common';
import { AnyAction, Dispatch } from '@reduxjs/toolkit';
import { updateAllOraichainTokens, updateAllOtherChainTokens } from 'reducer/token';

const arraysAreDifferent = (arr1: TokenItemType[], arr2: TokenItemType[]): boolean => {
  const sortedArr1 = JSON.stringify([...arr1].sort());
  const sortedArr2 = JSON.stringify([...arr2].sort());
  return sortedArr1 !== sortedArr2;
};

let oraidexCommonOg = await OraidexCommon.load();
while (!oraidexCommonOg) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  oraidexCommonOg = await OraidexCommon.load();
}
export const oraidexCommon = oraidexCommonOg;

export const usdcSolToken = {
  name: 'USDC',
  org: 'sol',
  denom: 's20_usdc',
  contractAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  coinGeckoId: 'usd-coin',
  decimals: 6,
  description: 'USD Coin on Solana',
  rpc: 'https://swr.xnftdata.com/rpc-proxy/',
  chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  cosmosBased: false,
  gasPriceStep: {
    low: 1,
    average: 1.25,
    high: 1.5
  },
  coinType: 501,
  feeCurrencies: [
    {
      coinDenom: 'SOL',
      coinMinimalDenom: 'sol',
      coinDecimals: 9,
      coinGeckoId: 'solana',
      coinImageUrl: 'https://assets.coingecko.com/coins/images/4128/standard/solana.png?1718769756',
      gasPriceStep: {
        low: 1,
        average: 1.25,
        high: 1.5
      }
    }
  ],
  icon: 'https://statics.solscan.io/cdn/imgs/s60?ref=68747470733a2f2f7261772e67697468756275736572636f6e74656e742e636f6d2f736f6c616e612d6c6162732f746f6b656e2d6c6973742f6d61696e2f6173736574732f6d61696e6e65742f45506a465764643541756671535371654d32714e31787a7962617043384734774547476b5a777954447431762f6c6f676f2e706e67',
  iconLight:
    'https://statics.solscan.io/cdn/imgs/s60?ref=68747470733a2f2f7261772e67697468756275736572636f6e74656e742e636f6d2f736f6c616e612d6c6162732f746f6b656e2d6c6973742f6d61696e2f6173736574732f6d61696e6e65742f45506a465764643541756671535371654d32714e31787a7962617043384734774547476b5a777954447431762f6c6f676f2e706e67',
  bridgeTo: ['Oraichain']
};

export const initializeOraidexCommon = async (
  dispatch: Dispatch<AnyAction>,
  allOraichainTokens: TokenItemType[],
  addedTokens: TokenItemType[]
) => {
  let oraichainTokens = oraidexCommonOg.oraichainTokens;
  const otherChainTokens = oraidexCommonOg.otherChainTokens;
  // Start Dev
  otherChainTokens.push(usdcSolToken as any);
  let usdcToken = oraichainTokens.find((token) => token.name === 'USDC');
  usdcToken.bridgeTo.push('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp');
  oraichainTokens = oraichainTokens.map((token) => {
    if (token.name !== 'USDC') {
      return token;
    }
    return usdcToken;
  });
  // End Dev
  const allVerifiedOraichainTokens = allOraichainTokens.filter((token) => token.isVerified);
  if (arraysAreDifferent(oraichainTokens, allVerifiedOraichainTokens)) {
    dispatch(updateAllOraichainTokens([...oraichainTokens, ...addedTokens]));
  }

  if (otherChainTokens.length > 0) {
    dispatch(updateAllOtherChainTokens(otherChainTokens));
  }
};

export const {
  tokens,
  oraichainNetwork,
  evmChains,
  flattenTokens,
  oraichainTokens,
  tokenMap,
  cosmosTokens,
  evmTokens,
  kawaiiTokens,
  otherChainTokens,
  cw20TokenMap,
  cw20Tokens,
  assetInfoMap,
  network,
  celestiaNetwork,
  chainConfig,
  chainInfosCommon,
  flattenTokensWithIcon,
  oraichainTokensWithIcon,
  otherTokensWithIcon,
  tokenConfig,
  tokensWithIcon,
  btcTokens,
  btcChains,
  solTokens,
  tonNetworkMainnet,
  tonTokens
} = oraidexCommon;

// Start Dev
otherChainTokens.push(usdcSolToken);
// End Dev

// FIXME: need remove when update chainInfo in oraichain-common sdk
const IGNORE_CHAIN_IDS = new Set(['kawaii_6886-1', '0x1ae6']);
const getFilteredChainInfos = (chainInfo) => chainInfo.filter((chain) => !IGNORE_CHAIN_IDS.has(chain.chainId));

export const chainInfos = getFilteredChainInfos(oraidexCommon.chainInfos);
export const chainInfosWithIcon = getFilteredChainInfos(oraidexCommon.chainInfosWithIcon);
export const cosmosChains = getFilteredChainInfos(oraidexCommon.cosmosChains);
