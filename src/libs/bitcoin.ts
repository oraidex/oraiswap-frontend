import { Key } from '@keplr-wallet/types';

import { bitcoinChainId } from 'helper/constants';
import { network } from 'initCommon';
import { BitcoinUnit } from 'bitcoin-units';
export type BitcoinMode = 'core' | 'extension' | 'mobile-web' | 'walletconnect';
// import { CosmosChainId, BitcoinWallet } from '@oraichain/oraidex-common';
type BitcoinChainId = 'bitcoin' | 'bitcoinTestnet';
export enum TransactionBtcType {
  Legacy = 'legacy',
  Bech32 = 'bech32',
  TapRoot = 'tap-root',
  Segwit = 'segwit'
}
export interface UnsignedBtcTransaction {
  amount: string;
  to: string;
  sender: string;
  memo: string;
  coinMinimalDenom: string;
  chainId: string;
}
export interface IBitcoin {
  readonly version: string;
  /**
   * mode means that how Ethereum is connected.
   * If the connected Ethereum is browser's extension, the mode should be "extension".
   * If the connected Ethereum is on the mobile app with the embeded web browser, the mode should be "mobile-web".
   */
  readonly mode: BitcoinMode;
  signAndBroadcast(
    chainId: string,
    data: object
  ): Promise<{
    rawTxHex: string;
  }>;
  getKey(chainId: string): Promise<Key>;
  sendTx(chainId: string, signedTx: string): Promise<string>;
  sign(chainId: string, signer: string, data: string | Uint8Array, type: TransactionBtcType): Promise<string>;
}

export default class Bitcoin {
  disconnect() {
    // not implemented
  }

  async getBitcoinKey(chainId?: string): Promise<Key | undefined> {
    try {
      chainId = chainId ?? network.chainId;
      const bitcoin = window.bitcoin;
      if (!chainId) return undefined;
      if (!bitcoin || !window.owallet) {
        throw new Error('Bitcoin wallet not found.');
      }
      //GetKey for new keyring
      if (bitcoin.getKey && bitcoin.sign) return bitcoin.getKey(chainId);
      //TODO: Default for get key by legacy
      return window.owallet.getKey(chainId);
    } catch (error) {
      console.error('Error while getting Bitcoin key:', error);
      return undefined;
    }
  }

  async getAddress(chainId: BitcoinChainId = bitcoinChainId): Promise<string | undefined> {
    try {
      const key = await this.getBitcoinKey(chainId);
      return key?.bech32Address;
    } catch (error) {
      console.error('Error while getting Bitcoin address:', error);
      return undefined;
    }
  }

  async signAndBroadCast(chainId: BitcoinChainId = bitcoinChainId, data): Promise<{ rawTxHex: string }> {
    try {
      const bitcoin = window.bitcoin;
      if (!bitcoin) {
        throw new Error('Bitcoin wallet not found.');
      }
      //Sign for new keyring
      if (bitcoin.sign && bitcoin.sendTx) {
        const amount = new BitcoinUnit(data.msgs.amount, 'satoshi').to('BTC').toString();
        const unsignedTx: UnsignedBtcTransaction = {
          chainId: chainId,
          to: data.msgs.address,
          amount: amount,
          coinMinimalDenom: 'segwit:btc',
          memo: data.memo || '',
          sender: data.address
        };
        const signedTx = await bitcoin.sign(
          chainId,
          data.address,
          JSON.stringify(unsignedTx),
          TransactionBtcType.Bech32
        );
        const txHash = await bitcoin.sendTx(chainId, signedTx);
        return { rawTxHex: txHash };
      }

      //TODO: Default sign by legacy
      return await window.bitcoin.signAndBroadcast(chainId, data);
    } catch (error) {
      console.error('Error while signing and broadcasting Bitcoin transaction:', error);
      throw new Error(`Error while signing and broadcasting Bitcoin transaction:  ${JSON.stringify(error)}`);
    }
  }
}
