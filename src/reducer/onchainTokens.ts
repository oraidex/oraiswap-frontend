import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { InspectedToken } from '@oraichain/orai-token-inspector/dist/types';
import { TokenItemType } from '@oraichain/oraidex-common';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { network } from 'initCommon';
import { getTokenInspectorInstance } from 'initTokenInspector';
import { addToOraichainTokens, updateAddedTokens, updateAmounts } from './token';

export interface OnchainTokensState {
  tokens: TokenItemType[];
  allOnChainTokens: TokenItemType[];
}

const initialState: OnchainTokensState = {
  tokens: [],
  allOnChainTokens: []
};

export const onchainTokensSlice = createSlice({
  name: 'onchainTokens',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(inspectToken.fulfilled, (state, action) => {
      const { token } = action.payload;
      state.tokens = [onChainTokenToTokenItem(token)];
      state.allOnChainTokens = [...state.allOnChainTokens, onChainTokenToTokenItem(token)];
    });
    builder.addCase(optimisticUpdateToken.fulfilled, (state, action) => {
      const { token } = action.payload;
      state.tokens = [onChainTokenToTokenItem(token)];
      state.allOnChainTokens = [...state.allOnChainTokens, onChainTokenToTokenItem(token)];
    });
  }
});

export const onChainTokenToTokenItem = (token: InspectedToken): TokenItemType => {
  return {
    name: token.name,
    chainId: token.chainId,
    cosmosBased: token.cosmosBased,
    decimals: token.decimals,
    denom: token.denom,
    icon: token.icon,
    iconLight: token.iconLight,
    rpc: token.rpc,
    org: token.org,
    contractAddress: token.contractAddress,
    feeCurrencies: network.feeCurrencies,
    coinGeckoId: undefined,
    bridgeTo: token.bridgeTo,
    coinType: token.coinType,
    gasPriceStep: token.gasPriceStep,
    isVerified: false,
    tag: token.tag,
    bridgeInfoUrl: token.bridgeInfoUrl
  };
};

export const optimisticUpdateToken = createAsyncThunk(
  'onchainTokens/optimisticUpdateToken',
  async (
    {
      token,
      balance
    }: {
      token: InspectedToken;
      balance: string;
    },
    thunkAPI
  ) => {
    thunkAPI.dispatch(
      updateAmounts({
        [token.denom]: balance
      })
    );

    const tokenItem = onChainTokenToTokenItem(token);
    thunkAPI.dispatch(updateAddedTokens([tokenItem]));

    return {
      token,
      balance
    };
  }
);

export const inspectToken = createAsyncThunk(
  'onchainTokens/inspectToken',
  async (
    {
      tokenId,
      address,
      isUserAdded
    }: {
      tokenId: string;
      address?: string;
      isUserAdded?: boolean;
    },
    thunkAPI
  ): Promise<{
    token: InspectedToken;
    balance: string;
  }> => {
    const tokenInspector = await getTokenInspectorInstance();
    const token = await tokenInspector.inspectToken(tokenId);

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

    const tokenItem = onChainTokenToTokenItem(token);
    thunkAPI.dispatch(addToOraichainTokens([tokenItem]));
    if (isUserAdded) thunkAPI.dispatch(updateAddedTokens([tokenItem]));

    return {
      token,
      balance: tokenBalance
    };
  }
);

export default onchainTokensSlice.reducer;
