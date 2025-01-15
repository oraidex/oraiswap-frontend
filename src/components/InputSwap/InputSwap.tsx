import styles from './InputSwap.module.scss';
import cn from 'classnames/bind';
import NumberFormat from 'react-number-format';
import { TokenItemType } from '@oraichain/oraidex-common';

const cx = cn.bind(styles);

interface InputSwapProps {
  Icon: any;
  setIsSelectFrom: (value: boolean) => void;
  token: TokenItemType;
  amount: number;
  tokenFee: number;
  onChangeAmount?: (amount: number | undefined) => void;
}

export default function InputSwap({ Icon, setIsSelectFrom, token, amount, onChangeAmount, tokenFee }: InputSwapProps) {
  return (
    <>
      <div className={cx('input')}>
        <div className={cx('token')} onClick={() => setIsSelectFrom(true)}>
          {Icon && <Icon className={cx('logo')} />}
          <div className={cx('token-info')}>
            <span className={cx('token-symbol')}>{token?.name}</span>
            <span className={cx('token-org')}>{token?.org}</span>
          </div>
          <div className={cx('arrow-down')} />
        </div>

        <NumberFormat
          placeholder="0"
          className={cx('amount')}
          thousandSeparator
          decimalScale={6}
          type="text"
          value={amount}
          onValueChange={({ floatValue }) => {
            onChangeAmount?.(floatValue);
          }}
        />
      </div>
      {tokenFee !== 0 && (
        <div className={cx('token-fee')}>
          <span>Token Fee</span>
          <span>{tokenFee}%</span>
        </div>
      )}
    </>
  );
}
