import { Key } from '@keplr-wallet/types';

import { bitcoinChainId } from 'helper/constants';
import { network } from 'index';
export type BitcoinMode = 'core' | 'extension' | 'mobile-web' | 'walletconnect';
// import { CosmosChainId, BitcoinWallet } from '@oraichain/oraidex-common';
type BitcoinChainId = 'bitcoin' | 'bitcoinTestnet';
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
}

export default class Bitcoin {
  disconnect() {
    // not implemented
  }

  async getBitcoinKey(chainId?: string): Promise<Key | undefined> {
    try {
      chainId = chainId ?? network.chainId;
      if (!chainId) return undefined;

      if (!window.owallet) {
        console.error('OWallet not found.');
        return undefined;
      }

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

  async signAndBroadCast(chainId: BitcoinChainId = bitcoinChainId, data: object): Promise<{ rawTxHex: string }> {
    try {
      if (!window.bitcoin) {
        throw new Error('Bitcoin wallet not found.');
      }

      const rs = await window.bitcoin.signAndBroadcast(chainId, data);
      return rs;
    } catch (error) {
      console.error('Error while signing and broadcasting Bitcoin transaction:', error);
      throw new Error(`Error while signing and broadcasting Bitcoin transaction:  ${JSON.stringify(error)}`);
    }
  }
}
