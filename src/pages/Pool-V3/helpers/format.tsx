import { PoolKey, PoolWithPoolKey } from '@oraichain/oraidex-contracts-sdk/build/OraiswapV3.types';
import { poolKeyToString } from 'libs/contractSingleton';
import { TokenItemType } from '@oraichain/oraidex-common';
import DefaultIcon from 'assets/icons/tokens.svg?react';
import { PoolInfoResponse } from 'types/pool';
import { parseAssetOnlyDenom } from 'pages/Pools/helpers';
import { POOL_TYPE } from '../index';
import { oraichainTokensWithIcon } from 'initCommon';

export type PoolWithTokenInfo = PoolWithPoolKey & {
  FromTokenIcon: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & {
      title?: string;
    }
  >;
  ToTokenIcon: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & {
      title?: string;
    }
  >;
  feeTier: number;
  spread: number;
  tokenXinfo: TokenItemType;
  tokenYinfo: TokenItemType;
  poolKey: string;
  type: POOL_TYPE;
  url: string;
};

export const getTokenInfo = (address, isLight) => {
  let Icon = DefaultIcon;
  const tokenInfo = oraichainTokensWithIcon.find((token) => [token.denom, token.contractAddress].includes(address));

  if (tokenInfo) Icon = isLight ? tokenInfo.IconLight : tokenInfo.Icon;
  return { Icon, tokenInfo };
};

export const getIconPoolData = (tokenX, tokenY, isLight) => {
  let [FromTokenIcon, ToTokenIcon] = [DefaultIcon, DefaultIcon];
  const tokenXinfo = oraichainTokensWithIcon.find((token) => [token.denom, token.contractAddress].includes(tokenX));
  const tokenYinfo = oraichainTokensWithIcon.find((token) => [token.denom, token.contractAddress].includes(tokenY));

  if (tokenXinfo) FromTokenIcon = isLight ? tokenXinfo.IconLight : tokenXinfo.Icon;
  if (tokenYinfo) ToTokenIcon = isLight ? tokenYinfo.IconLight : tokenYinfo.Icon;
  return { FromTokenIcon, ToTokenIcon, tokenXinfo, tokenYinfo };
};

export const formatPoolData = (p: PoolWithPoolKey | PoolInfoResponse, isLight: boolean = false) => {
  if ('liquidityAddr' in p) {
    const { firstAssetInfo, secondAssetInfo } = p;
    const [baseDenom, quoteDenom] = [
      parseAssetOnlyDenom(JSON.parse(firstAssetInfo)),
      parseAssetOnlyDenom(JSON.parse(secondAssetInfo))
    ];

    const { FromTokenIcon, ToTokenIcon, tokenXinfo, tokenYinfo } = getIconPoolData(baseDenom, quoteDenom, isLight);

    return {
      ...p,
      isValid: true,
      type: POOL_TYPE.V2,
      FromTokenIcon,
      ToTokenIcon,
      tokenXinfo,
      tokenYinfo,
      url: `/pools/v2/${encodeURIComponent(baseDenom)}_${encodeURIComponent(quoteDenom)}`
    };
  }

  const [tokenX, tokenY] = [p?.pool_key.token_x, p?.pool_key.token_y];
  const feeTier = p?.pool_key.fee_tier.fee || 0;
  const { FromTokenIcon, ToTokenIcon, tokenXinfo, tokenYinfo } = getIconPoolData(tokenX, tokenY, isLight);
  const spread = p?.pool_key.fee_tier.tick_spacing || 100;

  const poolKey = p?.pool_key ? poolKeyToString(p.pool_key) : '';
  return {
    ...p,
    type: POOL_TYPE.V3,
    FromTokenIcon,
    ToTokenIcon,
    feeTier,
    spread,
    tokenXinfo,
    tokenYinfo,
    poolKey,
    isValid: tokenXinfo && tokenYinfo,
    url: `/pools/v3/${encodeURIComponent(poolKey)}`
  };
};

export const parsePoolKeyString = (poolKey: string): PoolKey => {
  const [tokenX, tokenY, fee, tickSpacing] = poolKey.split('-');
  return {
    fee_tier: {
      fee: Number(fee),
      tick_spacing: Number(tickSpacing)
    },
    token_x: tokenX,
    token_y: tokenY
  };
};

export function extractAddress(tokenInfo: TokenItemType) {
  return tokenInfo.contractAddress ? tokenInfo.contractAddress : tokenInfo.denom;
}
