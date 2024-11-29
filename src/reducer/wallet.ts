import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export type WalletsByNetwork = {
  cosmos: 'owallet' | 'keplr' | 'leapSnap' | 'eip191';
  evm: 'owallet' | 'metamask' | null;
  tron: 'owallet' | 'tronLink' | null;
  bitcoin: 'owallet' | null;
  ton: 'ton' | null;
};

export interface WalletState {
  walletsByNetwork: WalletsByNetwork;
}

const initialState: WalletState = {
  walletsByNetwork: {
    cosmos: null,
    evm: null,
    tron: null,
    bitcoin: null,
    ton: null
  }
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    updateWallets: {
      reducer(state, action: PayloadAction<string, string, WalletState[keyof WalletState]>) {
        state[action.payload] = action.meta;
      },
      prepare(key: string, value: WalletState[keyof WalletState]) {
        return { payload: key, meta: value };
      }
    }
  }
});

// Action creators are generated for each case reducer function
export const { updateWallets } = walletSlice.actions;

export default walletSlice.reducer;
