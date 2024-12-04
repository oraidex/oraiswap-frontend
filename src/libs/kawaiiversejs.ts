import {
  createMessageConvertCoin,
  createMessageConvertERC20,
  createMessageConvertIbcTransferERC20,
  createMsgIbcCustom,
  createTxIBCMsgTransfer
} from '@oraichain/kawaiiverse-txs';
import { createTxRaw } from '@tharsis/proto';

import Long from 'long';
import { collectWallet } from './cosmjs';

import { Coin, StargateClient } from '@cosmjs/stargate';
import { OfflineDirectSigner } from '@keplr-wallet/types';
import { calculateTimeoutTimestamp, getEvmAddress } from '@oraichain/oraidex-common';
import { chainInfos, kawaiiTokens } from 'initCommon';

async function getAccountInfo(accAddress: string) {
  const kawaiiInfo = chainInfos.find((c) => c.chainId === 'kawaii_6886-1');
  return await fetch(`${kawaiiInfo.rest}/cosmos/auth/v1beta1/accounts/${accAddress}`, { method: 'GET' }).then((data) =>
    data.json()
  );
}

// chain id format: something_1234-3
function parseChainIdNumber(chainId: string) {
  return parseInt(chainId.split('_')[1].split('-')[0]);
}

async function getSenderInfo(sender: string, pubkey: Uint8Array) {
  const accountInfo = await getAccountInfo(sender);

  return {
    accountAddress: sender,
    sequence: parseInt(accountInfo.account.base_account.sequence),
    accountNumber: parseInt(accountInfo.account.base_account.account_number),
    pubkey: Buffer.from(pubkey).toString('base64')
  };
}

async function getWallet(chainId: string) {
  if (await window.Keplr.getKeplr()) await window.Keplr.suggestChain(chainId);
  else throw new Error('Cannot get Keplr to get account');

  const wallet = (await collectWallet(chainId)) as OfflineDirectSigner;
  const accounts = await wallet.getAccounts();
  return { accounts, wallet };
}

async function submit({
  wallet,
  signDirect,
  chainId,
  rpc,
  accountNumber,
  signer
}: {
  wallet: OfflineDirectSigner;
  signDirect: any;
  chainId: string;
  rpc: string;
  accountNumber: number;
  signer: string;
}) {
  const bodyBytes = signDirect.body.serialize();
  const authInfoBytes = signDirect.authInfo.serialize();
  const signResult = await wallet.signDirect(signer, {
    bodyBytes,
    authInfoBytes,
    chainId,
    accountNumber: new Long(accountNumber)
  });
  const signature = Buffer.from(signResult.signature.signature, 'base64');
  const txRaw = createTxRaw(signResult.signed.bodyBytes, signResult.signed.authInfoBytes, [
    signature
  ]).message.serialize();
  const client = await StargateClient.connect(rpc);
  const result = await client.broadcastTx(txRaw);
  return result;
}

function createTxIBCMsgTransferStrategy(
  data: {
    chainId: number;
    cosmosChainId: string;
    senderInfo: any;
    fee: any;
    params: any;
  },
  isCustom: { customMessages?: any[] }
) {
  const { chainId, cosmosChainId, senderInfo, fee, params } = data;
  if (isCustom.customMessages)
    return createMsgIbcCustom(
      { chainId, cosmosChainId },
      senderInfo,
      fee,
      `sender - ${senderInfo.accountAddress}; receiver - ${params.receiver}`,
      params,
      isCustom.customMessages
    );
  return createTxIBCMsgTransfer(
    { chainId, cosmosChainId },
    senderInfo,
    fee,
    `sender - ${senderInfo.accountAddress}; receiver - ${params.receiver}`,
    params
  );
}

export default class KawaiiverseJs {
  /**
   * A wrapper method to execute a msg convert coin feature
   * @param args - an object containing essential parameters to execute msg convert coin
   * @returns - transaction hash after executing the msg convert coin
   */
  static async convertCoin({
    sender,
    gasAmount,
    gasLimits = { exec: 2400000 },
    coin
  }: {
    sender: string;
    gasAmount: Coin;
    gasLimits?: { exec: number };
    coin: Coin;
  }) {
    try {
      const subnetwork = kawaiiTokens[0];
      const chainIdNumber = parseChainIdNumber(subnetwork.chainId as string);

      const { wallet, accounts } = await getWallet(subnetwork.chainId as string);

      const fee = { ...gasAmount, gas: gasLimits.exec.toString() };

      const senderInfo = await getSenderInfo(sender, accounts[0].pubkey);

      const destinationAddress = getEvmAddress(senderInfo.accountAddress);

      const params = {
        destinationAddress,
        amount: coin.amount.toString(),
        denom: coin.denom.toString()
      };

      const { signDirect } = createMessageConvertCoin(
        { chainId: chainIdNumber, cosmosChainId: subnetwork.chainId as string },
        senderInfo,
        fee,
        `sender - ${senderInfo.accountAddress}; receiver - ${params.destinationAddress}`,
        params
      );

      return submit({
        wallet,
        signDirect,
        chainId: subnetwork.chainId as string,
        rpc: subnetwork.rpc,
        accountNumber: senderInfo.accountNumber,
        signer: senderInfo.accountAddress
      });
    } catch (error) {
      console.log('error in converting coin: ', error);
      throw error;
    }
  }

  /**
   * A wrapper method to execute a msg convert coin feature
   * @param args - an object containing essential parameters to execute msg convert coin
   * @returns - transaction hash after executing the msg convert coin
   */
  static async convertERC20({
    sender,
    gasAmount,
    gasLimits = { exec: 2400000 },
    amount,
    contractAddr
  }: {
    sender: string;
    gasAmount: Coin;
    gasLimits?: { exec: number };
    amount: string;
    contractAddr?: string;
  }) {
    try {
      const subnetwork = kawaiiTokens[0];
      const chainIdNumber = parseChainIdNumber(subnetwork.chainId as string);

      const { wallet, accounts } = await getWallet(subnetwork.chainId as string);

      const fee = { ...gasAmount, gas: gasLimits.exec.toString() };

      let senderInfo = await getSenderInfo(sender, accounts[0].pubkey);

      const params = {
        contractAddress: contractAddr,
        destinationAddress: sender, // we want to convert erc20 token from eth address to native token with native address => use native sender address
        amount
      };

      senderInfo.accountAddress = getEvmAddress(senderInfo.accountAddress);

      const { signDirect } = createMessageConvertERC20(
        { chainId: chainIdNumber, cosmosChainId: subnetwork.chainId as string },
        senderInfo,
        fee,
        `sender - ${senderInfo.accountAddress}; receiver - ${params.destinationAddress}`,
        params
      );

      return submit({
        wallet,
        signDirect,
        chainId: subnetwork.chainId as string,
        rpc: subnetwork.rpc,
        accountNumber: senderInfo.accountNumber,
        signer: sender
      });
    } catch (error) {
      console.log('error in converting ERC20: ', error);
      throw error;
    }
  }

  static async transferIBC({
    sender,
    gasAmount,
    gasLimits = { exec: 2400000 },
    ibcInfo,
    customMessages
  }: {
    sender: string;
    gasAmount: Coin;
    gasLimits?: { exec: number };
    ibcInfo: IBCInfoMsg;
    customMessages?: any[];
  }) {
    try {
      const subnetwork = kawaiiTokens[0];
      const chainIdNumber = parseChainIdNumber(subnetwork.chainId as string);

      const { wallet, accounts } = await getWallet(subnetwork.chainId as string);

      const fee = { ...gasAmount, gas: gasLimits.exec.toString() };

      const senderInfo = await getSenderInfo(sender, accounts[0].pubkey);

      const params = {
        ...ibcInfo,
        timeoutTimestamp: calculateTimeoutTimestamp(ibcInfo.timeoutTimestamp),
        revisionNumber: 0,
        revisionHeight: 0
      };

      const { signDirect } = createTxIBCMsgTransferStrategy(
        {
          chainId: chainIdNumber,
          cosmosChainId: subnetwork.chainId as string,
          fee,
          params,
          senderInfo
        },
        { customMessages }
      );

      return submit({
        wallet,
        signDirect,
        chainId: subnetwork.chainId as string,
        rpc: subnetwork.rpc,
        accountNumber: senderInfo.accountNumber,
        signer: senderInfo.accountAddress
      });
    } catch (error) {
      console.log('error in transferring ibc: ', error);
      throw error;
    }
  }

  static async convertIbcTransferERC20({
    sender,
    gasAmount,
    gasLimits = { exec: 2400000 },
    amount,
    ibcInfo,
    contractAddr
  }: {
    sender: string;
    gasAmount: Coin;
    gasLimits?: { exec: number };
    amount: string;
    ibcInfo: IBCInfoMsg;
    contractAddr?: string;
  }) {
    try {
      const subnetwork = kawaiiTokens[0];
      const chainIdNumber = parseChainIdNumber(subnetwork.chainId as string);

      const { wallet, accounts } = await getWallet(subnetwork.chainId as string);

      const fee = { ...gasAmount, gas: gasLimits.exec.toString() };
      let senderInfo = await getSenderInfo(sender, accounts[0].pubkey);

      const params = {
        ...ibcInfo,
        contractAddress: contractAddr,
        destinationAddress: sender, // we want to convert erc20 token from eth address to native token with native address => use native sender address
        amount,
        timeoutTimestamp: calculateTimeoutTimestamp(ibcInfo.timeoutTimestamp),
        revisionNumber: 0,
        revisionHeight: 0
      };

      const evmAddress = getEvmAddress(senderInfo.accountAddress);
      const { signDirect } = createMessageConvertIbcTransferERC20(
        { chainId: chainIdNumber, cosmosChainId: subnetwork.chainId as string },
        senderInfo,
        evmAddress,
        fee,
        `sender - ${evmAddress}; receiver - ${params.receiver}`,
        params
      );

      return submit({
        wallet,
        signDirect,
        chainId: subnetwork.chainId as string,
        rpc: subnetwork.rpc,
        accountNumber: senderInfo.accountNumber,
        signer: sender
      });
    } catch (error) {
      console.log('error in converting ibc transfer ERC20: ', error);
      throw error;
    }
  }
}
