import { PAIRS, TokenItemType, parseAssetInfo, USDC_CONTRACT, ORAIX_CONTRACT } from '@oraichain/oraidex-common';
import uniq from 'lodash/uniq';
import flatten from 'lodash/flatten';
import { assetInfoMap } from 'index';

export const getPoolTokens = (): TokenItemType[] => {
  return (
    uniq(
      flatten(PAIRS.map((pair) => pair.asset_infos))
        .map((info) => assetInfoMap[parseAssetInfo(info)])
        .filter(Boolean)
    ) ?? []
  );
};

export const PAIRS_CHART = PAIRS.map((pair) => {
  const assets = pair.asset_infos.map((info) => {
    if ('native_token' in info) return info.native_token.denom;
    return info.token.contract_addr;
  });

  // TODO: reverse symbol for pair oraix/usdc
  let symbol = `${pair.symbols[0]}/${pair.symbols[1]}`;
  if (assets[0] === USDC_CONTRACT && assets[1] === ORAIX_CONTRACT) {
    symbol = `${pair.symbols[1]}/${pair.symbols[0]}`;
  }
  return {
    ...pair,
    symbol,
    info: `${assets[0]}-${assets[1]}`,
    assets
  };
});
