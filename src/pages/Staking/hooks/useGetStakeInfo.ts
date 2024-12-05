import { Cw20StakingQueryClient } from '@oraichain/oraidex-contracts-sdk';
import { useQuery } from '@tanstack/react-query';
import { network } from 'initCommon';
import { ORAIX_TOKEN_INFO } from '../constants';

export const useGetStakeInfo = (stakingToken) => {
  const getStakeAmount = async () => {
    const cw20Staking = new Cw20StakingQueryClient(window.client, network.staking_oraix);
    const data = await cw20Staking.poolInfo({
      stakingToken: stakingToken
    });
    return data;
  };

  const {
    data: stakeInfo,
    isLoading,
    refetch: refetchStakeInfo
  } = useQuery(['stake-info', stakingToken], () => getStakeAmount(), {
    refetchOnWindowFocus: false,
    placeholderData: {
      pending_reward: '0',
      reward_index: '0',
      staking_token: ORAIX_TOKEN_INFO.contractAddress,
      total_bond_amount: '0'
    },
    enabled: !!stakingToken
  });

  return { stakeInfo, isLoading, refetchStakeInfo };
};
