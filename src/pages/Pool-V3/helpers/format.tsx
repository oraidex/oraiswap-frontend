import { TokenItemType } from '@oraichain/oraidex-common';
import { PoolKey, PoolWithPoolKey } from '@oraichain/oraidex-contracts-sdk/build/OraiswapV3.types';
import DefaultIcon from 'assets/icons/tokens.svg?react';
import { chainInfosWithIcon, oraichainTokensWithIcon, osmosisPoolTokenWithIcon } from 'config/chainInfos';
import { poolKeyToString } from 'libs/contractSingleton';
import { parseAssetOnlyDenom } from 'pages/Pools/helpers';
import { OsmosisPoolInfoResponse, PoolInfoResponse } from 'types/pool';
import { AllPoolType } from '../hooks/useGetPoolList';
import { POOL_CHAIN, POOL_TYPE } from '../index';

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
  tokenXInfo: TokenItemType;
  tokenYInfo: TokenItemType;
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
  const tokenXInfo = oraichainTokensWithIcon.find((token) => [token.denom, token.contractAddress].includes(tokenX));
  const tokenYInfo = oraichainTokensWithIcon.find((token) => [token.denom, token.contractAddress].includes(tokenY));

  if (tokenXInfo) FromTokenIcon = isLight ? tokenXInfo.IconLight : tokenXInfo.Icon;
  if (tokenYInfo) ToTokenIcon = isLight ? tokenYInfo.IconLight : tokenYInfo.Icon;
  return { FromTokenIcon, ToTokenIcon, tokenXInfo, tokenYInfo };
};

export const getIconOsmosisPoolData = (tokenX, tokenY, isLight) => {
  let [FromTokenIcon, ToTokenIcon] = [DefaultIcon, DefaultIcon];
  const tokenXInfo = osmosisPoolTokenWithIcon.find((token) => [token.denom, token.contractAddress].includes(tokenX));
  const tokenYInfo = osmosisPoolTokenWithIcon.find((token) => [token.denom, token.contractAddress].includes(tokenY));

  if (tokenXInfo) FromTokenIcon = isLight ? tokenXInfo.IconLight : tokenXInfo.Icon;
  if (tokenYInfo) ToTokenIcon = isLight ? tokenYInfo.IconLight : tokenYInfo.Icon;
  return { FromTokenIcon, ToTokenIcon, tokenXInfo, tokenYInfo };
};

export const formatPoolV2 = (p: PoolInfoResponse, isLight: boolean = false) => {
  // pool V2
  const { firstAssetInfo, secondAssetInfo } = p;
  const [baseDenom, quoteDenom] = [
    parseAssetOnlyDenom(JSON.parse(firstAssetInfo)),
    parseAssetOnlyDenom(JSON.parse(secondAssetInfo))
  ];

  const { FromTokenIcon, ToTokenIcon, tokenXInfo, tokenYInfo } = getIconPoolData(baseDenom, quoteDenom, isLight);

  return {
    ...p,
    isValid: true,
    network: POOL_CHAIN.ORAICHAIN,
    chainInfo: chainInfosWithIcon.find((c) => c.chainName === POOL_CHAIN.ORAICHAIN),
    type: POOL_TYPE.V2,
    FromTokenIcon,
    ToTokenIcon,
    tokenXInfo,
    tokenYInfo,
    url: `/pools/v2/oraichain/${encodeURIComponent(baseDenom)}_${encodeURIComponent(quoteDenom)}`
  };
};

export const formatOsmosisPools = (p: OsmosisPoolInfoResponse, isLight: boolean = false) => {
  // osmosis-pool
  const {
    id,
    coinDenoms,
    coinNames,
    market,
    incentives,
    poolNameByDenom,
    raw,
    reserveCoins,
    spreadFactor,
    totalFiatValueLocked,
    type
  } = p;

  const {
    address,
    incentives_address,
    spread_rewards_address,
    current_tick_liquidity,
    token0,
    token1,
    current_sqrt_price,
    current_tick,
    tick_spacing,
    exponent_at_price_one,
    spread_factor,
    last_liquidity_update
  } = raw || {};

  const marketInfo = Object.entries(market).reduce((acc, [key, item]) => {
    acc[key] = JSON.parse(item);
    return acc;
  }, {});

  const spreadFactorInfo = JSON.parse(spreadFactor);
  const feeTier = Number(spreadFactorInfo?.rate || 0) * Math.pow(10, 12);
  const totalLiquidity = JSON.parse(totalFiatValueLocked)?.amount || '0';
  const volume24Hour = marketInfo['volume24hUsd']?.amount || '0';

  const reserveCoinsInfo = Object.entries(reserveCoins).reduce((acc, [key, item]) => {
    acc[key] = JSON.parse(item);
    return acc;
  }, {});

  const aprInfoRaw = Object.entries(incentives.aprBreakdown).reduce((acc, [key, item]) => {
    const { upper, lower } = item || {};
    if (!acc[key]) {
      acc[key] = {};
    }
    acc[key]['max'] = JSON.parse(upper);
    acc[key]['min'] = JSON.parse(lower);
    return acc;
  }, {});

  const aprInfo = {
    apr: {
      max: Number(aprInfoRaw['total'].max?.rate || 0),
      min: Number(aprInfoRaw['total'].min?.rate || 0)
    },
    incentives: '',
    incentivesApr: {
      max: incentives.incentiveTypes.reduce((sum, keyIncentiveType) => {
        const aprByKey = aprInfoRaw[keyIncentiveType]?.max?.rate || 0;
        sum = sum + Number(aprByKey);
        return sum;
      }, 0),
      min: incentives.incentiveTypes.reduce((sum, keyIncentiveType) => {
        const aprByKey = aprInfoRaw[keyIncentiveType]?.min?.rate || 0;
        sum = sum + Number(aprByKey);
        return sum;
      }, 0)
    },
    swapFee: {
      max: Number(aprInfoRaw['swapFee'].max?.rate || 0),
      min: Number(aprInfoRaw['swapFee'].min?.rate || 0)
    }
  };

  const { FromTokenIcon, ToTokenIcon, tokenXInfo, tokenYInfo } = getIconOsmosisPoolData(token0, token1, isLight);

  return {
    ...p,
    feeTier,
    spreadFactorInfo,
    aprInfoRaw,
    isValid: true,
    type: POOL_TYPE.V3,
    network: POOL_CHAIN.OSMOSIS,
    chainInfo: chainInfosWithIcon.find((c) => c.chainName === POOL_CHAIN.OSMOSIS),
    totalLiquidity,
    volume24Hour,
    aprInfo,
    reserveCoinsInfo,
    FromTokenIcon,
    ToTokenIcon,
    tokenXInfo,
    tokenYInfo,
    marketInfo,
    url: `/pools/v3/osmosis/${id}`
  };
};

export const formatOraichainPoolV3 = (p: PoolWithPoolKey, isLight: boolean = false) => {
  const [tokenX, tokenY] = [p?.pool_key.token_x, p?.pool_key.token_y];
  const feeTier = p?.pool_key.fee_tier.fee || 0;
  const { FromTokenIcon, ToTokenIcon, tokenXInfo, tokenYInfo } = getIconPoolData(tokenX, tokenY, isLight);
  const spread = p?.pool_key.fee_tier.tick_spacing || 100;

  const poolKey = p?.pool_key ? poolKeyToString(p.pool_key) : '';
  return {
    ...p,
    type: POOL_TYPE.V3,
    network: POOL_CHAIN.ORAICHAIN,
    chainInfo: chainInfosWithIcon.find((c) => c.chainName === POOL_CHAIN.ORAICHAIN),
    FromTokenIcon,
    ToTokenIcon,
    feeTier,
    spread,
    tokenXInfo,
    tokenYInfo,
    poolKey,
    isValid: tokenXInfo && tokenYInfo,
    url: `/pools/v3/oraichain/${encodeURIComponent(poolKey)}`
  };
};

export const formatPoolData = (p: AllPoolType, isLight: boolean = false) => {
  try {
    if ('liquidityAddr' in p) {
      return formatPoolV2(p, isLight);
    }

    if ('isOsmosisPool' in p) {
      return formatOsmosisPools(p, isLight);
    }

    return formatOraichainPoolV3(p, isLight);
  } catch (error) {
    console.log('format pool error', { pool: p, error });
    return { ...p, isValid: false };
  }
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
