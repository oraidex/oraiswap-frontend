import { BigDecimal, toAmount, toDisplay, TokenItemType, CW20_DECIMALS } from '@oraichain/oraidex-common';
import {
  FeeTier,
  PoolKey,
  PoolWithPoolKey,
  TokenAmount
} from '@oraichain/oraidex-contracts-sdk/build/OraiswapV3.types';
import {
  calculateSqrtPrice,
  getLiquidityByX,
  getLiquidityByY,
  getMaxTick,
  getMinTick,
  isTokenX,
  newPoolKey,
  poolKeyToString,
  Price
} from '@oraichain/oraiswap-v3';
import { ReactComponent as WarningIcon } from 'assets/icons/warning-fill-ic.svg';
import classNames from 'classnames';
import { Button } from 'components/Button';
import Loader from 'components/Loader';
import { displayToast, TToastType } from 'components/Toasts/Toast';
import { getIcon, getTransactionUrl } from 'helper';
import { numberWithCommas } from 'helper/format';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import { useLoadOraichainTokens } from 'hooks/useLoadTokens';
import useTheme from 'hooks/useTheme';
import SingletonOraiswapV3 from 'libs/contractSingleton';
import {
  calculateTokenAmountsWithSlippage,
  calcYPerXPriceBySqrtPrice,
  InitPositionData
} from 'pages/Pool-V3/helpers/helper';
import { convertBalanceToBigint } from 'pages/Pool-V3/helpers/number';
import useAddLiquidity from 'pages/Pool-V3/hooks/useAddLiquidity';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import NumberFormat from 'react-number-format';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configure';
import NewPositionNoPool from '../NewPositionNoPool';
import {
  calcPrice,
  calcTicksAmountInRange,
  calculateConcentrationRange,
  determinePositionTokenBlock,
  extractDenom,
  getConcentrationArray,
  getTickAtSqrtPriceFromBalance,
  handleGetCurrentPlotTicks,
  nearestTickIndex,
  PlotTickData,
  PositionTokenBlock,
  printBigint,
  TickPlotPositionData,
  toMaxNumericPlaces,
  trimLeadingZeros
} from '../PriceRangePlot/utils';
import styles from './index.module.scss';
import { useNavigate } from 'react-router-dom';
import { extractAddress } from 'pages/Pool-V3/helpers/format';

export type PriceInfo = {
  startPrice: number;
  minPrice?: number;
  maxPrice?: number;
};

export enum TYPE_CHART {
  CONTINUOUS,
  DISCRETE
}

interface CreatePoolFormProps {
  tokenFrom: TokenItemType;
  tokenTo: TokenItemType;
  feeTier: FeeTier;
  poolData: any; // Replace with appropriate type
  slippage: number;
  onCloseModal: () => void;
}

const CreatePoolForm: FC<CreatePoolFormProps> = ({ tokenFrom, tokenTo, feeTier, poolData, slippage, onCloseModal }) => {
  const navigate = useNavigate();
  const amounts = useSelector((state: RootState) => state.token.amounts);
  const { data: prices } = useCoinGeckoPrices();
  const [walletAddress] = useConfigReducer('address');
  const theme = useTheme();
  const [priceInfo, setPriceInfo] = useState<PriceInfo>({
    startPrice: 1.0
  });

  const loadOraichainToken = useLoadOraichainTokens();
  const [focusId, setFocusId] = useState<'from' | 'to' | null>(null);

  const [notInitPoolKey, setNotInitPoolKey] = useState<PoolKey>({
    token_x: tokenFrom?.denom || '',
    token_y: tokenTo?.denom || '',
    fee_tier: {
      fee: feeTier.fee,
      tick_spacing: feeTier.tick_spacing
    }
  });

  const [leftRange, setLeftRange] = useState(getMinTick(notInitPoolKey.fee_tier.tick_spacing));
  const [rightRange, setRightRange] = useState(getMaxTick(notInitPoolKey.fee_tier.tick_spacing));

  const [, setLeftInput] = useState('');
  const [, setRightInput] = useState('');

  const [, setLeftInputRounded] = useState('');
  const [, setRightInputRounded] = useState('');

  const [plotMin, setPlotMin] = useState(0);
  const [plotMax, setPlotMax] = useState(1);

  const [isPoolExist, setIsPoolExist] = useState(false);

  const [poolInfo, setPoolInfo] = useState<PoolWithPoolKey>();

  const [midPrice, setMidPrice] = useState<TickPlotPositionData>(() => {
    const isXToY = isTokenX(extractAddress(tokenFrom), extractAddress(tokenTo));

    const tokenXDecimals = isXToY ? tokenFrom?.decimals ?? 6 : tokenTo?.decimals ?? 6;
    const tokenYDecimals = isXToY ? tokenTo?.decimals ?? 6 : tokenFrom?.decimals ?? 6;

    const tickIndex = nearestTickIndex(
      priceInfo.startPrice,
      feeTier.tick_spacing,
      isXToY,
      tokenXDecimals,
      tokenYDecimals
    );

    return {
      index: tickIndex,
      x: calcPrice(tickIndex, isXToY, tokenXDecimals, tokenYDecimals)
    };
  });

  const isXtoY = useMemo(() => {
    if (tokenFrom && tokenTo) {
      return extractDenom(tokenFrom) < extractDenom(tokenTo);
    }
    return true;
  }, [tokenFrom, tokenTo]);

  const [amountTo, setAmountTo] = useState<number | string>();
  const [amountFrom, setAmountFrom] = useState<number | string>();
  const fromUsd = (prices?.[tokenFrom?.coinGeckoId] * Number(amountFrom || 0)).toFixed(6);
  const toUsd = (prices?.[tokenTo?.coinGeckoId] * Number(amountTo || 0)).toFixed(6);

  const isLightTheme = theme === 'light';
  const TokenFromIcon =
    tokenFrom &&
    getIcon({
      isLightTheme,
      type: 'token',
      coinGeckoId: tokenFrom.coinGeckoId,
      width: 30,
      height: 30
    });

  const TokenToIcon =
    tokenTo &&
    getIcon({
      isLightTheme,
      type: 'token',
      coinGeckoId: tokenTo.coinGeckoId,
      width: 30,
      height: 30
    });

  useEffect(() => {
    if (focusId === 'from') {
      setAmountTo(
        getOtherTokenAmount(
          toAmount(amountFrom, tokenFrom.decimals).toString(),
          Number(leftRange),
          Number(rightRange),
          true
        )
      );
    }
  }, [amountFrom, focusId]);

  useEffect(() => {
    if (focusId === 'to') {
      setAmountFrom(
        getOtherTokenAmount(
          toAmount(amountTo, tokenTo.decimals).toString(),
          Number(leftRange),
          Number(rightRange),
          false
        )
      );
    }
  }, [amountTo, focusId]);

  const positionOpeningMethod = 'range'; // always range

  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const concentrationArray = useMemo(
    () =>
      getConcentrationArray(Number(notInitPoolKey.fee_tier.tick_spacing), 2, Number(midPrice)).sort((a, b) => a - b),
    [notInitPoolKey.fee_tier.tick_spacing]
  );

  const liquidityRef = useRef<any>(0n);

  const [_concentrationIndex, setConcentrationIndex] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [liquidityData, setLiquidityData] = useState<PlotTickData[]>([]);

  useEffect(() => {
    if (isMountedRef.current && liquidityData) {
      resetPlot();
    }
  }, [liquidityData]);

  useEffect(() => {
    checkNoPool(feeTier, tokenFrom, tokenTo);
  }, [feeTier, tokenFrom, tokenTo, isPoolExist]);

  const zoomMinus = () => {
    const diff = plotMax - plotMin;
    const newMin = plotMin - diff / 4;
    const newMax = plotMax + diff / 4;
    setPlotMin(newMin);
    setPlotMax(newMax);
  };

  const zoomPlus = () => {
    const diff = plotMax - plotMin;
    const newMin = plotMin + diff / 6;
    const newMax = plotMax - diff / 6;

    if (
      calcTicksAmountInRange(
        Math.max(newMin, 0),
        newMax,
        Number(notInitPoolKey.fee_tier.tick_spacing),
        isXtoY,
        tokenFrom.decimals,
        tokenTo.decimals
      ) >= 4
    ) {
      setPlotMin(newMin);
      setPlotMax(newMax);
    }
  };

  const getTicksInsideRange = (left: number, right: number, isXtoY: boolean) => {
    const leftMax = isXtoY
      ? getMinTick(notInitPoolKey.fee_tier.tick_spacing)
      : getMaxTick(notInitPoolKey.fee_tier.tick_spacing);
    const rightMax = isXtoY
      ? getMaxTick(notInitPoolKey.fee_tier.tick_spacing)
      : getMinTick(notInitPoolKey.fee_tier.tick_spacing);

    let leftInRange: number;
    let rightInRange: number;

    if (isXtoY) {
      leftInRange = left < leftMax ? leftMax : left;
      rightInRange = right > rightMax ? rightMax : right;
    } else {
      leftInRange = left > leftMax ? leftMax : left;
      rightInRange = right < rightMax ? rightMax : right;
    }

    return { leftInRange, rightInRange };
  };

  const setLeftInputValues = (val: string) => {
    setLeftInput(val);
    setLeftInputRounded(toMaxNumericPlaces(+val, 5));
  };

  const setRightInputValues = (val: string) => {
    setRightInput(val);
    setRightInputRounded(toMaxNumericPlaces(+val, 5));
  };

  const onChangeRange = (left: number, right: number) => {
    let leftRange: number;
    let rightRange: number;

    // if (positionOpeningMethod === 'range') {
    const { leftInRange, rightInRange } = getTicksInsideRange(left, right, isXtoY);
    leftRange = leftInRange;
    rightRange = rightInRange;
    // } else {
    //   leftRange = left;
    //   rightRange = right;
    // }
    // leftRange = left;
    // rightRange = right;

    setLeftRange(Number(left));
    setRightRange(Number(right));

    if (tokenFrom && (isXtoY ? rightRange > midPrice.index : rightRange < midPrice.index)) {
      const deposit = amountFrom;
      const amount = getOtherTokenAmount(
        convertBalanceToBigint((deposit || '0').toString(), tokenFrom.decimals).toString(),
        Number(leftRange),
        Number(rightRange),
        true
      );

      if (tokenTo && +deposit !== 0) {
        setAmountFrom(deposit);
        setAmountTo(amount);
        return;
      }
    }

    if (tokenTo && (isXtoY ? leftRange < midPrice.index : leftRange > midPrice.index)) {
      const deposit = amountTo;
      const amount = getOtherTokenAmount(
        convertBalanceToBigint((deposit || '0').toString(), tokenTo.decimals).toString(),
        Number(leftRange),
        Number(rightRange),
        false
      );

      if (tokenFrom && +deposit !== 0) {
        setAmountTo(deposit);
        setAmountFrom(amount);
      }
    }
  };

  const changeRangeHandler = (left: number, right: number) => {
    let leftRange: number;
    let rightRange: number;

    if (positionOpeningMethod === 'range') {
      const { leftInRange, rightInRange } = getTicksInsideRange(left, right, isXtoY);
      leftRange = leftInRange;
      rightRange = rightInRange;
    } else {
      leftRange = left;
      rightRange = right;
    }

    setLeftRange(Number(leftRange));
    setRightRange(Number(rightRange));

    const tokenXDecimals = isXtoY ? tokenFrom.decimals : tokenTo.decimals;
    const tokenYDecimals = isXtoY ? tokenTo.decimals : tokenFrom.decimals;

    setLeftInputValues(calcPrice(Number(leftRange), isXtoY, tokenXDecimals, tokenYDecimals).toString());
    setRightInputValues(calcPrice(Number(rightRange), isXtoY, tokenXDecimals, tokenYDecimals).toString());

    onChangeRange(left, right);
  };

  const resetPlot = () => {
    if (positionOpeningMethod === 'range') {
      const tokenXDecimals = isXtoY ? tokenFrom.decimals : tokenTo.decimals;
      const tokenYDecimals = isXtoY ? tokenTo.decimals : tokenFrom.decimals;
      const initSideDist = Math.abs(
        midPrice.x -
          calcPrice(
            Math.max(
              getMinTick(notInitPoolKey.fee_tier.tick_spacing),
              Number(midPrice.index) - notInitPoolKey.fee_tier.tick_spacing * 15
            ),
            isXtoY,
            tokenXDecimals,
            tokenYDecimals
          )
      );

      const higherTick = Math.max(
        Number(getMinTick(Number(notInitPoolKey.fee_tier.tick_spacing))),
        Number(midPrice.index) - Number(notInitPoolKey.fee_tier.tick_spacing) * 10
      );

      const lowerTick = Math.min(
        Number(getMaxTick(Number(notInitPoolKey.fee_tier.tick_spacing))),
        Number(midPrice.index) + Number(notInitPoolKey.fee_tier.tick_spacing) * 10
      );

      changeRangeHandler(isXtoY ? higherTick : lowerTick, isXtoY ? lowerTick : higherTick);

      setPlotMin(midPrice.x - initSideDist);
      setPlotMax(midPrice.x + initSideDist);
    } else {
      setConcentrationIndex(0);
      const { leftRange, rightRange } = calculateConcentrationRange(
        1,
        concentrationArray[0],
        2,
        midPrice.index,
        isXtoY
      );
      changeRangeHandler(leftRange, rightRange);
      autoZoomHandler(leftRange, rightRange, true);
    }
  };

  const autoZoomHandler = (left: number, right: number, canZoomCloser: boolean = false) => {
    const leftX = calcPrice(left, isXtoY, tokenFrom.decimals, tokenTo.decimals);
    const rightX = calcPrice(right, isXtoY, tokenFrom.decimals, tokenTo.decimals);

    const higherLeftIndex = Math.max(
      getMinTick(notInitPoolKey.fee_tier.tick_spacing),
      left - notInitPoolKey.fee_tier.tick_spacing * 15
    );

    const lowerLeftIndex = Math.min(
      getMaxTick(notInitPoolKey.fee_tier.tick_spacing),
      left + notInitPoolKey.fee_tier.tick_spacing * 15
    );

    const lowerRightIndex = Math.min(
      getMaxTick(notInitPoolKey.fee_tier.tick_spacing),
      right + notInitPoolKey.fee_tier.tick_spacing * 15
    );

    const higherRightIndex = Math.max(
      getMinTick(notInitPoolKey.fee_tier.tick_spacing),
      right - notInitPoolKey.fee_tier.tick_spacing * 15
    );

    if (leftX < plotMin || rightX > plotMax || canZoomCloser) {
      const leftDist = Math.abs(
        leftX - calcPrice(isXtoY ? higherLeftIndex : lowerLeftIndex, isXtoY, tokenFrom.decimals, tokenTo.decimals)
      );
      const rightDist = Math.abs(
        rightX - calcPrice(isXtoY ? lowerRightIndex : higherRightIndex, isXtoY, tokenFrom.decimals, tokenTo.decimals)
      );

      let dist;

      if (leftX < plotMin && rightX > plotMax) {
        dist = Math.max(leftDist, rightDist);
      } else if (leftX < plotMin) {
        dist = leftDist;
      } else {
        dist = rightDist;
      }

      setPlotMin(leftX - dist);
      setPlotMax(rightX + dist);
    }
  };

  const checkNoPool = async (
    fee: FeeTier,
    tokenFrom: TokenItemType | undefined,
    tokenTo: TokenItemType | undefined
  ) => {
    if (fee && tokenFrom && tokenTo) {
      const denom_x = extractAddress(tokenFrom);
      const denom_y = extractAddress(tokenTo);
      const token_x = denom_x < denom_y ? denom_x : denom_y;
      const token_y = denom_x < denom_y ? denom_y : denom_x;
      try {
        const pool = await SingletonOraiswapV3.getPool({
          fee_tier: fee,
          token_x: token_x,
          token_y: token_y
        });
        if (pool) {
          setPoolInfo(pool);
          setNotInitPoolKey(pool.pool_key);
        } else {
          const isXToY = isTokenX(extractAddress(tokenFrom), extractAddress(tokenTo));
          const tokenXDecimals = isXtoY ? tokenFrom.decimals : tokenTo.decimals;
          const tokenYDecimals = isXtoY ? tokenTo.decimals : tokenFrom.decimals;
          const tickIndex = nearestTickIndex(
            priceInfo.startPrice,
            feeTier.tick_spacing,
            isXToY,
            tokenXDecimals,
            tokenYDecimals
          );
          setMidPrice({
            index: tickIndex,
            x: calcPrice(tickIndex, isXtoY, tokenXDecimals, tokenYDecimals)
          });
          setNotInitPoolKey({
            fee_tier: fee,
            token_x: token_x,
            token_y: token_y
          });
        }
        setIsPoolExist(pool !== null);
        return;
      } catch (error) {
        const isXToY = isTokenX(extractAddress(tokenFrom), extractAddress(tokenTo));
        const tokenXDecimals = isXtoY ? tokenFrom.decimals : tokenTo.decimals;
        const tokenYDecimals = isXtoY ? tokenTo.decimals : tokenFrom.decimals;
        const tickIndex = nearestTickIndex(
          priceInfo.startPrice,
          feeTier.tick_spacing,
          isXToY,
          tokenXDecimals,
          tokenYDecimals
        );
        setMidPrice({
          index: tickIndex,
          x: calcPrice(tickIndex, isXtoY, tokenXDecimals, tokenYDecimals)
        });
        setNotInitPoolKey({
          fee_tier: fee,
          token_x: token_x,
          token_y: token_y
        });
        setIsPoolExist(false);
      }
      return;
    } else {
      setIsPoolExist(false);
    }
  };

  const calcAmount = (amount: TokenAmount, left: number, right: number, tokenAddress: string) => {
    if (!notInitPoolKey) return BigInt(0);
    if (!tokenFrom || !tokenTo || isNaN(left) || isNaN(right)) {
      return BigInt(0);
    }

    const byX = tokenAddress === (isXtoY ? extractDenom(tokenFrom) : extractDenom(tokenTo));

    const lowerTick = Math.min(left, right);
    const upperTick = Math.max(left, right);

    try {
      if (byX) {
        const { amount: tokenYAmount, l: positionLiquidity } = getLiquidityByX(
          BigInt(amount),
          lowerTick,
          upperTick,
          isPoolExist ? BigInt(poolInfo.pool.sqrt_price) : calculateSqrtPrice(midPrice.index),
          true
        );

        let [, yAmountWithSlippage] = calculateTokenAmountsWithSlippage(
          notInitPoolKey.fee_tier.tick_spacing,
          isPoolExist ? BigInt(poolInfo.pool.sqrt_price) : calculateSqrtPrice(midPrice.index),
          positionLiquidity,
          lowerTick,
          upperTick,
          Number(slippage),
          true
        );
        const finalYAmount = yAmountWithSlippage > tokenYAmount ? yAmountWithSlippage : tokenYAmount;

        if (isMountedRef.current) {
          liquidityRef.current = positionLiquidity;
        }

        return finalYAmount;
      }

      const { amount: tokenXAmount, l: positionLiquidity } = getLiquidityByY(
        BigInt(amount),
        lowerTick,
        upperTick,
        isPoolExist ? BigInt(poolInfo.pool.sqrt_price) : calculateSqrtPrice(midPrice.index),
        true
      );

      let [xAmountWithSlippage] = calculateTokenAmountsWithSlippage(
        notInitPoolKey.fee_tier.tick_spacing,
        isPoolExist ? BigInt(poolInfo.pool.sqrt_price) : calculateSqrtPrice(midPrice.index),
        positionLiquidity,
        lowerTick,
        upperTick,
        Number(slippage),
        true
      );
      const finalXAmount = xAmountWithSlippage > tokenXAmount ? xAmountWithSlippage : tokenXAmount;

      if (isMountedRef.current) {
        liquidityRef.current = positionLiquidity;
      }

      return finalXAmount;
    } catch (error) {
      console.log('error', error);
      const result = (byX ? getLiquidityByY : getLiquidityByX)(
        BigInt(amount),
        lowerTick,
        upperTick,
        isPoolExist ? BigInt(poolInfo.pool.sqrt_price) : calculateSqrtPrice(midPrice.index),
        true
      );

      let [xAmountWithSlippage, yAmountWithSlippage] = calculateTokenAmountsWithSlippage(
        notInitPoolKey.fee_tier.tick_spacing,
        isPoolExist ? BigInt(poolInfo.pool.sqrt_price) : calculateSqrtPrice(midPrice.index),
        result.l,
        lowerTick,
        upperTick,
        Number(slippage),
        true
      );

      if (isMountedRef.current) {
        liquidityRef.current = result.l;
      }
      if (byX) {
        return yAmountWithSlippage > result.amount ? yAmountWithSlippage : result.amount;
      } else {
        return xAmountWithSlippage > result.amount ? xAmountWithSlippage : result.amount;
      }
    }
  };

  const getOtherTokenAmount = (amount: TokenAmount, left: number, right: number, byFirst: boolean) => {
    const [printToken, calcToken] = byFirst ? [tokenTo, tokenFrom] : [tokenFrom, tokenTo];

    if (!printToken || !calcToken) {
      return '0.0';
    }

    const result = calcAmount(amount, left, right, extractDenom(calcToken));

    return trimLeadingZeros(printBigint(result, printToken.decimals));
  };

  const onChangeMidPrice = (mid: Price) => {
    const convertedMid = Number(mid);

    const tokenXDecimals = isXtoY ? tokenFrom.decimals : tokenTo.decimals;
    const tokenYDecimals = isXtoY ? tokenTo.decimals : tokenFrom.decimals;

    setMidPrice({
      index: convertedMid,
      x: calcPrice(convertedMid, isXtoY, tokenXDecimals, tokenYDecimals)
    });
    setPriceInfo({
      ...priceInfo,
      startPrice: calcPrice(convertedMid, isXtoY, tokenXDecimals, tokenYDecimals)
    });

    if (amountFrom && (isXtoY ? rightRange > convertedMid : rightRange < convertedMid)) {
      const deposit = amountFrom;
      const amount = getOtherTokenAmount(
        convertBalanceToBigint((deposit || '0').toString(), tokenFrom.decimals).toString(),
        leftRange,
        rightRange,
        true
      );
      if (tokenTo && +deposit !== 0) {
        setAmountFrom(deposit);
        setAmountTo(amount);
        return;
      }
    }
    if (amountTo && (isXtoY ? leftRange < convertedMid : leftRange > convertedMid)) {
      const deposit = amountTo;
      const amount = getOtherTokenAmount(
        convertBalanceToBigint((deposit || '0').toString(), tokenTo.decimals).toString(),
        leftRange,
        rightRange,
        false
      );
      if (tokenFrom && +deposit !== 0) {
        setAmountTo(deposit);
        setAmountFrom(amount);
      }
    }
  };

  const handleSuccessAdd = async () => {
    try {
      await checkNoPool(feeTier, tokenFrom, tokenTo);

      if (isPoolExist && notInitPoolKey) {
        handleGetTicks();
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  useEffect(() => {
    handleGetTicks();
  }, [isPoolExist, notInitPoolKey, isXtoY]);

  useEffect(() => {
    if (poolInfo) {
      setMidPrice({
        index: poolInfo.pool.current_tick_index,
        x:
          calcYPerXPriceBySqrtPrice(BigInt(poolInfo.pool.sqrt_price), tokenFrom.decimals, tokenTo.decimals) **
          (isXtoY ? 1 : -1)
      });
    }
  }, [poolInfo, isXtoY, tokenFrom, tokenTo]);

  const [isFromBlocked, setIsFromBlocked] = useState(false);
  const [isToBlocked, setIsToBlocked] = useState(false);

  useEffect(() => {
    const fromBlocked =
      determinePositionTokenBlock(
        isPoolExist ? BigInt(poolData.pool?.sqrt_price || 0) : calculateSqrtPrice(midPrice.index),
        Math.min(Number(leftRange), Number(rightRange)),
        Math.max(Number(leftRange), Number(rightRange)),
        isXtoY
      ) === PositionTokenBlock.A;

    const toBlocked =
      determinePositionTokenBlock(
        isPoolExist ? BigInt(poolData.pool?.sqrt_price || 0) : calculateSqrtPrice(midPrice.index),
        Math.min(Number(leftRange), Number(rightRange)),
        Math.max(Number(leftRange), Number(rightRange)),
        isXtoY
      ) === PositionTokenBlock.B;

    setIsFromBlocked(fromBlocked);
    setIsToBlocked(toBlocked);
  }, [isPoolExist, poolData, midPrice, leftRange, rightRange, isXtoY]);

  const getButtonMessage = () => {
    const isInsufficientTo =
      amountTo && Number(amountTo) > toDisplay(amounts[tokenTo.denom], tokenTo.decimals || CW20_DECIMALS);
    const isInsufficientFrom =
      amountFrom && Number(amountFrom) > toDisplay(amounts[tokenFrom.denom], tokenFrom.decimals || CW20_DECIMALS);

    if (!walletAddress) {
      return 'Connect wallet';
    }

    if (!tokenFrom || !tokenTo) {
      return 'Select tokens';
    }

    if (tokenFrom.denom === tokenTo.denom) {
      return 'Select different tokens';
    }

    if (isInsufficientFrom) {
      return `Insufficient ${tokenFrom.name.toUpperCase()}`;
    }

    if (isInsufficientTo) {
      return `Insufficient ${tokenTo.name.toUpperCase()}`;
    }

    if ((!isFromBlocked && (!amountFrom || +amountFrom === 0)) || (!isToBlocked && (!amountTo || +amountTo === 0))) {
      return 'Liquidity must be greater than 0';
    }

    return 'Create new pool';
  };

  const { handleInitPosition } = useAddLiquidity();
  const addLiquidity = async (data: InitPositionData) => {
    setLoading(true);

    try {
      await handleInitPosition(
        data,
        walletAddress,
        (tx: string) => {
          displayToast(TToastType.TX_SUCCESSFUL, {
            customLink: getTransactionUrl('Oraichain', tx)
          });
          handleSuccessAdd();
          loadOraichainToken(walletAddress, [tokenFrom.contractAddress, tokenTo.contractAddress].filter(Boolean));
          onCloseModal();
          navigate(`/pools/v3/${encodeURIComponent(poolKeyToString(data.poolKeyData))}`);
        },
        (e) => {
          displayToast(TToastType.TX_FAILED, {
            message: 'Add liquidity failed!'
          });
        }
      );
    } catch (error) {
      console.log('error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetTicks = () => {
    try {
      const fetchTickData = async () => {
        setLoading(true);

        const ticksData = await handleGetCurrentPlotTicks({
          poolKey: notInitPoolKey,
          isXtoY: isXtoY,
          xDecimal: tokenFrom.decimals,
          yDecimal: tokenTo.decimals
        });

        setLiquidityData(ticksData);
      };

      if (isPoolExist && notInitPoolKey) {
        fetchTickData();
      }
    } catch (error) {
      console.log('error: >> liquidity', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetTicks();
  }, [isPoolExist, notInitPoolKey, isXtoY]);

  return (
    <div className={styles.createPoolForm}>
      {(isToBlocked || isFromBlocked) && (
        <div className={classNames(styles.warning)}>
          <div>
            <WarningIcon />
          </div>
          <span>
            Your position will not earn fees or be used in trades until the market price moves into your range.
          </span>
        </div>
      )}
      <div className={styles.item}>
        <NewPositionNoPool
          fromToken={tokenFrom} // symbol + decimal
          toToken={tokenTo} // symbol + decimal
          priceInfo={priceInfo} // startPrice, minPrice, maxPrice
          setPriceInfo={setPriceInfo} // setStartPrice, setMinPrice, setMaxPrice
          onChangeMidPrice={onChangeMidPrice}
          tickSpacing={notInitPoolKey.fee_tier.tick_spacing}
          isXtoY={isXtoY}
          onChangeRange={changeRangeHandler}
          midPrice={midPrice.index}
          showOnCreatePool
        />
      </div>
      <div className={classNames(styles.itemInput, { [styles.disabled]: isFromBlocked })}>
        <div className={styles.balance}>
          <p className={styles.bal}>
            <span>Balance:</span> {numberWithCommas(toDisplay(amounts[tokenFrom?.denom] || '0', tokenFrom.decimals))}{' '}
            {tokenFrom?.name}
          </p>
          <div className={styles.btnGroup}>
            <button
              className=""
              disabled={!tokenFrom}
              onClick={() => {
                const val = toDisplay(amounts[tokenFrom?.denom] || '0', tokenFrom.decimals);
                const haftValue = new BigDecimal(val).div(2).toNumber();
                setAmountFrom(haftValue);
                setFocusId('from');
              }}
            >
              50%
            </button>
            <button
              className=""
              disabled={!tokenFrom}
              onClick={() => {
                const val = toDisplay(amounts[tokenFrom?.denom] || '0', tokenFrom.decimals);
                setAmountFrom(val);
                setFocusId('from');
              }}
            >
              100%
            </button>
          </div>
        </div>
        <div className={styles.tokenInfo}>
          <div className={styles.name}>
            {TokenFromIcon ? (
              <>
                {TokenFromIcon}
                &nbsp;{tokenFrom.name}
              </>
            ) : (
              'Select Token'
            )}
          </div>
          <div className={styles.input}>
            <NumberFormat
              onFocus={() => setFocusId('from')}
              onBlur={() => setFocusId(null)}
              placeholder="0"
              thousandSeparator
              className={styles.amount}
              decimalScale={tokenFrom?.decimals || 6}
              disabled={isFromBlocked}
              type="text"
              value={amountFrom}
              onChange={() => {}}
              isAllowed={(values) => {
                const { floatValue } = values;
                // allow !floatValue to let user can clear their input
                return !floatValue || (floatValue >= 0 && floatValue <= 1e14);
              }}
              onValueChange={({ floatValue }) => {
                setAmountFrom(floatValue);
              }}
            />
            <div className={styles.usd}>
              ≈ ${amountFrom ? numberWithCommas(Number(fromUsd) || 0, undefined, { maximumFractionDigits: 6 }) : 0}
            </div>
          </div>
        </div>
      </div>
      <div className={classNames(styles.itemInput, { [styles.disabled]: isToBlocked })}>
        <div className={styles.balance}>
          <p className={styles.bal}>
            <span>Balance:</span> {numberWithCommas(toDisplay(amounts[tokenTo?.denom] || '0', tokenTo.decimals))}{' '}
            {tokenTo?.name}
          </p>
          <div className={styles.btnGroup}>
            <button
              className=""
              disabled={!tokenTo}
              onClick={() => {
                const val = toDisplay(amounts[tokenTo?.denom] || '0', tokenTo.decimals);
                const haftValue = new BigDecimal(val).div(2).toNumber();
                setAmountTo(haftValue);
                setFocusId('to');
              }}
            >
              50%
            </button>
            <button
              className=""
              disabled={!tokenTo}
              onClick={() => {
                const val = toDisplay(amounts[tokenTo?.denom] || '0', tokenTo.decimals);
                setAmountTo(val);
                setFocusId('to');
              }}
            >
              100%
            </button>
          </div>
        </div>
        <div className={styles.tokenInfo}>
          <div className={styles.name}>
            {TokenToIcon ? (
              <>
                {TokenToIcon}
                &nbsp;{tokenTo.name}
              </>
            ) : (
              'Select Token'
            )}
          </div>
          <div className={styles.input}>
            <NumberFormat
              onFocus={() => setFocusId('to')}
              onBlur={() => setFocusId(null)}
              placeholder="0"
              thousandSeparator
              className={styles.amount}
              decimalScale={tokenTo?.decimals || 6}
              disabled={isToBlocked}
              type="text"
              value={amountTo}
              onChange={() => {}}
              isAllowed={(values) => {
                const { floatValue } = values;
                // allow !floatValue to let user can clear their input
                return !floatValue || (floatValue >= 0 && floatValue <= 1e14);
              }}
              onValueChange={({ floatValue }) => {
                setAmountTo(floatValue);
              }}
            />
            <div className={styles.usd}>
              ≈ ${amountTo ? numberWithCommas(Number(toUsd) || 0, undefined, { maximumFractionDigits: 6 }) : 0}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.btn}>
        {(() => {
          const btnText = getButtonMessage();
          return (
            <Button
              type="primary"
              disabled={!tokenFrom || !tokenTo || btnText !== 'Create new pool' || loading}
              onClick={async () => {
                const lowerTick = Math.min(leftRange, rightRange);
                const upperTick = Math.max(leftRange, rightRange);
                const poolKeyData = newPoolKey(extractDenom(tokenFrom), extractDenom(tokenTo), feeTier);

                await addLiquidity({
                  poolKeyData,
                  lowerTick: lowerTick,
                  upperTick: upperTick,
                  liquidityDelta: liquidityRef.current,
                  spotSqrtPrice: isPoolExist
                    ? BigInt(poolData.pool?.sqrt_price || 0)
                    : calculateSqrtPrice(midPrice.index),
                  slippageTolerance: BigInt(slippage),
                  tokenXAmount:
                    poolKeyData.token_x === extractAddress(tokenFrom)
                      ? BigInt(Math.round(Number(amountFrom) * 10 ** (tokenFrom.decimals || 6)))
                      : BigInt(Math.round(Number(amountTo) * 10 ** (tokenTo.decimals || 6))),
                  tokenYAmount:
                    poolKeyData.token_y === extractAddress(tokenFrom)
                      ? BigInt(Math.round(Number(amountFrom) * 10 ** (tokenFrom.decimals || 6)))
                      : BigInt(Math.round(Number(amountTo) * 10 ** (tokenTo.decimals || 6))),
                  initPool: !isPoolExist
                });
              }}
            >
              {loading && <Loader width={22} height={22} />}&nbsp;&nbsp;{btnText}
            </Button>
          );
        })()}
      </div>
    </div>
  );
};

export default CreatePoolForm;
