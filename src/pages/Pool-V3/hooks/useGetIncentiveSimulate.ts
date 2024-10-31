import { useQuery } from '@tanstack/react-query';
import SingletonOraiswapV3 from 'libs/contractSingleton';

export const useGetIncentiveSimulate = (owner: string, positionIndex: number, openCollapse: boolean) => {
  const { data: simulation, refetch: refetchGetIncentiveSimulate } = useQuery<Record<string, number>>(
    ['pool-v3-incentive-simulate', owner, positionIndex],
    () => SingletonOraiswapV3.simulateIncentiveReward(owner, positionIndex),
    {
      refetchOnWindowFocus: false,
      placeholderData: {},
      enabled: !!openCollapse && !!positionIndex && !!owner
      // cacheTime: 5 * 60 * 1000
    }
  );

  return {
    simulation,
    refetchGetIncentiveSimulate
  };
};
