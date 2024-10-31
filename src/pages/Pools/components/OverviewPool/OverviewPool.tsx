import { CW20_DECIMALS, toDisplay } from '@oraichain/oraidex-common';
import DefaultIcon from 'assets/icons/tokens.svg?react';
import classNames from 'classnames';
import TokenBalance from 'components/TokenBalance';
import useTheme from 'hooks/useTheme';
import { toFixedIfNecessary } from 'pages/Pools/helpers';
import { useGetPairInfo } from 'pages/Pools/hooks/useGetPairInfo';
import { useState } from 'react';
import { PoolDetail } from 'types/pool';
import BootsIconDark from 'assets/icons/boost-icon-dark.svg?react';
import BootsIcon from 'assets/icons/boost-icon.svg?react';
import styles from './OverviewPool.module.scss';
import { formatDisplayUsdt, formatNumberKMB, numberWithCommas } from 'helper/format';
import useConfigReducer from 'hooks/useConfigReducer';

export const OverviewPool = ({ poolDetailData }: { poolDetailData: PoolDetail }) => {
  const theme = useTheme();

  const { pairAmountInfoData, lpTokenInfoData } = useGetPairInfo(poolDetailData);
  const { token1, token2 } = poolDetailData;

  const [isShowMore] = useState(false);
  const isLight = theme === 'light';
  const IconBoots = isLight ? BootsIcon : BootsIconDark;

  let [BaseTokenIcon, QuoteTokenIcon] = [DefaultIcon, DefaultIcon];
  if (token1) BaseTokenIcon = theme === 'light' ? token1.IconLight || token1.Icon : token1.Icon;
  if (token2) QuoteTokenIcon = theme === 'light' ? token2.IconLight || token2.Icon : token2.Icon;

  const aprBoost = Number(poolDetailData.info?.aprBoost || 0).toFixed(2);
  const isApproximatelyZero = Number(aprBoost) === 0;
  const totalApr = poolDetailData.info?.apr ? poolDetailData.info.apr.toFixed(2) : 0;
  const originalApr = Number(totalApr) - Number(aprBoost);
  const [cachedReward] = useConfigReducer('rewardPools');
  let poolReward = {
    reward: []
  };

  const { liquidityAddr: stakingToken } = poolDetailData.info || {};
  if (cachedReward && cachedReward.length > 0) {
    poolReward = cachedReward.find((item) => item.liquidity_token === stakingToken);
  }

  return (
    <div className={styles.overviewWrapper}>
      <div className={styles.infos}>
        <div className={styles.tvl}>
          <div className={styles.box}>
            <p>Liquidity</p>
            <h1>{formatDisplayUsdt(toDisplay(Math.trunc(poolDetailData?.info?.totalLiquidity || 0).toString()))}</h1>
          </div>
          <div className={styles.box}>
            <p>Volume (24H)</p>
            <h1>
              {Number.isNaN(poolDetailData.info?.volume24Hour || 0)
                ? 0
                : formatDisplayUsdt(toDisplay(poolDetailData.info?.volume24Hour || '0'))}
            </h1>
          </div>
        </div>

        <div className={classNames(styles.box, styles.alloc)}>
          <p>Liquidity Allocation</p>
          <div className={styles.tokens}>
            <div className={classNames(styles.tokenItem, styles[theme])}>
              {BaseTokenIcon && <BaseTokenIcon />}
              <span className={styles.value}>
                {formatNumberKMB(toDisplay(pairAmountInfoData?.token1Amount || '0'), false)}
              </span>
            </div>
            <div className={classNames(styles.tokenItem, styles[theme])}>
              {QuoteTokenIcon && <QuoteTokenIcon />}
              <span className={styles.value}>
                {formatNumberKMB(toDisplay(pairAmountInfoData?.token2Amount || '0'), false)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.reward}>
        <div className={styles.title}>Reward</div>
        <div className={styles.desc}>
          <div className={styles.item}>
            <span>Swap Fee</span>
            <p>
              {isApproximatelyZero ? '≈ ' : ''}
              {aprBoost}%
            </p>
          </div>
          <div className={styles.item}>
            <span className={styles.label}>
              {poolReward?.reward?.join('+')} Boost&nbsp;
              <IconBoots />
            </span>
            <p>{`${originalApr.toFixed(2)}%`}</p>
          </div>
          <div className={styles.item}>
            <span>Total APR</span>
            <p className={styles.total}>{totalApr}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};
