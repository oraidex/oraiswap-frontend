import { MILKYBSC_ORAICHAIN_DENOM } from '@oraichain/oraidex-common';
import { getSpecialCoingecko, isEmptyObject } from 'helper';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import { formateNumberDecimalsAuto, timeSince, toSumDisplay } from 'libs/utils';
import { calculateFinalPriceChange } from 'pages/UniversalSwap/helpers';
import { getTotalUsd, reduceString } from './../libs/utils';

describe('should utils functions in libs/utils run exactly', () => {
  const amounts: AmountDetails = {
    usdt: '1000000', // 1
    orai: '1000000', // 1
    milky: '1000000', // 1
    [MILKYBSC_ORAICHAIN_DENOM]: '1000000000000000000' // 1
  };

  const prices: CoinGeckoPrices<string> = {
    'milky-token': 1,
    'oraichain-token': 4,
    tether: 1
  };

  it('should get total usd correctly', () => {
    const usd = getTotalUsd(amounts, prices);
    expect(usd).toEqual(7);
  });

  it('should get sumn display correctly', () => {
    const subDisplay = toSumDisplay(amounts);
    expect(subDisplay).toEqual(4);
  });

  it.each([
    [4.1, '4.1'],
    [4.033333333, '4.03'],
    [0.033333333, '0.0333'],
    [0.0000066, '0.000007'],
    [0.0000064, '0.000006']
  ])('should formate number decimals auto run correctly', (price: number, expectedFormat: string) => {
    const priceFormated = formateNumberDecimalsAuto({
      price: price,
      maxDecimal: 6,
      minDecimal: 2,
      unit: '',
      minPrice: 1
    });
    expect(priceFormated).toEqual(expectedFormat);
  });

  describe('reduceString function', () => {
    it.each([
      ['Hello world!', 5, 5, 'Hello...orld!'],
      ['orai1g4h64yjt0fvzv5v2j8tyfnpe5kmnetejvfgs7g', 10, 7, 'orai1g4h64...jvfgs7g'],
      ['A B C D E F G H I J K L M N O P Q R S T U V W X Y Z', 2, 3, 'A ...Y Z']
    ])('should return a shortened string with "..." in between', (str, from, end, expected) => {
      expect(reduceString(str, from, end)).toEqual(expected);
    });

    it('should return "-" if the input string is null', () => {
      expect(reduceString(null, 5, 6)).toEqual('-');
    });
  });

  describe('timeSince', () => {
    it.each<[number, string]>([
      [Date.now() - 366 * 24 * 60 * 60 * 1000, '1 years'],
      [Date.now() - 31 * 24 * 60 * 60 * 1000, '1 months'],
      [Date.now() - 2 * 24 * 60 * 60 * 1000, '2 days'],
      [Date.now() - 2 * 60 * 60 * 1000, '2 hours'],
      [Date.now() - 2 * 60 * 1000, '2 minutes'],
      [Date.now() - 2 * 1000, '2 seconds']
    ])('returns correct time interval for %d milliseconds', (input, expected) => {
      const result = timeSince(input);
      expect(result).toEqual(expected);
    });

    it('returns "0 seconds" for current timestamp', () => {
      const result = timeSince(Date.now());
      expect(result).toEqual('0 seconds');
    });
  });

  describe('isEmptyObject', () => {
    it.each<[string, object, boolean]>([
      ['object-is-null', {}, true],
      ['key-object-is-undefined', { test: undefined }, true],
      ['key-object-have-value', { test: 'abc1234' }, false],
      ['multi-key-object', { test: 'abc1234', test1: undefined }, false]
    ])('test-isEmptyObject', (_caseName, input, expected) => {
      const result = isEmptyObject(input);
      expect(result).toEqual(expected);
    });
  });

  it.each([
    [false, 5, 10, 10],
    [true, 0, 10, 0],
    [true, 5, 10, -0.9090909090909092]
  ])(
    'test-calculateFinalPriceChange',
    (isPairReverseSymbol: boolean, currentPrice: number, percentPriceChange: number, expectedResult: number) => {
      // act
      const result = calculateFinalPriceChange(isPairReverseSymbol, currentPrice, percentPriceChange);

      // expect
      expect(result).toEqual(expectedResult);
    }
  );

  it.each([
    ['cosmos', 'oraidex', false, false],
    ['kawaii-islands', 'oraidex', true, false],
    ['injective-protocol', 'milky-token', true, true],
    ['cosmos', 'milky-token', false, true]
  ])('test-getSpecialCoingecko', (fromCoingecko, toCoingecko, expectedFrom, expectedTo) => {
    const { isSpecialFromCoingecko, isSpecialToCoingecko } = getSpecialCoingecko(fromCoingecko, toCoingecko);
    expect(isSpecialFromCoingecko).toEqual(expectedFrom);
    expect(isSpecialToCoingecko).toEqual(expectedTo);
  });
});
