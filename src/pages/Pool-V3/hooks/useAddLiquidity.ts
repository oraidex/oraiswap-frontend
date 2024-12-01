import SingletonOraiswapV3 from 'libs/contractSingleton';
import {
  createPoolMsg,
  createPositionMsg,
  createPositionWithNativeMsg,
  executeMultiple,
  genMsgAllowance,
  InitPositionData,
  isNativeToken
} from '../helpers/helper';

import { newPoolKey } from '@oraichain/oraiswap-v3';
import { network } from 'index';
import { getCosmWasmClient } from 'libs/cosmjs';

const useAddLiquidity = () => {
  const handleInitPositionWithNative = async (data: InitPositionData, walletAddress: string, onSuccess, onError) => {
    const { poolKeyData, lowerTick, upperTick, spotSqrtPrice, liquidityDelta, initPool, slippageTolerance } = data;

    const { token_x, token_y, fee_tier } = poolKeyData;

    try {
      // let [xAmountWithSlippage, yAmountWithSlippage] = calculateTokenAmountsWithSlippage(
      //   fee_tier.tick_spacing,
      //   spotSqrtPrice,
      //   liquidityDelta,
      //   lowerTick,
      //   upperTick,
      //   Number(slippageTolerance),
      //   false
      // );

      const [xAmountWithSlippage, yAmountWithSlippage] = [data.tokenXAmount, data.tokenYAmount];

      const msg = [];

      let listTokenApprove: {
        token: string;
        amount: bigint;
      }[] = [];
      if (!isNativeToken(token_x)) listTokenApprove.push({ token: token_x, amount: xAmountWithSlippage });
      if (!isNativeToken(token_y)) listTokenApprove.push({ token: token_y, amount: yAmountWithSlippage });
      if (listTokenApprove.length > 0) {
        const allowMsg = genMsgAllowance(listTokenApprove);
        // await executeMultiple(msg, walletAddress);
        msg.push(...allowMsg);
      }

      const poolKey = newPoolKey(token_x, token_y, fee_tier);

      if (initPool) {
        const createPoolTx = createPoolMsg(poolKey, spotSqrtPrice.toString());
        msg.push(createPoolTx);
      }

      // TODO:here
      const createPosMsg = createPositionWithNativeMsg(
        poolKey,
        lowerTick,
        upperTick,
        liquidityDelta,
        spotSqrtPrice,
        slippageTolerance,
        xAmountWithSlippage,
        yAmountWithSlippage
      );

      msg.push(createPosMsg);

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

  const handleInitPosition = async (data: InitPositionData, walletAddress: string, onSuccess, onError) => {
    const { client } = await getCosmWasmClient({ chainId: network.chainId });
    await SingletonOraiswapV3.load(client, walletAddress);

    const {
      poolKeyData,
      lowerTick,
      upperTick,
      spotSqrtPrice,
      tokenXAmount,
      tokenYAmount,
      liquidityDelta,
      initPool,
      slippageTolerance
    } = data;

    const { token_x, token_y, fee_tier } = poolKeyData;

    if (
      // TODO: open to ibc tokens later
      (isNativeToken(token_x) && tokenXAmount !== 0n) ||
      (isNativeToken(token_y) && tokenYAmount !== 0n)
    ) {
      return await handleInitPositionWithNative(data, walletAddress, onSuccess, onError);
    }

    try {
      const msg = [];
      const txs = [];

      // const [xAmountWithSlippage, yAmountWithSlippage] = calculateTokenAmountsWithSlippage(
      //   fee_tier.tick_spacing,
      //   spotSqrtPrice,
      //   liquidityDelta,
      //   lowerTick,
      //   upperTick,
      //   Number(slippageTolerance),
      //   true
      // );

      let listTokenApprove: {
        token: string;
        amount: bigint;
      }[] = [];
      if (!isNativeToken(token_x)) listTokenApprove.push({ token: token_x, amount: tokenXAmount });
      if (!isNativeToken(token_y)) listTokenApprove.push({ token: token_y, amount: tokenYAmount });

      const allowMsg = genMsgAllowance(listTokenApprove);
      msg.push(...allowMsg);

      // await executeMultiple(msg, walletAddress);

      const poolKey = newPoolKey(token_x, token_y, fee_tier);

      if (initPool) {
        // const createTx = await createPoolTx(poolKey, spotSqrtPrice.toString(), walletAddress);
        // txs.push(createTx);
        const createTx = createPoolMsg(poolKey, spotSqrtPrice.toString());
        msg.push(createTx);
      }

      const createPosTx = createPositionMsg(
        poolKey,
        lowerTick,
        upperTick,
        liquidityDelta,
        spotSqrtPrice,
        slippageTolerance
      );
      msg.push(createPosTx);

      const tx = await executeMultiple(msg, walletAddress);

      txs.push(tx);
      if (tx) {
        onSuccess(tx);
      }

      return tx;
    } catch (e: any) {
      console.log(e);
      onError(e);
    }
  };

  return {
    handleInitPositionWithNative,
    handleInitPosition
  };
};

export default useAddLiquidity;
