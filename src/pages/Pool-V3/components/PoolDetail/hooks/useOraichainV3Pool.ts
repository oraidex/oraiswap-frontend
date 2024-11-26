import { poolKeyToString } from "@oraichain/oraiswap-v3";
import { Themes } from "context/theme-context";
import useConfigReducer from "hooks/useConfigReducer";
import SingletonOraiswapV3, { fetchPoolAprInfo, PoolAprInfo } from "libs/contractSingleton";
import { formatPoolData, getIconPoolData, PoolWithTokenInfo } from "pages/Pool-V3/helpers/format";
import { useGetAllPositions } from "pages/Pool-V3/hooks/useGetAllPosition";
import { useGetFeeDailyData } from "pages/Pool-V3/hooks/useGetFeeDailyData";
import { useGetPoolDetail } from "pages/Pool-V3/hooks/useGetPoolDetail";
import { useGetPoolLiquidityVolume } from "pages/Pool-V3/hooks/useGetPoolLiquidityVolume";
import { useGetPoolList } from "pages/Pool-V3/hooks/useGetPoolList";
import { useGetPositions } from "pages/Pool-V3/hooks/useGetPosition";
import { FunctionComponent, SVGProps, useEffect, useState } from "react";
import BootsIconDark from 'assets/icons/boost-icon-dark.svg?react';
import BootsIcon from 'assets/icons/boost-icon.svg?react';
import { convertPosition } from "pages/Pool-V3/helpers/helper";
import { getFeeClaimData } from "rest/graphClient";

const useOraichainV3Pool = (poolId: string, theme: Themes): {
    poolDetail: PoolWithTokenInfo;
    IconBoots: FunctionComponent<SVGProps<SVGSVGElement> & { title?: string; }>;
    isInactive: boolean;
    totalLiquidity: number;
    volume24h: number;
    aprInfo: { [key: string]: PoolAprInfo; };
    balanceX: any;
    balanceY: any;
    dataPosition: any[];
    loading: boolean;
    poolKeyString: string;
    FromTokenIcon: FunctionComponent<SVGProps<SVGSVGElement> & { title?: string; }>;
    ToTokenIcon: FunctionComponent<SVGProps<SVGSVGElement> & { title?: string; }>;
    tokenXInfo: any;
    tokenYInfo: any;
    fee: string;
} => {
    const [address] = useConfigReducer('address');
    const [cachePrices] = useConfigReducer('coingecko');
    const { poolList, poolPrice } = useGetPoolList(cachePrices);
    const { poolLiquidities, poolVolume } = useGetPoolLiquidityVolume(poolPrice);

    const [tokenX, tokenY, fee, tick] = poolId.split('-');
    const poolKeyString = poolKeyToString({
        token_x: tokenX,
        token_y: tokenY,
        fee_tier: {
            fee: Number(fee),
            tick_spacing: Number(tick)
        }
    });

    const isLight = theme === 'light';
    const IconBoots = isLight ? BootsIcon : BootsIconDark;
    const { FromTokenIcon, ToTokenIcon, tokenXInfo, tokenYInfo } = getIconPoolData(tokenX, tokenY, isLight);
    const isInactive = tokenXInfo?.name === 'BTC (Legacy)' || tokenYInfo?.name === 'BTC (Legacy)';

    const totalLiquidity = poolLiquidities?.[poolId] ?? 0;
    const volume24h = poolVolume?.[poolId] ?? 0;

    const [dataPosition, setDataPosition] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [poolDetail, setPoolDetail] = useState<PoolWithTokenInfo>();
    const [statusRemove, setStatusRemove] = useState<boolean>(undefined);
    const [liquidity, setLiquidity] = useState({
        total: totalLiquidity,
        allocation: {}
    });

    const { feeDailyData } = useGetFeeDailyData();
    const { allPosition } = useGetAllPositions();
    const { positions: userPositions } = useGetPositions(address);
    const { liquidityDistribution } = useGetPoolDetail(poolKeyString, poolPrice);

    useEffect(() => {
        (async () => {
            try {
                if (!(poolList.length && allPosition && poolId)) return;
                if (liquidityDistribution !== null) {
                    setLiquidity(liquidityDistribution);
                    return;
                }

                const pool = poolList.find((p) => poolKeyToString(p.pool_key) === poolKeyString);
                const liquidity = await SingletonOraiswapV3.getLiquidityByPool(pool, poolPrice, allPosition);
                setLiquidity(liquidity);
            } catch (error) {
                console.log('error: get pool detail', error);
            } finally {
                if (poolList.length === 0) {
                    return;
                }
                const pool = poolList.find((p) => poolKeyToString(p.pool_key) === poolKeyString);
                const isLight3 = theme === 'light';
                const fmtPool = formatPoolData(pool, isLight);
                setPoolDetail(fmtPool as any);
            }
        })();
    }, [poolId, allPosition, poolList, theme, poolPrice, poolKeyString, liquidityDistribution]);

    const [aprInfo, setAprInfo] = useConfigReducer('aprPools');
    useEffect(() => {
        const getAPRInfo = async () => {
            const res = await fetchPoolAprInfo(
                [poolDetail],
                poolPrice,
                {
                    [poolKeyString]: liquidity.total
                },
                feeDailyData
            );
            setAprInfo({
                ...aprInfo,
                [poolKeyString]: res[poolKeyString]
            });
        };

        if (poolDetail && poolPrice && liquidity && poolDetail.poolKey === poolKeyString) {
            getAPRInfo();
        }
    }, [liquidity.total, feeDailyData, poolDetail, poolPrice, poolKeyString]);

    const { spread, pool_key } = poolDetail || {};
    const { allocation, total } = liquidity;

    const [balanceX, balanceY] = [
        allocation[pool_key?.token_x]?.balance || 0,
        allocation[pool_key?.token_y]?.balance || 0
    ];

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                if (!(poolList.length && userPositions.length && poolPrice && address)) return setDataPosition([]);
                // if (dataPosition.length) return;
                const feeClaimData = await getFeeClaimData(address);

                const positionsMap = convertPosition({
                    positions: userPositions.map((po, ind) => ({ ...po, ind })),
                    poolsData: poolList,
                    cachePrices: poolPrice,
                    address,
                    isLight,
                    feeClaimData
                });
                const filteredPositions = positionsMap
                    .filter((pos) => poolKeyToString(pos.pool_key) === poolKeyString)
                    .sort((a, b) => a.token_id - b.token_id);

                setDataPosition(filteredPositions);
            } catch (error) {
                console.log({ error });
            } finally {
                setLoading(false);
                setStatusRemove(false);
            }
        })();

        return () => { };
    }, [address, poolList.length, userPositions]);

    return {
        poolDetail,
        IconBoots,
        isInactive,
        totalLiquidity,
        volume24h,
        aprInfo,
        balanceX,
        balanceY,
        dataPosition,
        loading,
        poolKeyString,
        FromTokenIcon,
        ToTokenIcon,
        tokenXInfo,
        tokenYInfo,
        fee,
    }
}

export default useOraichainV3Pool;