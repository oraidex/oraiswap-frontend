import { WalletType as WalletCosmosType } from '@oraichain/oraidex-common/build/constant';
import KeplrIcon from 'assets/icons/keplr-icon.svg?react';
import MetamaskIcon from 'assets/icons/metamask-icon.svg?react';
import OwalletIcon from 'assets/icons/owallet-icon.svg?react';
import PhantomIcon from 'assets/icons/phantom.svg?react';
import TronIcon from 'assets/icons/tron-icon.svg?react';
import {
  cosmosNetworksWithIcon,
  evmNetworksIconWithoutTron,
  tronNetworksWithIcon,
  btcNetworksWithIcon,
  solanaNetworksWithIcon
} from 'helper';

export type NetworkType = 'cosmos' | 'evm' | 'tron' | 'bitcoin' | 'solana';
export type WalletType = WalletCosmosType | 'metamask' | 'tronLink' | 'eip191' | 'bitcoin' | 'phantom';
export type WalletNetwork = {
  icon: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & {
      title?: string;
    }
  >;
  name: string;
  nameRegistry?: WalletType;
  isActive: boolean;
  suffixName?: string;
};

export type ChainWallet = {
  icon: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & {
      title?: string;
    }
  >;
  name: string;
  chainName: string;
};

export type WalletProvider = {
  networkType: NetworkType;
  networks: any[];
  wallets: WalletNetwork[];
};

export const cosmosWallets: WalletNetwork[] = [
  {
    icon: OwalletIcon,
    name: 'Owallet',
    nameRegistry: 'owallet',
    isActive: true
  },
  {
    icon: MetamaskIcon,
    name: 'Metamask (Oraichain)',
    nameRegistry: 'eip191',
    isActive: true
  },
  {
    icon: KeplrIcon,
    name: 'Keplr',
    nameRegistry: 'keplr',
    isActive: true
  }
];

export const tronWallets: WalletNetwork[] = [
  {
    icon: OwalletIcon,
    name: 'Owallet',
    nameRegistry: 'owallet',
    isActive: true
  },
  {
    icon: TronIcon,
    name: 'TronLink',
    nameRegistry: 'tronLink',
    isActive: true
  }
];

export const evmWallets: WalletNetwork[] = [
  {
    icon: OwalletIcon,
    name: 'Owallet',
    nameRegistry: 'owallet',
    isActive: true
  },
  {
    icon: MetamaskIcon,
    name: 'Metamask',
    nameRegistry: 'metamask',
    isActive: true
  }
];
export const btcWallets: WalletNetwork[] = [
  {
    icon: OwalletIcon,
    name: 'Owallet',
    nameRegistry: 'owallet',
    isActive: true
  }
];

export const solanaWallets: WalletNetwork[] = [
  {
    icon: OwalletIcon,
    name: 'Owallet',
    nameRegistry: 'owallet',
    isActive: true
  },
  {
    icon: PhantomIcon,
    name: 'Phantom',
    nameRegistry: 'phantom',
    isActive: true
  }
];

export const allWallets: WalletNetwork[] = [
  ...cosmosWallets,
  ...tronWallets,
  ...evmWallets,
  ...btcWallets,
  ...solanaWallets
];

export const walletProvider: WalletProvider[] = [
  {
    networkType: 'cosmos',
    networks: cosmosNetworksWithIcon,
    wallets: cosmosWallets
  },
  {
    networkType: 'evm',
    networks: evmNetworksIconWithoutTron,
    wallets: evmWallets
  },
  {
    networkType: 'tron',
    networks: tronNetworksWithIcon,
    wallets: tronWallets
  },
  {
    networkType: 'bitcoin',
    networks: btcNetworksWithIcon,
    wallets: btcWallets
  },
  {
    networkType: 'solana',
    networks: solanaNetworksWithIcon,
    wallets: solanaWallets
  }
];
