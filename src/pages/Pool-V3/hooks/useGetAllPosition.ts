import { Position } from '@oraichain/oraidex-contracts-sdk/build/OraiswapV3.types';
import { useQuery } from '@tanstack/react-query';
import SingletonOraiswapV3 from 'libs/contractSingleton';

export const useGetAllPositions = () => {
  const { data: allPosition, refetch: refetchAllPosition } = useQuery<Position[]>(
    ['pool-v3-all-position'],
    () => getAllPositions(),
    {
      refetchOnWindowFocus: false,
      placeholderData: [],
      // cacheTime: 5 * 60 * 1000
    }
  );

  return {
    allPosition,
    refetchAllPosition
  };
};

const getAllPositions = async (): Promise<Position[]> => {
  try {
    const positions = await SingletonOraiswapV3.getAllPosition();
    return positions;
  } catch (error) {
    console.error('Failed to fetch all positions:', error);
    return [];
  }
};
