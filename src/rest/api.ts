import { ExecuteInstruction, JsonObject, fromBinary, toBinary } from '@cosmjs/cosmwasm-stargate';
import { Coin, coin } from '@cosmjs/stargate';
import { CwIcs20LatestQueryClient, MulticallQueryClient, Uint128 } from '@oraichain/common-contracts-sdk';
import { ConfigResponse, RelayerFeeResponse } from '@oraichain/common-contracts-sdk/build/CwIcs20Latest.types';
import {
  BTC_CONTRACT,
  IBCInfo,
  IBC_WASM_CONTRACT,
  KWT_DENOM,
  MILKY_DENOM,
  ORAI,
  STABLE_DENOM,
  TokenItemType,
  calculateTimeoutTimestamp,
  getSubAmountDetails,
  handleSentFunds,
  ibcInfos,
  ibcInfosOld,
  parseTokenInfo,
  toDecimal,
  toDisplay,
  toTokenInfo
} from '@oraichain/oraidex-common';
import {
  AssetInfo,
  CoharvestBidPoolQueryClient,
  OraiswapFactoryQueryClient,
  OraiswapOracleQueryClient,
  OraiswapPairQueryClient,
  OraiswapPairTypes,
  OraiswapRouterQueryClient,
  OraiswapStakingQueryClient,
  OraiswapStakingTypes,
  OraiswapTokenQueryClient,
  OraiswapTokenTypes,
  PairInfo
} from '@oraichain/oraidex-contracts-sdk';
import { TaxRateResponse } from '@oraichain/oraidex-contracts-sdk/build/OraiswapOracle.types';
import { Position } from '@oraichain/oraidex-contracts-sdk/build/OraiswapV3.types';
import { UniversalSwapHelper, generateSwapOperationMsgs } from '@oraichain/oraidex-universal-swap';
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import { network, oraichainTokens, tokenMap, tokens } from 'initCommon';
import isEqual from 'lodash/isEqual';
import { RemainingOraibTokenItem } from 'pages/Balance/StuckOraib/useGetOraiBridgeBalances';
import { listFactoryV1Pools, parseAssetOnlyDenom } from 'pages/Pools/helpers';
import { getRouterConfig } from 'pages/UniversalSwap/Swap/hooks';
import { store } from 'store/configure';
import { BondLP, MiningLP, UnbondLP, WithdrawLP } from 'types/pool';
import { PairInfoExtend, TokenInfo } from 'types/token';

export enum Type {
  'TRANSFER' = 'Transfer',
  'SWAP' = 'Swap',
  'PROVIDE' = 'Provide',
  'WITHDRAW' = 'Withdraw',
  'INCREASE_ALLOWANCE' = 'Increase allowance',
  'BOND_LIQUIDITY' = 'Bond liquidity',
  'BOND_STAKING_CW20' = 'StakingCw20',
  'WITHDRAW_LIQUIDITY_MINING' = 'Withdraw Liquidity Mining Rewards',
  'UNBOND_LIQUIDITY' = 'Unbond Liquidity Tokens',
  'CONVERT_TOKEN' = 'Convert IBC or CW20 Tokens',
  'CLAIM_ORAIX' = 'Claim ORAIX tokens',
  'CONVERT_TOKEN_REVERSE' = 'Convert reverse IBC or CW20 Tokens'
}

async function fetchTokenInfo(token: TokenItemType): Promise<TokenInfo> {
  let data: OraiswapTokenTypes.TokenInfoResponse;
  if (token.contractAddress) {
    const tokenContract = new OraiswapTokenQueryClient(window.client, token.contractAddress);
    data = await tokenContract.tokenInfo();
  }
  return toTokenInfo(token, data);
}

/// using multicall when query multiple
async function fetchTokenInfos(tokens: TokenItemType[]): Promise<TokenInfo[]> {
  const filterTokenSwaps = tokens.filter((t) => t.contractAddress);
  const queries = filterTokenSwaps.map((t) => ({
    address: t.contractAddress,
    data: toBinary({
      token_info: {}
    } as OraiswapTokenTypes.QueryMsg)
  }));
  const multicall = new MulticallQueryClient(window.client, network.multicall);
  let tokenInfos = tokens.map((t) => toTokenInfo(t));
  try {
    const res = await multicall.tryAggregate({
      queries
    });
    let ind = 0;
    tokenInfos = tokens.map((t) =>
      toTokenInfo(t, t.contractAddress && res.return_data[ind].success ? fromBinary(res.return_data[ind++].data) : t)
    );
  } catch (error) {
    console.log('error fetching token infos: ', error);
  }
  return tokenInfos;
}

function parsePoolAmount(poolInfo: OraiswapPairTypes.PoolResponse, trueAsset: AssetInfo): bigint {
  // TODO: remove when pool orai/btc close
  if ('token' in trueAsset && trueAsset.token.contract_addr === BTC_CONTRACT) {
    return BigInt(
      poolInfo.assets.find(
        (asset) =>
          'native_token' in asset.info &&
          asset.info.native_token.denom ===
            'factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/obtc'
      )?.amount || '0'
    );
  }
  return BigInt(poolInfo.assets.find((asset) => isEqual(asset.info, trueAsset))?.amount || '0');
}

// fetch price of a pair using simulate swap with amount = 1 so we know the ratio of the token and USDT
export async function fetchPairPriceWithStablecoin(
  fromTokenInfo: TokenItemType,
  toTokenInfo: TokenItemType
): Promise<string> {
  if (!fromTokenInfo.denom || !toTokenInfo.denom) return '0';
  const routerClient = new OraiswapRouterQueryClient(window.client, network.router);
  const storage = store.getState();
  const allOraichainTokens = storage.token.allOraichainTokens || [];
  const allOtherChainTokens = storage.token.allOtherChainTokens || [];
  const result = await Promise.allSettled([
    UniversalSwapHelper.handleSimulateSwap({
      flattenTokens: [...allOraichainTokens, ...allOtherChainTokens],
      oraichainTokens: allOraichainTokens,
      originalFromInfo: fromTokenInfo,
      originalToInfo: tokenMap[STABLE_DENOM],
      originalAmount: 1,
      routerClient,
      routerOption: {
        useIbcWasm: true
      },
      routerConfig: getRouterConfig()
    }),
    UniversalSwapHelper.handleSimulateSwap({
      flattenTokens: [...allOraichainTokens, ...allOtherChainTokens],
      oraichainTokens: allOraichainTokens,
      originalFromInfo: toTokenInfo,
      originalToInfo: tokenMap[STABLE_DENOM],
      originalAmount: 1,
      routerClient,
      routerOption: {
        useIbcWasm: true
      },
      routerConfig: getRouterConfig()
    })
  ])
    .then((results) => {
      for (let res of results) {
        if (res.status === 'fulfilled') return res.value; // only collect the result of the actual existing pool. If both exist then we only need data from one pool
      }
    })
    .catch((error) => {
      console.log('error when fetching pair price with stablecoin', error);
      return { amount: '0' };
    });
  return result.amount;
}

async function fetchPoolInfoAmount(
  fromTokenInfo: TokenItemType,
  toTokenInfo: TokenItemType,
  cachedPairs?: PairDetails,
  pairInfo?: PairInfo
): Promise<PoolInfo> {
  if (!fromTokenInfo.denom || !toTokenInfo.denom) return { offerPoolAmount: BigInt(0), askPoolAmount: BigInt(0) };
  const { info: fromInfo } = parseTokenInfo(fromTokenInfo);
  const { info: toInfo } = parseTokenInfo(toTokenInfo);

  let offerPoolAmount: bigint, askPoolAmount: bigint;
  let pair: PairInfo;
  try {
    pair = pairInfo ?? (await fetchPairInfo([fromTokenInfo, toTokenInfo]));
  } catch (error) {
    console.log('pair not found when fetching pair info', error);
  }

  const client = window.client;
  if (pair) {
    const pairContract = new OraiswapPairQueryClient(client, pair.contract_addr);
    const poolInfo = cachedPairs?.[pair.contract_addr] ?? (await pairContract.pool());
    offerPoolAmount = parsePoolAmount(poolInfo, fromInfo);
    askPoolAmount = parsePoolAmount(poolInfo, toInfo);
  } else {
    // handle multi-swap case
    const oraiTokenType = oraichainTokens.find((token) => token.denom === ORAI);
    const [fromPairInfo, toPairInfo] = await Promise.all([
      fetchPairInfo([fromTokenInfo, oraiTokenType]),
      fetchPairInfo([oraiTokenType, toTokenInfo])
    ]);
    const pairContractFrom = new OraiswapPairQueryClient(client, fromPairInfo.contract_addr);
    const pairContractTo = new OraiswapPairQueryClient(client, toPairInfo.contract_addr);
    const fromPoolInfo = cachedPairs?.[fromPairInfo.contract_addr] ?? (await pairContractFrom.pool());
    const toPoolInfo = cachedPairs?.[toPairInfo.contract_addr] ?? (await pairContractTo.pool());
    offerPoolAmount = parsePoolAmount(fromPoolInfo, fromInfo);
    askPoolAmount = parsePoolAmount(toPoolInfo, toInfo);
  }
  return { offerPoolAmount, askPoolAmount };
}

async function fetchCachedPairInfo(
  tokenTypes: [TokenItemType, TokenItemType],
  cachedPairs?: PairInfoExtend[]
): Promise<PairInfo> {
  if (!cachedPairs || cachedPairs.length === 0) return fetchPairInfo(tokenTypes);
  const pair = cachedPairs.find((pair) =>
    pair.asset_infos.find(
      (info) =>
        info.toString() === parseTokenInfo(tokenTypes[0]).info.toString() ||
        info.toString() === parseTokenInfo(tokenTypes[1]).info.toString()
    )
  );
  return pair;
}

async function fetchPairInfo(tokenTypes: [TokenItemType, TokenItemType]): Promise<PairInfo> {
  let { info: firstAsset } = parseTokenInfo(tokenTypes[0]);
  let { info: secondAsset } = parseTokenInfo(tokenTypes[1]);
  const firstDenom = parseAssetOnlyDenom(firstAsset);
  const secondDenom = parseAssetOnlyDenom(secondAsset);
  const factoryAddr = listFactoryV1Pools.find(
    (factoryV1Pool) =>
      factoryV1Pool.assetInfos.some((assetInfo) => parseAssetOnlyDenom(assetInfo) === firstDenom) &&
      factoryV1Pool.assetInfos.some((assetInfo) => parseAssetOnlyDenom(assetInfo) === secondDenom)
  )
    ? network.factory
    : network.factory_v2;
  const factoryContract = new OraiswapFactoryQueryClient(window.client, factoryAddr);
  const data = await factoryContract.pair({
    assetInfos: [firstAsset, secondAsset]
  });
  return data;
}

async function fetchTokenAllowance(tokenAddr: string, walletAddr: string, spender: string): Promise<bigint> {
  // hard code with native token
  if (!tokenAddr) return BigInt('999999999999999999999999999999');
  const tokenContract = new OraiswapTokenQueryClient(window.client, tokenAddr);
  const data = await tokenContract.allowance({
    owner: walletAddr,
    spender
  });
  return BigInt(data.allowance);
}

async function fetchRewardPerSecInfo(stakingToken: string): Promise<OraiswapStakingTypes.RewardsPerSecResponse> {
  const stakingContract = new OraiswapStakingQueryClient(window.client, network.staking);
  const data = await stakingContract.rewardsPerSec({ stakingToken });

  return data;
}

async function fetchStakingPoolInfo(stakingToken: string): Promise<OraiswapStakingTypes.PoolInfoResponse> {
  const stakingContract = new OraiswapStakingQueryClient(window.client, network.staking);
  const data = await stakingContract.poolInfo({ stakingToken });

  return data;
}

async function fetchLpBalance(stakerAddr: string, liquidityAddr: string): Promise<OraiswapTokenTypes.BalanceResponse> {
  const tokenContract = new OraiswapTokenQueryClient(window.client, liquidityAddr);
  const data = await tokenContract.balance({ address: stakerAddr });
  return data;
}

function generateConvertErc20Cw20Message(
  amounts: AmountDetails,
  tokenInfo: TokenItemType,
  sender: string
): ExecuteInstruction[] {
  if (!tokenInfo.evmDenoms) return [];
  const subAmounts = getSubAmountDetails(amounts, tokenInfo);
  // we convert all mapped tokens to cw20 to unify the token
  for (const denom in subAmounts) {
    const balance = BigInt(subAmounts[denom] ?? '0');
    // reset so we convert using native first
    const erc20TokenInfo = tokenMap[denom];
    if (balance > 0) {
      const msgConvert: ExecuteInstruction = generateConvertMsgs({
        type: Type.CONVERT_TOKEN,
        sender,
        inputAmount: balance.toString(),
        inputToken: erc20TokenInfo
      });
      return [msgConvert];
    }
  }
  return [];
}

function generateConvertCw20Erc20Message(
  amounts: AmountDetails,
  tokenInfo: TokenItemType,
  sender: string,
  sendCoin: Coin
): ExecuteInstruction[] {
  if (!tokenInfo.evmDenoms) return [];
  // we convert all mapped tokens to cw20 to unify the token
  for (let denom of tokenInfo.evmDenoms) {
    // optimize. Only convert if not enough balance & match denom
    if (denom !== sendCoin.denom) continue;

    // if this wallet already has enough native ibc bridge balance => no need to convert reverse
    if (+amounts[sendCoin.denom] >= +sendCoin.amount) break;

    const balance = amounts[tokenInfo.denom];

    const evmToken = tokenMap[denom];

    if (balance) {
      const outputToken: TokenItemType = {
        ...tokenInfo,
        denom: evmToken.denom,
        contractAddress: undefined,
        decimals: evmToken.decimals
      };
      const msgConvert = generateConvertMsgs({
        type: Type.CONVERT_TOKEN_REVERSE,
        sender,
        inputAmount: balance,
        inputToken: tokenInfo,
        outputToken
      });
      return [msgConvert];
    }
  }
  return [];
}

async function fetchRoundBid(): Promise<Number> {
  const coHavestBidPool = new CoharvestBidPoolQueryClient(window.client, network.bid_pool);
  try {
    const data = await coHavestBidPool.lastRoundId();

    return data;
  } catch (error) {
    console.log(`Error when query Round bid using: ${error}`);
    return 0;
  }
}

async function fetchTaxRate(): Promise<TaxRateResponse> {
  const oracleContract = new OraiswapOracleQueryClient(window.client, network.oracle);
  try {
    const data = await oracleContract.treasury({ tax_rate: {} });
    return data as TaxRateResponse;
  } catch (error) {
    throw new Error(`Error when query TaxRate using oracle: ${error}`);
  }
}

async function fetchRelayerFee(): Promise<RelayerFeeResponse[]> {
  const ics20Contract = new CwIcs20LatestQueryClient(window.client, IBC_WASM_CONTRACT);
  try {
    const { relayer_fees } = await ics20Contract.config();
    return relayer_fees;
  } catch (error) {
    throw new Error(`Error when query Relayer Fee using oracle: ${error}`);
  }
}

export async function fetchFeeConfig(): Promise<ConfigResponse> {
  const ics20Contract = new CwIcs20LatestQueryClient(window.client, IBC_WASM_CONTRACT);
  try {
    return await ics20Contract.config();
  } catch (error) {
    console.log(`Error when query fee config using oracle: ${error}`);
    return;
  }
}

export type SwapQuery = {
  type: Type.SWAP;
  fromInfo: TokenInfo;
  toInfo: TokenInfo;
  amount: number | string;
  max_spread?: number | string;
  belief_price?: number | string;
  sender: string;
  minimumReceive: Uint128;
};

export type ProvideQuery = {
  type: Type.PROVIDE;
  fromInfo: TokenInfo;
  toInfo: TokenInfo;
  fromAmount: number | string;
  toAmount: number | string;
  slippage?: number | string;
  sender: string;
  pair: string; // oraiswap pair contract addr, handle provide liquidity
};

export type WithdrawQuery = {
  type: Type.WITHDRAW;
  lpAddr: string;
  amount: number | string;
  sender: string;
  pair: string; // oraiswap pair contract addr, handle withdraw liquidity
};

export type TransferQuery = {
  type: Type.TRANSFER;
  amount: number | string;
  sender: string;
  token: string;
  recipientAddress: string;
};

export type IncreaseAllowanceQuery = {
  type: Type.INCREASE_ALLOWANCE;
  amount: number | string;
  sender: string;
  spender: string;
  token: string; //token contract addr
};

function generateContractMessages(
  query: SwapQuery | ProvideQuery | WithdrawQuery | IncreaseAllowanceQuery | TransferQuery
): ExecuteInstruction {
  const { type, sender, ...params } = query;
  let funds: Coin[] | null;
  // for withdraw & provide liquidity methods, we need to interact with the oraiswap pair contract
  let contractAddr = network.router;
  let input: any;
  switch (type) {
    case Type.SWAP:
      const swapQuery = params as SwapQuery;
      const { fund: offerSentFund, info: offerInfo } = parseTokenInfo(swapQuery.fromInfo, swapQuery.amount.toString());
      const { fund: askSentFund, info: askInfo } = parseTokenInfo(swapQuery.toInfo);
      funds = handleSentFunds(offerSentFund, askSentFund);
      let inputTemp = {
        execute_swap_operations: {
          operations: generateSwapOperationMsgs(offerInfo, askInfo),
          minimum_receive: swapQuery.minimumReceive
        }
      };
      // if cw20 => has to send through cw20 contract
      if (!swapQuery.fromInfo.contractAddress) {
        input = inputTemp;
      } else {
        input = {
          send: {
            contract: contractAddr,
            amount: swapQuery.amount.toString(),
            msg: toBinary(inputTemp)
          }
        };
        contractAddr = swapQuery.fromInfo.contractAddress;
      }
      break;
    case Type.PROVIDE:
      const provideQuery = params as ProvideQuery;
      const { fund: fromSentFund, info: fromInfoData } = parseTokenInfo(
        provideQuery.fromInfo,
        provideQuery.fromAmount as string
      );
      const { fund: toSentFund, info: toInfoData } = parseTokenInfo(
        provideQuery.toInfo,
        provideQuery.toAmount as string
      );
      funds = handleSentFunds(fromSentFund, toSentFund);
      input = {
        provide_liquidity: {
          assets: [
            {
              info: toInfoData,
              amount: provideQuery.toAmount.toString()
            },
            { info: fromInfoData, amount: provideQuery.fromAmount.toString() }
          ],
          slippage_tolerance: provideQuery.slippage
        }
      };
      contractAddr = provideQuery.pair;
      break;
    case Type.WITHDRAW:
      const withdrawQuery = params as WithdrawQuery;

      input = {
        send: {
          // owner: sender,
          contract: withdrawQuery.pair,
          amount: withdrawQuery.amount.toString(),
          msg: 'eyJ3aXRoZHJhd19saXF1aWRpdHkiOnt9fQ==' // withdraw liquidity msg in base64 : {"withdraw_liquidity":{}}
        }
      };
      contractAddr = withdrawQuery.lpAddr;
      break;
    case Type.INCREASE_ALLOWANCE:
      const increaseAllowanceQuery = params as IncreaseAllowanceQuery;
      input = {
        increase_allowance: {
          amount: increaseAllowanceQuery.amount.toString(),
          spender: increaseAllowanceQuery.spender
        }
      };
      contractAddr = increaseAllowanceQuery.token;
      break;
    case Type.TRANSFER:
      const transferQuery = params as TransferQuery;
      input = {
        transfer: {
          recipient: transferQuery.recipientAddress,
          amount: transferQuery.amount
        }
      };
      contractAddr = transferQuery.token;
      break;
    default:
      break;
  }

  const msg: ExecuteInstruction = {
    contractAddress: contractAddr,
    msg: input,
    funds
  };

  return msg;
}

function generateMiningMsgs(data: MiningLP): ExecuteInstruction {
  const { type, sender, ...params } = data;
  let funds: Coin[] | null;
  // for withdraw & provide liquidity methods, we need to interact with the oraiswap pair contract
  let contractAddr = network.router;
  let input: JsonObject;
  switch (type) {
    case Type.BOND_LIQUIDITY: {
      const bondMsgs = params as BondLP;
      // currently only support cw20 token pool
      input = {
        send: {
          contract: network.staking,
          amount: bondMsgs.amount.toString(),
          msg: toBinary({
            bond: {}
          })
        }
      };
      contractAddr = bondMsgs.lpAddress;
      break;
    }
    case Type.BOND_STAKING_CW20: {
      const bondMsgs = params as BondLP;
      // currently only support cw20 token pool
      input = {
        send: {
          contract: network.staking_oraix,
          amount: bondMsgs.amount.toString(),
          msg: toBinary({
            bond: {}
          })
        }
      };
      contractAddr = bondMsgs.lpAddress;
      break;
    }
    case Type.WITHDRAW_LIQUIDITY_MINING: {
      const msg = params as WithdrawLP;
      input = { withdraw: { staking_token: msg.lpAddress } };
      contractAddr = network.staking;
      break;
    }
    case Type.UNBOND_LIQUIDITY:
      const unbondMsg = params as UnbondLP;
      input = {
        unbond: {
          staking_token: unbondMsg.lpAddress,
          amount: unbondMsg.amount.toString()
        }
      };
      contractAddr = network.staking;
      break;
    default:
      break;
  }

  const msg: ExecuteInstruction = {
    contractAddress: contractAddr,
    msg: input,
    funds
  };

  return msg;
}

export type Convert = {
  type: Type.CONVERT_TOKEN;
  sender: string;
  inputToken: TokenItemType;
  inputAmount: string;
};

export type ConvertReverse = {
  type: Type.CONVERT_TOKEN_REVERSE;
  sender: string;
  inputToken: TokenItemType;
  inputAmount: string;
  outputToken: TokenItemType;
};

function generateConvertMsgs(data: Convert | ConvertReverse): ExecuteInstruction {
  const { type, sender, inputToken, inputAmount } = data;
  let funds: Coin[] | null;
  // for withdraw & provide liquidity methods, we need to interact with the oraiswap pair contract
  let contractAddr = network.converter;
  let input: any;
  switch (type) {
    case Type.CONVERT_TOKEN: {
      // currently only support cw20 token pool
      let { info: assetInfo, fund } = parseTokenInfo(inputToken, inputAmount);
      // native case
      if ('native_token' in assetInfo) {
        input = {
          convert: {}
        };
        funds = handleSentFunds(fund);
      } else {
        // cw20 case
        input = {
          send: {
            contract: network.converter,
            amount: inputAmount,
            msg: toBinary({
              convert: {}
            })
          }
        };
        contractAddr = assetInfo.token.contract_addr;
      }
      break;
    }
    case Type.CONVERT_TOKEN_REVERSE: {
      const { outputToken } = data as ConvertReverse;

      // currently only support cw20 token pool
      let { info: assetInfo, fund } = parseTokenInfo(inputToken, inputAmount);
      let { info: outputAssetInfo } = parseTokenInfo(outputToken, '0');
      // native case
      if ('native_token' in assetInfo) {
        input = {
          convert_reverse: {
            from_asset: outputAssetInfo
          }
        };
        funds = handleSentFunds(fund);
      } else {
        // cw20 case
        input = {
          send: {
            contract: network.converter,
            amount: inputAmount,
            msg: toBinary({
              convert_reverse: {
                from: outputAssetInfo
              }
            })
          }
        };
        contractAddr = assetInfo.token.contract_addr;
      }
      break;
    }
    default:
      break;
  }

  const msg: ExecuteInstruction = {
    contractAddress: contractAddr,
    msg: input,
    funds
  };

  return msg;
}

export type Claim = {
  type: Type.CLAIM_ORAIX;
  sender: string;
  stage: number;
  amount: string;
  proofs: string[];
};

// Generate multiple IBC messages in a single transaction to transfer from Oraibridge to Oraichain.
function generateMoveOraib2OraiMessages(
  remainingOraib: RemainingOraibTokenItem[],
  fromAddress: string,
  toAddress: string
) {
  // const [, toTokens] = tokens;
  let transferMsgs: MsgTransfer[] = [];
  for (const fromToken of remainingOraib) {
    // FIXME: what type of token?
    const toToken = tokens.find((t) => t.chainId === 'Oraichain' && t.name === fromToken.name);
    let ibcInfo: IBCInfo = ibcInfos[fromToken.chainId][toToken.chainId];
    // hardcode for MILKY & KWT because they use the old IBC channel
    if (fromToken.denom === MILKY_DENOM || fromToken.denom === KWT_DENOM)
      ibcInfo = ibcInfosOld[fromToken.chainId][toToken.chainId];

    const tokenAmount = coin(fromToken.amount, fromToken.denom);
    transferMsgs.push({
      sourcePort: ibcInfo.source,
      sourceChannel: ibcInfo.channel,
      token: tokenAmount,
      sender: fromAddress,
      receiver: toAddress,
      memo: '',
      timeoutHeight: undefined,
      timeoutTimestamp: BigInt(calculateTimeoutTimestamp(ibcInfo.timeout))
    });
  }
  return transferMsgs;
}

async function getPairAmountInfo(
  fromToken: TokenItemType,
  toToken: TokenItemType,
  cachedPairs?: PairDetails,
  poolInfo?: PoolInfo,
  oraiUsdtPoolInfo?: PoolInfo
): Promise<PairAmountInfo> {
  console.log({ poolInfo });
  console.log({ fromToken, toToken });
  const poolData = poolInfo ?? (await fetchPoolInfoAmount(fromToken, toToken, cachedPairs));
  console.log({ poolData });
  // default is usdt
  let tokenPrice = 0;

  if (fromToken.denom === ORAI) {
    const poolOraiUsdData =
      oraiUsdtPoolInfo ?? (await fetchPoolInfoAmount(tokenMap[ORAI], tokenMap[STABLE_DENOM], cachedPairs));
    // orai price
    tokenPrice = toDecimal(poolOraiUsdData.askPoolAmount, poolOraiUsdData.offerPoolAmount);
  } else {
    // must be stable coin for ask pool amount
    const poolUsdData = await fetchPairPriceWithStablecoin(fromToken, toToken);
    tokenPrice = toDisplay(poolUsdData, toToken.decimals);
  }

  return {
    token1Amount: poolData.offerPoolAmount.toString(),
    token2Amount: poolData.askPoolAmount.toString(),
    tokenUsd: 2 * toDisplay(poolData.offerPoolAmount, fromToken.decimals) * tokenPrice
  };
}

export {
  fetchCachedPairInfo,
  fetchLpBalance,
  fetchPairInfo,
  fetchPoolInfoAmount,
  fetchRelayerFee,
  fetchRewardPerSecInfo,
  fetchRoundBid,
  fetchStakingPoolInfo,
  fetchTaxRate,
  fetchTokenAllowance,
  fetchTokenInfo,
  fetchTokenInfos,
  generateContractMessages,
  generateConvertCw20Erc20Message,
  generateConvertErc20Cw20Message,
  generateConvertMsgs,
  generateMiningMsgs,
  generateMoveOraib2OraiMessages,
  getPairAmountInfo,
  getSubAmountDetails
};
