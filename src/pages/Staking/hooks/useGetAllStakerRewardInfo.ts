import { Cw20StakingQueryClient } from '@oraichain/oraidex-contracts-sdk';
import { useQuery } from '@tanstack/react-query';
import { network } from 'index';

export const useGetAllStakerRewardInfo = (stakingToken) => {
  const getRewardAmount = async () => {
    const cw20Staking = new Cw20StakingQueryClient(window.client, network.staking_oraix);
    const data = await cw20Staking.rewardInfos({
      stakingToken
    });

    return data;
  };

  const {
    data: allRewardStakerInfo,
    isLoading,
    refetch: refetchAllStakerRewardInfo
  } = useQuery(['all-staker-reward-info', stakingToken], () => getRewardAmount(), {
    refetchOnWindowFocus: false,
    placeholderData: [],
    enabled: !!stakingToken
  });

  return { allRewardStakerInfo, isLoading, refetchAllStakerRewardInfo };
};
