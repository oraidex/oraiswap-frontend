import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Keplr as keplr } from '@keplr-wallet/types';
import { Class } from '@oraichain/common-contracts-sdk/build/CwIcs721Bridge.types';
import { TokenInspector } from '@oraichain/orai-token-inspector';
import { TronWeb as _TronWeb } from '@oraichain/oraidex-common/build/tronweb';
import { OraiswapPairTypes } from '@oraichain/oraidex-contracts-sdk';
import { TonConnectUI } from '@tonconnect/ui-react';
import { Network } from 'bip32';
import Bitcoin, { IBitcoin } from 'libs/bitcoin';
import { DuckDb } from 'libs/duckdb';
import { Networks as _Networks } from 'libs/ethereum-multicall/enums';
import { AbstractProvider } from 'web3-core';
import Keplr from '../libs/keplr';
import Metamask from '../libs/metamask';

declare global {
  type AmountDetails = { [denom: string]: string };
  type IBCInfoMsg = {
    sourcePort: string;
    sourceChannel: string;
    amount: string;
    denom: string;
    sender: string;
    receiver: string;
    timeoutTimestamp: number;
  };
  type PairDetails = {
    [key: string]: OraiswapPairTypes.PoolResponse;
  };
  type PairAmountInfo = {
    token1Amount: string;
    token2Amount: string;
  };
  type LpPoolDetails = {
    [key: string]: {
      balance: string;
    };
  };
  type BondLpPoolDetails = {
    [key: string]: string;
  };
  type MetaMaskEthereumProvider = AbstractProvider & {
    chainId: string;
    isMetaMask?: boolean;
    once(eventName: string | symbol, listener: (...args: any[]) => void): this;
    on(eventName: string | symbol, listener: (...args: any[]) => void): this;
    off(eventName: string | symbol, listener: (...args: any[]) => void): this;
    addListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string | symbol): this;
  };

  type ExecuteOptions = {
    gas?: number;
    fees?: number;
    funds?: Funds;
    memo?: string;
  };

  type ExecuteKeplrOptions = {
    accountNumber: Long | null;
    sequence: number;
    gas: number;
    fees: number;
    mode?: BroadCastMode;
  };

  type SignedData = {
    signature: string;
    publicKey: string;
  };

  type ContractAddress = {
    marketplace: string | undefined;
    ow721: string | undefined;
    lock?: string | undefined;
    auction: string | undefined;
  };

  type StatusCode = {
    SUCCESS: number;
    NOT_FOUND: number;
    GENERIC_ERROR: number;
  };

  interface FileData {
    name: string;
    data: Buffer;
  }

  interface PoolInfo {
    offerPoolAmount: bigint;
    askPoolAmount: bigint;
  }

  interface ChildKeyData {
    privateKey: Buffer;
    chainCode: Buffer;
    network: Network;
  }

  interface TronLink {
    ready: Bool; //Initialize to false, true after user authorization
    request: ({ method }: { method: 'tron_requestAccounts' }) => Promise<{ code: number; message: string }>; // The method of tuning plugins for dapp website
    sunWeb: sunWeb;
    tronWeb: _TronWeb;
    isOwallet?: boolean;
  }

  declare class Wallet {
    getChildKey(path?: string): Promise<ChildKeyData>;
    send(message: any);
    deploy(file: FileData);
  }
  interface Window {
    MSStream: String;
    Keystation: any;
    Wallet: Wallet;
    Keplr: Keplr;
    Bitcoin: Bitcoin;
    Ton: TonConnectUI;
    tronWeb: _TronWeb;
    tronLink: TronLink;
    ethereum: MetaMaskEthereumProvider;
    ethereumX: MetaMaskEthereumProvider;
    Metamask: Metamask;
    ReactNativeWebView?: {
      postMessage(msg: string): void;
    };
    client: SigningCosmWasmClient;
    keplr: keplr;
    owallet: keplr;
    owalletSolana: any;
    bitcoin: IBitcoin;
    browser: Browser;
    queryIfDatasetMinted({ tokenId: string }): Promise<boolean>;
    duckDb: DuckDb;
    TradingView: { version: Function; widget: Class };
    ethereumDapp: MetaMaskEthereumProvider;
    tronWebDapp: _TronWeb;
    tronLinkDapp: TronLink;
    eth_owallet: MetaMaskEthereumProvider;
    tronWeb_owallet: _TronWeb;
    tronLink_owallet: TronLink;
    tokenInspector: TokenInspector;
  }

  declare const APP_SETTINGS: Record<string, any>;
  type keplrType = keplr;

  // extend Intl namespace
  namespace Intl {
    interface DateTimeFormat {
      formatToJson(date: Date | number): Record<Intl.DateTimeFormatPartTypes, string>;
    }
  }
  namespace NodeJS {
    interface ProcessEnv {
      VITE_APP_SITE_TITLE: string;
      VITE_APP_SITE_DESC: string;
    }
  }

  // re-declare as global
  declare const Networks = _Networks;
  declare const TronWeb = _TronWeb;
  type ReactChildren = React.ReactElement | React.ReactElement[] | React.ReactNode | React.ReactNode[];
}

export {};
