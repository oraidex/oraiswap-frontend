import { ExecuteInstruction, ExecuteResult } from '@cosmjs/cosmwasm-stargate';
import { Coin, coin } from '@cosmjs/proto-signing';
import { DeliverTxResponse, GasPrice } from '@cosmjs/stargate';
import {
  BigDecimal,
  GAS_ESTIMATION_BRIDGE_DEFAULT,
  IBCInfo,
  KWT,
  ORAI,
  TokenItemType,
  buildMultipleExecuteMessages,
  calculateTimeoutTimestamp,
  getEncodedExecuteContractMsgs,
  ibcInfos,
  ibcInfosOld,
  oraichain2oraib,
  parseTokenInfo,
  toAmount,
  validateNumber
} from '@oraichain/oraidex-common';
import { feeEstimate, getNetworkGasPrice } from 'helper';

import { CosmosChainId } from '@oraichain/common';
import { CwIcs20LatestClient } from '@oraichain/common-contracts-sdk';
import { TransferBackMsg } from '@oraichain/common-contracts-sdk/build/CwIcs20Latest.types';
import { OraiswapTokenClient } from '@oraichain/oraidex-contracts-sdk';
import { useQuery } from '@tanstack/react-query';
import { BitcoinUnit } from 'bitcoin-units';
import { opcodes, script } from 'bitcoinjs-lib';
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import { bitcoinLcd, bitcoinLcdV2 } from 'helper/constants';
import { chainInfos, flattenTokens, kawaiiTokens, network, tokenMap } from 'initCommon';
import CosmJs, { collectWallet, connectWithSigner, getCosmWasmClient } from 'libs/cosmjs';
import KawaiiverseJs from 'libs/kawaiiversejs';
import { NomicClient } from 'libs/nomic/models/nomic-client/nomic-client';
import { generateError } from 'libs/utils';
import { Type, generateConvertCw20Erc20Message, generateConvertMsgs, generateMoveOraib2OraiMessages } from 'rest/api';
import axios from 'rest/request';
import { RemainingOraibTokenItem } from './StuckOraib/useGetOraiBridgeBalances';
import { store } from 'store/configure';
import { config } from 'libs/nomic/config';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { OraiBtcSubnetChain } from 'libs/nomic/models/ibc-chain';
import { fromBech32, toBech32 } from '@cosmjs/encoding';
import { getAccount, getMint } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';

export const transferIBC = async (data: {
  fromToken: TokenItemType;
  fromAddress: string;
  toAddress: string;
  amount: Coin;
  ibcInfo: IBCInfo;
  memo?: string;
}): Promise<DeliverTxResponse> => {
  const { fromToken, fromAddress, toAddress, amount, ibcInfo, memo } = data;
  const transferMsg: MsgTransfer = {
    sourcePort: ibcInfo.source,
    sourceChannel: ibcInfo.channel,
    token: amount,
    sender: fromAddress,
    receiver: toAddress,
    memo,
    timeoutTimestamp: BigInt(calculateTimeoutTimestamp(ibcInfo.timeout)),
    timeoutHeight: undefined
  };
  let feeDenom = fromToken.denom;
  if (fromToken.denom.includes('ibc')) feeDenom = fromToken.prefix;
  const result = await transferIBCMultiple(fromAddress, fromToken.chainId as CosmosChainId, fromToken.rpc, feeDenom, [
    transferMsg
  ]);
  return result;
};

export const transferIBCKwt = async (
  fromToken: TokenItemType,
  toToken: TokenItemType,
  transferAmount: number,
  amounts: AmountDetails
): Promise<DeliverTxResponse> => {
  if (transferAmount === 0) throw generateError('Transfer amount is empty');
  const keplr = await window.Keplr.getKeplr();
  if (!keplr) return;
  await window.Keplr.suggestChain(toToken.chainId);
  // enable from to send transaction
  await window.Keplr.suggestChain(fromToken.chainId);
  const fromAddress = await window.Keplr.getKeplrAddr(fromToken.chainId);
  const toAddress = await window.Keplr.getKeplrAddr(toToken.chainId);
  if (!fromAddress || !toAddress) throw generateError('Please login keplr!');

  const amount = coin(toAmount(transferAmount, fromToken.decimals).toString(), fromToken.denom);

  const ibcInfo: IBCInfo = ibcInfos[fromToken.chainId][toToken.chainId];
  let customMessages: any[];

  // check if from token has erc20 map then we need to convert back to bep20 / erc20 first. TODO: need to filter if convert to ERC20 or BEP20
  if (fromToken.evmDenoms) {
    const msgConvertReverses = generateConvertCw20Erc20Message(amounts, fromToken, fromAddress, amount);
    const executeContractMsgs = getEncodedExecuteContractMsgs(
      fromAddress,
      buildMultipleExecuteMessages(undefined, ...msgConvertReverses)
    );
    customMessages = executeContractMsgs.map((msg) => ({
      message: msg.value,
      path: msg.typeUrl.substring(1)
    }));
  }

  const result = await KawaiiverseJs.transferIBC({
    sender: fromAddress,
    gasAmount: { denom: '200000', amount: '0' },
    ibcInfo: {
      sourcePort: ibcInfo.source,
      sourceChannel: ibcInfo.channel,
      amount: amount.amount,
      denom: amount.denom,
      sender: fromAddress,
      receiver: toAddress,
      timeoutTimestamp: ibcInfo.timeout
    },
    customMessages
  });
  return result;
};

export const convertTransferIBCErc20Kwt = async (
  fromToken: TokenItemType,
  toToken: TokenItemType,
  transferAmount: number
): Promise<DeliverTxResponse> => {
  if (transferAmount === 0) throw generateError('Transfer amount is empty!');
  const keplr = await window.Keplr.getKeplr();
  if (!keplr) return;
  await window.Keplr.suggestChain(toToken.chainId);
  // enable from to send transaction
  await window.Keplr.suggestChain(fromToken.chainId);
  const fromAddress = await window.Keplr.getKeplrAddr(fromToken.chainId);
  const toAddress = await window.Keplr.getKeplrAddr(toToken.chainId);
  if (!fromAddress || !toAddress) throw generateError('Please login keplr!');
  const nativeToken = kawaiiTokens.find(
    (token) =>
      token.bridgeTo &&
      token.cosmosBased &&
      token.coinGeckoId === fromToken.coinGeckoId &&
      token.denom !== fromToken.denom
  ); // collect kawaiiverse cosmos based token for conversion

  const amount = coin(toAmount(transferAmount, fromToken.decimals).toString(), nativeToken.denom);
  const ibcInfo: IBCInfo = ibcInfos[fromToken.chainId][toToken.chainId];

  const result = await KawaiiverseJs.convertIbcTransferERC20({
    sender: fromAddress,
    gasAmount: { denom: '200000', amount: '0' },
    ibcInfo: {
      sourcePort: ibcInfo.source,
      sourceChannel: ibcInfo.channel,
      amount: amount.amount,
      denom: amount.denom,
      sender: fromAddress,
      receiver: toAddress,
      timeoutTimestamp: ibcInfo.timeout
    },
    amount: amount.amount,
    contractAddr: fromToken?.contractAddress
  });
  return result;
};

export const transferIBCMultiple = async (
  fromAddress: string,
  fromChainId: CosmosChainId,
  rpc: string,
  feeDenom: string,
  messages: MsgTransfer[]
): Promise<DeliverTxResponse> => {
  const encodedMessages = messages.map((message) => ({
    typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
    value: MsgTransfer.fromPartial(message)
  }));
  const offlineSigner = await collectWallet(fromChainId);
  // Initialize the gaia api with the offline signer that is injected by Keplr extension.
  const client = await connectWithSigner(
    rpc,
    offlineSigner as any,
    fromChainId === 'injective-1' ? 'injective' : 'cosmwasm',
    {
      gasPrice: GasPrice.fromString(`${await getNetworkGasPrice(fromChainId)}${feeDenom}`),
      broadcastPollIntervalMs: 600
    }
  );
  // hardcode fix bug osmosis
  let fee: 'auto' | number = 'auto';
  if (fromChainId === 'osmosis-1') fee = 3;
  const result = await client.signAndBroadcast(fromAddress, encodedMessages, fee);
  return result as DeliverTxResponse;
};

export const transferTokenErc20Cw20Map = async ({
  amounts,
  transferAmount,
  fromToken,
  fromAddress,
  toAddress,
  ibcInfo,
  ibcMemo
}: {
  amounts: AmountDetails;
  transferAmount: number;
  fromToken: TokenItemType;
  fromAddress: string;
  toAddress: string;
  ibcInfo: IBCInfo;
  ibcMemo?: string;
}): Promise<DeliverTxResponse> => {
  const evmToken = tokenMap[fromToken.evmDenoms[0]];
  const evmAmount = coin(toAmount(transferAmount, evmToken.decimals).toString(), evmToken.denom);

  const msgConvertReverses = generateConvertCw20Erc20Message(amounts, fromToken, fromAddress, evmAmount);

  const executeContractMsgs = buildMultipleExecuteMessages(undefined, ...msgConvertReverses);
  // note need refactor
  // get raw ibc tx
  const msgTransfer = {
    typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
    value: MsgTransfer.fromPartial({
      sourcePort: ibcInfo.source,
      sourceChannel: ibcInfo.channel,
      token: evmAmount,
      sender: fromAddress,
      receiver: toAddress,
      memo: ibcMemo,
      timeoutTimestamp: BigInt(calculateTimeoutTimestamp(ibcInfo.timeout))
    })
  };

  // Initialize the gaia api with the offline signer that is injected by Keplr extension.
  const { client } = await getCosmWasmClient(
    { rpc: fromToken.rpc, chainId: fromToken.chainId },
    {
      gasPrice: GasPrice.fromString(`${await getNetworkGasPrice(fromToken.chainId)}${network.denom}`)
    }
  );
  const result = await client.signAndBroadcast(
    fromAddress,
    [...getEncodedExecuteContractMsgs(fromAddress, executeContractMsgs), msgTransfer],
    'auto'
  );
  return result;
};

export const transferToRemoteChainIbcWasm = async (
  ibcInfo: IBCInfo,
  fromToken: TokenItemType,
  toToken: TokenItemType,
  fromAddress: string,
  toAddress: string,
  amount: string,
  ibcMemo: string
): Promise<ExecuteResult> => {
  const ibcWasmContractAddress = ibcInfo.source.split('.')[1];
  if (!ibcWasmContractAddress)
    throw generateError('IBC Wasm source port is invalid. Cannot transfer to the destination chain');

  const { info: assetInfo } = parseTokenInfo(fromToken);
  const ibcWasmContract = new CwIcs20LatestClient(window.client, fromAddress, ibcWasmContractAddress);
  try {
    // query if the cw20 mapping has been registered for this pair or not. If not => we switch to erc20cw20 map case
    await ibcWasmContract.pairMappingsFromAssetInfo({ assetInfo });
  } catch (error) {
    // switch ibc info to erc20cw20 map case, where we need to convert between ibc & cw20 for backward compatibility
    throw generateError('Cannot transfer to remote chain because cannot find mapping pair');
  }

  // if asset info is native => send native way, else send cw20 way
  const msg = {
    localChannelId: ibcInfo.channel,
    remoteAddress: toAddress,
    remoteDenom: toToken.denom,
    timeout: ibcInfo.timeout,
    memo: ibcMemo
  };
  let result: ExecuteResult;
  if ('native_token' in assetInfo) {
    result = await ibcWasmContract.transferToRemote(msg, 'auto', undefined, [{ amount, denom: fromToken.denom }]);
  } else {
    const transferBackMsgCw20Msg: TransferBackMsg = {
      local_channel_id: msg.localChannelId,
      remote_address: msg.remoteAddress,
      remote_denom: msg.remoteDenom,
      timeout: msg.timeout,
      memo: msg.memo
    };
    const cw20Token = new OraiswapTokenClient(window.client, fromAddress, fromToken.contractAddress);
    result = await cw20Token.send(
      {
        amount,
        contract: ibcWasmContractAddress,
        msg: Buffer.from(JSON.stringify(transferBackMsgCw20Msg)).toString('base64')
      },
      'auto'
    );
  }
  return result;
};

// Oraichain (Orai)
export const transferIbcCustom = async (
  fromToken: TokenItemType,
  toToken: TokenItemType,
  transferAmount: number,
  amounts: AmountDetails,
  transferAddress?: string
): Promise<DeliverTxResponse> => {
  if (transferAmount === 0) throw generateError('Transfer amount is empty');
  await window.Keplr.suggestChain(toToken.chainId);
  // enable from to send transaction
  await window.Keplr.suggestChain(fromToken.chainId);
  // check address
  const fromAddress = await window.Keplr.getKeplrAddr(fromToken.chainId);
  const toAddress = await window.Keplr.getKeplrAddr(toToken.chainId);
  if (!fromAddress || !toAddress) throw generateError('Please login keplr!');
  if (toToken.chainId === 'oraibridge-subnet-2' && !toToken.prefix) throw generateError('Prefix Token not found!');

  let amount = coin(toAmount(transferAmount, fromToken.decimals).toString(), fromToken.denom);
  const ibcMemo = toToken.chainId === 'oraibridge-subnet-2' ? toToken.prefix + transferAddress : '';
  let ibcInfo: IBCInfo = ibcInfos[fromToken.chainId][toToken.chainId];
  // only allow transferring back to ethereum / bsc only if there's metamask address and when the metamask address is used, which is in the ibcMemo variable
  if (!transferAddress && (fromToken.evmDenoms || ibcInfo.channel === oraichain2oraib)) {
    throw generateError('Please login metamask!');
  }
  // for KWT & MILKY tokens, we use the old ibc info channel
  if (fromToken.evmDenoms || kawaiiTokens.find((i) => i.name === fromToken.name))
    ibcInfo = ibcInfosOld[fromToken.chainId][toToken.chainId];
  let result: DeliverTxResponse;
  if (fromToken.evmDenoms) {
    result = await transferTokenErc20Cw20Map({
      amounts,
      transferAmount,
      fromToken,
      fromAddress,
      toAddress,
      ibcInfo,
      ibcMemo
    });
    return result;
  }
  // if it includes wasm in source => ibc wasm case
  if (ibcInfo.channel === oraichain2oraib) {
    try {
      // special case. We try-catch because cosmwasm stargate already check tx code for us & throw an error if code != 0 => we can safely cast to DeliverTxResponse if there's no error
      const result = await transferToRemoteChainIbcWasm(
        ibcInfo,
        fromToken,
        toToken,
        fromAddress,
        toAddress,
        amount.amount,
        ibcMemo
      );
      // @ts-ignore
      return { ...result, code: 0 };
    } catch (error) {
      throw generateError(error.toString());
    }
  }
  result = await transferIBC({
    fromToken,
    fromAddress,
    toAddress,
    amount,
    ibcInfo
  });
  return result;
};

export const findDefaultToToken = (from: TokenItemType) => {
  if (!from.bridgeTo) return;

  const storage = store.getState();
  const allTokens = [...(storage.token.allOraichainTokens || []), ...(storage.token.allOtherChainTokens || [])];

  const defaultToken = allTokens.find((t) => {
    const defaultChain = from.bridgeTo[0];
    return defaultChain === t.chainId && from.coinGeckoId === t.coinGeckoId && from.chainId !== t.chainId;
  });

  return defaultToken;
};

export const convertKwt = async (transferAmount: number, fromToken: TokenItemType): Promise<DeliverTxResponse> => {
  if (transferAmount === 0) throw new Error('Transfer amount is empty');
  const keplr = await window.Keplr.getKeplr();
  if (!keplr) return;
  await window.Keplr.suggestChain(fromToken.chainId);
  const fromAddress = await window.Keplr.getKeplrAddr(fromToken.chainId);

  if (!fromAddress) {
    return;
  }

  const amount = coin(toAmount(transferAmount, fromToken.decimals).toString(), fromToken.denom);

  let result: DeliverTxResponse;

  if (!fromToken.contractAddress) {
    result = await KawaiiverseJs.convertCoin({
      sender: fromAddress,
      gasAmount: { amount: '0', denom: KWT },
      coin: amount
    });
  } else {
    result = await KawaiiverseJs.convertERC20({
      sender: fromAddress,
      gasAmount: { amount: '0', denom: KWT },
      amount: amount.amount,
      contractAddr: fromToken?.contractAddress
    });
  }
  return result;
};

export const broadcastConvertTokenTx = async (
  amount: number,
  token: TokenItemType,
  type: 'cw20ToNative' | 'nativeToCw20',
  outputToken?: TokenItemType
): Promise<ExecuteResult> => {
  const _fromAmount = toAmount(amount, token.decimals).toString();
  const oraiAddress = await window.Keplr.getKeplrAddr();
  if (!oraiAddress) throw generateError('Please login both metamask and Keplr!');
  let msg: ExecuteInstruction;
  if (type === 'nativeToCw20') {
    msg = generateConvertMsgs({
      type: Type.CONVERT_TOKEN,
      sender: oraiAddress,
      inputAmount: _fromAmount,
      inputToken: token
    });
  } else if (type === 'cw20ToNative') {
    msg = generateConvertMsgs({
      type: Type.CONVERT_TOKEN_REVERSE,
      sender: oraiAddress,
      inputAmount: _fromAmount,
      inputToken: token,
      outputToken
    });
  }
  const result = await CosmJs.execute({
    prefix: ORAI,
    address: msg.contractAddress,
    walletAddr: oraiAddress,
    handleMsg: msg.msg,
    gasAmount: { denom: ORAI, amount: '0' },
    funds: msg.funds
  });
  return result;
};

export const moveOraibToOraichain = async (remainingOraib: RemainingOraibTokenItem[]) => {
  // we can hardcode OraiBridge because we are transferring from the bridge to Oraichain
  const fromAddress = await window.Keplr.getKeplrAddr('oraibridge-subnet-2');
  const toAddress = await window.Keplr.getKeplrAddr('Oraichain');
  const transferMsgs = generateMoveOraib2OraiMessages(remainingOraib, fromAddress, toAddress);

  // we can hardcode OraiBridge because we are transferring from the bridge to Oraichain
  const result = await transferIBCMultiple(
    fromAddress,
    'oraibridge-subnet-2',
    chainInfos.find((c) => c.chainId === 'oraibridge-subnet-2').rpc,
    'uoraib',
    transferMsgs
  );
  return result;
};

// TODO: write testcases
export const calcMaxAmount = ({
  maxAmount,
  token,
  coeff,
  gas = GAS_ESTIMATION_BRIDGE_DEFAULT
}: {
  maxAmount: number;
  token: TokenItemType;
  coeff: number;
  gas?: number;
}) => {
  if (!token) return maxAmount;

  let finalAmount = maxAmount;
  if (token.chainId === 'ton') return finalAmount;

  const feeCurrencyOfToken = token.feeCurrencies?.find((e) => e.coinMinimalDenom === token.denom);
  if (feeCurrencyOfToken) {
    const useFeeEstimate = feeEstimate(token, gas);

    if (coeff === 1) {
      finalAmount = useFeeEstimate > finalAmount ? 0 : new BigDecimal(finalAmount).sub(useFeeEstimate).toNumber();
    } else {
      finalAmount =
        useFeeEstimate > new BigDecimal(maxAmount).sub(new BigDecimal(finalAmount).mul(coeff)).toNumber()
          ? 0
          : finalAmount;
    }
  }

  return finalAmount;
};

//==================================================> BTC <===========================================================================
const MIN_FEE_RATE = 5;
const TX_EMPTY_SIZE = 4 + 1 + 1 + 4; //10
const TX_INPUT_BASE = 32 + 4 + 1 + 4; // 41
const TX_INPUT_PUBKEYHASH = 107;
const TX_OUTPUT_BASE = 8 + 1; //9
const TX_OUTPUT_PUBKEYHASH = 25;
const MIN_TX_FEE = 1000;
// decimals BTC is 8
const truncDecimals = 8;
const atomic = 10 ** truncDecimals;

export const BTC_SCAN = 'https://blockstream.info';

const inputBytes = (input) => {
  return TX_INPUT_BASE + (input.witnessUtxo?.script ? input.witnessUtxo?.script.length : TX_INPUT_PUBKEYHASH);
};

export const getUtxos = async (address: string, baseUrl: string) => {
  if (!address) throw Error('Address is not empty');
  if (!baseUrl) throw Error('BaseUrl is not empty');
  const { data } = await axios({
    baseURL: baseUrl,
    method: 'get',
    url: `/address/${address}/utxo`
  });
  return data;
};
export const mapUtxos = ({ utxos, address, path = "m/84'/0'/0'/0/0", currentBlockHeight = 0 }) => {
  let balance = 0;
  let utxosData = [];
  if (!utxos || utxos?.length === 0) {
    return {
      balance,
      utxos: utxosData
    };
  }
  utxos.forEach((utxo) => {
    balance = balance + Number(utxo.value);
    const data = {
      address: address, //Required
      path: path, //Required
      value: utxo.value, //Required
      confirmations: currentBlockHeight - Number(utxo.status.block_height ?? 0), //Required
      blockHeight: utxo.status.block_height ?? 0,
      txid: utxo.txid, //Required (Same as tx_hash_big_endian)
      vout: utxo.vout, //Required (Same as tx_output_n)
      tx_hash: utxo.txid,
      tx_hash_big_endian: utxo.txid,
      tx_output_n: utxo.vout
    };
    utxosData.push(data);
  });
  return {
    balance,
    utxos: utxosData
  };
};
export const getFeeRate = async ({ blocksWillingToWait = 2, url }) => {
  if (!blocksWillingToWait) throw Error('blocksWillingToWait is not empty');
  if (!url) throw Error('url is not empty');
  const { data: feeRate } = await axios({
    baseURL: url,
    method: 'get',
    url: `/fee-estimates`
  });

  const feeRateByBlock = feeRate?.[blocksWillingToWait];
  if (!feeRateByBlock) {
    throw Error('Not found Fee rate');
  }
  return feeRateByBlock > MIN_FEE_RATE ? feeRateByBlock : MIN_FEE_RATE;
};

const getFeeFromUtxos = (utxos, feeRate, data) => {
  const inputSizeBasedOnInputs =
    utxos.length > 0
      ? utxos.reduce((a, x) => a + inputBytes(x), 0) + utxos.length // +1 byte for each input signature
      : 0;
  let sum =
    TX_EMPTY_SIZE +
    inputSizeBasedOnInputs +
    TX_OUTPUT_BASE +
    TX_OUTPUT_PUBKEYHASH +
    TX_OUTPUT_BASE +
    TX_OUTPUT_PUBKEYHASH;

  if (data) {
    sum += TX_OUTPUT_BASE + data.length;
  }
  const fee = sum * feeRate;
  return fee > MIN_TX_FEE ? fee : MIN_TX_FEE;
};

const compileMemo = (memo) => {
  const data = Buffer.from(memo, 'utf8'); // converts MEMO to buffer
  return script.compile([opcodes.OP_RETURN, data]); // Compile OP_RETURN script
};

export const calculatorTotalFeeBtc = ({ utxos = [], transactionFee = 1, message = '' }) => {
  if (message && message.length > 80) {
    throw new Error('message too long, must not be longer than 80 chars.');
  }
  if (utxos.length === 0) return 0;
  const feeRateWhole = Math.ceil(transactionFee);
  const compiledMemo = message ? compileMemo(message) : null;
  const fee = getFeeFromUtxos(utxos, feeRateWhole, compiledMemo);
  return fee;
};

export const useGetWithdrawlFeesBitcoin = ({
  enabled,
  bitcoinAddress
}: {
  enabled: boolean;
  bitcoinAddress: string;
}) => {
  const getWithdrawFeeBTC = async (bitcoinAddr) => {
    if (!bitcoinAddr) return 0;
    try {
      const { data } = await axios({
        baseURL: bitcoinLcd,
        method: 'get',
        url: `/bitcoin/withdrawal_fees/${bitcoinAddr}`
      });
      return data;
    } catch (error) {
      console.log({ errorGetWithdrawFeeBTC: error });
      return {
        withdrawal_fees: 0
      };
    }
  };

  const { data } = useQuery(['withdrawl_fees', bitcoinAddress, enabled], () => getWithdrawFeeBTC(bitcoinAddress), {
    refetchOnWindowFocus: true,
    enabled: !!bitcoinAddress && !!enabled
  });

  return data;
};

export const useDepositFeesBitcoin = (enabled: boolean) => {
  const getDepositFeeBTC = async () => {
    try {
      const { data } = await axios({
        baseURL: bitcoinLcd,
        method: 'get',
        url: `/bitcoin/deposit_fees`
      });
      return data;
    } catch (error) {
      console.log({ errorGetDepositFeeBTC: error });
      return {
        deposit_fees: 0
      };
    }
  };

  const { data } = useQuery(['deposit_fees', enabled], () => getDepositFeeBTC(), {
    refetchOnWindowFocus: true,
    enabled
  });

  return data;
};

export const useGetWithdrawlFeesBitcoinV2 = ({
  enabled,
  bitcoinAddress
}: {
  enabled: boolean;
  bitcoinAddress: string;
}) => {
  const getWithdrawFeeBTC = async (bitcoinAddr) => {
    if (!bitcoinAddr) {
      return {
        withdrawal_fees: 0
      };
    }
    try {
      const { data } = await axios({
        baseURL: bitcoinLcdV2,
        method: 'get',
        url: `/api/checkpoint/withdraw_fee`,
        params: {
          address: bitcoinAddr
        }
      });
      return {
        withdrawal_fees: data.data
      };
    } catch (error) {
      console.log({ errorGetWithdrawFeeBTC: error });
      return {
        withdrawal_fees: 0
      };
    }
  };

  const { data } = useQuery(['withdrawl_fees_v2', bitcoinAddress, enabled], () => getWithdrawFeeBTC(bitcoinAddress), {
    refetchOnWindowFocus: true,
    enabled: !!bitcoinAddress && !!enabled
  });

  return data;
};

export const useDepositFeesBitcoinV2 = (enabled: boolean) => {
  // FIXME: TURN OFF BTC NOW
  return null

  const getDepositFeeBTC = async () => {
    try {
      const { data } = await axios({
        baseURL: bitcoinLcdV2,
        method: 'get',
        url: `/api/checkpoint/deposit_fee`
      });
      return { deposit_fees: data.data };
    } catch (error) {
      console.log({ errorGetDepositFeeBTC: error });
      return {
        deposit_fees: 0
      };
    }
  };

  const { data } = useQuery(['deposit_fees_v2', enabled], () => getDepositFeeBTC(), {
    refetchOnWindowFocus: true,
    enabled
  });

  return data;
};

export const toAmountBTC = (amount: number | string, decimals = 8): bigint => {
  const validatedAmount = validateNumber(amount);
  return BigInt(Math.trunc(validatedAmount * atomic)) * BigInt(10 ** (decimals - truncDecimals));
};

export const useGetInfoBtc = () => {
  const { data: infoBTC } = useQuery(
    ['estimate-btc-deposit'],
    async () => {
      const nomic = new NomicClient();
      return await nomic.getConfig();
    },
    {
      placeholderData: {
        capacity_limit: 0,
        max_offline_checkpoints: 0,
        max_withdrawal_amount: 0,
        max_withdrawal_script_length: 0,
        min_checkpoint_confirmations: 0,
        min_confirmations: 0,
        min_deposit_amount: 0,
        min_withdrawal_amount: 0,
        min_withdrawal_checkpoints: 0,
        transfer_fee: 0,
        units_per_sat: 0
      }
    }
  );
  return { infoBTC };
};

export const satToBTC = (sat = 0, isDisplayAmount?: boolean) => {
  if (!sat) return 0;
  if (isDisplayAmount) return new BitcoinUnit(sat, 'satoshi').to('BTC').getValueAsString();
  return new BitcoinUnit(sat, 'satoshi').to('BTC').getValue();
};

//==================================================> BTC <-> Oraichain <===========================================================================
export const calculateEstWitnessSize = (signatoriesLength: number) => {
  return signatoriesLength * 79 + 39; // 79 and 39 are magic numbers
};

export const calculateInputSize = (estWitnessSize: number) => {
  return estWitnessSize + 40; // 40 is a magic number
};

export const calculateFeeRateFromMinerFee = (minerFeeRate: number, estWitnessSize: number) => {
  return (minerFeeRate * 10 ** 8) / estWitnessSize; // miner fee rate is in BTC, we * 10**8 to convert to sats
};

export const fiatToCrypto = ({ amount = 0, exchangeRate = 0 } = {}) => {
  try {
    amount = Number(amount);
    BitcoinUnit.setFiat('usd', exchangeRate);
    return new BitcoinUnit(amount, 'usd').to('satoshi').getValue().toFixed(0);
  } catch (e) {
    console.log(e);
  }
};

export const BTCtoSat = (sat = 0, isDisplayAmount?: boolean) => {
  if (!sat) return 0;
  if (isDisplayAmount) return new BitcoinUnit(sat, 'BTC').to('satoshi').getValueAsString();
  return new BitcoinUnit(sat, 'BTC').to('satoshi').getValue();
};
