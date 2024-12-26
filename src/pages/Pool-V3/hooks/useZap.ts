import { Coin } from '@cosmjs/proto-signing';
import { TokenItemType, ZAPPER_CONTRACT } from '@oraichain/oraidex-common';
import { parseAsset, ZapInLiquidityResponse, ZapOutLiquidityResponse } from '@oraichain/oraiswap-v3';
import { network } from 'initCommon';
import { executeMultiple } from '../helpers/helper';

export type ZapInData = {
  tokenZap: TokenItemType;
  zapAmount: string;
  zapInResponse: ZapInLiquidityResponse;
};

export type ZapOutData = {
  tokenId: number;
  zapOutResponse: ZapOutLiquidityResponse;
};

const useZap = () => {
  const zapIn = async (data: ZapInData, walletAddress: string, onSuccess: any, onError: any) => {
    try {
      const { tokenZap, zapAmount, zapInResponse } = data;

      let msg = [];

      // approve
      const coins: Coin[] = [];
      if (tokenZap.contractAddress) {
        msg.push({
          contractAddress: tokenZap.contractAddress,
          msg: {
            increase_allowance: {
              amount: zapAmount,
              spender: ZAPPER_CONTRACT
            }
          }
        });
      } else {
        coins.push({
          denom: tokenZap.denom,
          amount: zapAmount
        });
      }

      // zapIn message
      msg.push({
        contractAddress: ZAPPER_CONTRACT,
        msg: {
          zap_in_liquidity: {
            asset_in: parseAsset(tokenZap, zapAmount),
            minimum_liquidity: zapInResponse.minimumLiquidity.toString(),
            pool_key: zapInResponse.poolKey,
            routes: zapInResponse.routes,
            tick_lower_index: zapInResponse.tickLowerIndex,
            tick_upper_index: zapInResponse.tickUpperIndex
          }
        },
        funds: coins
      });

      const tx = await executeMultiple(msg, walletAddress);

      if (tx) {
        onSuccess(tx);
      }

      return tx;
    } catch (e: any) {
      console.log('error', e);
      onError(e);
    }
  };

  const zapOut = async (data: ZapOutData, walletAddress: string, onSuccess: any, onError: any) => {
    try {
      const { tokenId, zapOutResponse } = data;

      let msg = [];

      // first approve NFT for ZAPPER_CONTRACT
      msg.push({
        contractAddress: network.pool_v3,
        msg: {
          approve: {
            spender: ZAPPER_CONTRACT,
            token_id: tokenId
          }
        }
      });

      // zapOut message
      msg.push({
        contractAddress: ZAPPER_CONTRACT,
        msg: {
          zap_out_liquidity: {
            position_index: zapOutResponse.positionIndex,
            routes: zapOutResponse.routes
          }
        }
      });

      const tx = await executeMultiple(msg, walletAddress);

      if (tx) {
        onSuccess(tx);
      }
    } catch (e: any) {
      console.log('error', e);
      onError(e);
    }
  };

  return {
    zapIn,
    zapOut
  };
};

export default useZap;
