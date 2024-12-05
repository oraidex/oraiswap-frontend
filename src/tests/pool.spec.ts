import {
  INJECTIVE_CONTRACT,
  ORAI,
  ORAIX_CONTRACT,
  USDC_CONTRACT,
  WETH_CONTRACT,
  buildMultipleExecuteMessages
} from '@oraichain/oraidex-common';
import { getPoolTokens } from 'config/pools';
import { flattenTokens } from 'initCommon';
import { estimateShare, formatDisplayUsdt, getSymbolPools, toFixedIfNecessary } from 'pages/Pools/helpers';
import { ProvideQuery, Type, generateContractMessages } from 'rest/api';
import { describe, expect, it } from 'vitest';
import { constants } from './listing-simulate';

/**
 * We use 2 pairs: ORAI/AIRI & ORAI/USDT for all test below.
 */
describe('pool', () => {
  const { devAddress } = constants;

  describe('add & withdraw liquidity', () => {
    it('should generate contract messages correcty when add & withdraw liquidity pool ', async () => {
      const [amount1, amount2] = [100, 100];
      const [token1InfoData, token2InfoData] = [
        flattenTokens.find((t) => t.name === 'ORAI' && t.chainId === 'Oraichain'),
        flattenTokens.find((t) => t.name === 'USDT' && t.chainId === 'Oraichain')
      ];
      const testPairContractAddr = 'test-contract-addr';
      const msg = generateContractMessages({
        type: Type.PROVIDE,
        sender: devAddress,
        fromInfo: token1InfoData!,
        toInfo: token2InfoData!,
        fromAmount: amount1.toString(),
        toAmount: amount2.toString(),
        pair: testPairContractAddr
      } as ProvideQuery);

      // check if the contract address, sent_funds and sender are correct
      expect(msg.contractAddress).toEqual(testPairContractAddr);
      expect(msg.funds).toEqual([{ amount: '100', denom: ORAI }]);
      expect(msg).toHaveProperty('msg');

      const messages = buildMultipleExecuteMessages([msg]);
      // check if the contract address, sent_funds and sender are correct
      expect(messages[0].contractAddress).toEqual(testPairContractAddr);
      expect(messages[0]).toHaveProperty('funds');

      expect(messages[0].msg).toEqual({
        provide_liquidity: {
          assets: [
            { info: { token: { contract_addr: token2InfoData.contractAddress } }, amount: '100' },
            { info: { native_token: { denom: ORAI } }, amount: '100' }
          ]
        }
      });
    });
  });

  it('test Pairs getPoolTokens', () => {
    const poolTokens = getPoolTokens().filter(Boolean);
    expect(Array.isArray(poolTokens)).toBe(true);
    expect(poolTokens.length).toBe(17);
  });

  it.each([
    ['0.001234', '$0.0012'],
    ['2', '$2'],
    ['2.1', '$2.1'],
    ['2.129', '$2.13'],
    ['1234567', '$1,234,567'],
    ['1234567.111', '$1,234,567.11']
  ])('test formatDisplayUsdt should formats %s to %s', (input, expected) => {
    expect(formatDisplayUsdt(input)).toBe(expected);
  });

  it.each([
    ['2.12345', 2, 2.12],
    ['2.1', 2, 2.1],
    ['2', 2, 2],
    ['2.12345', 1, 2.1],
    ['2.129', 1, 2.1]
  ])('test toFixedIfNecessary should rounds %s to %d decimal places as %f', (value, dp, expected) => {
    expect(toFixedIfNecessary(value, dp)).toBeCloseTo(expected);
  });

  it.each<[number, number, number]>([
    [0, 1, 0],
    [1, 0, 0],
    [100, 500, 0.02]
  ])('test-estimateShare-should-return-correctly-share', (totalBaseAmount, totalQuoteAmount, expectedResult) => {
    // setup
    const payload = {
      baseAmount: 1,
      quoteAmount: 2,
      totalShare: 5,
      totalBaseAmount,
      totalQuoteAmount
    };

    // act
    const result = estimateShare(payload);

    // assertion
    expect(result).toEqual(expectedResult);

    // if totalShare is falsy
    payload.totalShare = NaN;
    expect(estimateShare(payload)).toEqual(0);
  });

  it.each<[string, string, string, string]>([
    [INJECTIVE_CONTRACT, ORAI, 'INJ/ORAI', 'ORAI/INJ'],
    [USDC_CONTRACT, ORAIX_CONTRACT, 'USDC/ORAIX', 'ORAIX/USDC'],
    [ORAI, WETH_CONTRACT, 'ORAI/WETH', 'ORAI/WETH']
  ])('test getSymbolPools', (baseDenom, quoteDenom, originalSymbols, expected) => {
    const symbols = getSymbolPools(baseDenom, quoteDenom, originalSymbols);
    expect(symbols).toEqual(expected);
  });
});
