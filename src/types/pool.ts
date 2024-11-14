import { TokenItemType } from '@oraichain/oraidex-common';
import { AssetInfo } from '@oraichain/oraidex-contracts-sdk';
import { Type } from 'rest/api';

export type PairInfoData = {
  firstAssetInfo: string;
  secondAssetInfo: string;
  commissionRate: string;
  pairAddr: string;
  liquidityAddr: string;
  oracleAddr: string;
  symbols: string;
  fromIconUrl: string;
  toIconUrl: string;
};

export type PoolInfoResponse = PairInfoData & {
  apr: number;
  aprBoost: number;
  totalLiquidity: number;
  volume24Hour: string;
  volume24hChange: string;
  fee7Days: string;
  rewardPerSec: string;
  offerPoolAmount: number;
  askPoolAmount: number;
  totalSupply: number;
};

export type OsmosisPoolInfoResponse = {
  isOsmosisPool: boolean;
  id: string;
  type: string;
  raw: {
    address: string;
    incentives_address: string;
    spread_rewards_address: string;
    id: string;
    current_tick_liquidity: string;
    token0: string;
    token1: string;
    current_sqrt_price: string;
    current_tick: string;
    tick_spacing: string;
    exponent_at_price_one: string;
    spread_factor: string;
    last_liquidity_update: string;
  };
  spreadFactor: string;
  reserveCoins: string[];
  totalFiatValueLocked: string;
  incentives: {
    aprBreakdown: {
      total: {
        upper: string;
        lower: string;
      };
      swapFee: {
        upper: string;
        lower: string;
      };
      superfluid: {
        upper: string | null;
        lower: string | null;
      };
      osmosis: {
        upper: string | null;
        lower: string | null;
      };
      boost: {
        upper: string | null;
        lower: string | null;
      };
    };
    incentiveTypes: string[];
  };
  market: {
    volume24hUsd: string;
    volume7dUsd: string;
    feesSpent24hUsd: string;
    feesSpent7dUsd: string;
  };
  coinDenoms: string[];
  poolNameByDenom: string;
  coinNames: string[][];
};

export type PoolDetail = {
  info: PoolInfoResponse;
  token1: TokenItemType;
  token2: TokenItemType;
  isLoading: boolean;
};

export type BaseMining = {
  type: Type;
  lpAddress: string;
  sender: string;
};
export type BondLP = BaseMining & {
  lpAddress: string;
  amount: number | string;
};
export type WithdrawLP = BaseMining;
export type UnbondLP = BaseMining & { amount: number | string };
export type MiningLP = BondLP | WithdrawLP | UnbondLP;
