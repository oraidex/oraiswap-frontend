import { ChainIdEnum, USDC_CONTRACT } from '@oraichain/oraidex-common';
import { TokenInfo } from '@oraichain/oraidex-contracts-sdk/build/OraiswapConverter.types';

export const leapSnapId = 'npm:@leapwallet/metamask-cosmos-snap';
export const leapWalletType = 'leapSnap';

export const btcNetwork: any = 'bitcoin';
// TODO: hardcode switch bitcoinTestnet and bitcoin
export const bitcoinChainId: any = ChainIdEnum.Bitcoin;
export const bitcoinLcdV2 = 'https://relayer-btc.oraidex.io';
export const CWAppBitcoinContractAddress = 'orai1g90x3z2kss99wvmpkenjdelmpw4hf9l3yt420gpgqvpuz8lt79uq24arlv';
export const CWBitcoinFactoryDenom = 'factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/obtc';

export const MIN_DEPOSIT_BTC = 600;
export const MIN_WITHDRAW_BTC = 600;

export const AMOUNT_BALANCE_ENTRIES_UNIVERSAL_SWAP: [number, string, string][] = [
  [0.5, '50%', 'half'],
  [1, '100%', 'max']
];

export const DEFAULT_RELAYER_FEE = '1000000';
export const RELAYER_DECIMAL = 6;
export const DAY_IN_MILIS = 86400000;
export const DEFAULT_TOKEN_ICON_URL =
  'https://raw.githubusercontent.com/cosmos/chain-registry/master/oraichain/images/orai-token.png';

export type ConverterPairParams = {
  from: TokenInfo;
  to: TokenInfo;
  isMintBurn: boolean;
};

export const USDC_IBC_DENOM =
  'factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export const CONVERTER_MIDDLEWARE: Partial<Record<string, ConverterPairParams>> = {
  ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']: {
    from: {
      decimals: 6,
      info: {
        native_token: {
          denom: USDC_IBC_DENOM
        }
      }
    },
    to: {
      decimals: 6,
      info: {
        token: {
          contract_addr: USDC_CONTRACT
        }
      }
    },
    isMintBurn: false
  }
};
