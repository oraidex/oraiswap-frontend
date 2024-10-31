import { CW20_DECIMALS, toAmount, toDisplay, CoinIcon, TokenInfo } from '@oraichain/oraidex-common';
import classNames from 'classnames/bind';
import TokenBalance from 'components/TokenBalance';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import { getUsd } from 'libs/utils';
import React, { FC, ReactNode, memo, useState } from 'react';
import NumberFormat from 'react-number-format';
import styles from './InputWithOptionPercent.module.scss';

const cx = classNames.bind(styles);

const InputWithOptionPercent: FC<{
  setAmountFromPercent: (value: bigint) => void;
  onValueChange?: (value: any) => void;
  onChange?: (e: any) => void;
  totalAmount: bigint;
  percentList?: number[];
  value: bigint | null;
  TokenIcon?: CoinIcon;
  token?: TokenInfo;
  apr?: number;
  showIcon?: boolean;
  hasPath?: boolean;
  isFocus?: boolean;
  prefixText?: string;
  amountInUsdt?: number;
  slippage?: ReactNode;
}> = ({
  setAmountFromPercent,
  onValueChange,
  onChange,
  value,
  TokenIcon,
  token,
  totalAmount,
  percentList = [50, 100],
  apr,
  showIcon = false,
  hasPath = false,
  isFocus = true,
  prefixText = 'Balance: ',
  amountInUsdt = 0,
  slippage
}) => {
  const { data: prices } = useCoinGeckoPrices();
  const [chosenOption, setChosenOption] = useState(-1);
  const [theme] = useConfigReducer('theme');
  const [inputValue, setInputValue] = useState<number | string>('');

  const onChangePercent = (percent: number) => {
    const HUNDRED_PERCENT_IN_CW20_DECIMALS = 100000000;
    setAmountFromPercent((toAmount(percent, CW20_DECIMALS) * totalAmount) / BigInt(HUNDRED_PERCENT_IN_CW20_DECIMALS));
  };

  return (
    <>
      <div className={cx('top')}>
        {slippage ? slippage : !!apr && <div className={cx('apr')}>Current APR: {apr}%</div>}
      </div>
      <div className={cx('supply', theme, { 'has-path': hasPath })} key={token?.denom}>
        <div className={cx('balance')}>
          <div className={cx('amount', theme)}>
            <TokenBalance
              balance={{
                amount: totalAmount || BigInt(0),
                denom: token?.symbol || token?.name || '',
                decimals: token?.decimals
              }}
              prefix={prefixText}
              decimalScale={6}
            />
          </div>
          {
            <div className={cx('options')}>
              {percentList.map((option, idx) => (
                <div
                  className={cx('item', theme, {
                    isChosen: isFocus && chosenOption === idx
                  })}
                  key={idx}
                  onClick={() => {
                    setAmountFromPercent((BigInt(option) * totalAmount) / BigInt(100));
                    setChosenOption(idx);
                    setInputValue('');
                  }}
                >
                  {option}%
                </div>
              ))}
            </div>
          }
        </div>

        <div className={cx('input')}>
          {showIcon && (
            <div className={cx('token')}>
              {TokenIcon}
              <div className={cx('title', theme)}>
                <div>{token?.name}</div>
              </div>
            </div>
          )}

          <div className={cx('input-amount')}>
            <NumberFormat
              className={cx('amount', theme)}
              thousandSeparator
              decimalScale={6}
              placeholder={'0'}
              value={value === null ? '' : toDisplay(value, token?.decimals)}
              allowNegative={false}
              onChange={(e) => {
                onChange && onChange(e);
                setChosenOption(-1);
              }}
              onValueChange={(value) => {
                onValueChange && onValueChange(value);
              }}
              isAllowed={(values) => {
                const { floatValue } = values;
                // allow !floatValue to let user can clear their input
                return !floatValue || (floatValue >= 0 && floatValue <= 1e14);
              }}
            />
            <div className={cx('amount-usd', theme)}>
              <TokenBalance
                balance={
                  amountInUsdt
                    ? {
                        amount: BigInt(Math.trunc(amountInUsdt)),
                        decimals: CW20_DECIMALS
                      }
                    : getUsd(value, token, prices)
                }
                decimalScale={2}
                prefix="~$"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(InputWithOptionPercent);
