import { TON_ALL_OSMOSIS_CONTRACT, TON_OSMOSIS_CONTRACT } from '@oraichain/oraidex-common';

import TonIcon from 'assets/icons/ton.svg?react';
import { TonChainId } from 'context/ton-provider';

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
