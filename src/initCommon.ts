import { OraidexCommon, TokenItemType } from '@oraichain/oraidex-common';
import { AnyAction, Dispatch } from '@reduxjs/toolkit';
import { updateAllOraichainTokens, updateAllOtherChainTokens, setLoadingOraidexCommon } from 'reducer/token';

<<<<<<< Updated upstream
const getOraidexCommon = async () => {
  console.log('getOraidexCommon');
  const persistStore = localStorage.getItem('oraidexCommon');
  const parsedResult = persistStore ? JSON.parse(persistStore) : null;
  if (!parsedResult) {
    console.log('initializing');
    const oraidexCommonOg = await OraidexCommon.load();
    localStorage.setItem('oraidexCommon', JSON.stringify(oraidexCommonOg));
    return oraidexCommonOg;
  }
  // console.log({ parsedResult });
  return parsedResult;
};

// export const oraidexCommon = await getOraidexCommon();

export let isLoadingCommon = true;
=======
// export const initializeApp = async () => {
//   console.log({ store });
//   store.dispatch(setLoadingOraidexCommon(true));
//   try {
//     const oraidexCommon = await OraidexCommon.load();
//     store.dispatch(setLoadingOraidexCommon(false));
//     return oraidexCommon;
//   } catch (error) {
//     store.dispatch(setLoadingOraidexCommon(false));
//     throw error;
//   }
// };

// export const oraidexCommon = await initializeApp();
>>>>>>> Stashed changes
export const oraidexCommon = await OraidexCommon.load();
isLoadingCommon = false;

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
