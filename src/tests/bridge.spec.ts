import { coin } from '@cosmjs/stargate';
import {
  IBC_WASM_CONTRACT,
  INJECTIVE_ORAICHAIN_DENOM,
  KWTBSC_ORAICHAIN_DENOM,
  TokenItemType,
  buildMultipleExecuteMessages,
  getEncodedExecuteContractMsgs,
  parseTokenInfo,
  toAmount
} from '@oraichain/oraidex-common';
import { getSourceReceiver } from '@oraichain/oraidex-universal-swap';
import { CoinGeckoId, NetworkChainId } from '@oraichain/oraidex-common';
import {
  BSC_SCAN,
  ETHEREUM_SCAN,
  KWT_BSC_CONTRACT,
  KWT_DENOM,
  KWT_SCAN,
  MILKY_BSC_CONTRACT,
  MILKY_DENOM,
  ORAI_BSC_CONTRACT,
  ORAI_INFO,
  TRON_SCAN
} from '@oraichain/oraidex-common';
import { ibcInfos, ibcInfosOld, oraib2oraichain } from '@oraichain/oraidex-common';
import { network } from 'config/networks';
import { filterChainBridge, getTransactionUrl, networks, Tokens } from 'helper';
import Long from 'long';
import { findDefaultToToken } from 'pages/Balance/helpers';
import {
  generateConvertCw20Erc20Message,
  generateConvertErc20Cw20Message,
  generateMoveOraib2OraiMessages
} from 'rest/api';
import { describe, expect, it } from 'vitest';
import { cosmosTokens, flattenTokens, oraichainTokens } from 'index';

// @ts-ignore
window.Networks = require('@oraichain/ethereum-multicall').Networks;

const keplrAddress = 'orai1329tg05k3snr66e2r9ytkv6hcjx6fkxcarydx6';
describe('bridge', () => {
  it('bridge-evm-bsc-to-orai-normal-token-should-return-channel-1-plus-address', async () => {
    const tokenAddress = ORAI_BSC_CONTRACT;
    const res = getSourceReceiver(keplrAddress, tokenAddress);
    expect(res).toBe(`${oraib2oraichain}/${keplrAddress}`);
  });

  it('bridge-evm-bsc-to-orai-special-tokens-should-return-only-address', async () => {
    let tokenAddress = KWT_BSC_CONTRACT;
    let res = getSourceReceiver(keplrAddress, tokenAddress);
    expect(res).toBe(keplrAddress);

    tokenAddress = MILKY_BSC_CONTRACT;
    res = getSourceReceiver(keplrAddress, tokenAddress);
    expect(res).toBe(keplrAddress);
  });

  // it('bridge-convert-kwt-should-return-only-evm-amount', async () => {
  //   const transferAmount = 10;
  //   const fromToken = cosmosTokens.find((item) => item.name === 'KWT' && item.chainId === 'kawaii_6886-1');
  //   const evmAmount = coin(toAmount(transferAmount, fromToken.decimals).toString(), fromToken.denom);
  //   expect(evmAmount).toMatchObject({
  //     amount: '10000000000000000000', // 10 * 10**18
  //     denom: fromToken.denom
  //   });
  // });

  describe('bridge-transfer-token-erc20-cw20', () => {
    const denom = KWTBSC_ORAICHAIN_DENOM;
    const decimal = 18;
    const transferAmount = 10;
    const fromToken = cosmosTokens.find((item) => item.name === 'KWT' && item.chainId === 'Oraichain');
    const evmAmount = coin(toAmount(transferAmount, decimal).toString(), denom);
    const amounts: AmountDetails = {
      kwt: '1000000000',
      [denom]: '9000000000000000000' // 9 * 10*18
    };
    const msgConvertReverses = generateConvertCw20Erc20Message(amounts, fromToken, keplrAddress, evmAmount);

    it.each<[string, AmountDetails, number]>([
      ['scatom', {}, 0],
      ['injective', { [`${INJECTIVE_ORAICHAIN_DENOM}`]: '10' }, 1],
      ['injective', { injective: '10' }, 0]
    ])(
      'test-generateConvertErc20Cw20Message-should-return-correct-message-length',
      (denom, amountDetails, expectedMessageLength) => {
        const token = oraichainTokens.find((token) => token.denom === denom);
        const result = generateConvertErc20Cw20Message(amountDetails, token, 'john doe');
        expect(result.length).toEqual(expectedMessageLength);
      }
    );

    it('bridge-transfer-token-erc20-cw20-should-return-only-evm-amount', async () => {
      expect(evmAmount).toMatchObject({
        amount: '10000000000000000000', // 10 * 10**18
        denom: KWTBSC_ORAICHAIN_DENOM
      });
    });

    it('bridge-transfer-token-erc20-cw20-should-return-only-msg-convert-reverses', async () => {
      // check if the sender and contract address are correct
      for (const msg of msgConvertReverses) {
        expect(msg.contractAddress).toBe(fromToken.contractAddress);
      }

      expect(Array.isArray(msgConvertReverses)).toBe(true);
    });

    it('bridge-transfer-token-erc20-cw20-should-return-only-execute-convert-reverses', async () => {
      const executeContractMsgs = getEncodedExecuteContractMsgs(
        keplrAddress,
        buildMultipleExecuteMessages(undefined, ...msgConvertReverses)
      );
      expect(Array.isArray(executeContractMsgs)).toBe(true);
    });
  });

  it('bridge-transfer-to-remote-chain-ibc-wasm-should-return-only-ibc-wasm-contract-address', async () => {
    const fromToken = cosmosTokens.find((item) => item.name === 'ORAI' && item.chainId === 'Oraichain');
    const toToken = cosmosTokens.find((item) => item.name === 'ORAI' && item.chainId === 'oraibridge-subnet-2');
    let ibcInfo = ibcInfos[fromToken.chainId][toToken.chainId];
    const ibcWasmContractAddress = ibcInfo.source.split('.')[1];
    expect(ibcWasmContractAddress).toBe(IBC_WASM_CONTRACT);
  });

  it('bridge-transfer-to-remote-chain-ibc-wasm-should-return-only-asset-info-token', async () => {
    const fromToken = cosmosTokens.find((item) => item.name === 'ORAI' && item.chainId === 'Oraichain');
    const { info: assetInfo } = parseTokenInfo(fromToken);
    expect(assetInfo).toMatchObject(ORAI_INFO);
  });

  it.each<[TokenItemType, NetworkChainId, string, CoinGeckoId]>([
    [
      flattenTokens.find((item) => item.name === 'MILKY' && item.chainId === 'Oraichain'),
      '0x38',
      'MILKY',
      'milky-token'
    ],
    [
      flattenTokens.find((item) => item.coinGeckoId === 'cosmos' && item.chainId === 'cosmoshub-4'),
      'Oraichain',
      'ATOM',
      'cosmos'
    ],
    [
      flattenTokens.find((item) => item.coinGeckoId === 'cosmos' && item.chainId === 'Oraichain'),
      'cosmoshub-4',
      'ATOM',
      'cosmos'
    ],
    [
      flattenTokens.find((item) => item.coinGeckoId === 'oraichain-token' && item.chainId === '0x38'),
      'Oraichain',
      'ORAI',
      'oraichain-token'
    ],
    [
      flattenTokens.find((item) => item.coinGeckoId === 'tether' && item.chainId === '0x2b6653dc'),
      'Oraichain',
      'USDT',
      'tether'
    ],
    [
      flattenTokens.find((item) => item.coinGeckoId === 'tether' && item.chainId === 'Oraichain'),
      '0x38',
      'USDT',
      'tether'
    ]
  ])(
    'bridge-test-find-default-to-token given from-token: %j, should give expected-name: %s, expected coingeckoid: %s',
    (from, expectedChainId, expectedName, expectedCoingeckoId) => {
      const toToken = findDefaultToToken(from);
      expect(from.bridgeTo.includes(toToken.chainId)).toBe(true);
      expect(toToken.name).toContain(expectedName);
      expect(toToken.coinGeckoId).toBe(expectedCoingeckoId);
    }
  );

  it.each<[NetworkChainId, string, string]>([
    ['0x38', '0x', `${BSC_SCAN}/tx/0x`],
    ['0x01', '0x', `${ETHEREUM_SCAN}/tx/0x`],
    ['0x2b6653dc', '0x1234', `${TRON_SCAN}/#/transaction/1234`],
    ['Oraichain', '0x', `${network.explorer}/txs/0x`]
  ])(
    'bridge-test-get-transaciton-url given chainId %s should give expected URL %s',
    (chainId: NetworkChainId, transactionHash: any, expectedUrl: string) => {
      const url = getTransactionUrl(chainId, transactionHash);
      expect(url).toBe(expectedUrl);
    }
  );

  it('bridge-move-oraibridge-to-oraichain-should-return-only-transfer-IBC-msgs', async () => {
    const bridgeTokenNames = ['AIRI', 'USDT'];
    const amount = '100000000000000000';
    const oraibTokens = cosmosTokens
      .filter((t) => bridgeTokenNames.includes(t.name) && t.chainId === 'oraibridge-subnet-2')
      .map((t) => {
        return {
          ...t,
          amount
        };
      });

    const toTokens = oraibTokens.map((oraibToken) => {
      return cosmosTokens.find((t) => t.chainId === 'Oraichain' && t.name === oraibToken.name);
    });

    const fromAddress = 'oraib14n3tx8s5ftzhlxvq0w5962v60vd82h305kec0j';
    const toAddress = 'orai14n3tx8s5ftzhlxvq0w5962v60vd82h30rha573';
    const transferMsgs = generateMoveOraib2OraiMessages(oraibTokens, fromAddress, toAddress);

    // check if transferMsgs is an array
    expect(Array.isArray(transferMsgs)).toBe(true);

    // check if each object in the transferMsgs array has the required properties
    for (const msg of transferMsgs) {
      expect(msg).toHaveProperty('sourcePort');
      expect(msg).toHaveProperty('sourceChannel');
      expect(msg).toHaveProperty('token');
      expect(msg).toHaveProperty('sender');
      expect(msg).toHaveProperty('receiver');
      expect(msg).toHaveProperty('memo');
      expect(msg).toHaveProperty('timeoutTimestamp');
    }

    // check if the sourcePort and sourceChannel values are correct
    let ibcInfo = ibcInfos[oraibTokens[0].chainId][toTokens[0].chainId];

    // hardcode for MILKY & KWT because they use the old IBC channel
    if (oraibTokens[0].denom === MILKY_DENOM || oraibTokens[0].denom === KWT_DENOM)
      ibcInfo = ibcInfosOld[oraibTokens[0].chainId][toTokens[0].chainId];

    expect(transferMsgs[0].sourcePort).toEqual(ibcInfo.source);
    expect(transferMsgs[0].sourceChannel).toEqual(ibcInfo.channel);

    // check if the sender and receiver addresses are correct
    expect(transferMsgs[0].sender).toEqual(fromAddress);
    expect(transferMsgs[0].receiver).toEqual(toAddress);

    // check if the token amount is correct
    expect(transferMsgs[0].token.amount).toEqual(amount);

    // check if the timeout timestamp is correct
    const currentTime = Math.floor(Date.now() / 1000);
    const expectedTimeoutTimestamp = Long.fromNumber(currentTime + ibcInfo.timeout).multiply(1000000000);
    expect(transferMsgs[0].timeoutTimestamp).toEqual(expectedTimeoutTimestamp);
  });

  // describe('helper function', () => {
  //   it.each<[Tokens, NetworkChainId[]]>([
  //     [
  //       flattenTokens.find((i) => i.coinGeckoId === 'oraichain-token' && i.chainId === 'Oraichain'),
  //       ['injective-1', '0x01', '0x38']
  //     ],
  //     [flattenTokens.find((i) => i.name === 'MILKY' && i.chainId === 'Oraichain'), ['kawaii_6886-1', '0x38']]
  //   ])('should filter chain bridge run exactly', async (token: Tokens, expectedBridgeNetwork: NetworkChainId[]) => {
  //     const bridgeNetworks = networks.filter((item) => filterChainBridge(token, item));
  //     expect(bridgeNetworks.map((network) => network.chainId)).toEqual(expectedBridgeNetwork);
  //   });
  // });
});
