import {  TokenItemType } from '@oraichain/oraidex-common';

export type AssetInfoResponse = {
  asset: string;
  chain?: string;
  price: number;
  balance: number;
  denom?: string;
  value: number;
  coeff?: number;
  coeffType?: string;
  iconLight?: any;
  icon: any;
  coinGeckoId?: string;
};

export type HistoryInfoResponse = {
  type: string;
  time: string;
  denom: string;
  balance: string;
  balanceType: string;
  txHash: string;
  usd?: string;
};
