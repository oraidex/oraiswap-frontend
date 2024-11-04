import { TonConnectUIProvider } from '@tonconnect/ui-react';

export const TonChainId: any = 'ton';

export enum TonNetwork {
  Mainnet = 'mainnet',
  Testnet = 'testnet'
}

export const TonInteractionContract = {
  [TonNetwork.Mainnet]: {
    lightClient: 'EQDzy_POlimFDyzrHd3OQsb9sZCngyG3O7Za4GRFzM-rrO93',
    whitelist: 'EQATDM6mfPZjPDMD9TVa6D9dlbmAKY5w6xOJiTXJ9Nqj_dsu',
    bridgeAdapter: 'EQC-aFP0rJXwTgKZQJPbPfTSpBFc8wxOgKHWD9cPvOl_DnaY'
  },
  [TonNetwork.Testnet]: {
    lightClient: 'EQDzy_POlimFDyzrHd3OQsb9sZCngyG3O7Za4GRFzM-rrO93',
    whitelist: 'EQAbJI3NZKGcVu-ec_z_LcmXca9ZOtzkgCW5H9glnWBDpaFg',
    bridgeAdapter: 'EQA3ISho4fpW3wmCkKEwsyXulIw7vLf-2jxso40ul3QQJ_O7'
  }
};

export const TON_SCAN = 'https://tonviewer.com';
export const MANIFEST_URL = `${window.location?.origin}/manifest.json`;

export const CW_TON_BRIDGE = 'orai159l8l9c5ckhqpuwdfgs9p4v599nqt3cjlfahalmtrhfuncnec2ms5mz60e';
export const TOKEN_FACTORY = 'orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9';

export const TonProvider = (props: React.PropsWithChildren<{}>) => {
  return <TonConnectUIProvider manifestUrl={MANIFEST_URL}>{props.children}</TonConnectUIProvider>;
};
