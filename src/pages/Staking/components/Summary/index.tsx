import { toDisplay, USDC_CONTRACT } from '@oraichain/oraidex-common';
import ChartUpIcon from 'assets/icons/chartUpIcon.svg?react';
import PercentIcon from 'assets/icons/percentIcon.svg?react';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import { numberWithCommas } from 'pages/Pools/helpers';
import { ORAIX_TOKEN_INFO, USDC_TOKEN_INFO } from 'pages/Staking/constants';
import { calcAPY } from 'pages/Staking/helpers';
import { useGetRewardPerSecInfo, useGetStakeInfo } from 'pages/Staking/hooks';
import styles from './index.module.scss';

const Summary = () => {
  const { data: prices } = useCoinGeckoPrices();
  const { stakeInfo } = useGetStakeInfo(ORAIX_TOKEN_INFO.contractAddress);
  // const { allRewardStakerInfo } = useGetAllStakerRewardInfo(ORAIX_TOKEN_INFO.contractAddress);

  const { rewardPerSec } = useGetRewardPerSecInfo(ORAIX_TOKEN_INFO.contractAddress);

  const rewardPerSecInfo = rewardPerSec?.[0] || {
    amount: '0',
    info: {
      token: {
        contract_addr: USDC_CONTRACT
      }
    },
    token: USDC_TOKEN_INFO
  };

  const apy = calcAPY(rewardPerSecInfo.amount, stakeInfo?.total_bond_amount || '0', prices);

  // console.log('stakeInfo', stakeInfo);

  return (
    <div className={styles.summary}>
      <div className={styles.title}>Summary</div>
      <div className={styles.divider}></div>

      <div className={styles.statistic}>
        <div className={styles.item}>
          <div className={styles.header}>{Number(apy).toFixed(2)}%</div>
          <span>APR</span>
        </div>
        <div className={styles.item}>
          <div className={styles.header}>{numberWithCommas(toDisplay(stakeInfo?.total_bond_amount || '0'))} ORAIX</div>
          <span>Total LP</span>
        </div>
        {/* <div className={styles.item}>
          <div className={styles.header}>{numberWithCommas(allRewardStakerInfo?.length || 0)}</div>
          <span>Stakers</span>
        </div> */}
      </div>

      <div className={styles.divider}></div>

      <div className={styles.overview}>
        <div className={styles.item}>
          <ChartUpIcon />
          <span className={styles.header}>Earn rewards over time</span>
          <span>USDC rewards are distributed approximately every 5 minutes.</span>
        </div>

        <div className={styles.item}>
          <PercentIcon />
          <span className={styles.header}>Earn revenue sharing</span>
          <span>30% of the revenue will be distributed to ORAIX stakers as USDC</span>
        </div>
      </div>
    </div>
  );
};

export default Summary;
