import { OraiToken } from "@oraichain/orai-token-inspector/dist/types";
import { TokenItemType } from "@oraichain/oraidex-common";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { tokenInspector } from "initTokenInspector";

export interface OnchainTokensState {
    tokens: TokenItemType[];
}

const initialState: OnchainTokensState = {
    tokens: [],
};

export const onchainTokensSlice = createSlice({
    name: 'onchainTokens',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(inspectToken.fulfilled, (state, action) => {
            state.tokens = [onChainTokenToTokenItem(action.payload)];
        });
    }
});

//TODO: hardcode oraichain
export const onChainTokenToTokenItem = (token: OraiToken): TokenItemType => {
    return {
        name: token.symbol,
        chainId: "Oraichain",
        cosmosBased: true,
        decimals: token.decimals,
        denom: token.denom,
        icon: token.logo,
        rpc: "https://rpc.orai.io",
        org: "oraichain",
        coinGeckoId: undefined,
        contractAddress: token.contractAddress,
    }
};

export const inspectToken = createAsyncThunk('onchainTokens/inspectToken', async (tokenId: string) => {
    const token = await tokenInspector.inspectToken({
        tokenId,
        getOffChainData: false
    });
    return token;
});

export default onchainTokensSlice.reducer;