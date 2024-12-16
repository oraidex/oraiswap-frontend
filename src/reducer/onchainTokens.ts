import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { OraiToken } from '@oraichain/orai-token-inspector/dist/types';
import { TokenItemType } from '@oraichain/oraidex-common';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { network } from 'initCommon';
import { tokenInspector } from 'initTokenInspector';
import { Dispatch } from '@reduxjs/toolkit';
import { updateAmounts } from './token';

export interface OnchainTokensState {
  tokens: TokenItemType[];
  amounts: AmountDetails;
}

const initialState: OnchainTokensState = {
  tokens: [],
  amounts: {}
};

export const onchainTokensSlice = createSlice({
  name: 'onchainTokens',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(inspectToken.fulfilled, (state, action) => {
      const { token, balance } = action.payload;
      state.tokens = [onChainTokenToTokenItem(token)];
      state.amounts[token.denom] = balance;
    });
  }
});

//TODO: hardcode oraichain
export const onChainTokenToTokenItem = (token: OraiToken): TokenItemType => {
  return {
    name: token.symbol,
    chainId: 'Oraichain',
    cosmosBased: true,
    decimals: token.decimals,
    denom: token.denom,
    icon: token.logo,
    rpc: 'https://rpc.orai.io',
    org: 'oraichain',
    coinGeckoId: undefined,
    contractAddress: token.contractAddress
  };
};

export const inspectToken = createAsyncThunk(
  'onchainTokens/inspectToken',
  async (
    {
      tokenId,
      address
    }: {
      tokenId: string;
      address?: string;
    },
    thunkAPI
  ): Promise<{
    token: OraiToken;
    balance: string;
  }> => {
    const token = await tokenInspector.inspectToken({
      tokenId,
      getOffChainData: true
    });

    const client = await CosmWasmClient.connect(network.rpc);

    let tokenBalance = '0';
    if (address) {
      if (token.contractAddress) {
        const balance = await client.queryContractSmart(token.contractAddress, {
          balance: {
            address
          }
        });
        tokenBalance = balance.balance;
      } else {
        const balance = await client.getBalance(address, token.denom);
        tokenBalance = balance.amount;
      }
    }

    thunkAPI.dispatch(
      updateAmounts({
        [token.denom]: tokenBalance
      })
    );

    return {
      token,
      balance: tokenBalance
    };
  }
);

export default onchainTokensSlice.reducer;
