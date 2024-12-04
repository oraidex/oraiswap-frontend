import {
  tokens,
  oraichainNetwork as customOraichainNetwork,
  chainInfos as customChainInfos,
  ChainIdEnum,
  BridgeAppCurrency,
  CustomChainInfo,
  defaultBech32Config,
  solChainId
} from '@oraichain/oraidex-common';
import BitcoinIcon from 'assets/icons/bitcoin.svg?react';
import OraiIcon from 'assets/icons/oraichain.svg?react';
import BTCIcon from 'assets/icons/btc-icon.svg?react';
import OraiLightIcon from 'assets/icons/oraichain_light.svg?react';
import flatten from 'lodash/flatten';

import { chainIconsInfos, tokensIconInfos, mapListWithIcon } from './iconInfos';
import { CWBitcoinFactoryDenom } from 'helper/constants';

export const tokensIcon = tokensIconInfos;
export const chainIcons = chainIconsInfos;

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

export const chainInfosWithIcon = mapListWithIcon(
  [...customChainInfos, bitcoinMainnet, oraibtcNetwork],
  chainIcons,
  'chainId'
);
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
  currencies: [...customOraichainNetwork.currencies]
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

export const btcChains = chainInfos.filter((c) => c.networkType === 'bitcoin');
