import { USDC_CONTRACT } from '@oraichain/oraidex-common';
import { Cw20StakingQueryClient } from '@oraichain/oraidex-contracts-sdk';
import { useQuery } from '@tanstack/react-query';
import { network } from 'config/networks';
import { USDC_TOKEN_INFO } from '../constants';
import { cw20TokenMap, tokenMap } from 'index';

export const useGetRewardPerSecInfo = (stakingToken) => {
  const getRewardPerSec = async () => {
    const cw20Staking = new Cw20StakingQueryClient(window.client, network.staking_oraix);
    const data = await cw20Staking.rewardsPerSec({
      stakingToken
    });

    const result = (data?.assets || [])
      .filter((asset) => parseInt(asset.amount))
      .map((asset) => {
        const token =
          'token' in asset.info
            ? cw20TokenMap[asset.info.token.contract_addr]
            : tokenMap[asset.info.native_token.denom];

        return {
          ...(asset || {
            amount: '0',
            info: {
              token: {
                contract_addr: USDC_CONTRACT
              }
            }
          }),
          token: token || USDC_TOKEN_INFO
        };
      });

    return (
      result || [
        {
          amount: '0',
          info: {
            token: {
              contract_addr: USDC_CONTRACT
            }
          },
          token: USDC_TOKEN_INFO
        }
      ]
    );
  };

  const {
    data: rewardPerSec,
    isLoading,
    refetch: refetchRewardPerSec
  } = useQuery(['stake-reward-per-sec-info-data', stakingToken], () => getRewardPerSec(), {
    refetchOnWindowFocus: false,
    placeholderData: [
      {
        amount: '0',
        info: {
          token: {
            contract_addr: USDC_CONTRACT
          }
        },
        token: USDC_TOKEN_INFO
      }
    ],
    enabled: !!stakingToken
  });

  return { rewardPerSec, isLoading, refetchRewardPerSec };
};
