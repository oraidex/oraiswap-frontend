import styles from './index.module.scss';
import { BigDecimal, toDisplay, TokenItemType } from '@oraichain/oraidex-common';
import { FC } from 'react';
import classNames from 'classnames';
import { numberWithCommas } from 'helper/format';
import NumberFormat from 'react-number-format';
import { ReactComponent as LeafIcon } from 'assets/icons/leaf.svg';

interface ManuallyAddLiquidityProps {
  apr: number;
  isFromBlocked: boolean;
  isToBlocked: boolean;
  amounts: AmountDetails;
  tokenFrom: TokenItemType;
  setAmountFrom: (value: number) => void;
  setAmountTo: (value: number) => void;
  setFocusId: (value: 'zap' | 'x' | 'y') => void;
  TokenFromIcon: JSX.Element;
  amountFrom: number;
  amountTo: number;
  fromUsd: string;
  toUsd: string;
  tokenTo: TokenItemType;
  TokenToIcon: JSX.Element;
}

const ManuallyAddLiquidity: FC<ManuallyAddLiquidityProps> = ({
  apr,
  isFromBlocked,
  isToBlocked,
  amounts,
  tokenFrom,
  setAmountFrom,
  setAmountTo,
  setFocusId,
  TokenFromIcon,
  amountFrom,
  amountTo,
  fromUsd,
  tokenTo,
  TokenToIcon,
  toUsd
}) => {
  return (
    <>
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
                setFocusId('x');
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
                setFocusId('x');
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
              onFocus={() => setFocusId('x')}
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
                setFocusId('y');
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
                setFocusId('y');
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
              onFocus={() => setFocusId('y')}
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
      <div className={styles.aprWrapper}>
        <p className={styles.title}>Est APR</p>
        <div className={styles.amountWrap}>
          <p className={styles.amount}>~{numberWithCommas(apr, undefined, { maximumFractionDigits: 2 })}%</p>
          <LeafIcon />
        </div>
      </div>
    </>
  );
};

export default ManuallyAddLiquidity;
