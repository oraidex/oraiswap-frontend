import { NetworkName, TokenItemType } from '@oraichain/oraidex-common';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { RootState } from 'store/configure';
import { PairToken, TradingState } from './type';
import { PAIRS_CHART } from 'config/pools';
import { networks } from 'helper';
import { OraiToken } from 'config/chainInfos';

const initialState: TradingState = {
  currentToken: PAIRS_CHART.find((pair) => pair.symbol === 'ORAI/USDT'),
  chartTimeFrame: 0,
  currentToChain: 'Oraichain',
  currentToToken: null
};

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    setCurrentToken: (state, action: PayloadAction<PairToken>) => {
      state.currentToken = action.payload;
    },
    setCurrentToChain: (state, action: PayloadAction<NetworkName | ''>) => {
      state.currentToChain = action.payload;
    },
    setCurrentToToken: (state, action: PayloadAction<TokenItemType | null>) => {
      state.currentToToken = action.payload;
    },
    setChartTimeFrame: (state, action: PayloadAction<number>) => {
      state.chartTimeFrame = action.payload;
    }
  }
});

// Action creators are generated for each case reducer function
export const { setCurrentToken, setChartTimeFrame, setCurrentToChain, setCurrentToToken } = tradingSlice.actions;

export const selectCurrentToken = (state: RootState): PairToken => state.trading.currentToken;
export const selectCurrentToChain = (state: RootState): NetworkName | '' => state.trading.currentToChain;
export const selectCurrentToToken = (state: RootState): TokenItemType | null => state.trading.currentToToken;
export const selectChartTimeFrame = (state: RootState): number => state.trading.chartTimeFrame;

export default tradingSlice.reducer;
