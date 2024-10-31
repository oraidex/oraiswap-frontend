// import { PoolWithPoolKey } from '@oraichain/oraidex-contracts-sdk/build/OraiswapV3.types';
// import { LiquidityTick, PoolKey, poolKeyToString, Tickmap } from '@oraichain/oraiswap-v3';
// import { useQuery } from '@tanstack/react-query';
// import console from 'console';
// import SingletonOraiswapV3 from 'libs/contractSingleton';
// import { useEffect, useState } from 'react';

// export const useTickMap = () => {
//   const [liquidityTick, setLiquidityTick] = useState<Record<string, LiquidityTick[]>>({});
//   const [poolRecord, setPoolRecord] = useState<Record<string, PoolWithPoolKey>>({});
//   const { data, refetch, isLoading } = useQuery<{
//     tickMap: Record<string, Tickmap>;
//     poolList: Record<string, PoolWithPoolKey>;
//   }>(['tickmap'], () => getAllTickMap(), {
//     refetchOnWindowFocus: false,
//     placeholderData: {
//       tickMap: {},
//       poolList: {}
//     }
//     // cacheTime: 5 * 60 * 1000
//   });

//   useEffect(() => {
//     // console.log('data change', Object.keys(data.tickMap).length);
//     console.log('erer');
//     // if (Object.keys(data.tickMap).length > 0) {
//     //   (async () => {
//     //     const newLiquidityTick: Record<string, LiquidityTick[]> = {};
//     //     console.time('getAllLiquidityTicks');
//     //     for (const poolKeyStr of Object.keys(data.tickMap)) {
//     //       const liquidityTicks = await SingletonOraiswapV3.getAllLiquidityTicks(
//     //         stringToPoolKey(poolKeyStr),
//     //         data[poolKeyStr]
//     //       );
//     //       newLiquidityTick[poolKeyStr] = liquidityTicks;
//     //     }
//     //     console.timeEnd('getAllLiquidityTicks');

//     //     setLiquidityTick(newLiquidityTick);
//     //   })();
//     // }

//     // if (Object.keys(data.poolList).length > 0) {
//     //   const newPoolRecord: Record<string, PoolWithPoolKey> = {};
//     //   for (const poolKeyStr of Object.keys(data.poolList)) {
//     //     newPoolRecord[poolKeyStr] = data.poolList[poolKeyStr];
//     //   }
//     //   setPoolRecord(newPoolRecord);
//     // }
//   }, []);

//   return {
//     data,
//     poolRecord,
//     refetch,
//     isLoading,
//     liquidityTick
//   };
// };

// const getAllTickMap = async (): Promise<{
//   tickMap: Record<string, Tickmap>;
//   poolList: Record<string, PoolWithPoolKey>;
// }> => {
//   try {
//     console.time('getPool');
//     const poolList = await SingletonOraiswapV3.getPools();
//     const poolRecord: Record<string, PoolWithPoolKey> = {};
//     poolList.forEach((pool) => {
//       poolRecord[poolKeyToString(pool.pool_key)] = pool;
//     });
//     console.timeEnd('getPool');
//     console.time('getFullTickmap');
//     const allTickMap: Record<string, Tickmap> = {};
//     for (const pool of poolList) {
//       const poolKey: PoolKey = pool.pool_key;
//       const tickMap = await SingletonOraiswapV3.getFullTickmap(poolKey);
//       allTickMap[poolKeyToString(poolKey)] = tickMap;
//     }
//     console.timeEnd('getFullTickmap');
//     return {
//       tickMap: allTickMap,
//       poolList: poolRecord
//     };
//   } catch (error) {
//     console.error('Failed to fetch all tick map:', error);
//     return {
//       tickMap: {},
//       poolList: {}
//     };
//   }
// };
