import { OraidexCommon } from "@oraichain/oraidex-common";
export const oraidexCommon = await OraidexCommon.load();
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
    network
} = oraidexCommon;