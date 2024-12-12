import { toAmount, toDisplay } from '@oraichain/oraidex-common';
import TokensIcon from 'assets/icons/tokens.svg?react';
import WalletIcon from 'assets/icons/wallet1.svg?react';
import cn from 'classnames/bind';
import CheckBox from 'components/CheckBox';
import Input from 'components/Input';
import { tokenMap } from 'initCommon';
import NumberFormat from 'react-number-format';
import styles from './NewTokenModal.module.scss';
import { getIcon } from 'helper';

const cx = cn.bind(styles);

export const RewardItems = ({ item, ind, selectedReward, setSelectedReward, setRewardTokens, rewardTokens, theme }) => {
  const originalFromToken = tokenMap?.[item?.denom];
  let Icon = getIcon({
    isLightTheme: theme === 'light',
    type: 'token',
    chainId: originalFromToken?.chainId,
    coinGeckoId: originalFromToken?.coinGeckoId, 
    width: 30,
    height: 30
  })
  return (
    <div className={cx('orai')}>
      <CheckBox
        checked={selectedReward.includes(ind)}
        label=""
        onCheck={() => {
          const arr = selectedReward.includes(ind) ? selectedReward.filter((e) => e !== ind) : [...selectedReward, ind];
          setSelectedReward(arr);
        }}
      />
      <div className={cx('orai_label')}>
        {Icon ? Icon : <TokensIcon className={cx('logo')} />}
        <div className={cx('per')}>
          <span>{item?.name}</span> /s
        </div>
      </div>
      <div className={cx('input_per', theme)}>
        <NumberFormat
          className={cx('value')}
          placeholder="0"
          thousandSeparator
          decimalScale={6}
          customInput={Input}
          value={toDisplay(item?.value, 6)}
          onClick={(event) => {
            event.stopPropagation();
          }}
          onValueChange={({ floatValue }) => {
            setRewardTokens(
              rewardTokens.map((isReward, index) => {
                return ind === index ? { ...isReward, value: toAmount(floatValue) } : isReward;
              })
            );
          }}
        />
      </div>
    </div>
  );
};

export const InitBalancesItems = ({
  selectedInitBalances,
  ind,
  setSelectedInitBalances,
  item,
  setInitBalances,
  initBalances,
  theme,
  decimals
}) => {
  return (
    <div>
      <div className={cx('wrap-init-balances')}>
        <div>
          <CheckBox
            checked={selectedInitBalances.includes(ind)}
            onCheck={() => {
              const arr = selectedInitBalances.includes(ind)
                ? selectedInitBalances.filter((e) => e !== ind)
                : [...selectedInitBalances, ind];
              setSelectedInitBalances(arr);
            }}
          />
        </div>
        <div className={cx('wallet', theme)}>
          <span>{ind + 1}</span>
          <WalletIcon />
        </div>
      </div>
      <div className={cx('row')}>
        <div className={cx('label')}>Address</div>
        <Input
          className={cx('input', theme)}
          value={item.address}
          onChange={(e) => {
            setInitBalances(
              initBalances.map((ba, i) => ({
                amount: ba.amount,
                address: ind === i ? e?.target?.value : ba.address
              }))
            );
          }}
          placeholder="ADDRESS"
        />
      </div>
      <div
        className={cx('row')}
        style={{
          paddingTop: 10
        }}
      >
        <div className={cx('label')}>Amount</div>
        <NumberFormat
          placeholder="0"
          className={cx('input', theme)}
          style={{
            color: theme === 'light' ? 'rgba(126, 92, 197, 1)' : 'rgb(255, 222, 91)'
          }}
          thousandSeparator
          decimalScale={6}
          type="text"
          value={toDisplay(item.amount, decimals)}
          onValueChange={({ floatValue }) =>
            setInitBalances(
              initBalances.map((ba, index) => {
                return ind === index ? { ...ba, amount: toAmount(floatValue, decimals) } : ba;
              })
            )
          }
        />
      </div>
      <hr />
    </div>
  );
};
