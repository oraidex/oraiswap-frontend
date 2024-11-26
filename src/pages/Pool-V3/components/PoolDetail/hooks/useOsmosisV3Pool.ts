import { Themes } from "context/theme-context";
import useConfigReducer from "hooks/useConfigReducer";
import { getIconOsmosisPoolData, PoolWithTokenInfo } from "pages/Pool-V3/helpers/format";
import { useEffect, useMemo, useState } from "react";
import BootsIconDark from 'assets/icons/boost-icon-dark.svg?react';
import BootsIcon from 'assets/icons/boost-icon.svg?react';
import { OsmosisPoolDetail } from "@oraichain/oraidex-zapper/dist/amms/osmosis/types";
import { POOL_TYPE } from "pages/Pool-V3";
import { PoolAprInfo } from "libs/contractSingleton";
import { toUpper } from "lodash";
import { tickToSqrtPrice } from "@osmosis-labs/math";
import { Int } from "@keplr-wallet/unit";

const useOsmosisV3Pool = (poolId: string, theme: Themes) => {
    const [cachePrices] = useConfigReducer('coingecko');
    const address = useConfigReducer('cosmosAddress')[0]["osmosis-1"];
    const [osmosisDex,] = useConfigReducer("osmosisDex");
    const [pool, setPool] = useState<OsmosisPoolDetail>();
    const [poolDetail, setPoolDetail] = useState<PoolWithTokenInfo>();
    const [dataPosition, setDataPosition] = useState<any[]>([]);
    const [aprInfo, setAprInfo] = useState<{ [key: string]: PoolAprInfo; }>({});
    const isLight = theme === 'light';
    const IconBoots = isLight ? BootsIcon : BootsIconDark;
    const { FromTokenIcon, ToTokenIcon, tokenXInfo, tokenYInfo } = getIconOsmosisPoolData(pool?.raw.token0, pool?.raw.token1, theme === 'light');
    const isInactive = tokenXInfo?.name === 'BTC (Legacy)' || tokenYInfo?.name === 'BTC (Legacy)';

    useEffect(() => {
        (async () => {
            if (!poolDetail || !osmosisDex) return;
            const positions = (await osmosisDex.getUserPositions(address));
            // console.log(positions)
            const filteredPositions: any[] = [];
            for (const pos of positions) {
                if (pos.position.pool_id !== poolDetail.poolKey) continue;
                const asset = await osmosisDex.getPrincipleAsset(pos.position.position_id);
                filteredPositions.push({
                    pool_key: poolDetail.pool_key,
                    poolData: poolDetail,
                    tokenX: tokenXInfo,
                    tokenY: tokenYInfo,
                    tokenXName: tokenXInfo.name,
                    tokenYName: tokenYInfo.name,
                    ind: pos.position.position_id,
                    tokenXIcon: FromTokenIcon,
                    tokenYIcon: ToTokenIcon,
                    tokenXDecimal: getDecimals(tokenXInfo),
                    tokenYDecimal: getDecimals(tokenYInfo),
                    fee: poolDetail.feeTier / 10 ** 10,
                    min: tickToSqrtPrice(new Int(pos.position.lower_tick)).pow(new Int(2)).toString(),
                    max: tickToSqrtPrice(new Int(pos.position.upper_tick)).pow(new Int(2)).toString(),
                    tokenXUsd: cachePrices[tokenXInfo.coinGeckoId],
                    tokenYUsd: cachePrices[tokenYInfo.coinGeckoId],
                    tokenXLiq: Number(pos.asset0.amount) / 10 ** getDecimals(tokenXInfo),
                    tokenYLiq: Number(pos.asset1.amount) / 10 ** getDecimals(tokenYInfo),
                    tokenXLiqInUsd: Number(pos.asset0.amount) / 10 ** getDecimals(tokenXInfo) * cachePrices[tokenXInfo.coinGeckoId],
                    tokenYLiqInUsd: Number(pos.asset1.amount) / 10 ** getDecimals(tokenYInfo) * cachePrices[tokenYInfo.coinGeckoId],
                    // "valueX": 0.071156,
                    // "valueY": 0.071156,
                    address: address,
                    id: pos.position.position_id,
                    isActive: Number(pos.position.lower_tick) <= poolDetail.pool.current_tick_index && poolDetail.pool.current_tick_index < Number(pos.position.upper_tick),
                    // tokenXId: "oraichain-token",
                    principalAmountX: asset.principal.assets[0].amount,
                    principalAmountY: asset.principal.assets[1].amount,
                    totalEarn: 0,
                    totalEarnIncentiveUsd: 0

                });
            }
            setDataPosition(filteredPositions);
            // setDataPosition()
        })();
    }, [poolId, poolDetail, address, cachePrices, tokenXInfo, tokenYInfo, osmosisDex]);

    useEffect(() => {
        (async () => {
            if (osmosisDex) {
                const pool = await osmosisDex.getPoolDetail(poolId);
                setPool(pool);
                const { FromTokenIcon, ToTokenIcon, tokenXInfo, tokenYInfo } = getIconOsmosisPoolData(pool?.raw.token0, pool?.raw.token1, theme === 'light');
                setPoolDetail({
                    pool: {
                        liquidity: pool.raw.current_tick_liquidity,
                        sqrt_price: pool.raw.current_sqrt_price,
                        current_tick_index: Number(pool.raw.current_tick),
                        fee_growth_global_x: "0",
                        fee_growth_global_y: "0",
                        fee_protocol_token_x: "0",
                        fee_protocol_token_y: "0",
                        start_timestamp: 1722508001,
                        last_timestamp: 1732519480,
                        fee_receiver: "",
                        status: "opening",
                        incentives: []
                    },
                    pool_key: {
                        token_x: pool.raw.token0,
                        token_y: pool.raw.token1,
                        fee_tier: {
                            fee: Number(pool.raw.spread_factor) * 10 ** 12,
                            tick_spacing: Number(pool.raw.tick_spacing)
                        }
                    },
                    type: POOL_TYPE.V3,
                    poolKey: pool.id,
                    url: `/pools/v3/osmosis/${pool.id}`,
                    spread: 0.01,
                    feeTier: Number(pool.raw.spread_factor) * 10 ** 12,
                    tokenXInfo,
                    tokenYInfo,
                    FromTokenIcon,
                    ToTokenIcon
                })
                const aprInfo: { [key: string]: PoolAprInfo; } = {};

                aprInfo[poolId] = {
                    swapFee: {
                        min: Number(pool.incentives.aprBreakdown.swapFee.lower),
                        max: Number(pool.incentives.aprBreakdown.swapFee.upper)
                    },
                    incentivesApr: {
                        min: Number(pool.incentives.aprBreakdown.superfluid.lower) + Number(pool.incentives.aprBreakdown.osmosis.lower) + Number(pool.incentives.aprBreakdown.boost.lower),
                        max: Number(pool.incentives.aprBreakdown.superfluid.upper) + Number(pool.incentives.aprBreakdown.osmosis.upper) + Number(pool.incentives.aprBreakdown.boost.upper)
                    },
                    apr: {
                        min: Number(pool.incentives.aprBreakdown.total.lower),
                        max: Number(pool.incentives.aprBreakdown.total.upper)
                    },
                    incentives: pool.incentives.incentiveTypes.map(toUpper)
                }


                setAprInfo(aprInfo);
            }
        })();
    }, [osmosisDex, poolId]);
    const poolKeyString = poolId;

    const getDecimals = (token: any) => {
        return Number(token.decimals ? token.decimals : token.coinDecimals);
    }

    const [loading, setLoading] = useState(false);
    const totalLiquidity = pool?.totalFiatValueLocked;
    const volume24h = pool?.market.volume24hUsd;
    const [balanceX, balanceY] = useMemo(() => {
        return [
            Number(pool?.reserveCoins[0].amount) / 10 ** getDecimals(tokenXInfo) || 0,
            Number(pool?.reserveCoins[1].amount) / 10 ** getDecimals(tokenYInfo) || 0
        ]
    }, [pool, tokenXInfo, tokenYInfo]);

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
        fee: poolDetail?.feeTier,
    }
}

export default useOsmosisV3Pool;