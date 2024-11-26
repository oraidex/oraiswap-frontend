import useConfigReducer from "hooks/useConfigReducer";
import usePoolDetailV3Reducer from "hooks/usePoolDetailV3Reducer";
import { getIconOsmosisPoolData } from "pages/Pool-V3/helpers/format";
import { OptionType } from "pages/Pool-V3/hooks/useCreatePositionForm";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux"
import { tickToSqrtPrice } from "@osmosis-labs/math";
import { LiquidityChartData, setCurrentPrice, setHistoricalChartData, setLiquidityChartData, setNetwork, setPair, setPool, setPoolId, setPoolKey, setRawLiquidityChartData, setXRange, setYRange, TimeDuration, TokenPairHistoricalPrice } from "reducer/poolDetailV3";
import { Dec, Int } from "@keplr-wallet/unit";
import { CoinGeckoPrices } from "hooks/useCoingecko";
import { PoolFeeAndLiquidityDaily } from "libs/contractSingleton";
import { oraichainTokens } from "config/bridgeTokens";
import { BigDecimal, TokenItemType } from "@oraichain/oraidex-common";
import { osmosisPoolTokens } from "config/chainInfos";
import { AlphaRouter, RouteNoLiquidity, RouteNotFoundError, SpamTooManyRequestsError, ZapInResponse, Zapper } from "@oraichain/oraidex-zapper";
import { useDebounce } from "hooks/useDebounce";
import { executeMultiple } from "pages/Pool-V3/helpers/helper";
import { getCosmWasmClient } from "libs/cosmjs";

const TICK_SPACING_TO_RANGE = {
    '100': 500,
    '10': 7000,
    '1': 10000
};

const useOsmosisAddLiquidity = (
    poolString: string,
    slippage: number,
    extendPrices: CoinGeckoPrices<string>,
    feeDailyData: PoolFeeAndLiquidityDaily[],
    toggleZap: boolean) => {
    const dispatch = useDispatch();
    dispatch(setNetwork('osmosis'));
    const address = useConfigReducer('cosmosAddress')[0]["osmosis-1"];
    
    const [osmosisDex,] = useConfigReducer('osmosisDex');
    const [hoverPrice, setHoverPrice] = useState<number>(0);
    const [minPrice, setMinPrice] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(0);
    const [lowerTick, setLowerTick] = useState<number>(0);
    const [higherTick, setHigherTick] = useState<number>(0);
    const [optionType, setOptionType] = useState<OptionType>(OptionType.CUSTOM);
    const [isFullRange, setIsFullRange] = useState<boolean>(false);

    const poolId = usePoolDetailV3Reducer('poolId'); //
    const poolKey = usePoolDetailV3Reducer('poolKey'); //
    const pool = usePoolDetailV3Reducer('pool'); //
    const tokenX = usePoolDetailV3Reducer('tokenX'); //
    const tokenY = usePoolDetailV3Reducer('tokenY'); //
    const historicalRange = usePoolDetailV3Reducer('historicalRange'); //
    const cache3Month = usePoolDetailV3Reducer('cache3Month'); //
    const cache7Day = usePoolDetailV3Reducer('cache7Day'); //
    const cache1Month = usePoolDetailV3Reducer('cache1Month'); //
    const cache1Year = usePoolDetailV3Reducer('cache1Year'); //
    const historicalChartData = usePoolDetailV3Reducer('historicalChartData'); //
    const fullRange = usePoolDetailV3Reducer('fullRange'); //
    const xRange = usePoolDetailV3Reducer('xRange'); //
    const yRange = usePoolDetailV3Reducer('yRange'); //
    const currentPrice = usePoolDetailV3Reducer('currentPrice'); //
    const liquidityChartData = usePoolDetailV3Reducer('liquidityChartData'); //
    const fullTickMap = usePoolDetailV3Reducer('fullTickMap'); //
    const liquidityTicks = usePoolDetailV3Reducer('liquidityTicks'); //
    const zoom = usePoolDetailV3Reducer('zoom'); //
    const range = usePoolDetailV3Reducer('range'); //
    const isXToY = usePoolDetailV3Reducer('isXToY'); //

    useEffect(() => {
        if (poolString) {
            dispatch(setPoolId(poolString));
            if (osmosisDex) {
                (async () => {
                    const pool = await osmosisDex.getPoolDetail(poolString);
                    const { tokenXInfo, tokenYInfo } = getIconOsmosisPoolData(pool?.raw.token0, pool?.raw.token1, true);
                    dispatch(setPair({
                        tokenX: tokenXInfo,
                        tokenY: tokenYInfo
                    }))
                    dispatch(setPool({
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
                    }));
                    dispatch(setPoolKey({
                        token_x: pool.raw.token0,
                        token_y: pool.raw.token1,
                        fee_tier: {
                            fee: Number(pool.raw.spread_factor) * 10 ** 12,
                            tick_spacing: Number(pool.raw.tick_spacing)
                        }
                    }))
                    const currentPrice = (new Dec(pool.raw.current_sqrt_price)).pow(new Int(2)).toString();
                    dispatch(setCurrentPrice(Number(currentPrice)));
                    const historicalChartData = await osmosisDex.getAssetPairHistoricalPrice(
                        poolString,
                        pool.raw.token0,
                        pool.raw.token1,
                        '7d'
                    );
                    const convertedHistoricalChartData: TokenPairHistoricalPrice[] = historicalChartData.prices.map((item) => {
                        return {
                            time: Number(item.time),
                            close: Number(item.close),
                        }
                    });
                    dispatch(setHistoricalChartData(convertedHistoricalChartData));
                    dispatch(setYRange([Number(historicalChartData.min), Number(historicalChartData.max)]));

                })();
            }
        }
    }, [poolString, dispatch, osmosisDex]);

    useEffect(() => {
        if (yRange) {
            (async () => {
                const liquidityTicks = await osmosisDex.getLiquidityPerTickRange(poolString);
                const convertedLiquidityTicks: LiquidityChartData[] = liquidityTicks.map((item) => {
                    return {
                        depth: Number(item.liquidity_amount),
                        price: Number(tickToSqrtPrice(new Int(item.lower_tick)).pow(new Int(2)).toString())
                    }
                });
                const min = yRange[0];
                const max = yRange[1];
                console.log(convertedLiquidityTicks)

                const depths: { price: number; depth: number }[] = [];

                for (let price = min; price <= max; price += (max - min) / 20) {
                    const liquidityItem = convertedLiquidityTicks.find(
                        (item, index) => price >= item.price && price <= convertedLiquidityTicks[index + 1]?.price
                    );

                    let depth = liquidityItem ? liquidityItem.depth : 0;

                    depths.push({
                        price,
                        depth
                    });
                }

                dispatch(setRawLiquidityChartData(depths));
            })()
        }
    }, [yRange, poolString]);

    useEffect(() => {
        if (liquidityChartData) {
            const xRange = [0, Math.max(...liquidityChartData.map((d) => d.depth))];
            dispatch(setXRange(xRange as [number, number]));
        }
    }, [liquidityChartData, dispatch]);

    useEffect(() => {
        if (currentPrice) {
            setHoverPrice(currentPrice);
        }
    }, [currentPrice]);

    useEffect(() => {
        if (poolKey && pool && tokenX && tokenY) {
            resetPlot();
        }
    }, [poolKey, pool, tokenX, tokenY, isXToY]);

    const changeHistoricalRange = (range: TimeDuration) => {
        // dispatch(setHistoricalRange(range));
    };

    const flipToken = () => {
        // dispatch(setIsXToY(!isXToY));
    };

    const zoomIn = () => {
        // dispatch(setZoom(zoom - ZOOM_STEP));
    };

    const zoomOut = () => {
        // dispatch(setZoom(zoom + ZOOM_STEP));
    };

    const resetRange = () => {
        // dispatch(setZoom(1.1));
        resetPlot();
        setOptionType(OptionType.CUSTOM);
        // setApr(0);
    };

    const swapBaseToX = () => {
        if (!isXToY) {
            setOptionType(OptionType.CUSTOM);
            // dispatch(setIsXToY(true));
        }
    };

    const swapBaseToY = () => {
        if (isXToY) {
            setOptionType(OptionType.CUSTOM);
            // dispatch(setIsXToY(false));
        }
    };

    const resetPlot = () => {
        if (!pool) return;
        // changeHistoricalRange('7d');
        console.log(pool.current_tick_index);
        const higherTick = Math.round(Number(pool.current_tick_index)/100) * 100 +
            Number(poolKey.fee_tier.tick_spacing) * (TICK_SPACING_TO_RANGE[poolKey.fee_tier.tick_spacing] ?? 20);

        const lowerTick = Math.round(Number(pool.current_tick_index)/100) * 100 -
            Number(poolKey.fee_tier.tick_spacing) * (TICK_SPACING_TO_RANGE[poolKey.fee_tier.tick_spacing] ?? 20);

        console.log({ lowerTick, higherTick })
        setLowerTick(lowerTick);
        setHigherTick(higherTick);

        const minPrice = Number(tickToSqrtPrice(new Int(lowerTick)).pow(new Int(2)).toString())

        const maxPrice = Number(tickToSqrtPrice(new Int(higherTick)).pow(new Int(2)).toString())

        console.log({ minPrice, maxPrice })

        setMinPrice(minPrice);
        setMaxPrice(maxPrice);

        // setAmountX(0);
        // setAmountY(0);
    };

    const handleOptionCustom = () => {
        // changeHistoricalRange('7d');
        // resetPlot();
    };

    // wide: take the price range of prices in 3m
    const handleOptionWide = () => {
        // setIsFullRange(false);
        // changeHistoricalRange('3mo');
        // const data = cache3Month?.map(({ time, close }) => ({
        //     time,
        //     price: close
        // }));
        // data.push({
        //     time: Date.now(),
        //     price: currentPrice
        // });
        // const prices = data.map((d) => d.price);

        // const chartMin = cache3Month?.length > 0 ? Math.max(0, Math.min(...prices)) : currentPrice * 0.5;
        // const chartMax = cache3Month?.length > 0 ? Math.max(...prices) : currentPrice * 1.5;

        // if (isXToY) {
        //     setMinPrice(chartMin);
        //     setMaxPrice(chartMax);
        // } else {
        //     setMinPrice(chartMax);
        //     setMaxPrice(chartMin);
        // }
    };

    // narrow: take the price range of prices in 7d
    const handleOptionNarrow = () => {
        // setIsFullRange(false);
        // changeHistoricalRange('7d');
        // const data = cache7Day?.map(({ time, close }) => ({
        //     time,
        //     price: close
        // }));
        // data.push({
        //     time: Date.now(),
        //     price: currentPrice
        // });
        // const prices = data.map((d) => d.price);

        // const chartMin = cache7Day?.length > 0 ? Math.max(0, Math.min(...prices)) : currentPrice * 0.5;
        // const chartMax = cache7Day?.length > 0 ? Math.max(...prices) : currentPrice * 1.5;

        // if (isXToY) {
        //     setMinPrice(chartMin);
        //     setMaxPrice(chartMax);
        // } else {
        //     setMinPrice(chartMax);
        //     setMaxPrice(chartMin);
        // }
    };

    // full range: just set full range
    const handleOptionFullRange = () => {
        // const maxTick = getMaxTick(Number(poolKey.fee_tier.tick_spacing));
        // const maxPrice = calcPrice(maxTick, isXToY, tokenX.decimals, tokenY.decimals);
        // if (isXToY) {
        //     setMinPrice(0);
        //     setMaxPrice(maxPrice);
        // } else {
        //     setMinPrice(maxPrice);
        //     setMaxPrice(0);
        // }
        // setIsFullRange(true);
    };

    const getCorrespondingTickRange = (priceMin: number, priceMax: number) => {
        // try {
        //     if (isFullRange) {
        //         setLowerTick(getMinTick(Number(poolKey.fee_tier.tick_spacing)));
        //         setHigherTick(getMaxTick(Number(poolKey.fee_tier.tick_spacing)));
        //         return;
        //     }

        //     const sqrtPriceMin = priceToSqrtPriceBigInt(priceMin, tokenX.decimals - tokenY.decimals);
        //     const sqrtPriceMax = priceToSqrtPriceBigInt(priceMax, tokenX.decimals - tokenY.decimals);
        //     const lowerTick = getTickAtSqrtPrice(sqrtPriceMin, poolKey.fee_tier.tick_spacing);
        //     const higherTick = getTickAtSqrtPrice(sqrtPriceMax, poolKey.fee_tier.tick_spacing);
        //     if (isXToY) {
        //         if (lowerTick >= higherTick) {
        //             // set lower tick: higher tick - tick spacing, change to corresponding price
        //             const minPrice = calcPrice(
        //                 lowerTick - poolKey.fee_tier.tick_spacing * 10,
        //                 isXToY,
        //                 tokenX.decimals,
        //                 tokenY.decimals
        //             );
        //             setMinPrice(minPrice);
        //             return;
        //         }
        //     } else {
        //         if (lowerTick <= higherTick) {
        //             // set higher tick: lower tick + tick spacing, change to corresponding price
        //             const maxPrice = calcPrice(
        //                 higherTick + poolKey.fee_tier.tick_spacing * 10,
        //                 isXToY,
        //                 tokenX.decimals,
        //                 tokenY.decimals
        //             );
        //             setMaxPrice(maxPrice);
        //             return;
        //         }
        //     }

        //     setLowerTick(Math.min(lowerTick, higherTick));
        //     setHigherTick(Math.max(lowerTick, higherTick));
        // } catch (error) {
        //     console.log('error', error);
        // }
    };

    // useEffect(() => {
    //     if (isXBlocked || isYBlocked) {
    //         setApr(0);
    //         setZapApr(0);
    //     }
    // }, [isXBlocked, isYBlocked]);

    // TODO: move to zap hook
    const [tokenZap, setTokenZap] = useState<any>(osmosisPoolTokens.find((token) => token.name === 'USDC'));
    const [zapAmount, setZapAmount] = useState<number>(0);
    const [simulating, setSimulating] = useState<boolean>(false);
    const [zapError, setZapError] = useState<string>('');
    const [zapInResponse, setZapInResponse] = useState<ZapInResponse>();
    const [zapImpactPrice, setZapImpactPrice] = useState<number>(0);
    const [matchRate, setMatchRate] = useState<number>(0);
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [swapFee, setSwapFee] = useState<number>(0);
    const [totalFee, setTotalFee] = useState<number>(0);
    const [amountX, setAmountX] = useState<number>(0);
    const [amountY, setAmountY] = useState<number>(0);
    const [zapFee, setZapFee] = useState<number>(0);
    const [zapLoading, setZapLoading] = useState<boolean>(false);
    const [zapApr, setZapApr] = useState<number>(0);

    const debounceZapAmount = useDebounce(zapAmount, 1000);
    const debounceLowerTick = useDebounce(lowerTick, 1000);
    const debounceUpperTick = useDebounce(higherTick, 1000);

    const xUsd =
        zapInResponse &&
        tokenX &&
        ((extendPrices?.[tokenX?.coinGeckoId] * (amountX || 0)) / 10 ** (tokenX as any).coinDecimals).toFixed(6);
    const yUsd =
        zapInResponse &&
        tokenX &&
        ((extendPrices?.[tokenY?.coinGeckoId] * (amountY || 0)) / 10 ** (tokenY as any).coinDecimals).toFixed(6);
    const zapUsd = extendPrices?.[tokenZap?.coinGeckoId]
        ? (extendPrices[tokenZap.coinGeckoId] * Number(zapAmount || 0)).toFixed(6)
        : '0';

    useEffect(() => {
        if (Number(zapAmount) > 0 && toggleZap) {
            handleSimulateZapIn();
        }
    }, [debounceZapAmount, debounceLowerTick, debounceUpperTick]);

    useEffect(() => {
        if (Number(zapAmount) > 0 && !zapInResponse && !simulating) {
            setSimulating(true);
        }
        if (Number(zapAmount) === 0 || !zapAmount) {
            setZapInResponse(null);
        }
    }, [zapAmount, debounceZapAmount]);

    const zapIn = async (msg: any, walletAddress: string, onSuccess: any, onError: any) => {
        try {
            msg.zap_in_liquidity.token_min_amount_0 = "1";
            msg.zap_in_liquidity.token_min_amount_1 = "1";
            const { client } = await getCosmWasmClient({ chainId: 'osmosis-1', rpc: 'https://rpc.osmosis.zone/' });
            console.log({ client, address, msg, tokenZap });
            const tx = await client.execute(address, "osmo1jujj85k8nfvztux47lwks8f5q5hud0u70vp3zxae5wh5mtr0h0sq0j322x", msg, "auto", undefined,
                [
                    {
                        denom: tokenZap.denom,
                        amount: new BigDecimal(zapAmount, tokenZap.decimals).mul(10n ** BigInt(tokenZap.decimals)).toString()
                    }
                ]
            );

            if (tx) {
                onSuccess(tx);
            }

            return tx;
        } catch (e: any) {
            console.log('error', e);
            onError(e);
        }
    };

    const handleZapIn = async (walletAddress: string, onSuccess: (tx: string) => void, onFailed: any) => {
        try {
            if (tokenZap && zapAmount) {
                setZapLoading(true);
                await zapIn(
                    zapInResponse.message,
                    walletAddress,
                    onSuccess,
                    onFailed
                );
            }
        } catch (error) {
            console.error('error', error);
        } finally {
            setZapLoading(false);
        }
    };

    const handleSimulateZapIn = async () => {
        setSimulating(true);
        setZapLoading(true);
        let zapFee = 0; // FIXME: HARD code
        // let client: CosmWasmClient;
        // try {
        //     client = await CosmWasmClient.connect(network.rpc);
        //     const zap = new ZapperQueryClient(client, ZAPPER_CONTRACT);
        //     zapFee = Number((await zap.protocolFee()).percent);
        // } catch (error) {
        // console.error('Error handleSimulateZapIn fee:', error);
        // }

        try {
            const amountAfterFee = Number(zapAmount) * (1 - zapFee);

            const alphaRouter = new AlphaRouter(
                "https://osor.oraidex.io/smart-router/alpha-router",
                {
                    swapOptions: {
                        protocols: ["Osmosis"],
                        maxSplits: 1,
                    },
                }
            );

            const zapper = new Zapper(osmosisDex, alphaRouter);

            const amountIn = Math.round(amountAfterFee * 10 ** tokenZap.decimals).toString();
            const amountFee = Math.floor(zapFee * Number(zapAmount) * 10 ** tokenZap.decimals);

            setZapFee(amountFee);

            const lowerTick = Math.min(debounceLowerTick, debounceUpperTick);
            const upperTick = Math.max(debounceLowerTick, debounceUpperTick);

            console.log({
                poolId: poolId,
                tokenAmountIn: {
                    token: {
                        address: tokenZap.denom,
                        chainId: "osmosis-1",
                        decimals: tokenZap.decimals,
                    },
                    amount: BigInt(amountIn),
                },
                targetPosition: {
                    owner: address,
                    lowerTick: lowerTick,
                    upperTick: upperTick
                }
            })

            const result = await zapper.processZapIn({
                poolId: poolId,
                tokenAmountIn: {
                    token: {
                        address: tokenZap.denom,
                        chainId: "osmosis-1",
                        decimals: tokenZap.decimals,
                    },
                    amount: BigInt(amountIn),
                },
                targetPosition: {
                    owner: address,
                    lowerTick: lowerTick,
                    upperTick: upperTick
                }
            });

            console.log({ result });

            setAmountX(Number(result?.amountX));
            setAmountY(Number(result?.amountY));
            setSwapFee(result.swapFee * 100);
            // const inputUsd = extendPrices?.[tokenZap.coinGeckoId] * Number(amountAfterFee);
            // const outputUsd =
            //     extendPrices?.[tokenX.coinGeckoId] * (Number(result.amountX) / 10 ** tokenX.decimals) +
            //     extendPrices?.[tokenY.coinGeckoId] * (Number(result.amountY) / 10 ** tokenY.decimals);

            // const priceImpact = (Math.abs(inputUsd - outputUsd) / inputUsd) * 100;
            // const matchRate = 100 - priceImpact;

            // const swapFeeInUsd = amountAfterFee * result.swapFee * extendPrices?.[tokenZap.coinGeckoId];
            // const zapFeeInUsd = (Number(zapAmount) - amountAfterFee) * extendPrices?.[tokenZap.coinGeckoId];
            // const totalFeeInUsd = swapFeeInUsd + zapFeeInUsd;

            // setTotalFee(totalFeeInUsd);
            // setZapImpactPrice(priceImpact);
            setMatchRate(matchRate);
            setZapInResponse(result);
            setSimulating(false);
        } catch (error) {
            console.log('error', error);

            if (error instanceof RouteNotFoundError) {
                setZapError('No route found, try other tokens or other amount');
            } else if (error instanceof RouteNoLiquidity) {
                setZapError('No liquidity found for the swap route. Cannot proceed with the swap.');
            } else if (error instanceof SpamTooManyRequestsError) {
                setZapError('Too many requests, please try again later, after 1 minute');
            } else {
                console.error('Unexpected error during zap simulation:', error);
                setZapError('An unexpected error occurred, please try again later.');
            }
        } finally {
            setSimulating(false);
            setZapLoading(false);
        }
    };

    return {
        poolId,
        poolKey,
        pool,
        tokenX,
        tokenY,
        historicalRange,
        cache3Month,
        cache7Day,
        cache1Month,
        cache1Year,
        historicalChartData,
        fullRange,
        xRange,
        yRange,
        currentPrice,
        liquidityChartData,
        zoom,
        range,
        hoverPrice,
        minPrice,
        maxPrice,
        lowerTick,
        higherTick,
        isXToY,
        optionType,
        amountX: 0,
        amountY: 0,
        isXBlocked: false,
        isYBlocked: false,
        focusId: '',
        liquidity: 0,
        loading: false,
        apr: 0,
        tokenZap,
        zapAmount,
        zapInResponse,
        zapImpactPrice: 0,
        matchRate: 0,
        isVisible,
        zapFee: 0,
        totalFee: 0,
        swapFee,
        amountXZap: amountX,
        amountYZap: amountY,
        zapLoading,
        zapError,
        simulating,
        zapXUsd: xUsd,
        zapYUsd: yUsd,
        zapUsd: 0,
        zapApr: 0,
        setIsFullRange,
        setApr: () => { },
        setZapApr: () => { },
        handleOptionCustom,
        handleOptionWide,
        handleOptionNarrow,
        handleOptionFullRange,
        setTokenZap,
        setZapAmount,
        setAmountXZap: () => { },
        setAmountYZap: () => { },
        handleZapIn,
        handleSimulateZapIn,
        addLiquidity: () => { },
        changeRangeHandler: () => { },
        setAmountX: () => { },
        setAmountY: () => { },
        setFocusId: () => { },
        setOptionType,
        setLowerTick,
        setHigherTick,
        setMinPrice,
        setMaxPrice,
        setHoverPrice,
        changeHistoricalRange,
        zoomIn,
        zoomOut,
        resetRange,
        flipToken,
        swapBaseToX,
        swapBaseToY,
        setLoading: () => { },
    };
}

export default useOsmosisAddLiquidity;