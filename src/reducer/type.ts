import { NetworkName, TokenItemType, CustomChainInfo } from '@oraichain/oraidex-common';
import { OrderDirection } from '@oraichain/oraidex-contracts-sdk/build/OraiswapOrderbook.types';
import { Themes } from 'context/theme-context';
import { CoinGeckoPrices } from 'hooks/useCoingecko';

export type ChainInfoType = {
  networkType?: string;
  chainId?: string;
  rpc?: string;
  lcd?: string;
};
export type PriceAmountFilled = {
  price: string;
  amount: string;
};

export interface ConfigState {
  address: string;
  statusChangeAccount: boolean;
  theme: Themes;
  coingecko: CoinGeckoPrices<string>;
}
export interface DataTrading {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface DataVolume {
  time: number;
  value: number;
  color: string;
}

export interface RecentlyTraded {
  pair: string;
  hash: string;
  height: number;
  time: string;
  orderId: number;
  status: string;
  direction: DirectionTrade;
  bidderAddr: string;
  offerAmount: number;
  askAmount: number;
  filledOfferAmount: number;
  filledAskAmount: number;
  fee?: string;
}

export interface Orderbook {
  id: number | string;
  price: string;
  ask_amount: string;
  offer_amount: string;
  side: OrderSide;
  status: number;
  time: string;
}

export type PairToken = {
  symbol: string;
  info: string;
};

export type InfoAToken = {
  key: string;
  pair: string;
  price: number;
  price_percent: number;
  day_hight: number;
  day_low: number;
  day_amount: number;
  day_volume: number;
};

export interface TradingState {
  chartTimeFrame: number;
  currentToChain: NetworkName | '';
  currentToToken: TokenItemType | null;
  currentFromToken: TokenItemType | null;
}

export interface PoolChartState {
  filterDay: FILTER_DAY;
  tabChart: TAB_CHART;
  filterTimeSwap: FILTER_TIME_CHART;
  tabChartSwap: TAB_CHART_SWAP;
}

export enum AddressManagementStep {
  INIT,
  SELECT,
  CREATE,
  EDIT
}

export type AddressBookType = {
  id: string | number;
  address: string;
  network: CustomChainInfo;
  token: TokenItemType | null;
  isUniversal?: boolean;
  memo?: string;
  walletName: string;
};

export interface AddressBookManagementState {
  currentStep: AddressManagementStep;
  addresses: AddressBookType[];
  currentEditedWallet?: AddressBookType | null;
}

export interface TypeDecimal {
  key: string;
  title: string;
}

export enum BuySellFilter {
  sell = 'sell',
  buy = 'buy',
  all = 'all'
}
export interface OrderDetail {
  id: number | string;
  price: string;
  ask_amount: string;
  offer_amount: string;
  side: OrderSide;
  status: number;
  time: string;
  trade_sequence: number;
  fee: string;
}

interface AssetInfoContractAdress {
  token: {
    contract_addr: string;
  };
}
interface AssetInfoNativeToken {
  native_token: {
    denom: string;
  };
}

interface AssetInfo {
  info: AssetInfoContractAdress | AssetInfoNativeToken;
  amount: string;
}
export interface OrderDetailFromContract {
  order_id: number;
  direction: OrderDirection;
  bidder_addr: string;
  offer_asset: AssetInfo;
  ask_asset: AssetInfo;
  filled_offer_amount: string;
  filled_ask_amount: string;
  amount?: string;
  price?: string;
}

export interface OrderHistories {
  id: number | string;
  price: string;
  ask_amount: string;
  offer_amount: string;
  side: OrderSide;
  status: number;
  time: string;
  fee: string | null;
  trade_sequence: number;
}

export interface CandleTrades {
  time: number | string;
  open: string;
  close: string;
  high: string;
  low: string;
  volume: string;
}

export interface Order {
  orders: OrderDetail[];
}
export interface OrderResponseContract {
  orders: OrderDetailFromContract[];
}

export enum OrderStatus {
  OPEN = 'OPEN',
  FUL_FILLED = 'FUL_FILLED',
  FILLING = 'FILLING',
  CLOSE = 'CLOSE',
  CANCELED = 'CANCELED'
}

export enum TradeStatus {
  FULFILLED = 'Fulfilled',
  CANCEL = 'Cancel',
  OPEN = 'Open'
}

export enum OrderSide {
  SELL = 1,
  BUY = 2
}

export enum DirectionTrade {
  SELL = 'Sell',
  BUY = 'Buy'
}

export enum FILTER_DAY {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}

export enum FILTER_TIME_CHART {
  'DAY' = '1D',
  '7DAY' = '7D',
  'MONTH' = '1M',
  '3MONTH' = '3M'
}

export enum TAB_CHART {
  LIQUIDITY = 'Liquidity',
  VOLUME = 'Volume'
}

export enum TAB_CHART_SWAP {
  TOKEN = 'Simple',
  POOL = 'Advance'
}
