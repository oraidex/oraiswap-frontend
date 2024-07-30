import styles from './index.module.scss';
import { ReactComponent as SwitchIcon } from 'assets/icons/ant_swap_light.svg';
import { ReactComponent as ArrowIcon } from 'assets/icons/ic_arrow_down.svg';
import { TokenItemType, toDisplay } from '@oraichain/oraidex-common';
import SelectToken from '../SelectToken';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { getIcon, sleep } from 'helper';
import useTheme from 'hooks/useTheme';
import NumberFormat from 'react-number-format';
import { numberWithCommas } from 'helper/format';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import { RootState } from 'store/configure';
import { useSelector } from 'react-redux';
import { Button } from 'components/Button';
import classNames from 'classnames';
import { FeeTier } from '@oraichain/oraidex-contracts-sdk/build/OraiswapV3.types';
import { ALL_FEE_TIERS_DATA } from 'libs/contractSingleton';
import Loader from 'components/Loader';

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
  tokenFromInput,
  tokenToInput,
  setFocusInput
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
  tokenFromInput: InputState;
  tokenToInput: InputState;
  fee: FeeTier;
  setFocusInput: Dispatch<React.SetStateAction<'from' | 'to'>>;
}) => {
  const theme = useTheme();
  const isLightTheme = theme === 'light';
  const amounts = useSelector((state: RootState) => state.token.amounts);
  const { data: prices } = useCoinGeckoPrices();
  const [loading, setLoading] = useState(false);

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
  const toUsd = (prices?.[tokenFrom?.coinGeckoId] * Number(toAmount)).toFixed(6);

  const handleSwitch = () => {
    const originFromToken = tokenFrom;
    const originToToken = tokenTo;

    setFromAmount(0);
    setToAmount(0);
    handleChangeTokenFrom(originToToken);
    handleChangeTokenTo(originFromToken);
  };

  const getButtonMessage = () => {
    if (!tokenFrom || !tokenTo) {
      return 'Select tokens';
    }

    if (tokenFrom.denom === tokenTo.denom) {
      return 'Select different tokens';
    }

    // if (
    //   (!poolInfo  && !isPoolExist) ||
    //   (poolInfo && isPoolExist)
    // ) {
    //   return 'Insufficient Orai';
    // }

    if ((!tokenFromInput.blocked && +fromAmount === 0) || (!tokenToInput.blocked && +toAmount === 0)) {
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
        <div className={classNames(styles.itemInput, { [styles.disabled]: tokenFromInput.blocked })}>
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
                decimalScale={6}
                disabled={tokenFromInput.blocked}
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
                  // tokenFromInput.setValue(floatValue?.toString());
                }}
              />
              <div className={styles.usd}>
                ≈ ${fromAmount ? numberWithCommas(Number(fromUsd) || 0, undefined, { maximumFractionDigits: 6 }) : 0}
              </div>
            </div>
          </div>
          <div className={styles.balance}>
            <p className={styles.bal}>
              <span>Balance:</span> {numberWithCommas(toDisplay(amounts[tokenFrom?.denom] || '0'))} {tokenFrom?.name}
            </p>
            <button
              disabled={!tokenFrom}
              onClick={() => {
                const val = toDisplay(amounts[tokenFrom?.denom] || '0');
                setFromAmount(val);
                // tokenFromInput.setValue(val.toString());

                setFocusInput('from');
              }}
            >
              Max
            </button>
          </div>
        </div>
        <div className={classNames(styles.itemInput, { [styles.disabled]: tokenToInput.blocked })}>
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
                decimalScale={6}
                disabled={tokenToInput.blocked}
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
                  // tokenToInput.setValue(floatValue?.toString());
                }}
              />
              <div className={styles.usd}>
                ≈ ${toAmount ? numberWithCommas(Number(toUsd) || 0, undefined, { maximumFractionDigits: 6 }) : 0}
              </div>
            </div>
          </div>
          <div className={styles.balance}>
            <p className={styles.bal}>
              <span>Balance:</span> {numberWithCommas(toDisplay(amounts[tokenTo?.denom] || '0'))} {tokenTo?.name}
            </p>
            <button
              className=""
              disabled={!tokenTo}
              onClick={() => {
                const val = toDisplay(amounts[tokenTo?.denom] || '0');
                setToAmount(val);
                setFocusInput('to');
                // tokenToInput.setValue(val.toString());
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
                try {
                  setLoading(true);

                  console.log('first', {
                    tokenFrom,
                    tokenTo,
                    fee,
                    toAmount,
                    fromAmount
                  });

                  await sleep(2000);
                } catch (error) {
                  console.log('error:>> Add liquidity', error);
                } finally {
                  setLoading(false);
                }
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
