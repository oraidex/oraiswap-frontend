import { Cw20StakingQueryClient } from '@oraichain/oraidex-contracts-sdk';
import { useQuery } from '@tanstack/react-query';
import { network } from 'initCommon';
import { ORAIX_TOKEN_INFO } from '../constants';

export const useGetLockInfo = (stakingToken, stakerAddr) => {
  const getLockAmount = async () => {
    const cw20Staking = new Cw20StakingQueryClient(window.client, network.staking_oraix);
    const data = await cw20Staking.lockInfos({
      stakingToken,
      stakerAddr
    });

    const lockAmount = data?.lock_infos?.reduce((acc, cur) => {
      acc = Number(cur.amount) + acc;

      return acc;
    }, 0);

    return {
      ...(data || {
        lock_infos: [],
        staker_addr: stakerAddr,
        staking_token: ORAIX_TOKEN_INFO.contractAddress
      }),
      lockAmount: lockAmount.toString()
    };
  };

  const {
    data: lockInfo,
    isLoading,
    refetch: refetchLockInfo
  } = useQuery(['stake-lock-info', stakerAddr, stakingToken], () => getLockAmount(), {
    refetchOnWindowFocus: false,
    placeholderData: {
      lock_infos: [],
      lockAmount: '0',
      staker_addr: stakerAddr,
      staking_token: ORAIX_TOKEN_INFO.contractAddress
    },
    enabled: !!stakingToken && !!stakerAddr
  });

  return { lockInfo, isLoading, refetchLockInfo };
};
