import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { ConfigResponse } from '@oraichain/common-contracts-sdk/build/CwIcs20Latest.types';

export interface TokenState {
  amounts: AmountDetails;
  pairs: PairDetails;
  lpPools: LpPoolDetails;
  bondLpPools: BondLpPoolDetails;
  feeConfigs: ConfigResponse;
  totalLpv3: number;
}

const initialState: TokenState = {
  amounts: {},
  pairs: {},
  lpPools: {},
  totalLpv3: 0,
  bondLpPools: {},
  feeConfigs: {
    default_timeout: 0,
    fee_denom: 'string',
    gov_contract: 'string',
    relayer_fee_receiver: '',
    relayer_fees: [],
    swap_router_contract: 'string',
    token_fee_receiver: '',
    token_fees: []
  }
};

export const tokenSlice = createSlice({
  name: 'token',
  initialState,
  reducers: {
    updateTotalLpv3: (state, action: PayloadAction<number>) => {
      state.totalLpv3 = action.payload;
    },
    updateAmounts: (state, action: PayloadAction<AmountDetails>) => {
      state.amounts = {
        ...state.amounts,
        ...action.payload
      };
    },
    updatePairs: (state, action: PayloadAction<PairDetails>) => {
      state.pairs = {
        ...state.pairs,
        ...action.payload
      };
    },
    removeToken: (state) => {
      state.amounts = {};
      state.pairs = {};
      state.lpPools = {};
      state.bondLpPools = {};
      state.totalLpv3 = 0;
    },
    updateLpPools: (state, action: PayloadAction<LpPoolDetails>) => {
      state.lpPools = {
        ...state.lpPools,
        ...action.payload
      };
    },
    updateBondLpPools: (state, action: PayloadAction<BondLpPoolDetails>) => {
      state.bondLpPools = {
        ...state.bondLpPools,
        ...action.payload
      };
    },
    updateFeeConfig: (state, action: PayloadAction<ConfigResponse>) => {
      state.feeConfigs = {
        ...state.feeConfigs,
        ...action.payload
      };
    }
  }
});

// Action creators are generated for each case reducer function
export const {
  updateAmounts,
  updatePairs,
  removeToken,
  updateLpPools,
  updateBondLpPools,
  updateFeeConfig,
  updateTotalLpv3
} = tokenSlice.actions;

export default tokenSlice.reducer;
