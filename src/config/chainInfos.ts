import {
  tokens,
  oraichainNetwork as customOraichainNetwork,
  chainInfos as customChainInfos,
  ChainIdEnum,
  BridgeAppCurrency,
  CustomChainInfo,
  defaultBech32Config
} from '@oraichain/oraidex-common';
import BitcoinIcon from 'assets/icons/bitcoin.svg?react';
import OraiIcon from 'assets/icons/oraichain.svg?react';
import BTCIcon from 'assets/icons/btc-icon.svg?react';
import OraiLightIcon from 'assets/icons/oraichain_light.svg?react';
import UsdtIcon from 'assets/icons/tether.svg';
import TonIcon from 'assets/icons/ton.svg';
import flatten from 'lodash/flatten';
import { TON_SCAN, TonChainId } from 'context/ton-provider';

import { chainIconsInfos, tokensIconInfos, mapListWithIcon } from './iconInfos';
import { CWBitcoinFactoryDenom } from 'helper/constants';

export const tokensIcon = tokensIconInfos;
export const chainIcons = chainIconsInfos;

export const TON_ZERO_ADDRESS = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
export const USDT_TON_CONTRACT = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

const [otherChainTokens, oraichainTokens] = tokens;
const OraiBTCToken: BridgeAppCurrency = {
  coinDenom: 'ORAIBTC',
  coinMinimalDenom: 'uoraibtc',
  coinDecimals: 6,
  gasPriceStep: {
    low: 0,
    average: 0,
    high: 0
  }
};

export const tonNetworkMainnet: CustomChainInfo = {
  rest: 'https://toncenter.com/api/v2/jsonRPC',
  rpc: 'https://toncenter.com/api/v2/jsonRPC',
  chainId: TonChainId,
  chainName: 'Ton' as any,
  bip44: {
    coinType: 607 as any
  },
  coinType: 607,
  Icon: TonIcon,
  IconLight: TonIcon,
  stakeCurrency: {
    coinDenom: 'TON',
    coinMinimalDenom: 'ton',
    coinDecimals: 9,
    coinGeckoId: 'the-open-network',
    coinImageUrl: 'https://assets.coingecko.com/coins/images/17980/standard/ton_symbol.png'
  },
  bech32Config: defaultBech32Config('bc'),
  networkType: 'ton' as any,
  currencies: [
    {
      coinDenom: 'TON',
      coinMinimalDenom: 'ton',
      coinDecimals: 9,
      bridgeTo: ['Oraichain'],
      prefixToken: 'ton20_',
      contractAddress: TON_ZERO_ADDRESS,
      Icon: TonIcon,
      coinGeckoId: 'the-open-network',
      coinImageUrl: 'https://assets.coingecko.com/coins/images/17980/standard/ton_symbol.png',
      gasPriceStep: {
        low: 0,
        average: 0,
        high: 0
      }
    },
    {
      coinDenom: 'USDT',
      coinMinimalDenom: 'ton20_usdt',
      coinDecimals: 6,
      Icon: UsdtIcon,
      bridgeTo: ['Oraichain'],
      contractAddress: USDT_TON_CONTRACT,
      prefixToken: 'ton20_',
      coinGeckoId: 'tether'
    }
  ],
  get feeCurrencies() {
    return this.currencies;
  },
  // features: ['isBtc'],

  txExplorer: {
    name: 'BlockStream',
    txUrl: `${TON_SCAN}/transaction/{txHash}`,
    accountUrl: `${TON_SCAN}/{address}`
  }
};

const oraibtcNetwork = {
  rpc: 'https://btc.rpc.orai.io',
  rest: 'https://btc.lcd.orai.io/',
  chainId: 'oraibtc-mainnet-1' as any,
  chainName: 'OraiBTC' as any,
  networkType: 'cosmos',
  bip44: {
    coinType: 118
  },
  Icon: BitcoinIcon,
  IconLight: BitcoinIcon,
  bech32Config: defaultBech32Config('oraibtc'),
  feeCurrencies: [OraiBTCToken],
  currencies: [
    {
      coinDenom: 'BTC',
      coinMinimalDenom: 'uoraibtc',
      coinDecimals: 6,
      coinGeckoId: 'bitcoin',
      bridgeTo: ['Oraichain'],
      Icon: BitcoinIcon,
      IconLight: BitcoinIcon
    }
  ]
};

export const bitcoinMainnet: CustomChainInfo = {
  rest: 'https://blockstream.info/api',
  rpc: 'https://blockstream.info/api',
  chainId: ChainIdEnum.Bitcoin as any,
  chainName: 'Bitcoin' as any,
  bip44: {
    coinType: 0 as any
  },
  coinType: 0,
  Icon: BTCIcon,
  IconLight: BTCIcon,
  stakeCurrency: {
    coinDenom: 'BTC (Legacy)',
    coinMinimalDenom: 'btc',
    coinDecimals: 8,
    coinGeckoId: 'bitcoin',
    coinImageUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
  },
  bech32Config: defaultBech32Config('bc'),
  networkType: 'bitcoin' as any,
  currencies: [
    {
      coinDenom: 'BTC (Legacy)',
      coinMinimalDenom: 'btc',
      prefixToken: 'oraibtc',
      coinDecimals: 8 as any,
      bridgeTo: ['Oraichain'],
      Icon: BTCIcon,
      coinGeckoId: 'bitcoin',
      coinImageUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
      gasPriceStep: {
        low: 0,
        average: 0,
        high: 0
      }
    },
    {
      coinDenom: 'BTC',
      coinMinimalDenom: 'btc-v2',
      prefixToken: 'oraibtc',
      coinDecimals: 8 as any,
      bridgeTo: ['Oraichain'],
      Icon: BTCIcon,
      coinGeckoId: 'bitcoin',
      coinImageUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
      gasPriceStep: {
        low: 0,
        average: 0,
        high: 0
      }
    }
  ],
  get feeCurrencies() {
    return this.currencies;
  },

  features: ['isBtc'],
  txExplorer: {
    name: 'BlockStream',
    txUrl: 'https://blockstream.info/tx/{txHash}',
    accountUrl: 'https://blockstream.info/address/{address}'
  }
};

export const chainInfosWithIcon = mapListWithIcon([...customChainInfos, bitcoinMainnet], chainIcons, 'chainId');
export const oraichainTokensWithIcon = mapListWithIcon(oraichainTokens, tokensIcon, 'coinGeckoId');
export const otherTokensWithIcon = mapListWithIcon(otherChainTokens, tokensIcon, 'coinGeckoId');

export const tokensWithIcon = [otherTokensWithIcon, oraichainTokensWithIcon];
export const flattenTokensWithIcon = flatten(tokensWithIcon);

export const OraiToken: BridgeAppCurrency = {
  coinDenom: 'ORAI',
  coinMinimalDenom: 'orai',
  coinDecimals: 6,
  coinGeckoId: 'oraichain-token',
  Icon: OraiIcon,
  IconLight: OraiLightIcon,
  bridgeTo: ['0x38', '0x01', 'injective-1'],
  gasPriceStep: {
    low: 0.003,
    average: 0.005,
    high: 0.007
  }
};

export const oraichainNetwork: CustomChainInfo = {
  ...customOraichainNetwork,
  currencies: [
    ...customOraichainNetwork.currencies
    // {
    //   coinDenom: 'BTC V2',
    //   coinGeckoId: 'bitcoin',
    //   coinMinimalDenom: CWBitcoinFactoryDenom,
    //   bridgeTo: ['bitcoin'] as any,
    //   coinDecimals: 14 as any,
    //   coinImageUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png'
    // }
  ]
};

export const OraiBTCBridgeNetwork = {
  chainId: 'oraibtc-mainnet-1',
  chainName: 'OraiBtc Bridge',
  rpc: 'https://btc.rpc.orai.io',
  rest: 'https://btc.lcd.orai.io',
  networkType: 'cosmos',
  Icon: BTCIcon,
  IconLight: BTCIcon,
  stakeCurrency: {
    coinDenom: 'ORAIBTC',
    coinMinimalDenom: 'uoraibtc',
    coinDecimals: 6,
    gasPriceStep: {
      low: 0,
      average: 0,
      high: 0
    },
    coinImageUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
  },
  bip44: {
    coinType: 118
  },
  coinType: 118,
  bech32Config: defaultBech32Config('oraibtc'),
  currencies: [
    {
      coinDenom: 'ORAIBTC',
      coinMinimalDenom: 'uoraibtc',
      coinDecimals: 6,
      gasPriceStep: {
        low: 0,
        average: 0,
        high: 0
      },
      coinImageUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
    },
    {
      coinDenom: 'oBTC',
      coinMinimalDenom: 'usat',
      coinDecimals: 14,
      gasPriceStep: {
        low: 0,
        average: 0,
        high: 0
      },
      coinImageUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
    }
  ],

  get feeCurrencies() {
    return this.currencies;
  }
};

export const chainInfosWithSdk = [...customChainInfos, bitcoinMainnet, oraibtcNetwork];
export const chainInfos = mapListWithIcon(chainInfosWithSdk, chainIcons, 'chainId');

// exclude kawaiverse subnet and other special evm that has different cointype
export const evmChains = chainInfos.filter(
  (c) => c.networkType === 'evm' && c.bip44.coinType === 60 && c.chainId !== '0x1ae6'
);

export const btcChains = chainInfos.filter((c) => c.networkType === ('bitcoin' as any));
