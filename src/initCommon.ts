import { OraidexCommon, TokenItemType } from '@oraichain/oraidex-common';
import { AnyAction, Dispatch } from '@reduxjs/toolkit';
import { updateAllOraichainTokens, updateAllOtherChainTokens, setLoadingOraidexCommon } from 'reducer/token';

export const oraidexCommon = await OraidexCommon.load();

export const initializeOraidexCommon = async (dispatch: Dispatch<AnyAction>, allOraichainTokens: TokenItemType[]) => {
  const oraidexCommon = await OraidexCommon.load();
  const oraichainTokens = oraidexCommon.oraichainTokens;
  const otherChainTokens = oraidexCommon.otherChainTokens;
  if (oraichainTokens.length > (allOraichainTokens || []).length) {
    dispatch(updateAllOraichainTokens(oraichainTokens));
  }
  if (otherChainTokens.length > 0) {
    dispatch(updateAllOtherChainTokens(otherChainTokens));
  }
};

export const {
  tokens,
  oraichainNetwork,
  chainInfos,
  cosmosChains,
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
  chainInfosWithIcon,
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
