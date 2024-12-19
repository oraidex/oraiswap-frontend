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
import TrashIcon from 'assets/icons/ion_trash-sharp.svg?react';
import { reduceString } from 'libs/utils';

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
  decimals,
  deleteSelectedItem
}) => {
  return (
    <div className={cx('init-balance-item')}>
      <div className={cx('row-item')}>
        <div className={cx('input', theme)}>
          <div>
            <Input
              value={item.address ? reduceString(item.address, 7, 10) : null}
              style={{
                color: theme === 'light' && 'rgba(39, 43, 48, 1)'
              }}
              onChange={(e) => {
                setInitBalances(
                  initBalances.map((ba, i) => ({
                    amount: ba.amount,
                    address: ind === i ? e?.target?.value : ba.address
                  }))
                );
              }}
              placeholder="Address"
            />
          </div>
        </div>
      </div>
      <div className={cx('row-item')}>
        <div className={cx('input', theme)}>
          <div>
            <NumberFormat
              thousandSeparator
              decimalScale={6}
              value={toDisplay(item.amount, decimals)}
              style={{
                color: theme === 'light' && 'rgba(39, 43, 48, 1)'
              }}
              onValueChange={({ floatValue }) =>
                setInitBalances(
                  initBalances.map((ba, index) => {
                    return ind === index ? { ...ba, amount: toAmount(floatValue, decimals) } : ba;
                  })
                )
              }
              placeholder="0"
            />
          </div>
        </div>
      </div>
      <div className={cx('trash')}
        onClick={() => {
          const arr = selectedInitBalances.includes(ind) ? selectedInitBalances.filter((e) => e !== ind) : [...selectedInitBalances, ind];
          deleteSelectedItem(arr);
        }}
      >
        <TrashIcon />
      </div>
    </div>
  );
};
