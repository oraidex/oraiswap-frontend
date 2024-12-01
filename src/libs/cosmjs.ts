// @ts-nocheck
import * as cosmwasm from '@cosmjs/cosmwasm-stargate';
import { OfflineSigner } from '@cosmjs/proto-signing';
import { Coin, GasPrice } from '@cosmjs/stargate';
import { Tendermint37Client } from '@cosmjs/tendermint-rpc';
import { Stargate } from '@injectivelabs/sdk-ts';
import { getWalletByNetworkCosmosFromStorage } from 'helper';
import { network } from 'index';
import { MetamaskOfflineSigner } from './eip191';
export type clientType = 'cosmwasm' | 'injective';

const collectWallet = async (chainId: string) => {
  const keplr = await window.Keplr.getKeplr();
  if (keplr) return await keplr.getOfflineSignerAuto(chainId);
  if (window.ethereum) return await MetamaskOfflineSigner.connect(window.ethereum, network.denom);
  throw new Error('You have to install Cosmos wallet first if you do not use a mnemonic to sign transactions');
};

const getCosmWasmClient = async (
  config: { signer?: OfflineSigner; chainId?: string; rpc?: string },
  options?: cosmwasm.SigningCosmWasmClientOptions
) => {
  try {
    const { chainId, rpc, signer } = config;
    const wallet = signer ?? (await collectWallet(chainId));
    const defaultAddress = (await wallet.getAccounts())[0];
    const tmClient = await Tendermint37Client.connect(rpc ?? (network.rpc as string));
    const client = await cosmwasm.SigningCosmWasmClient.createWithSigner(
      tmClient,
      wallet,
      options
        ? { ...options, broadcastPollIntervalMs: 600 }
        : {
          gasPrice: GasPrice.fromString(network.fee.gasPrice + network.denom),
          broadcastPollIntervalMs: 600
        }
    );
    return { wallet, client, defaultAddress };
  } catch (error) {
    console.error('error getCosmwasmClient: ', error);
  }
};

export const connectWithSigner = async (rpc: string, signer: OfflineSigner, clientType: clientType, options?: any) => {
  switch (clientType) {
    case 'cosmwasm': {
      const { client } = await getCosmWasmClient({ signer, rpc }, options);
      return client;
    }
    case 'injective': {
      const tmClient = await Tendermint37Client.connect(rpc);
      return Stargate.InjectiveSigningStargateClient.createWithSigner(tmClient as any, signer, options);
    }
  }
};

class CosmJs {
  static getWalletByFromStorage() {
    return getWalletByNetworkCosmosFromStorage();
  }
  static async execute(data: {
    prefix?: string;
    walletAddr: string;
    address: string;
    handleMsg: cosmwasm.ExecuteInstruction;
    funds?: readonly Coin[];
    gasAmount: Coin;
    gasLimits?: { exec: number };
    memo?: string;
  }) {
    try {
      const walletType = this.getWalletByFromStorage();
      const keplr = await window.Keplr.getKeplr();
      if (keplr || (walletType && walletType === 'eip191')) {
        await window.Keplr.suggestChain(network.chainId);
        const result = await window.client.execute(
          data.walletAddr,
          data.address,
          data.handleMsg,
          'auto',
          data.memo,
          data.funds
        );
        return result;
      } else {
        throw new Error('You need to install Keplr to execute the contract');
      }
    } catch (error) {
      console.log('error in executing contract: ' + error);
      throw error;
    }
  }

  static async executeMultiple(data: {
    prefix?: string;
    walletAddr: string;
    msgs: cosmwasm.ExecuteInstruction[];
    gasAmount: Coin;
    gasLimits?: { exec: number };
    memo?: string;
  }) {
    try {
      const walletType = this.getWalletByFromStorage();
      const keplr = await window.Keplr.getKeplr();
      if (keplr || (walletType && walletType === 'eip191')) {
        await window.Keplr.suggestChain(network.chainId);
        const result = await window.client.executeMultiple(data.walletAddr, data.msgs, 'auto', data.memo);
        return {
          logs: result?.logs,
          transactionHash: result.transactionHash
        };
      } else {
        throw new Error('You need to install Keplr to execute the contract');
      }
    } catch (error) {
      console.log('error in executing contract: ' + error);
      throw error;
    }
  }
}

export { collectWallet, getCosmWasmClient };

export default CosmJs;
