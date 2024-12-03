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

export const solChainId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

export const solanaMainnet: CustomChainInfo = {
  rpc: 'https://swr.xnftdata.com/rpc-proxy/',
  rest: 'https://swr.xnftdata.com/rpc-proxy/',
  chainId: solChainId as any,
  chainName: 'Solana' as any,
  bip44: {
    coinType: 501 as any
  },
  bech32Config: defaultBech32Config('sol'),
  stakeCurrency: {
    coinDenom: 'SOL',
    coinMinimalDenom: 'sol',
    coinDecimals: 9,
    coinGeckoId: 'solana',
    coinImageUrl: 'https://assets.coingecko.com/coins/images/4128/standard/solana.png?1718769756'
  },
  chainSymbolImageUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png',
  networkType: 'svm' as any,
  currencies: [
    // {
    //   coinDenom: 'SOL',
    //   coinMinimalDenom: 'sol',
    //   coinDecimals: 9,
    //   bridgeTo: ['Oraichain'],
    //   coinGeckoId: 'solana' as any,
    //   coinImageUrl: 'https://assets.coingecko.com/coins/images/4128/standard/solana.png?1718769756'
    // },
    {
      coinDenom: 'MAX',
      coinMinimalDenom: 'max',
      coinDecimals: 6,
      bridgeTo: ['Oraichain'],
      contractAddress: 'oraim8c9d1nkfuQk9EzGYEUGxqL3MHQYndRw1huVo5h',
      coinGeckoId: 'max.clan' as any,
      coinImageUrl:
        'https://pump.mypinata.cloud/ipfs/QmcGwYebsQfYbNSM9QDAMS2wKZ8fZNEiMbezJah1zgEWWS?img-width=256&img-dpr=2'
    }
  ],
  get feeCurrencies() {
    return [
      {
        coinDenom: 'SOL',
        coinMinimalDenom: 'sol',
        coinDecimals: 9,
        coinGeckoId: 'solana',
        coinImageUrl: 'https://assets.coingecko.com/coins/images/4128/standard/solana.png?1718769756',
        gasPriceStep: {
          low: 1,
          average: 1.25,
          high: 1.5
        }
      },
      {
        coinDenom: 'MAX',
        coinMinimalDenom: 'max',
        coinDecimals: 6,
        coinGeckoId: 'max.clan',
        coinImageUrl:
          'https://pump.mypinata.cloud/ipfs/QmcGwYebsQfYbNSM9QDAMS2wKZ8fZNEiMbezJah1zgEWWS?img-width=256&img-dpr=2',
        gasPriceStep: {
          low: 1,
          average: 1.25,
          high: 1.5
        }
      }
    ];
  },

  features: [],
  txExplorer: {
    name: 'Sol Scan',
    txUrl: 'https://solscan.io/tx/{txHash}',
    accountUrl: 'https://solscan.io/address/{address}'
  }
};

export const chainInfosWithIcon = mapListWithIcon(
  [...customChainInfos, bitcoinMainnet, oraibtcNetwork, solanaMainnet],
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
  currencies: [
    ...customOraichainNetwork.currencies,
    // {
    //   coinDenom: 'SOL',
    //   coinGeckoId: 'solana' as any,
    //   coinMinimalDenom: 'factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/sol',
    //   bridgeTo: [solChainId] as any,
    //   coinDecimals: 9,
    //   coinImageUrl:
    //     'https://pump.mypinata.cloud/ipfs/QmcGwYebsQfYbNSM9QDAMS2wKZ8fZNEiMbezJah1zgEWWS?img-width=256&img-dpr=2'
    // },
    {
      coinDenom: 'MAX',
      coinGeckoId: 'max.clan' as any,
      coinMinimalDenom:
        'factory/orai17hyr3eg92fv34fdnkend48scu32hn26gqxw3hnwkfy904lk9r09qqzty42/oraim8c9d1nkfuQk9EzGYEUGxqL3MHQYndRw1huVo5h',
      bridgeTo: [solChainId] as any,
      coinDecimals: 6,
      coinImageUrl:
        'https://pump.mypinata.cloud/ipfs/QmcGwYebsQfYbNSM9QDAMS2wKZ8fZNEiMbezJah1zgEWWS?img-width=256&img-dpr=2'
    }
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

export const chainInfosWithSdk = [...customChainInfos, bitcoinMainnet, oraibtcNetwork, solanaMainnet];
export const chainInfos = mapListWithIcon(chainInfosWithSdk, chainIcons, 'chainId');

// exclude kawaiverse subnet and other special evm that has different cointype
export const evmChains = chainInfos.filter(
  (c) => c.networkType === 'evm' && c.bip44.coinType === 60 && c.chainId !== '0x1ae6'
);

export const btcChains = chainInfos.filter((c) => c.networkType === ('bitcoin' as any));
