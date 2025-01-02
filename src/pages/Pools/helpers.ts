import { Cw20Coin } from '@oraichain/common-contracts-sdk';
import { InstantiateMarketingInfo } from '@oraichain/common-contracts-sdk/build/Cw20Base.types';
import {
  validateNumber,
  INJECTIVE_CONTRACT,
  ORAI,
  USDC_CONTRACT,
  ORAIX_CONTRACT,
  AIRI_CONTRACT,
  ATOM_ORAICHAIN_DENOM,
  USDT_CONTRACT,
  KWT_CONTRACT,
  OSMOSIS_ORAICHAIN_DENOM
} from '@oraichain/oraidex-common';
import { Asset, AssetInfo } from '@oraichain/oraidex-contracts-sdk';
import { MinterResponse } from '@oraichain/oraidex-contracts-sdk/build/OraiswapToken.types';
import { formatDate } from 'pages/CoHarvest/helpers';
import { TIMER } from 'pages/CoHarvest/constants';
import { FILTER_DAY } from 'reducer/type';

// TODO: hardcode reverse symbol for ORAI/INJ,USDC/ORAIX, need to update later
export const reverseSymbolArr = [
  [
    {
      denom: INJECTIVE_CONTRACT,
      coinGeckoId: 'injective-protocol'
    },
    {
      denom: ORAI,
      coinGeckoId: 'orai'
    }
  ],
  [
    {
      denom: USDC_CONTRACT,
      coinGeckoId: 'usd-coin'
    },
    {
      denom: ORAIX_CONTRACT,
      coinGeckoId: 'oraidex'
    }
  ]
];

export type ListTokenJsMsg = {
  initialBalances?: Cw20Coin[];
  mint?: MinterResponse;
  marketing?: InstantiateMarketingInfo;
  label?: string;
  name?: string;
  symbol: string;
  liquidityPoolRewardAssets: Asset[];
  pairAssetInfo: AssetInfo;
  targetedAssetInfo?: AssetInfo;
};

const generateMsgFrontierAddToken = (tokenMsg: ListTokenJsMsg) => {
  const {
    symbol,
    liquidityPoolRewardAssets,
    label,
    pairAssetInfo,
    marketing,
    mint,
    initialBalances,
    name,
    targetedAssetInfo
  } = tokenMsg;
  const msgAddTokenFrontier: ListTokenJsMsg = {
    symbol,
    liquidityPoolRewardAssets,
    pairAssetInfo,
    targetedAssetInfo
  };
  if (mint) msgAddTokenFrontier.mint = mint;
  if (initialBalances) msgAddTokenFrontier.initialBalances = initialBalances;

  if (marketing) msgAddTokenFrontier.marketing = marketing;
  if (name) msgAddTokenFrontier.name = name;
  if (label) msgAddTokenFrontier.label = label;
  msgAddTokenFrontier.pairAssetInfo = pairAssetInfo;
  return msgAddTokenFrontier;
};

const getInfoLiquidityPool = ({ denom, contract_addr }) => {
  if (contract_addr)
    return {
      token: {
        contract_addr
      }
    };
  return { native_token: { denom } };
};

const getSymbolPools = (baseDenom: string, quoteDenom: string, originalSymbols: string) => {
  let symbols = originalSymbols;
  if (reverseSymbolArr.some((item) => item[0].denom === baseDenom && item[1].denom === quoteDenom)) {
    symbols = originalSymbols.split('/').reverse().join('/');
  }
  return symbols;
};

const isBigIntZero = (value: BigInt): boolean => {
  return value === BigInt(0);
};

export const parseAssetOnlyDenom = (assetInfo: AssetInfo) => {
  if ('native_token' in assetInfo) return assetInfo.native_token.denom;
  return assetInfo.token.contract_addr;
};

// TODO: need to seperate format funcs to format module later.
export const formatDisplayUsdt = (amount: number | string, dp = 2, dpMin = 4): string => {
  if (amount === undefined) return '0';
  const validatedAmount = validateNumber(amount);
  if (validatedAmount < 1) return `$${toFixedIfNecessary(amount?.toString(), dpMin).toString()}`;
  return `$${numberWithCommas(toFixedIfNecessary(amount?.toString(), dp), undefined, { maximumFractionDigits: 6 })}`;
  // return `$${numberWithCommas(toFixedIfNecessary(amount.toString(), dp))}`;
};

export const formatDisplayClaimable = (amount: number | string, dp = 2): string => {
  const validatedAmount = validateNumber(amount);
  if (validatedAmount < 1) {
    const displayValue = toFixedIfNecessary(amount.toString(), 4);
    return !displayValue ? '0' : `+$${toFixedIfNecessary(amount.toString(), 4).toString()}`;
  }

  return `$${numberWithCommas(toFixedIfNecessary(amount.toString(), dp), undefined, { maximumFractionDigits: 6 })}`;
  // return `+$${numberWithCommas(toFixedIfNecessary(amount.toString(), dp))}`;
};

export const toFixedIfNecessary = (value: string, dp: number): number => {
  return +parseFloat(value).toFixed(dp);
};

// add `,` when split thounsand value.
export const numberWithCommas = (
  x: number,
  locales: Intl.LocalesArgument = undefined,
  options: Intl.NumberFormatOptions = {}
) => {
  if (isNegative(x)) return '0';
  return x.toLocaleString(locales, options);
};

export const isNegative = (number) => number <= 0;
/**
 * Estmate LP share when provide liquidity pool
 * @param baseAmount input base amount
 * @param quoteAmount input quote amount
 * @param totalShare total LP share of pool
 * @param totalBaseAmount total base amount in pool
 * @param totalQuoteAmount total quote amount in pool
 * @returns // min(1, 2)
  // 1. sqrt(deposit_0 * exchange_rate_0_to_1 * deposit_0) * (total_share / sqrt(pool_0 * pool_1))
  // == deposit_0 * total_share / pool_0
  // 2. sqrt(deposit_1 * exchange_rate_1_to_0 * deposit_1) * (total_share / sqrt(pool_1 * pool_1))
  // == deposit_1 * total_share / pool_1
 */
export const estimateShare = ({
  baseAmount,
  quoteAmount,
  totalShare,
  totalBaseAmount,
  totalQuoteAmount
}: {
  baseAmount: number;
  quoteAmount: number;
  totalShare: number;
  totalBaseAmount: number;
  totalQuoteAmount: number;
}): number => {
  if (totalBaseAmount === 0 || totalQuoteAmount === 0 || !totalShare) return 0;

  const share = Math.min(
    Number((baseAmount * totalShare) / totalBaseAmount),
    Number((quoteAmount * totalShare) / totalQuoteAmount)
  );
  return share;
};

export { generateMsgFrontierAddToken, getInfoLiquidityPool, isBigIntZero, getSymbolPools };

export const getInclude = (list, condition) => {
  let i = 0;
  while (i < list.length) {
    if (condition(list[i])) return i;
    i++;
  }
  return -1;
};

export const endOfWeek = (date: Date) => {
  const lastDayOfWeek = date.getDate() - (date.getDay() - 1) + 6;
  const endDateOfWeek = new Date(date.setDate(lastDayOfWeek));
  const now = new Date();

  return endDateOfWeek >= now ? now : endDateOfWeek;
};

export const endOfMonth = (date: Date) => {
  const lastDateOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const now = new Date();
  return lastDateOfMonth >= now ? now : lastDateOfMonth;
};

export const formatTimeDataChart = (
  time: number | string,
  type: FILTER_DAY,
  lastDate: number,
  currentText: string = 'Now'
) => {
  if (!time) {
    return currentText;
  }

  const fmtTime = typeof time === 'string' ? new Date(time).getTime() : time * TIMER.MILLISECOND;
  const date = new Date(fmtTime);

  switch (type) {
    case FILTER_DAY.DAY:
      return time === lastDate ? currentText : formatDate(fmtTime);

    case FILTER_DAY.WEEK:
      return formatDate(fmtTime) + ' - ' + formatDate(endOfWeek(date));

    case FILTER_DAY.MONTH:
      return formatDate(fmtTime) + ' - ' + formatDate(endOfMonth(date));
  }
};

export const canStake = (rewardPerSec: string) => {
  if (!rewardPerSec) return false;
  const rewardPerSecJSON = JSON.parse(rewardPerSec) as {
    assets: {
      amount: string;
    }[];
  };

  return rewardPerSecJSON.assets.some((asset) => asset.amount !== '0');
};

export type FACTORY_V1_POOL = {
  symbols: [string, string];
  assetInfos: [AssetInfo, AssetInfo];
};
export const listFactoryV1Pools: FACTORY_V1_POOL[] = [
  {
    symbols: ['AIRI', 'ORAI'],
    assetInfos: [
      {
        token: {
          contract_addr: AIRI_CONTRACT
        }
      },
      {
        native_token: {
          denom: ORAI
        }
      }
    ]
  },
  {
    symbols: ['ORAIX', 'ORAI'],
    assetInfos: [
      {
        token: {
          contract_addr: ORAIX_CONTRACT
        }
      },
      {
        native_token: {
          denom: ORAI
        }
      }
    ]
  },
  {
    symbols: ['ORAI', 'ATOM'],
    assetInfos: [
      {
        native_token: {
          denom: ORAI
        }
      },
      {
        native_token: {
          denom: ATOM_ORAICHAIN_DENOM
        }
      }
    ]
  },
  {
    symbols: ['ORAI', 'USDT'],
    assetInfos: [
      {
        native_token: {
          denom: ORAI
        }
      },
      {
        token: {
          contract_addr: USDT_CONTRACT
        }
      }
    ]
  },
  {
    symbols: ['KWT', 'ORAI'],
    assetInfos: [
      {
        token: {
          contract_addr: KWT_CONTRACT
        }
      },
      {
        native_token: {
          denom: ORAI
        }
      }
    ]
  },
  {
    symbols: ['ORAI', 'OSMO'],
    assetInfos: [
      {
        native_token: {
          denom: ORAI
        }
      },
      {
        token: {
          contract_addr: OSMOSIS_ORAICHAIN_DENOM
        }
      }
    ]
  }
];
