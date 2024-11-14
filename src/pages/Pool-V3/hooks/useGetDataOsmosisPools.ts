import { OsmosisPoolInfoResponse } from 'types/pool';

export const getOsmosisPools = async (): Promise<OsmosisPoolInfoResponse[]> => {
  try {
    // const res = await axios.get('/v1/pools/', {});
    return MOCKED_DATA;
  } catch (e) {
    console.error('getOsmosisPools', e);
    return [];
  }
};

export const MOCKED_DATA = [
  {
    isOsmosisPool: true,
    id: '1464',

    type: 'concentrated',
    raw: {
      address: 'osmo13vhcd3xllpvz8tql4dzp8yszxeas8zxpzptyvjttdy7m64kuyz5sv6caqq',
      incentives_address: 'osmo1wsfhgwgvpylkcde80vzyry3dt2vhkah83ctqc23r8780vujsxvdq952del',
      spread_rewards_address: 'osmo1zdze9lvalg9x6zj9u4vzrsyjljnmgp46kwcelzz4eqddsqk8uecsrxwmcv',
      id: '1464',
      current_tick_liquidity: '269827459200220.410584898005959774',
      token0: 'uosmo',
      token1: 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4',
      current_sqrt_price: '0.688662836802325242643011673807428028',
      current_tick: '-5257435',
      tick_spacing: '100',
      exponent_at_price_one: '-6',
      spread_factor: '0.000100000000000000',
      last_liquidity_update: '2024-11-13T02:41:20.614493179Z'
    },
    spreadFactor:
      '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.000100000000000000"}',
    reserveCoins: [
      '{"currency":{"coinDenom":"OSMO","coinName":"Osmosis","coinMinimalDenom":"uosmo","coinDecimals":6,"coinGeckoId":"osmosis","coinImageUrl":"/tokens/generated/osmo.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"uosmo","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"273172702852"}',
      '{"currency":{"coinDenom":"USDC","coinName":"USDC","coinMinimalDenom":"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4","coinDecimals":6,"coinGeckoId":"usd-coin","coinImageUrl":"/tokens/generated/usdc.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"66737758795"}'
    ],
    totalFiatValueLocked:
      '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"196292.000000000000000000"}',
    incentives: {
      aprBreakdown: {
        total: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.162899673301755000"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.049209972823568290"}'
        },
        swapFee: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.092572507023281720"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.000605506482605172"}'
        },
        superfluid: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.048461445088182010"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.048461445088182000"}'
        },
        osmosis: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.021865721190291296"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.000143021252781119"}'
        },
        boost: {
          upper: null,
          lower: null
        }
      },
      incentiveTypes: ['superfluid', 'osmosis']
    },
    market: {
      volume24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"4395149.626883883000000000"}',
      volume7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"18675090.005889070000000000"}',
      feesSpent24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"439.514962688388300000"}',
      feesSpent7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"1867.509000588907000000"}'
    },
    coinDenoms: ['OSMO', 'uosmo', 'USDC', 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4'],
    poolNameByDenom: 'OSMO/USDC',
    coinNames: [['Osmosis'], ['USDC']]
  },
  {
    isOsmosisPool: true,
    id: '1251',
    type: 'concentrated',
    raw: {
      address: 'osmo1gj26haupvyh6qun4fmc5xnr0tsrg9fwfvycs567u6d5qmezue22sza64gx',
      incentives_address: 'osmo1vhw7cjhv5w4ckkr49d8f4tg99m2ar5x377ku9540mfnrdpptw00qe9rd5g',
      spread_rewards_address: 'osmo15zn4jn8dwyj709jvzuev74m55cf9w89wcmqemp34kr82yn2mr0kqtnhxqw',
      id: '1251',
      current_tick_liquidity: '109179621597346.700582020203961325',
      token0: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
      token1: 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4',
      current_sqrt_price: '2.261490360608352849892949680674991272',
      current_tick: '4114338',
      tick_spacing: '100',
      exponent_at_price_one: '-6',
      spread_factor: '0.002000000000000000',
      last_liquidity_update: '2024-11-13T02:41:03.031313512Z'
    },
    spreadFactor:
      '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.002000000000000000"}',
    reserveCoins: [
      '{"currency":{"coinDenom":"ATOM","coinName":"Cosmos Hub","coinMinimalDenom":"ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2","coinDecimals":6,"coinGeckoId":"cosmos","coinImageUrl":"/tokens/generated/atom.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"234598964894"}',
      '{"currency":{"coinDenom":"USDC","coinName":"USDC","coinMinimalDenom":"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4","coinDecimals":6,"coinGeckoId":"usd-coin","coinImageUrl":"/tokens/generated/usdc.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"51187416265"}'
    ],
    totalFiatValueLocked:
      '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"1251007.000000000000000000"}',
    incentives: {
      aprBreakdown: {
        total: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.013300447561205366"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.000095908049536345"}'
        },
        swapFee: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.012731997313310840"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.000091809017959916"}'
        },
        superfluid: {
          upper: null,
          lower: null
        },
        osmosis: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.000568450247894525"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.000004099031576429"}'
        },
        boost: {
          upper: null,
          lower: null
        }
      },
      incentiveTypes: ['osmosis']
    },
    market: {
      volume24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"2868363.482615840600000000"}',
      volume7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"13304922.721656570000000000"}',
      feesSpent24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"5736.726965231682000000"}',
      feesSpent7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"26609.845443313140000000"}'
    },
    coinDenoms: [
      'ATOM',
      'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
      'USDC',
      'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4'
    ],
    poolNameByDenom: 'ATOM/USDC',
    coinNames: [['Cosmos Hub'], ['USDC']]
  },
  {
    isOsmosisPool: true,
    id: '1247',
    type: 'concentrated',
    raw: {
      address: 'osmo1ucec097umzw2ehtlj3rt2jghehrspu5dk3e5ewv4sjy6tg6kttuqgxkd4f',
      incentives_address: 'osmo175dck737jmvr9mw34pqs7y5fv0umnak3vrsj3mjxg75cnkmyulfs0c3sxr',
      spread_rewards_address: 'osmo1sztcvwfec7lk766vn4wxny2s5rzh9ggglmhaaycrgqxmvxduuwvsg0rvcx',
      id: '1247',
      current_tick_liquidity: '13244877793232.639966490485418147',
      token0: 'ibc/D79E7D83AB399BFFF93433E54FAA480C191248FC556924A2A8351AE2638B3877',
      token1: 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4',
      current_sqrt_price: '2.282897261869952355880570966158261947',
      current_tick: '4211619',
      tick_spacing: '100',
      exponent_at_price_one: '-6',
      spread_factor: '0.000500000000000000',
      last_liquidity_update: '2024-11-13T02:41:50.397290399Z'
    },
    spreadFactor:
      '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.000500000000000000"}',
    reserveCoins: [
      '{"currency":{"coinDenom":"TIA","coinName":"Celestia","coinMinimalDenom":"ibc/D79E7D83AB399BFFF93433E54FAA480C191248FC556924A2A8351AE2638B3877","coinDecimals":6,"coinGeckoId":"celestia","coinImageUrl":"/tokens/generated/tia.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"ibc/D79E7D83AB399BFFF93433E54FAA480C191248FC556924A2A8351AE2638B3877","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"35930060202"}',
      '{"currency":{"coinDenom":"USDC","coinName":"USDC","coinMinimalDenom":"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4","coinDecimals":6,"coinGeckoId":"usd-coin","coinImageUrl":"/tokens/generated/usdc.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"92058801208"}'
    ],
    totalFiatValueLocked:
      '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"279313.000000000000000000"}',
    incentives: {
      aprBreakdown: {
        total: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.016497744745478382"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.000122435263004444"}'
        },
        swapFee: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.013707791382706302"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.000101730089114858"}'
        },
        superfluid: {
          upper: null,
          lower: null
        },
        osmosis: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.002789953362772079"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.000020705173889586"}'
        },
        boost: {
          upper: null,
          lower: null
        }
      },
      incentiveTypes: ['osmosis']
    },
    market: {
      volume24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"2389197.573993378300000000"}',
      volume7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"11646853.547039429000000000"}',
      feesSpent24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"1194.598786996689100000"}',
      feesSpent7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"5823.426773519714500000"}'
    },
    coinDenoms: [
      'TIA',
      'ibc/D79E7D83AB399BFFF93433E54FAA480C191248FC556924A2A8351AE2638B3877',
      'USDC',
      'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4'
    ],
    poolNameByDenom: 'TIA/USDC',
    coinNames: [['Celestia'], ['USDC']]
  },
  {
    isOsmosisPool: true,
    id: '1282',
    type: 'concentrated',
    raw: {
      address: 'osmo1hfvn84ea9ch4sth90qusqnyhgexvn3uqr95c7w4y3l39jvrfh3tqpd4fcn',
      incentives_address: 'osmo1ud56842l2t7scmdt8wttwect9us25g32h0hy4895emxjxjf8dxzqg227pl',
      spread_rewards_address: 'osmo1enrsppqmv5e3cp4m0rjmy2hkqd8xl940vptkzund25vh44fvjdes0x0v5d',
      id: '1282',
      current_tick_liquidity: '111356730527.034073353975987247',
      token0: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
      token1: 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4',
      current_sqrt_price: '2.262674911706782992435772736165376213',
      current_tick: '4119697',
      tick_spacing: '100',
      exponent_at_price_one: '-6',
      spread_factor: '0.000500000000000000',
      last_liquidity_update: '2024-11-13T02:42:04.957212661Z'
    },
    spreadFactor:
      '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.000500000000000000"}',
    reserveCoins: [
      '{"currency":{"coinDenom":"ATOM","coinName":"Cosmos Hub","coinMinimalDenom":"ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2","coinDecimals":6,"coinGeckoId":"cosmos","coinImageUrl":"/tokens/generated/atom.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"9543213116"}',
      '{"currency":{"coinDenom":"USDC","coinName":"USDC","coinMinimalDenom":"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4","coinDecimals":6,"coinGeckoId":"usd-coin","coinImageUrl":"/tokens/generated/usdc.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"22616087652"}'
    ],
    totalFiatValueLocked:
      '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"71476.000000000000000000"}',
    incentives: {
      aprBreakdown: {
        total: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.913331363493495900"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.006421531335460159"}'
        },
        swapFee: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.721997402207087500"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.005076283512984453"}'
        },
        superfluid: {
          upper: null,
          lower: null
        },
        osmosis: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.191333961286408430"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.001345247822475706"}'
        },
        boost: {
          upper: null,
          lower: null
        }
      },
      incentiveTypes: ['osmosis']
    },
    market: {
      volume24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"1727196.549904958000000000"}',
      volume7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"7609171.331450585000000000"}',
      feesSpent24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"863.598274952479100000"}',
      feesSpent7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"3804.585665725292500000"}'
    },
    coinDenoms: [
      'ATOM',
      'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
      'USDC',
      'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4'
    ],
    poolNameByDenom: 'ATOM/USDC',
    coinNames: [['Cosmos Hub'], ['USDC']]
  },
  {
    isOsmosisPool: true,
    id: '1301',
    type: 'concentrated',
    raw: {
      address: 'osmo1qrnsjncq2kul2j43y6m2raz2yyvujz7373nl9lp08875kgell74sx4fz0p',
      incentives_address: 'osmo198za9jtj55eyzgsfzqtpz3f56mc2zkv9xuy0sfdf072acsu9nq6s9ll8xq',
      spread_rewards_address: 'osmo1nm0vpuuud0t9umvl44jfce842zx5xh536dtgamg4zy3uqt4jpk6sce3zlx',
      id: '1301',
      current_tick_liquidity: '1255998979016.848737955135330664',
      token0: 'ibc/1480B8FD20AD5FCAE81EA87584D269547DD4D436843C1D20F15E00EB64743EF4',
      token1: 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4',
      current_sqrt_price: '1.758132952649864616752530328580479434',
      current_tick: '2091031',
      tick_spacing: '100',
      exponent_at_price_one: '-6',
      spread_factor: '0.002000000000000000',
      last_liquidity_update: '2024-11-13T02:25:43.06460182Z'
    },
    spreadFactor:
      '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.002000000000000000"}',
    reserveCoins: [
      '{"currency":{"coinDenom":"AKT","coinName":"Akash","coinMinimalDenom":"ibc/1480B8FD20AD5FCAE81EA87584D269547DD4D436843C1D20F15E00EB64743EF4","coinDecimals":6,"coinGeckoId":"akash-network","coinImageUrl":"/tokens/generated/akt.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"ibc/1480B8FD20AD5FCAE81EA87584D269547DD4D436843C1D20F15E00EB64743EF4","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"264837851131"}',
      '{"currency":{"coinDenom":"USDC","coinName":"USDC","coinMinimalDenom":"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4","coinDecimals":6,"coinGeckoId":"usd-coin","coinImageUrl":"/tokens/generated/usdc.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"244429056160"}'
    ],
    totalFiatValueLocked:
      '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"1063053.000000000000000000"}',
    incentives: {
      aprBreakdown: {
        total: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"1.514061256682102500"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.006668598690542061"}'
        },
        swapFee: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"1.514061256682102500"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.006668598690542061"}'
        },
        superfluid: {
          upper: null,
          lower: null
        },
        osmosis: {
          upper: null,
          lower: null
        },
        boost: {
          upper: null,
          lower: null
        }
      },
      incentiveTypes: ['none']
    },
    market: {
      volume24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"1587719.917381461700000000"}',
      volume7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"5945111.446582137000000000"}',
      feesSpent24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"3175.439834762923500000"}',
      feesSpent7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"11890.222893164273000000"}'
    },
    coinDenoms: [
      'AKT',
      'ibc/1480B8FD20AD5FCAE81EA87584D269547DD4D436843C1D20F15E00EB64743EF4',
      'USDC',
      'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4'
    ],
    poolNameByDenom: 'AKT/USDC',
    coinNames: [['Akash'], ['USDC']]
  },
  {
    isOsmosisPool: true,
    id: '1671',
    type: 'concentrated',
    raw: {
      address: 'osmo1fv6xq7j49rrfq2p2yxuwqjl4a4suy4hz74njnl2tsyghvqpzm3xqvn8vvn',
      incentives_address: 'osmo1u5f3mw7kvj5t6mx3sterd8zkeknwfthz0xa2ukmhrxx6c3ym4h2qq6tf00',
      spread_rewards_address: 'osmo17relzmlmsmzumz58jzenjzhx58kz2q5kc3whsnymrr6jh2mpnxys9d5ksp',
      id: '1671',
      current_tick_liquidity: '269003569580.529117247892794370',
      token0: 'ibc/094FB70C3006906F67F5D674073D2DAFAFB41537E7033098F5C752F211E7B6C2',
      token1: 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4',
      current_sqrt_price: '1.392747417145022990728114011167541848',
      current_tick: '939745',
      tick_spacing: '100',
      exponent_at_price_one: '-6',
      spread_factor: '0.002000000000000000',
      last_liquidity_update: '2024-11-13T02:24:26.042686195Z'
    },
    spreadFactor:
      '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.002000000000000000"}',
    reserveCoins: [
      '{"currency":{"coinDenom":"SAGA","coinName":"Saga","coinMinimalDenom":"ibc/094FB70C3006906F67F5D674073D2DAFAFB41537E7033098F5C752F211E7B6C2","coinDecimals":6,"coinGeckoId":"saga-2","coinImageUrl":"/tokens/generated/saga.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"ibc/094FB70C3006906F67F5D674073D2DAFAFB41537E7033098F5C752F211E7B6C2","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"114457173458"}',
      '{"currency":{"coinDenom":"USDC","coinName":"USDC","coinMinimalDenom":"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4","coinDecimals":6,"coinGeckoId":"usd-coin","coinImageUrl":"/tokens/generated/usdc.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"67075233092"}'
    ],
    totalFiatValueLocked:
      '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"289094.000000000000000000"}',
    incentives: {
      aprBreakdown: {
        total: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"1.903566852413112500"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.005506384381746997"}'
        },
        swapFee: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"1.903566852413112500"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.005506384381746997"}'
        },
        superfluid: {
          upper: null,
          lower: null
        },
        osmosis: {
          upper: null,
          lower: null
        },
        boost: {
          upper: null,
          lower: null
        }
      },
      incentiveTypes: ['none']
    },
    market: {
      volume24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"584580.380606080300000000"}',
      volume7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"3123544.556682727800000000"}',
      feesSpent24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"1169.160761212160700000"}',
      feesSpent7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"6247.089113365456000000"}'
    },
    coinDenoms: [
      'SAGA',
      'ibc/094FB70C3006906F67F5D674073D2DAFAFB41537E7033098F5C752F211E7B6C2',
      'USDC',
      'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4'
    ],
    poolNameByDenom: 'SAGA/USDC',
    coinNames: [['Saga'], ['USDC']]
  },
  {
    isOsmosisPool: true,
    id: '1245',
    type: 'concentrated',
    raw: {
      address: 'osmo1n03tyj0ln273yhchaued5neqgrtljthl87l8uv90awkfgd0hux9q2sujws',
      incentives_address: 'osmo19rkvx5xzx8xzpj7950v5v28lsle9m7rlrgxk6mue6wfxg77d0djst297ue',
      spread_rewards_address: 'osmo1l647zzkm7qdz7grwmumdgdxu547xsk2zc83yxsa82eph6q0qfmysy09cux',
      id: '1245',
      current_tick_liquidity: '555247955858602854.174237748065105027',
      token0: 'ibc/831F0B1BBB1D08A2B75311892876D71565478C532967545476DF4C2D7492E48C',
      token1: 'uosmo',
      current_sqrt_price: '0.000001584177230946260117821260632126',
      current_tick: '-106490383',
      tick_spacing: '100',
      exponent_at_price_one: '-6',
      spread_factor: '0.002000000000000000',
      last_liquidity_update: '2024-11-13T02:38:57.974397792Z'
    },
    spreadFactor:
      '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.002000000000000000"}',
    reserveCoins: [
      '{"currency":{"coinDenom":"DYDX","coinName":"dYdX Protocol","coinMinimalDenom":"ibc/831F0B1BBB1D08A2B75311892876D71565478C532967545476DF4C2D7492E48C","coinDecimals":18,"coinGeckoId":"dydx-chain","coinImageUrl":"/tokens/generated/dydx.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"ibc/831F0B1BBB1D08A2B75311892876D71565478C532967545476DF4C2D7492E48C","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":18,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"15891844383062047639212"}',
      '{"currency":{"coinDenom":"OSMO","coinName":"Osmosis","coinMinimalDenom":"uosmo","coinDecimals":6,"coinGeckoId":"osmosis","coinImageUrl":"/tokens/generated/osmo.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"uosmo","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"58654501585"}'
    ],
    totalFiatValueLocked:
      '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"46755.000000000000000000"}',
    incentives: {
      aprBreakdown: {
        total: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"1.035739915657339800"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.004081505760967024"}'
        },
        swapFee: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"1.035739915657339800"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.004081505760967024"}'
        },
        superfluid: {
          upper: null,
          lower: null
        },
        osmosis: {
          upper: null,
          lower: null
        },
        boost: {
          upper: null,
          lower: null
        }
      },
      incentiveTypes: ['none']
    },
    market: {
      volume24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"549088.669113666000000000"}',
      volume7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"1128866.390495520600000000"}',
      feesSpent24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"1098.177338227332000000"}',
      feesSpent7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"2257.732780991041000000"}'
    },
    coinDenoms: ['DYDX', 'ibc/831F0B1BBB1D08A2B75311892876D71565478C532967545476DF4C2D7492E48C', 'OSMO', 'uosmo'],
    poolNameByDenom: 'DYDX/OSMO',
    coinNames: [['dYdX Protocol'], ['Osmosis']]
  },
  {
    isOsmosisPool: true,
    id: '1248',
    type: 'concentrated',
    raw: {
      address: 'osmo1emr5hycqzrlrd9cdm9j3jxs66detx2j69mde2xxxsj8xhnl3dvmsgpudk6',
      incentives_address: 'osmo1y3excgs02765nzvxv5lqlvullva2w2uxapq5nyjnzg30yglge03sem7azc',
      spread_rewards_address: 'osmo1uv76jtxlyvdkg5hqdkzlwlvsknzhfw5xazqc549g8g60kmtkxr3sfgd5lx',
      id: '1248',
      current_tick_liquidity: '2182554805196.283472813445297352',
      token0: 'ibc/D79E7D83AB399BFFF93433E54FAA480C191248FC556924A2A8351AE2638B3877',
      token1: 'uosmo',
      current_sqrt_price: '3.318484966859762591906675805391370411',
      current_tick: '9101234',
      tick_spacing: '100',
      exponent_at_price_one: '-6',
      spread_factor: '0.002000000000000000',
      last_liquidity_update: '2024-11-13T02:35:36.27008558Z'
    },
    spreadFactor:
      '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.002000000000000000"}',
    reserveCoins: [
      '{"currency":{"coinDenom":"TIA","coinName":"Celestia","coinMinimalDenom":"ibc/D79E7D83AB399BFFF93433E54FAA480C191248FC556924A2A8351AE2638B3877","coinDecimals":6,"coinGeckoId":"celestia","coinImageUrl":"/tokens/generated/tia.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"ibc/D79E7D83AB399BFFF93433E54FAA480C191248FC556924A2A8351AE2638B3877","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"45452517207"}',
      '{"currency":{"coinDenom":"OSMO","coinName":"Osmosis","coinMinimalDenom":"uosmo","coinDecimals":6,"coinGeckoId":"osmosis","coinImageUrl":"/tokens/generated/osmo.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"uosmo","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"613292367750"}'
    ],
    totalFiatValueLocked:
      '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"527405.000000000000000000"}',
    incentives: {
      aprBreakdown: {
        total: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.198952158182391660"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.049355995329194650"}'
        },
        swapFee: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.150490713094209600"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.000894550241012670"}'
        },
        superfluid: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.048461445088182060"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.048461445088181980"}'
        },
        osmosis: {
          upper: null,
          lower: null
        },
        boost: {
          upper: null,
          lower: null
        }
      },
      incentiveTypes: ['superfluid']
    },
    market: {
      volume24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"444784.504147230760000000"}',
      volume7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"2419731.441098971300000000"}',
      feesSpent24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"889.569008294461600000"}',
      feesSpent7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"4839.462882197942000000"}'
    },
    coinDenoms: ['TIA', 'ibc/D79E7D83AB399BFFF93433E54FAA480C191248FC556924A2A8351AE2638B3877', 'OSMO', 'uosmo'],
    poolNameByDenom: 'TIA/OSMO',
    coinNames: [['Celestia'], ['Osmosis']]
  },
  {
    isOsmosisPool: true,
    id: '1263',
    type: 'concentrated',
    raw: {
      address: 'osmo1hueh0egxjt6upzn6d80d3653k5vwjjluqz7lm8ffu4t84488p49s6vquyd',
      incentives_address: 'osmo1glw62sxnarqlte4g4kxh7z5pje0x0llfwe53jfec7uydc9xygv7srmknr9',
      spread_rewards_address: 'osmo15qle4t0azwg8etdn48n8lrvvwwut2wfe6lmkn5hk2faycs5gyalsf7eqgv',
      id: '1263',
      current_tick_liquidity: '36886378467294.928895358778584126',
      token0: 'uosmo',
      token1: 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4',
      current_sqrt_price: '0.688590600538785386336064545419908025',
      current_tick: '-5258430',
      tick_spacing: '100',
      exponent_at_price_one: '-6',
      spread_factor: '0.000500000000000000',
      last_liquidity_update: '2024-11-13T02:40:29.075508746Z'
    },
    spreadFactor:
      '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.000500000000000000"}',
    reserveCoins: [
      '{"currency":{"coinDenom":"OSMO","coinName":"Osmosis","coinMinimalDenom":"uosmo","coinDecimals":6,"coinGeckoId":"osmosis","coinImageUrl":"/tokens/generated/osmo.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"uosmo","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"458941198161"}',
      '{"currency":{"coinDenom":"USDC","coinName":"USDC","coinMinimalDenom":"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4","coinDecimals":6,"coinGeckoId":"usd-coin","coinImageUrl":"/tokens/generated/usdc.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"15778870672"}'
    ],
    totalFiatValueLocked:
      '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"233436.000000000000000000"}',
    incentives: {
      aprBreakdown: {
        total: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.637715431277723040"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.053368621339838190"}'
        },
        swapFee: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.567970467966197300"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.004729931841562943"}'
        },
        superfluid: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.048461445088182020"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.048461445088181950"}'
        },
        osmosis: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.021283518223343703"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.000177244410093290"}'
        },
        boost: {
          upper: null,
          lower: null
        }
      },
      incentiveTypes: ['superfluid', 'osmosis']
    },
    market: {
      volume24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"301697.648836160140000000"}',
      volume7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"1231407.833758364000000000"}',
      feesSpent24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"150.848824418080080000"}',
      feesSpent7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"615.703916879182000000"}'
    },
    coinDenoms: ['OSMO', 'uosmo', 'USDC', 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4'],
    poolNameByDenom: 'OSMO/USDC',
    coinNames: [['Osmosis'], ['USDC']]
  },
  {
    isOsmosisPool: true,
    id: '1319',
    type: 'concentrated',
    raw: {
      address: 'osmo1cf99g299n5td4fncjentcjrhyzalvrr6fa4ts3amtvddmpydd9fqgypct8',
      incentives_address: 'osmo13ywhmydm7qwyg8n60afqhzl4ahd65egn00266qqae2v3es4cmepqe07ztk',
      spread_rewards_address: 'osmo1qvmwex60ahcsklntxy9vr38zq54a8gup7psvnfgttfkqv6xmyssq4xglje',
      id: '1319',
      current_tick_liquidity: '144568814775528738.781642058405163142',
      token0: 'ibc/64BA6E31FE887D66C6F8F31C7B1A80C7CA179239677B4088BB55F5EA07DBE273',
      token1: 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4',
      current_sqrt_price: '0.000004867517294781715565675696852460',
      current_tick: '-97630728',
      tick_spacing: '100',
      exponent_at_price_one: '-6',
      spread_factor: '0.002000000000000000',
      last_liquidity_update: '2024-11-13T02:41:41.87563823Z'
    },
    spreadFactor:
      '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.002000000000000000"}',
    reserveCoins: [
      '{"currency":{"coinDenom":"INJ","coinName":"Injective","coinMinimalDenom":"ibc/64BA6E31FE887D66C6F8F31C7B1A80C7CA179239677B4088BB55F5EA07DBE273","coinDecimals":18,"coinGeckoId":"injective-protocol","coinImageUrl":"/tokens/generated/inj.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"ibc/64BA6E31FE887D66C6F8F31C7B1A80C7CA179239677B4088BB55F5EA07DBE273","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":18,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"39600839877152741641157"}',
      '{"currency":{"coinDenom":"USDC","coinName":"USDC","coinMinimalDenom":"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4","coinDecimals":6,"coinGeckoId":"usd-coin","coinImageUrl":"/tokens/generated/usdc.svg","isUnstable":false,"areTransfersDisabled":false,"isVerified":true,"variantGroupKey":"ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4","isAlloyed":false},"options":{"separator":" ","upperCase":false,"lowerCase":false,"hideDenom":false,"maxDecimals":6,"trim":false,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":false,"inequalitySymbolSeparator":" "},"amount":"122362345619"}'
    ],
    totalFiatValueLocked:
      '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"1060615.000000000000000000"}',
    incentives: {
      aprBreakdown: {
        total: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"1.824586066145340300"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.006056814812462021"}'
        },
        swapFee: {
          upper:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"1.824586066145340300"}',
          lower:
            '{"options":{"maxDecimals":3,"trim":true,"shrink":false,"ready":true,"locale":true,"inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","symbol":"%"},"rate":"0.006056814812462021"}'
        },
        superfluid: {
          upper: null,
          lower: null
        },
        osmosis: {
          upper: null,
          lower: null
        },
        boost: {
          upper: null,
          lower: null
        }
      },
      incentiveTypes: ['none']
    },
    market: {
      volume24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"846646.467938203000000000"}',
      volume7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"5845246.777066985000000000"}',
      feesSpent24hUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"1693.292935876406000000"}',
      feesSpent7dUsd:
        '{"fiat":{"currency":"usd","symbol":"$","maxDecimals":2,"locale":"en-US"},"options":{"maxDecimals":2,"trim":true,"shrink":true,"ready":true,"locale":"en-US","inequalitySymbol":true,"inequalitySymbolSeparator":" ","separator":"","upperCase":false,"lowerCase":false},"amount":"11690.493554133971000000"}'
    },
    coinDenoms: [
      'INJ',
      'ibc/64BA6E31FE887D66C6F8F31C7B1A80C7CA179239677B4088BB55F5EA07DBE273',
      'USDC',
      'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4'
    ],
    poolNameByDenom: 'INJ/USDC',
    coinNames: [['Injective'], ['USDC']]
  }
];
