import {
  CoinGeckoId,
  NetworkChainId,
  GAS_ESTIMATION_SWAP_DEFAULT,
  GAS_ESTIMATION_BRIDGE_DEFAULT,
  AIRI_BSC_CONTRACT,
  flattenTokens
} from '@oraichain/oraidex-common';
import { calcMaxAmount } from 'pages/Balance/helpers';
import {
  SwapDirection,
  SwapType,
  checkEvmAddress,
  filterNonPoolEvmTokens,
  getSwapType
} from 'pages/UniversalSwap/helpers';

describe('universal-swap', () => {
  it.skip.each<[string, CoinGeckoId, string, string, SwapDirection, number]>([
    ['0x38', 'wbnb', 'bep20_bnb', '', SwapDirection.From, 5],
    ['Oraichain', 'tether', 'usdt', '', SwapDirection.From, 26],
    ['Oraichain', 'oraichain-token', 'orai', '', SwapDirection.To, 25],
    ['0x38', 'oraichain-token', 'bep20_orai', '', SwapDirection.To, 27],
    ['0x38', 'wbnb', 'bep20_bnb', '', SwapDirection.To, 8],
    ['0x38', 'oraichain-token', 'oraichain-token', 'AIRI', SwapDirection.From, 2]
  ])('test-filterNonPoolEvmTokens', (chainId, coinGeckoId, denom, searchTokenName, direction, expectedLength) => {
    const tokens = filterNonPoolEvmTokens(chainId, coinGeckoId, denom, searchTokenName, direction);
    expect(tokens.length).toEqual(expectedLength);
  });

  describe('checkEvmAddress', () => {
    const testCases = [
      ['0x01', '', undefined],
      ['0x38', '', undefined],
      ['0x2b6653dc', undefined, '']
    ];
    it.each(testCases)(
      'throws an error when not logged in to wallet (%s)',
      (chainId: NetworkChainId, metamaskAddress?: string, tronAddress?: string | boolean) => {
        expect(() => {
          checkEvmAddress(chainId, metamaskAddress, tronAddress);
        }).toThrow();
      }
    );
    it('does not throw an error when logged in to Metamask on Ethereum', () => {
      expect(() => {
        checkEvmAddress('0x01', '0x1234abcd');
      }).not.toThrow();
    });
    it('does not throw an error when logged in to Metamask on BSC', () => {
      expect(() => {
        checkEvmAddress('0x38', '0x5678efgh');
      }).not.toThrow();
    });
    it('does not throw an error when logged in to Tron wallet', () => {
      expect(() => {
        checkEvmAddress('0x2b6653dc', '', 'TRON_ADDRESS');
      }).not.toThrow();
    });
  });

  it.each([
    ['Oraichain', 'Oraichain', 'oraichain-token', 'osmosis', 'Swap'] as const,
    ['Oraichain', '0x38', 'tether', 'tether', 'Bridge'] as const,
    ['Oraichain', '0x38', 'oraichain-token', 'tether', 'Universal Swap'] as const
  ])(
    'get-swap-type-with-fromChainId=%s, toChainId=%s, fromCoingeckoId=%s, toCoingeckoId=%s-should-return-type-%s',
    (fromChainId, toChainId, fromCoingeckoId, toCoingeckoId, expectedResult) => {
      const result: SwapType = getSwapType({ fromChainId, toChainId, fromCoingeckoId, toCoingeckoId });
      expect(result).toEqual(expectedResult);
    }
  );

  it.each([
    [
      'estimate universal swap native orai ( oraichain ) when select 100%',
      100,
      1,
      flattenTokens.find((cosmos) => cosmos.chainId === 'Oraichain' && cosmos.denom === 'orai'),
      GAS_ESTIMATION_SWAP_DEFAULT,
      99.993504
    ],
    [
      'estimate universal bridge native inj ( injective ) when select 25%',
      100,
      0.25,
      flattenTokens.find((cosmos) => cosmos.chainId === 'injective-1' && cosmos.denom === 'inj'),
      GAS_ESTIMATION_BRIDGE_DEFAULT,
      25
    ],
    [
      'estimate universal bridge native inj ( injective ) when select 100%',
      100,
      1,
      flattenTokens.find((cosmos) => cosmos.chainId === 'injective-1' && cosmos.denom === 'inj'),
      GAS_ESTIMATION_BRIDGE_DEFAULT,
      99.984
    ],
    [
      'estimate universal swap airi ( bnb chain ) when select 100%',
      100,
      1,
      flattenTokens.find((cosmos) => cosmos.chainId === '0x38' && cosmos.contractAddress === AIRI_BSC_CONTRACT),
      GAS_ESTIMATION_SWAP_DEFAULT,
      100
    ]
  ])('calc-max-amount-fee', (_, fromBalance, coeff, originalFromToken, gasEstimate, expectedResult) => {
    const result = calcMaxAmount({
      maxAmount: fromBalance * coeff,
      token: originalFromToken,
      coeff,
      gas: gasEstimate
    });
    console.log({ result });

    expect(result).toEqual(expectedResult);
  });
});
