import { toAmount as toAmountFn, toDisplay, TokenItemType, CW20_DECIMALS } from '@oraichain/oraidex-common';
import { FeeTier, PoolWithPoolKey } from '@oraichain/oraidex-contracts-sdk/build/OraiswapV3.types';
import { ReactComponent as SwitchIcon } from 'assets/icons/ant_swap_light.svg';
import classNames from 'classnames';
import { Button } from 'components/Button';
import Loader from 'components/Loader';
import { displayToast, TToastType } from 'components/Toasts/Toast';
import { getIcon, getTransactionUrl } from 'helper';
import { numberWithCommas } from 'helper/format';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import useTheme from 'hooks/useTheme';
import { ALL_FEE_TIERS_DATA } from 'libs/contractSingleton';
import { InitPositionData } from 'pages/Pool-V3/helpers/helper';
import useAddLiquidity from 'pages/Pool-V3/hooks/useAddLiquidity';
import { calculateSqrtPrice, newPoolKey, PoolKey } from '@oraichain/oraiswap-v3';
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import NumberFormat from 'react-number-format';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configure';
import { TickPlotPositionData } from '../PriceRangePlot/utils';
import { determinePositionTokenBlock, extractDenom, PositionTokenBlock } from '../PriceRangePlot/utils';
import SelectToken from '../SelectToken';
import styles from './index.module.scss';
import { useLoadOraichainTokens } from 'hooks/useLoadTokens';
import { extractAddress } from 'pages/Pool-V3/helpers/format';

export interface InputState {
  value: string;
  setValue: (value: string) => void;
  blocked: boolean;
  blockerInfo?: string;
  decimalsLimit: number;
}

const TokenForm = ({
  tokenFrom,
  handleChangeTokenFrom,
  tokenTo,
  handleChangeTokenTo,
  setFee,
  setFromAmount,
  setToAmount,
  toAmount,
  fromAmount,
  fee,
  setFocusInput,
  left,
  right,
  slippage,
  poolData,
  isPoolExist,
  liquidity,
  midPrice,
  handleSuccessAdd
}: {
  tokenFrom: TokenItemType;
  handleChangeTokenFrom: (token) => void;
  tokenTo: TokenItemType;
  handleChangeTokenTo: (token) => void;
  setFee: Dispatch<SetStateAction<FeeTier>>;
  setToAmount: Dispatch<SetStateAction<number | string>>;
  setFromAmount: Dispatch<SetStateAction<number | string>>;
  toAmount: number | string;
  fromAmount: number | string;
  fee: FeeTier;
  setFocusInput: Dispatch<React.SetStateAction<'from' | 'to'>>;
  left: number;
  right: number;
  slippage: number;
  poolData: PoolWithPoolKey;
  isPoolExist: boolean;
  liquidity: bigint;
  midPrice: TickPlotPositionData;
  handleSuccessAdd: () => Promise<void>;
}) => {
  const theme = useTheme();
  const isLightTheme = theme === 'light';
  const amounts = useSelector((state: RootState) => state.token.amounts);
  const { data: prices } = useCoinGeckoPrices();
  const [loading, setLoading] = useState(false);
  const [walletAddress] = useConfigReducer('address');

  const loadOraichainToken = useLoadOraichainTokens();
  const { handleInitPosition } = useAddLiquidity();

  const addLiquidity = async (data: InitPositionData) => {
    setLoading(true);

    await handleInitPosition(
      data,
      walletAddress,
      (tx: string) => {
        displayToast(TToastType.TX_SUCCESSFUL, {
          customLink: getTransactionUrl('Oraichain', tx)
        });
        handleSuccessAdd();
        loadOraichainToken(walletAddress, [tokenFrom.contractAddress, tokenTo.contractAddress].filter(Boolean));
      },
      (e) => {
        displayToast(TToastType.TX_FAILED, {
          message: 'Add liquidity failed!'
        });
      }
    );

    setLoading(false);
  };

  const isXtoY = useMemo(() => {
    if (tokenFrom && tokenTo) {
      return extractDenom(tokenFrom) < extractDenom(tokenTo);
    }
    return true;
  }, [tokenFrom, tokenTo]);

  const [isFromBlocked, setIsFromBlocked] = useState(false);
  const [isToBlocked, setIsToBlocked] = useState(false);

  useEffect(() => {
    const fromBlocked =
      determinePositionTokenBlock(
        isPoolExist ? BigInt(poolData.pool.sqrt_price) : calculateSqrtPrice(midPrice.index),
        Math.min(Number(left), Number(right)),
        Math.max(Number(left), Number(right)),
        isXtoY
      ) === PositionTokenBlock.A;

    const toBlocked =
      determinePositionTokenBlock(
        isPoolExist ? BigInt(poolData.pool.sqrt_price) : calculateSqrtPrice(midPrice.index),
        Math.min(Number(left), Number(right)),
        Math.max(Number(left), Number(right)),
        isXtoY
      ) === PositionTokenBlock.B;

    setIsFromBlocked(fromBlocked);
    setIsToBlocked(toBlocked);
  }, [isPoolExist, poolData, midPrice, left, right, isXtoY]);

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
  const fromUsd = (prices?.[tokenFrom?.coinGeckoId] * Number(fromAmount)).toFixed(6);
  const toUsd = (prices?.[tokenTo?.coinGeckoId] * Number(toAmount)).toFixed(6);

  const handleSwitch = () => {
    const originFromToken = tokenFrom;
    const originToToken = tokenTo;

    setFromAmount(0);
    setToAmount(0);
    handleChangeTokenFrom(originToToken);
    handleChangeTokenTo(originFromToken);
  };

  const getButtonMessage = () => {
    const isInsufficientTo =
      toAmount && Number(toAmount) > toDisplay(amounts[tokenTo.denom], tokenTo.decimals || CW20_DECIMALS);
    const isInsufficientFrom =
      fromAmount && Number(fromAmount) > toDisplay(amounts[tokenFrom.denom], tokenFrom.decimals || CW20_DECIMALS);

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

    if ((!isFromBlocked && +fromAmount === 0) || (!isToBlocked && +toAmount === 0)) {
      return 'Liquidity must be greater than 0';
    }

    return 'Add Liquidity';
  };

  return (
    <div className={styles.tokenForm}>
      <div className={styles.select}>
        <h1>Tokens</h1>
        <div className={styles.selectContent}>
          <SelectToken token={tokenFrom} handleChangeToken={handleChangeTokenFrom} otherTokenDenom={tokenTo?.denom} />
          <div className={classNames(styles.switch, styles[theme])} onClick={() => handleSwitch()}>
            <SwitchIcon />
          </div>
          <SelectToken token={tokenTo} handleChangeToken={handleChangeTokenTo} otherTokenDenom={tokenFrom?.denom} />
        </div>
        <div className={styles.fee}>
          {ALL_FEE_TIERS_DATA.map((e, index) => {
            return (
              <div
                className={classNames(styles.feeItem, { [styles.chosen]: e.fee === fee.fee })}
                key={`${index}-${e}-fee`}
                onClick={() => setFee(e)}
              >
                {toDisplay(e.fee.toString(), 10)}%
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.deposit}>
        <h1>Deposit Amount</h1>
        <div className={classNames(styles.itemInput, { [styles.disabled]: isFromBlocked })}>
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
                onFocus={() => setFocusInput('from')}
                onBlur={() => setFocusInput(null)}
                placeholder="0"
                thousandSeparator
                className={styles.amount}
                decimalScale={tokenFrom.decimals || 6}
                disabled={isFromBlocked}
                type="text"
                value={fromAmount}
                onChange={() => {}}
                isAllowed={(values) => {
                  const { floatValue } = values;
                  // allow !floatValue to let user can clear their input
                  return !floatValue || (floatValue >= 0 && floatValue <= 1e14);
                }}
                onValueChange={({ floatValue }) => {
                  setFromAmount && setFromAmount(floatValue);
                }}
              />
              <div className={styles.usd}>
                ≈ ${fromAmount ? numberWithCommas(Number(fromUsd) || 0, undefined, { maximumFractionDigits: 6 }) : 0}
              </div>
            </div>
          </div>
          <div className={styles.balance}>
            <p className={styles.bal}>
              <span>Balance:</span> {numberWithCommas(toDisplay(amounts[tokenFrom?.denom] || '0', tokenFrom.decimals))}{' '}
              {tokenFrom?.name}
            </p>
            <button
              disabled={!tokenFrom}
              onClick={() => {
                const val = toDisplay(amounts[tokenFrom?.denom] || '0', tokenFrom.decimals);
                setFromAmount(val);

                setFocusInput('from');
              }}
            >
              Max
            </button>
          </div>
        </div>
        <div className={classNames(styles.itemInput, { [styles.disabled]: isToBlocked })}>
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
                onFocus={() => setFocusInput('to')}
                onBlur={() => setFocusInput(null)}
                placeholder="0"
                thousandSeparator
                className={styles.amount}
                decimalScale={tokenTo.decimals || 6}
                disabled={isToBlocked}
                type="text"
                value={toAmount}
                onChange={() => {}}
                isAllowed={(values) => {
                  const { floatValue } = values;
                  // allow !floatValue to let user can clear their input
                  return !floatValue || (floatValue >= 0 && floatValue <= 1e14);
                }}
                onValueChange={({ floatValue }) => {
                  setToAmount && setToAmount(floatValue);
                }}
              />
              <div className={styles.usd}>
                ≈ ${toAmount ? numberWithCommas(Number(toUsd) || 0, undefined, { maximumFractionDigits: 6 }) : 0}
              </div>
            </div>
          </div>
          <div className={styles.balance}>
            <p className={styles.bal}>
              <span>Balance:</span> {numberWithCommas(toDisplay(amounts[tokenTo?.denom] || '0', tokenTo.decimals))}{' '}
              {tokenTo?.name}
            </p>
            <button
              className=""
              disabled={!tokenTo}
              onClick={() => {
                const val = toDisplay(amounts[tokenTo?.denom] || '0', tokenTo.decimals);
                setToAmount(val);
                setFocusInput('to');
              }}
            >
              Max
            </button>
          </div>
        </div>
      </div>

      <div className={styles.btn}>
        {(() => {
          const btnText = getButtonMessage();
          return (
            <Button
              type="primary"
              disabled={!tokenFrom || !tokenTo || btnText !== 'Add Liquidity' || loading}
              onClick={async () => {
                const lowerTick = Math.min(left, right);
                const upperTick = Math.max(left, right);
                const poolKey: PoolKey = newPoolKey(extractDenom(tokenFrom), extractDenom(tokenTo), fee);
                // console.log({ fromAmount, fromAmount2: toAmountFn(fromAmount || 0, tokenFrom.decimals || 6) });
                await addLiquidity({
                  poolKeyData: poolKey,
                  lowerTick: lowerTick,
                  upperTick: upperTick,
                  liquidityDelta: liquidity,
                  spotSqrtPrice: isPoolExist ? BigInt(poolData.pool.sqrt_price) : calculateSqrtPrice(midPrice.index),
                  slippageTolerance: BigInt(slippage),
                  tokenXAmount:
                    poolKey.token_x === extractAddress(tokenFrom)
                      ? BigInt(Math.round(Number(fromAmount) * 10 ** (tokenFrom.decimals || 6)))
                      : BigInt(Math.round(Number(toAmount) * 10 ** (tokenTo.decimals || 6))),
                  tokenYAmount:
                    poolKey.token_y === extractAddress(tokenFrom)
                      ? BigInt(Math.round(Number(fromAmount) * 10 ** (tokenFrom.decimals || 6)))
                      : BigInt(Math.round(Number(toAmount) * 10 ** (tokenTo.decimals || 6))),
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

export default TokenForm;
