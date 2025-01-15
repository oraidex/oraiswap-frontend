import { TokenItemType } from '@oraichain/oraidex-common';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { RootState } from 'store/configure';
import { PairToken, TradingState } from './type';

const initialState: TradingState = {
  chartTimeFrame: 0,
  currentToChain: 'Oraichain',
  currentToToken: null,
  currentFromToken: null
};

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    setCurrentToChain: (state, action: PayloadAction<string | ''>) => {
      state.currentToChain = action.payload;
    },
    setCurrentToToken: (state, action: PayloadAction<TokenItemType | null>) => {
      state.currentToToken = action.payload;
    },
    setCurrentFromToken: (state, action: PayloadAction<TokenItemType | null>) => {
      state.currentFromToken = action.payload;
    },
    setChartTimeFrame: (state, action: PayloadAction<number>) => {
      state.chartTimeFrame = action.payload;
    }
  }
});

// Action creators are generated for each case reducer function
export const { setChartTimeFrame, setCurrentToChain, setCurrentToToken, setCurrentFromToken } = tradingSlice.actions;

export const selectCurrentToken = (state: RootState): PairToken => state.trading.currentToken;
export const selectCurrentToChain = (state: RootState): string | '' => state.trading.currentToChain;
export const selectCurrentToToken = (state: RootState): TokenItemType | null => state.trading.currentToToken;
export const selectCurrentFromToken = (state: RootState): TokenItemType | null => state.trading.currentFromToken;
export const selectChartTimeFrame = (state: RootState): number => state.trading.chartTimeFrame;

export default tradingSlice.reducer;
