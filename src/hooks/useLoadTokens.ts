import { fromBinary, toBinary } from '@cosmjs/cosmwasm-stargate';
import { StargateClient } from '@cosmjs/stargate';
import { MulticallQueryClient } from '@oraichain/common-contracts-sdk';
import { OraiswapTokenTypes } from '@oraichain/oraidex-contracts-sdk';
import { btcTokens, chainInfos, cosmosTokens, evmChains, evmTokens, network, oraichainTokens, tokenMap } from 'initCommon';
import flatten from 'lodash/flatten';
import { ContractCallResults, Multicall } from '@oraichain/ethereum-multicall';
import { COSMOS_CHAIN_ID_COMMON } from '@oraichain/oraidex-common';
import { Dispatch } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import {
  EVM_BALANCE_RETRY_COUNT,
  ERC20__factory,
  getEvmAddress,
  tronToEthAddress
} from '@oraichain/oraidex-common';
import { ethers } from 'ethers';
import { reduce } from 'lodash';
import { bitcoinChainId } from 'helper/constants';
import { getUtxos } from 'pages/Balance/helpers';
import { generateError } from '../libs/utils';
import { updateAmounts } from 'reducer/token';
import {
  genAddressCosmos,
  getAddress,
  handleCheckWallet,
  getWalletByNetworkCosmosFromStorage,
  handleErrorRateLimit
} from 'helper';
import { UniversalSwapHelper } from '@oraichain/oraidex-universal-swap';
import { CustomChainInfo } from '@oraichain/common';

export type LoadTokenParams = {
  refresh?: boolean;
  metamaskAddress?: string;
  oraiAddress?: string;
  tronAddress?: string;
  btcAddress?: string;
};

async function loadNativeBalance(dispatch: Dispatch, address: string, tokenInfo: { chainId: string; rpc: string }) {
  if (!address) return;
  if (!tokenInfo) return;
  try {
    const client = await StargateClient.connect(tokenInfo.rpc);
    const amountAll = await client.getAllBalances(address);

    let amountDetails: AmountDetails = {};

    // reset native balances
    cosmosTokens
      .filter((t) => t.chainId === tokenInfo.chainId && !t.contractAddress)
      .forEach((t) => {
        amountDetails[t.denom] = '0';
      });

    const tokensAmount = amountAll.filter((coin) => tokenMap[coin.denom]).map((coin) => [coin.denom, coin.amount]);
    Object.assign(amountDetails, Object.fromEntries(tokensAmount));

    dispatch(updateAmounts(amountDetails));
  } catch (ex) {
    console.log('ex', ex);
    handleErrorRateLimit(ex?.message);
  }
}

const timer = {};

async function loadTokens(
  dispatch: Dispatch,
  { oraiAddress, metamaskAddress, tronAddress, btcAddress }: LoadTokenParams
) {
  try {
    if (oraiAddress) {
      clearTimeout(timer[oraiAddress]);
      // case get address when keplr ledger not support kawaii
      // case EIP191
      const walletType = getWalletByNetworkCosmosFromStorage();
      if (walletType === 'eip191') {
        timer[oraiAddress] = setTimeout(async () => {
          await Promise.all([
            loadNativeBalance(dispatch, oraiAddress, { chainId: network.chainId, rpc: network.rpc }),
            loadCw20Balance(dispatch, oraiAddress)
          ]);
        }, 2000);
      } else {
        const kawaiiAddress = getAddress(
          await window.Keplr.getKeplrAddr(COSMOS_CHAIN_ID_COMMON.INJECTVE_CHAIN_ID),
          'oraie'
        );
        timer[oraiAddress] = setTimeout(async () => {
          await Promise.all([
            loadTokensCosmos(dispatch, kawaiiAddress, oraiAddress),
            loadCw20Balance(dispatch, oraiAddress),
            // different cointype but also require keplr connected by checking oraiAddress
            loadKawaiiSubnetAmount(dispatch, kawaiiAddress)
          ]);
        }, 2000);
      }
    }

    if (metamaskAddress) {
      clearTimeout(timer[metamaskAddress]);
      timer[metamaskAddress] = setTimeout(() => {
        loadEvmAmounts(dispatch, metamaskAddress, evmChains);
      }, 2000);
    }

    if (tronAddress) {
      clearTimeout(timer[tronAddress]);
      timer[tronAddress] = setTimeout(() => {
        loadEvmAmounts(
          dispatch,
          tronToEthAddress(tronAddress),
          chainInfos.filter((c) => c.chainId == '0x2b6653dc')
        );
      }, 2000);
    }
    if (btcAddress) {
      clearTimeout(timer[btcAddress]);
      timer[btcAddress] = setTimeout(() => {
        loadBtcAmounts(
          dispatch,
          btcAddress,
          // TODO: hardcode check bitcoinTestnet need update later
          chainInfos.filter((c) => c.chainId == bitcoinChainId)
        );
      }, 2000);
    }
  } catch (error) {
    console.log('error load balance: ', error);
  }
}

async function loadTokensCosmos(dispatch: Dispatch, kwtAddress: string, oraiAddress: string) {
  if (!kwtAddress && !oraiAddress) return;
  await handleCheckWallet();
  const cosmosInfos = chainInfos.filter(
    (chainInfo) =>
      (chainInfo.networkType === 'cosmos' || chainInfo.bip44.coinType === 118) &&
      // TODO: ignore oraibtc
      chainInfo.chainId !== ('oraibtc-mainnet-1' as string)
  );
  for (const chainInfo of cosmosInfos) {
    const { cosmosAddress } = genAddressCosmos(chainInfo, kwtAddress, oraiAddress);
    if (!cosmosAddress) continue;
    loadNativeBalance(dispatch, cosmosAddress, chainInfo);
  }
}

async function loadCw20Balance(dispatch: Dispatch, address: string) {
  if (!address) return;

  // get all cw20 token contract
  const cw20Tokens = [...oraichainTokens.filter((t) => t.contractAddress)];

  const data = toBinary({
    balance: { address }
  });

  const multicall = new MulticallQueryClient(window.client, network.multicall);

  const res = await multicall.aggregate({
    queries: cw20Tokens.map((t) => ({
      address: t.contractAddress,
      data
    }))
  });

  const amountDetails = Object.fromEntries(
    cw20Tokens.map((t, ind) => {
      if (!res.return_data[ind].success) {
        return [t.denom, 0];
      }
      const balanceRes = fromBinary(res.return_data[ind].data) as OraiswapTokenTypes.BalanceResponse;
      const amount = balanceRes.balance;
      return [t.denom, amount];
    })
  );

  dispatch(updateAmounts(amountDetails));
}

async function loadCw20BalanceWithSpecificTokens(dispatch: Dispatch, address: string, specificTokens: string[]) {
  if (!address) return;

  // get all cw20 token contract
  const cw20Tokens = [
    ...oraichainTokens.filter((t) => t.contractAddress && specificTokens.includes(t.contractAddress))
  ];

  const data = toBinary({
    balance: { address }
  });

  const multicall = new MulticallQueryClient(window.client, network.multicall);

  const res = await multicall.aggregate({
    queries: cw20Tokens.map((t) => ({
      address: t.contractAddress,
      data
    }))
  });

  const amountDetails = Object.fromEntries(
    cw20Tokens.map((t, ind) => {
      if (!res.return_data[ind].success) {
        return [t.denom, 0];
      }
      const balanceRes = fromBinary(res.return_data[ind].data) as OraiswapTokenTypes.BalanceResponse;
      const amount = balanceRes.balance;
      return [t.denom, amount];
    })
  );

  dispatch(updateAmounts(amountDetails));
}

async function loadNativeEvmBalance(address: string, chain: CustomChainInfo) {
  try {
    const client = new ethers.providers.StaticJsonRpcProvider(chain.rpc, Number(chain.chainId));
    const balance = await client.getBalance(address);
    return balance;
  } catch (error) {
    console.log('error load native evm balance: ', error);
  }
}
async function loadNativeBtcBalance(address: string, chain: CustomChainInfo) {
  const data = await getUtxos(address, chain.rest);
  const total = reduce(
    data,
    function (sum, n) {
      return sum + n.value;
    },
    0
  );

  return total;
}

async function loadEvmEntries(
  address: string,
  chain: CustomChainInfo,
  multicallCustomContractAddress?: string,
  retryCount?: number
): Promise<[string, string][]> {
  try {
    const tokens = evmTokens.filter((t) => t.chainId === chain?.chainId && t.contractAddress);
    const nativeEvmToken = evmTokens.find(
      (t) =>
        !t.contractAddress &&
        UniversalSwapHelper.isEvmNetworkNativeSwapSupported(chain?.chainId) &&
        chain?.chainId === t.chainId
    );
    if (!tokens.length) return [];
    const multicall = new Multicall({
      nodeUrl: chain.rpc,
      multicallCustomContractAddress,
      chainId: Number(chain.chainId)
    });
    const input = tokens.map((token) => ({
      reference: token.denom,
      contractAddress: token.contractAddress,
      abi: ERC20__factory.abi,
      calls: [
        {
          reference: token.denom,
          methodName: 'balanceOf(address)',
          methodParameters: [address]
        }
      ]
    }));

    const results: ContractCallResults = await multicall.call(input as any);
    const nativeBalance = nativeEvmToken ? await loadNativeEvmBalance(address, chain) : 0;
    let entries: [string, string][] = tokens.map((token) => {
      const amount = results.results[token.denom].callsReturnContext[0].returnValues[0].hex;
      return [token.denom, amount];
    });
    if (nativeEvmToken) entries.push([nativeEvmToken.denom, nativeBalance.toString()]);
    return entries;
  } catch (error) {
    console.log('error querying EVM balance: ', error);
    let retry = retryCount ? retryCount + 1 : 1;
    if (retry >= EVM_BALANCE_RETRY_COUNT) console.error(`Cannot query EVM balance with error: ${error}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return loadEvmEntries(address, chain, multicallCustomContractAddress, retry);
  }
}
async function loadBtcEntries(
  address: string,
  chain: CustomChainInfo,

  retryCount?: number
): Promise<[string, string][]> {
  try {
    const nativeBtcs = btcTokens.filter((t) => chain.chainId === t.chainId);

    const nativeBalance = await loadNativeBtcBalance(address, chain);
    let entries: [string, string][] = nativeBtcs.map((item) => [item.denom, nativeBalance.toString()]);
    return entries;
  } catch (error) {
    console.log('error querying BTC balance: ', error);
    let retry = retryCount ? retryCount + 1 : 1;
    if (retry >= EVM_BALANCE_RETRY_COUNT) throw generateError(`Cannot query BTC balance with error: ${error}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return loadBtcEntries(address, chain, retry);
  }
}

async function loadEvmAmounts(dispatch: Dispatch, evmAddress: string, chains: CustomChainInfo[]) {
  console.log('---', chains);
  const amountDetails = Object.fromEntries(
    flatten(await Promise.all(chains.map((chain) => loadEvmEntries(evmAddress, chain))))
  );

  dispatch(updateAmounts(amountDetails));
}

async function loadBtcAmounts(dispatch: Dispatch, btcAddress: string, chains: CustomChainInfo[]) {
  try {
    const amountDetails = Object.fromEntries(
      flatten(await Promise.all(chains.map((chain) => loadBtcEntries(btcAddress, chain))))
    );

    dispatch(updateAmounts(amountDetails));
  } catch (error) {
    console.log('error: loadBtcAmounts', error);
  }
}

async function loadKawaiiSubnetAmount(dispatch: Dispatch, kwtAddress: string) {
  if (!kwtAddress) return;
  const kawaiiInfo = chainInfos.find((c) => c.chainId === 'kawaii_6886-1');
  loadNativeBalance(dispatch, kwtAddress, kawaiiInfo);

  const kwtSubnetAddress = getEvmAddress(kwtAddress);
  const kawaiiEvmInfo = chainInfos.find((c) => c.chainId === '0x1ae6');
  let amountDetails = Object.fromEntries(await loadEvmEntries(kwtSubnetAddress, kawaiiEvmInfo));
  // update amounts
  dispatch(updateAmounts(amountDetails));
}

export default function useLoadTokens(): (params: LoadTokenParams) => Promise<void> {
  const dispatch = useDispatch();
  return loadTokens.bind(null, dispatch);
}

export function useLoadOraichainTokens(): (oraiAddress: string, specificTokens: string[]) => Promise<void> {
  const dispatch = useDispatch();
  return loadOraichainToken.bind(null, dispatch);
}

export const loadOraichainToken = async (dispatch: Dispatch, oraiAddress: string, specificTokens: string[]) => {
  if (!oraiAddress) return;
  clearTimeout(timer[oraiAddress]);

  timer[oraiAddress] = setTimeout(async () => {
    await Promise.all([
      loadNativeBalance(dispatch, oraiAddress, { chainId: network.chainId, rpc: network.rpc }),
      loadCw20BalanceWithSpecificTokens(dispatch, oraiAddress, specificTokens)
    ]);
  }, 2000);
};
