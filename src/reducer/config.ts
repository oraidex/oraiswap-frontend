import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { Themes } from 'context/theme-context';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import { PoolAprInfo } from 'libs/contractSingleton';
import { DepositInfo } from 'pages/BitcoinDashboard/@types';
import { KeyFilterPool } from 'pages/Pools/components/Filter';
import { PERSIST_VER } from 'store/constants';
// import { PERSIST_VERSION } from 'store/configure';

export type ChainInfoType = {
  networkType?: string;
  chainId?: string;
  rpc?: string;
  lcd?: string;
};

export type RewardPoolType = {
  reward: Array<string>;
  liquidity_token: string;
};

export interface ConfigState {
  address: string;
  metamaskAddress: string | null;
  tronAddress: string | null;
  btcAddress: string | null;
  tonAddress: string | null;
  cosmosAddress: { [key: string]: string };
  allPendingDeposits: { [key: string]: DepositInfo[] };
  chainId: string;
  chainInfo: ChainInfoType;
  infoEvm: ChainInfoType;
  filterNetwork: string;
  walletTypeStore: string;
  infoCosmos: ChainInfoType;
  statusChangeAccount: boolean;
  hideOtherSmallAmount: boolean;
  hideOraichainSmallAmount: boolean;
  theme: Themes;
  coingecko: CoinGeckoPrices<string>;
  tokenRank: Record<string, number>;
  apr: {
    [key: string]: number;
  };
  rewardPools: RewardPoolType[];
  filterDefaultPool: KeyFilterPool;
  persistVersion: number;
  bannerTime?: number;
  AIRoute?: boolean;
  //pool v3
  liquidityPools?: {
    [key: string]: number;
  };
  aprPools?: {
    [key: string]: PoolAprInfo;
  };
  volumnePools?: {
    apy: number;
    fee: number;
    poolAddress: string;
    tokenX: string;
    tokenY: string;
    tvl: number;
    volume24: number;
  }[];
}

const initialState: ConfigState = {
  address: '',
  metamaskAddress: '',
  bannerTime: 0,
  btcAddress: '',
  tonAddress: '',
  tronAddress: '',
  walletTypeStore: 'owallet',
  cosmosAddress: {},
  allPendingDeposits: {},
  chainId: 'Oraichain',
  filterNetwork: 'Oraichain',
  chainInfo: {},
  infoEvm: {},
  infoCosmos: {},
  statusChangeAccount: false,
  hideOtherSmallAmount: false,
  hideOraichainSmallAmount: false,
  theme: 'dark',
  coingecko: {},
  tokenRank: {},
  apr: {},
  rewardPools: [],
  liquidityPools: {},
  aprPools: {},
  volumnePools: [],
  filterDefaultPool: KeyFilterPool.all_pool,
  persistVersion: PERSIST_VER,
  AIRoute: true
};

export const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    updateConfig: {
      reducer(state, action: PayloadAction<string, string, ConfigState[keyof ConfigState]>) {
        state[action.payload] = action.meta;
      },
      prepare(key: string, value: ConfigState[keyof ConfigState]) {
        return { payload: key, meta: value };
      }
    }
  }
});

// Action creators are generated for each case reducer function
export const { updateConfig } = configSlice.actions;

export default configSlice.reducer;
