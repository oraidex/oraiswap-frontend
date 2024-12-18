import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export enum EVENT_ENUM {
  normal = 'normal',
  halloween = 'halloween',
  christmas = 'christmas'
}

export interface TemporaryConfigState {
  customBanner: boolean;
  event: EVENT_ENUM;
}

const initialState: TemporaryConfigState = {
  customBanner: true,
  event: EVENT_ENUM.christmas
};

export const temporaryConfigSlice = createSlice({
  name: 'temporaryConfig',
  initialState,
  reducers: {
    updateConfig: {
      reducer(state, action: PayloadAction<string, string, TemporaryConfigState[keyof TemporaryConfigState]>) {
        state[action.payload] = action.meta;
      },
      prepare(key: string, value: TemporaryConfigState[keyof TemporaryConfigState]) {
        return { payload: key, meta: value };
      }
    }
  }
});

// Action creators are generated for each case reducer function
export const { updateConfig } = temporaryConfigSlice.actions;

export default temporaryConfigSlice.reducer;
