import { CW20_DECIMALS, TokenItemType, toDisplay } from '@oraichain/oraidex-common';
import useConfigReducer from 'hooks/useConfigReducer';
import isEqual from 'lodash/isEqual';
import { KeyFilterPool } from 'pages/Pools/components/Filter';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configure';
import { PoolInfoResponse } from 'types/pool';
import { getSymbolPools, parseAssetOnlyDenom } from './../../Pools/helpers';
import {
  useFetchCacheRewardAssetForAllPools,
  useFetchLpPoolsV3,
  useGetMyStake,
  useGetPools,
  useGetPoolsWithClaimableAmount,
  useGetRewardInfo
} from './../../Pools/hooks/hooks';
import { oraichainTokensWithIcon } from 'initCommon';

export type PoolTableData = PoolInfoResponse & {
  reward: string[];
  myStakedLP: number;
  earned: number;
  claimable: number;
  baseToken: TokenItemType;
  quoteToken: TokenItemType;
};

const useGetPoolV2Data = ({ typeFilter }: { typeFilter: KeyFilterPool }) => {
  const [filteredPools, setFilteredPools] = useState<PoolInfoResponse[]>([]);
  const lpPools = useSelector((state: RootState) => state.token.lpPools);
  const [address] = useConfigReducer('address');

  const pools = useGetPools();
  const lpAddresses = pools.map((pool) => pool.liquidityAddr);
  const { totalRewardInfoData } = useGetRewardInfo({
    stakerAddr: address
  });

  useFetchCacheRewardAssetForAllPools(lpAddresses);
  useFetchLpPoolsV3(lpAddresses);

  const { myStakes } = useGetMyStake({
    stakerAddress: address
  });

  const listClaimableData = useGetPoolsWithClaimableAmount({
    poolTableData: filteredPools,
    totalRewardInfoData
  });

  const [cachedReward] = useConfigReducer('rewardPools');

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

  useEffect(() => {
    if (!pools.length) return;

    let filteredPools: PoolInfoResponse[];
    if (typeFilter === KeyFilterPool.my_pool) {
      filteredPools = pools.filter((pool) => isPoolWithLiquidity(pool) || findBondAmount(pool) > 0);
    } else filteredPools = [...pools];
    setFilteredPools(filteredPools);
  }, [typeFilter, pools.length, totalRewardInfoData]);

  const poolTableData: PoolTableData[] = filteredPools.map((pool) => {
    const { liquidityAddr: stakingToken, totalSupply, totalLiquidity, firstAssetInfo, secondAssetInfo } = pool;
    let poolReward = {
      reward: []
    };
    if (cachedReward && cachedReward.length > 0) {
      poolReward = cachedReward.find((item) => item.liquidity_token === stakingToken);
    }

    // calculate my stake in usdt, we calculate by bond_amount from contract and totalLiquidity from backend.
    const myStakedLP = stakingToken
      ? totalRewardInfoData?.reward_infos.find((item) => isEqual(item.staking_token, stakingToken))?.bond_amount || '0'
      : 0;
    const lpPrice = Number(totalSupply) ? totalLiquidity / Number(totalSupply) : 0;
    const myStakeLPInUsdt = +myStakedLP * lpPrice;

    const earned = stakingToken
      ? myStakes.find((item) => item.stakingAssetDenom === stakingToken)?.earnAmountInUsdt || 0
      : 0;

    const [baseDenom, quoteDenom] = [
      parseAssetOnlyDenom(JSON.parse(firstAssetInfo)),
      parseAssetOnlyDenom(JSON.parse(secondAssetInfo))
    ];
    const [baseToken, quoteToken] = [baseDenom, quoteDenom].map((denom) =>
      oraichainTokensWithIcon.find((token) => token.denom === denom || token.contractAddress === denom)
    );
    const symbols = getSymbolPools(baseDenom, quoteDenom, pool.symbols);
    // calc claimable of each pool
    const claimableAmount = listClaimableData.find((e) => isEqual(e.liquidityAddr, stakingToken));

    return {
      ...pool,
      reward: poolReward?.reward ?? [],
      myStakedLP: toDisplay(BigInt(Math.trunc(myStakeLPInUsdt)), CW20_DECIMALS),
      earned: toDisplay(BigInt(Math.trunc(earned)), CW20_DECIMALS),
      baseToken,
      quoteToken,
      symbols,
      claimable: claimableAmount?.amountEachPool || 0
    };
  });

  return {
    poolTableData,
    pools
  };
};

export default useGetPoolV2Data;
