import { fromBinary, toBinary } from '@cosmjs/cosmwasm-stargate';
import { MulticallQueryClient, MulticallReadOnlyInterface } from '@oraichain/common-contracts-sdk';
import { AggregateResult } from '@oraichain/common-contracts-sdk/build/Multicall.types';
import { toDisplay, TokenItemType } from '@oraichain/oraidex-common';
import { OraiswapStakingQueryClient, OraiswapStakingTypes } from '@oraichain/oraidex-contracts-sdk';
import { useQuery } from '@tanstack/react-query';
import useConfigReducer from 'hooks/useConfigReducer';
import { cw20TokenMap, network, oraichainTokens, tokenMap } from 'initCommon';
import isEqual from 'lodash/isEqual';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'rest/request';

import { getUsd } from 'libs/utils';
import { parseAssetOnlyDenom } from 'pages/Pools/helpers';
import { RewardPoolType } from 'reducer/config';
import { updateLpPools } from 'reducer/token';
import { fetchRewardPerSecInfo, fetchTokenInfo } from 'rest/api';
import { RootState } from 'store/configure';
import { PoolInfoResponse } from 'types/pool';
import { tokenInspector } from 'initTokenInspector';
import { onChainTokenToTokenItem } from 'reducer/onchainTokens';

export const calculateLpPoolsV3 = (lpAddresses: string[], res: AggregateResult) => {
  const lpTokenData = Object.fromEntries(
    lpAddresses.map((lpAddress, ind) => {
      const data = res.return_data?.[ind];
      if (!data?.success) {
        return [lpAddress, {}];
      }
      return [lpAddress, fromBinary(data.data)];
    })
  );
  return lpTokenData;
};

export const fetchLpPoolsFromContract = async (
  lpAddresses: string[],
  userAddress: string,
  multicall: MulticallReadOnlyInterface
) => {
  const queries = lpAddresses.map((lpAddress) => ({
    address: lpAddress,
    data: toBinary({
      balance: {
        address: userAddress
      }
    })
  }));
  const res = await multicall.aggregate({
    queries
  });
  return calculateLpPoolsV3(lpAddresses, res);
};

// Fetch lp pools from contract
export const useFetchLpPoolsV3 = (lpAddresses: string[]) => {
  const dispatch = useDispatch();
  const [address] = useConfigReducer('address');
  const setCachedLpPools = (payload: LpPoolDetails) => dispatch(updateLpPools(payload));

  const fetchLpPool = async () => {
    if (!!lpAddresses.length && address) {
      const lpTokenData = await fetchLpPoolsFromContract(
        lpAddresses,
        address,
        new MulticallQueryClient(window.client, network.multicall)
      );

      // setCachedLpPools(lpTokenData);
      return lpTokenData;
    }
    return {};
  };

  const { data } = useQuery(['lpTokenData-queries', lpAddresses, address], () => fetchLpPool(), {
    refetchOnWindowFocus: false,
    placeholderData: [],
    cacheTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (!data.length) {
      // fetchLpPool();
      setCachedLpPools(data);
    }
  }, [data]);
};

export const getPools = async (): Promise<PoolInfoResponse[]> => {
  try {
    const res = await axios.get('/v1/pools/', {});
    return res.data;
  } catch (e) {
    console.error('getPools', e);
    return [];
  }
};

export const useGetPriceChange = (params: { base_denom: string; quote_denom: string; tf: number }) => {
  const getPriceChange = async (queries: { base_denom: string; quote_denom: string; tf: number }) => {
    try {
      const res = await axios.get('/price', { params: queries });
      return res.data;
    } catch (e) {
      console.error('useGetPriceChange', e);
      return {
        price_change: 0,
        price: 0,
        isError: true
      };
    }
  };

  const { data: priceChange, isLoading } = useQuery(['price-change', params], () => getPriceChange(params), {
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000,
    placeholderData: {
      price: 0,
      price_change: 0
    }
  });

  return {
    isLoading,
    priceChange
  };
};

export const useGetPools = () => {
  const { data: pools } = useQuery(['pools'], getPools, {
    refetchOnWindowFocus: false,
    placeholderData: [],
    staleTime: 5 * 60 * 1000
  });
  return pools.filter(Boolean);
};

export type GetStakedByUserQuery = {
  stakerAddress: string;
  tf?: number;
  pairDenoms?: string;
};

export type StakeByUserResponse = {
  stakingAssetDenom: string;
  earnAmountInUsdt: number;
};

const getMyStake = async (queries: GetStakedByUserQuery): Promise<StakeByUserResponse[]> => {
  try {
    const res = await axios.get('/v1/my-staking/', { params: queries });
    return res.data;
  } catch (e) {
    console.error('getMyStake', e);
  }
};
export const useGetMyStake = ({ stakerAddress, pairDenoms, tf }: GetStakedByUserQuery) => {
  const { totalRewardInfoData } = useGetRewardInfo({ stakerAddr: stakerAddress });
  const pools = useGetPools();

  const { data: myStakes } = useQuery(
    ['myStakes', stakerAddress, pairDenoms, tf],
    () => getMyStake({ stakerAddress, pairDenoms, tf }),
    {
      placeholderData: [],
      refetchOnWindowFocus: true,
      enabled: !!stakerAddress,
      staleTime: 5 * 60 * 1000
    }
  );

  // calculate total staked of all pool
  const totalStaked = pools.reduce((accumulator, pool) => {
    const { totalSupply, totalLiquidity } = pool;
    const myStakedLP = pool.liquidityAddr
      ? totalRewardInfoData?.reward_infos.find((item) => isEqual(item.staking_token, pool.liquidityAddr))
        ?.bond_amount || '0'
      : 0;

    const lpPrice = Number(totalSupply) ? totalLiquidity / Number(totalSupply) : 0;
    const myStakeLPInUsdt = +myStakedLP * lpPrice;
    accumulator += myStakeLPInUsdt;
    return accumulator;
  }, 0);

  const totalEarned = myStakes
    ? myStakes.reduce((total, current) => {
      total += current.earnAmountInUsdt;
      return total;
    }, 0)
    : 0;

  return {
    totalStaked,
    totalEarned,
    myStakes: myStakes || []
  };
};

export const useGetPoolDetail = ({ pairDenoms }: { pairDenoms: string }) => {
  const getPoolDetail = async (queries: { pairDenoms: string }): Promise<PoolInfoResponse> => {
    try {
      const res = await axios.get('/v1/pool-detail/', { params: queries });
      return res.data;
    } catch (e) {
      console.error('error getPoolDetail: ', e);
    }
  };

  const { data: poolDetail, isLoading } = useQuery(['pool-detail', pairDenoms], () => getPoolDetail({ pairDenoms }), {
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 5,
    enabled: !!pairDenoms,
  });

  const [[token1, token2], setTokens] = useState<[TokenItemType, TokenItemType]>([{}, {}]);

  useEffect(() => {
    if (!pairDenoms) return;
    (async function fetchTokens() {
      try {

        const pairRawData = pairDenoms.split('_');
        const tokenTypes = pairRawData.map((raw) =>
          oraichainTokens.find((token) => token.denom === raw || token.contractAddress === raw)
        );

        let token1 = tokenTypes[0];
        let token2 = tokenTypes[1];

        if (!tokenTypes[0]) {
          const inspectedToken1 = await tokenInspector.inspectToken({ tokenId: pairRawData[0], getOffChainData: true });
          token1 = onChainTokenToTokenItem(inspectedToken1);
        }
        if (!tokenTypes[1]) {
          const inspectedToken2 = await tokenInspector.inspectToken({ tokenId: pairRawData[1], getOffChainData: true });
          token2 = onChainTokenToTokenItem(inspectedToken2);
        }
        setTokens([token1, token2]);
      } catch (e) {
        console.error('error fetchTokens: ', e);
      }
    })();
  }, [pairDenoms]);

  return {
    info: poolDetail,
    token1,
    token2,
    isLoading
  };
};

export type RewardInfoQueryType = {
  stakerAddr: string;
  stakingToken?: string;
  poolInfo?: {
    liquidityAddr: string;
  };
};
export const fetchRewardInfoV3 = async (
  stakerAddr: string,
  stakingToken?: string
): Promise<OraiswapStakingTypes.RewardInfoResponse> => {
  const stakingContract = new OraiswapStakingQueryClient(window.client, network.staking);
  let payload: RewardInfoQueryType = {
    stakerAddr
  };
  if (stakingToken) payload.stakingToken = stakingToken;
  const data = await stakingContract.rewardInfo(payload);
  return data;
};

export const useGetRewardInfo = ({ stakerAddr, poolInfo }: RewardInfoQueryType) => {
  const { data: totalRewardInfoData, refetch: refetchRewardInfo } = useQuery(
    ['reward-info', stakerAddr, poolInfo],
    () => fetchRewardInfoV3(stakerAddr, poolInfo?.liquidityAddr),
    { enabled: !!stakerAddr, refetchOnWindowFocus: true }
  );

  return { totalRewardInfoData, refetchRewardInfo };
};

export const useGetRewardInfoDetail = ({ stakerAddr, poolInfo }: RewardInfoQueryType) => {
  const { data: totalRewardInfoData, refetch: refetchRewardInfo } = useQuery(
    ['reward-info-detail', stakerAddr, poolInfo],
    () => {
      return fetchRewardInfoV3(stakerAddr, poolInfo.liquidityAddr);
    },
    { enabled: !!stakerAddr && !!poolInfo && !!poolInfo.liquidityAddr, refetchOnWindowFocus: true }
  );

  return { totalRewardInfoData, refetchRewardInfo };
};

export const getStatisticData = (data: PoolInfoResponse[]) => {
  const statisticData = data.reduce(
    (acc, curr) => {
      acc.volume = acc.volume + toDisplay(curr.volume24Hour);
      acc.totalLiquidity = acc.totalLiquidity + curr.totalLiquidity;

      return acc;
    },
    {
      volume: 0,
      totalLiquidity: 0,
      totalClaimable: 0
    }
  );

  return statisticData;
};

export const getClaimableInfoByPool = ({ pool, totalRewardInfoData }) => {
  const rewardPerSecInfoData = JSON.parse(pool.rewardPerSec);

  const currentPoolReward = totalRewardInfoData?.reward_infos?.find((reward) =>
    isEqual(reward.staking_token, pool.liquidityAddr)
  );
  const totalRewardAmount = BigInt(currentPoolReward?.pending_reward ?? 0);

  const rewardPerSecInfoDataIsArray =
    rewardPerSecInfoData.assets && Array.isArray(rewardPerSecInfoData.assets) && rewardPerSecInfoData.assets.length > 0;

  // unit LP
  const totalRewardPerSec =
    rewardPerSecInfoDataIsArray &&
    rewardPerSecInfoData.assets.map((asset) => BigInt(asset.amount)).reduce((a, b) => a + b, BigInt(0));

  const results =
    rewardPerSecInfoDataIsArray &&
    rewardPerSecInfoData.assets
      // .filter((asset) => parseInt(asset.amount))
      .map(async (asset) => {
        const pendingWithdraw = BigInt(
          currentPoolReward?.pending_withdraw.find((e) => isEqual(e.info, asset.info))?.amount ?? 0
        );

        const amount =
          (!totalRewardPerSec ? 0n : (totalRewardAmount * BigInt(asset.amount)) / totalRewardPerSec) + pendingWithdraw;

        let token =
          'token' in asset.info
            ? cw20TokenMap[asset.info.token.contract_addr]
            : tokenMap[asset.info.native_token.denom];

        // only for atom/scatom pool
        if (!token && 'token' in asset.info && asset.info?.token?.contract_addr) {
          const tokenInfo = await fetchTokenInfo({
            contractAddress: asset.info.token.contract_addr,
            name: '',
            org: 'Oraichain',
            denom: '',
            Icon: undefined,
            chainId: 'Oraichain',
            rpc: '',
            decimals: 0,
            coinGeckoId: 'scatom',
            cosmosBased: undefined,
            icon: undefined
          });

          token = {
            ...tokenInfo,
            denom: tokenInfo?.symbol
          };
        }
        return {
          ...token,
          amount,
          pendingWithdraw
        };
      });

  return results;
};

export const getClaimableAmountByPool = async ({ pool, totalRewardInfoData, cachePrices }) => {
  const results = getClaimableInfoByPool({ pool, totalRewardInfoData });

  const res = await Promise.all(results || []);

  const total = res.reduce((acc, cur) => {
    const eachBalance = getUsd(cur.amount, cur, cachePrices, cur.coinGeckoId === 'scatom' && xOCH_PRICE);

    acc = acc + eachBalance;

    return acc;
  }, 0);

  return total;
};

export const getTotalClaimable = async ({ poolTableData, totalRewardInfoData }) => {
  const promiseRes = [];

  poolTableData.map((e) => {
    const results = getClaimableInfoByPool({ pool: e, totalRewardInfoData });
    promiseRes.push(...results);
  });

  const res = await Promise.all(promiseRes);

  return res;
};

export const xOCH_PRICE = 0.4;

export const useGetTotalClaimable = ({ poolTableData, totalRewardInfoData }) => {
  const [cachePrices] = useConfigReducer('coingecko');
  const [totalClaim, setTotalClaim] = useState();
  const lpPools = useSelector((state: RootState) => state.token.lpPools);

  const isPoolWithLiquidity = (pool: PoolInfoResponse) => {
    const liquidityAddress = pool?.liquidityAddr;
    return parseInt(lpPools[liquidityAddress]?.balance) > 0;
  };

  const findBondAmount = (pool: PoolInfoResponse) => {
    if (!totalRewardInfoData) return 0;
    const rewardInfo = totalRewardInfoData.reward_infos.find(({ staking_token }) =>
      isEqual(staking_token, pool.liquidityAddr)
    );
    return rewardInfo ? parseInt(rewardInfo.bond_amount) : 0;
  };

  const myPools = poolTableData.filter((pool) => isPoolWithLiquidity(pool) || findBondAmount(pool) > 0);

  useEffect(() => {
    (async () => {
      if (totalRewardInfoData) {
        const res = await getTotalClaimable({ poolTableData: myPools, totalRewardInfoData });
        const total = res.reduce((acc, cur) => {
          const eachBalance = getUsd(cur.amount, cur, cachePrices, cur.coinGeckoId === 'scatom' && xOCH_PRICE);

          acc = acc + eachBalance;

          return acc;
        }, 0);

        if (res) {
          setTotalClaim(total);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalRewardInfoData, poolTableData, cachePrices]);

  return totalClaim;
};

export const useGetPoolsWithClaimableAmount = ({ poolTableData, totalRewardInfoData }) => {
  const [cachePrices] = useConfigReducer('coingecko');
  const [listClaimable, setListClaimable] = useState<
    {
      liquidityAddr: string;
      amountEachPool: number;
    }[]
  >([]);

  const promiseClaimAmounts = poolTableData.map(async (pool) => {
    const amountEachPool = await getClaimableAmountByPool({ pool, totalRewardInfoData, cachePrices });
    return {
      liquidityAddr: pool.liquidityAddr,
      amountEachPool: amountEachPool
    };
  });

  useEffect(() => {
    (async () => {
      if (totalRewardInfoData) {
        const res = await Promise.all(promiseClaimAmounts);

        if (res) {
          setListClaimable(res);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalRewardInfoData, poolTableData, cachePrices]);

  return listClaimable;
};

/**
 * fetch reward asset for each pool, with unique key is staking token (also called liquidity address)
 * @param lpAddresses: list lp address of all pools
 * @returns list reward. format: [{
 *   "reward": [
 *       "AIRI"
 *   ],
 *   "liquidity_token": "orai1hxm433hnwthrxneyjysvhny539s9kh6s2g2n8y"
 * }]
 */
export const useFetchCacheRewardAssetForAllPools = (lpAddresses: string[]) => {
  const [cachedReward, setCachedReward] = useConfigReducer('rewardPools');
  const fetchReward = async () => {
    let rewardAll: RewardPoolType[] = await Promise.all(
      lpAddresses.map(async (lpAddress) => {
        const rewardPerSecInfo = await fetchRewardPerSecInfo(lpAddress);
        const reward = rewardPerSecInfo.assets.reduce((acc, rewardAsset) => {
          const rewardDenom = parseAssetOnlyDenom(rewardAsset.info);
          const token = 'token' in rewardAsset.info ? cw20TokenMap[rewardDenom] : tokenMap[rewardDenom];
          // TODO: hardcode token reward xOCH
          const xOCH_TOKEN_NAME = 'xOCH';
          return [...acc, token ? token.name : xOCH_TOKEN_NAME];
        }, []);
        return {
          reward,
          liquidity_token: lpAddress
        };
      })
    );
    setCachedReward(rewardAll);
  };

  useEffect(() => {
    const isLpAddressesLength = lpAddresses?.length;
    const isNotCacheReward = !cachedReward || !cachedReward.length || cachedReward.length < isLpAddressesLength;
    if (isNotCacheReward && isLpAddressesLength > 0) {
      fetchReward();
    }
  }, [lpAddresses, cachedReward]);

  return [cachedReward];
};
