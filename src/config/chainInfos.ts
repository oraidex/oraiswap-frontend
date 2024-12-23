import {
  tokens,
  oraichainNetwork as customOraichainNetwork,
  chainInfos as customChainInfos,
  ChainIdEnum,
  BridgeAppCurrency,
  CustomChainInfo,
  defaultBech32Config,
  getTokensFromNetwork,
  TON_ORAICHAIN_DENOM,
  HMSTR_ORAICHAIN_DENOM,
  TON_ALL_OSMOSIS_CONTRACT,
  TON_OSMOSIS_CONTRACT,
  solChainId,
  solanaMainnet,
  tonNetworkMainnet,
  TON_CONTRACT,
  TON20_USDT_CONTRACT,
  jUSDC_TON_CONTRACT as jUSDC_TON_CONTRACT_COMMON,
  HMSTR_TON_CONTRACT as HMSTR_TON_CONTRACT_COMMON
} from '@oraichain/oraidex-common';
import HamsterIcon from 'assets/icons/hmstr.svg?react';
import BitcoinIcon from 'assets/icons/bitcoin.svg?react';
import OraiIcon from 'assets/icons/oraichain.svg?react';
import BTCIcon from 'assets/icons/btc-icon.svg?react';
import OraiLightIcon from 'assets/icons/oraichain_light.svg?react';
import UsdtIcon from 'assets/icons/tether.svg?react';
import UsdcIcon from 'assets/icons/usd_coin.svg?react';
import TonIcon from 'assets/icons/ton.svg?react';
import flatten from 'lodash/flatten';
import { TON_SCAN, TonChainId, TonNetwork } from 'context/ton-provider';

import { chainIconsInfos, tokensIconInfos, mapListWithIcon } from './iconInfos';
import { CWBitcoinFactoryDenom } from 'helper/constants';

export const tokensIcon = tokensIconInfos;
export const chainIcons = chainIconsInfos;

export const TON_ZERO_ADDRESS = TON_CONTRACT;
export const USDT_TON_CONTRACT = TON20_USDT_CONTRACT;
export const jUSDC_TON_CONTRACT = jUSDC_TON_CONTRACT_COMMON;
export const HMSTR_TON_CONTRACT = HMSTR_TON_CONTRACT_COMMON;

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

export type AlloyedPool = {
  poolId: string;
  alloyedToken: string;
  sourceToken: string;
};

export const OsmosisAlloyedPools: AlloyedPool[] = [
  {
    poolId: '2161',
    alloyedToken: TON_ALL_OSMOSIS_CONTRACT,
    sourceToken: TON_OSMOSIS_CONTRACT
  }
];

export const OsmosisTokenDenom = {
  allTon: TON_ALL_OSMOSIS_CONTRACT,
  ton: TON_OSMOSIS_CONTRACT
};

export const OsmosisTokenList = [
  {
    chainId: 'osmosis-1',
    bridgeTo: [TonChainId],
    coinDenom: 'TON.orai',
    name: 'TON',
    symbol: 'TON.orai',
    Icon: TonIcon,
    contractAddress: null,
    denom: OsmosisTokenDenom.ton,
    coinMinimalDenom: OsmosisTokenDenom.ton,
    coinGeckoId: 'the-open-network',
    decimal: 9,
    coinDecimals: 9
  },
  {
    chainId: 'osmosis-1',
    bridgeTo: [TonChainId],
    coinDenom: 'TON',
    name: 'TON',
    symbol: 'TON',
    Icon: TonIcon,
    contractAddress: null,
    denom: OsmosisTokenDenom.allTon,
    coinMinimalDenom: OsmosisTokenDenom.allTon,
    coinGeckoId: 'the-open-network',
    decimal: 9,
    coinDecimals: 9,
    alloyedToken: true
  }
];

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

export const oraichainTokensWithIcon = mapListWithIcon(oraichainTokens, tokensIcon, 'coinGeckoId');
export const otherTokensWithIcon = mapListWithIcon(otherChainTokens, tokensIcon, 'coinGeckoId');
export const tonNetworkTokens = getTokensFromNetwork(tonNetworkMainnet);

export const tokensWithIcon = [otherTokensWithIcon, oraichainTokensWithIcon];
export const flattenTokensWithIcon = flatten(tokensWithIcon);

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

const customChainInfo = customChainInfos.filter((custom) => custom.chainId !== solChainId);

export const oraichainNetwork: CustomChainInfo = {
  ...customOraichainNetwork,
  currencies: [...customOraichainNetwork.currencies]
};

export const solanaNetwork: CustomChainInfo = {
  ...solanaMainnet,
  currencies: [...solanaMainnet.currencies]
};
export const chainInfosWithSdk = [...customChainInfo, solanaNetwork, bitcoinMainnet, oraibtcNetwork];
export const chainInfos = mapListWithIcon(chainInfosWithSdk, chainIcons, 'chainId');

// exclude kawaiverse subnet and other special evm that has different cointype
export const evmChains = chainInfos.filter(
  (c) => c.networkType === 'evm' && c.bip44.coinType === 60 && c.chainId !== '0x1ae6'
);

export const chainInfosWithIcon = mapListWithIcon(chainInfosWithSdk, chainIcons, 'chainId');

export const btcChains = chainInfos.filter((c) => c.networkType === 'bitcoin');
