import { toDisplay } from '@oraichain/oraidex-common';
import { oraichainTokens } from 'index';
import TooltipIcon from 'assets/icons/icon_tooltip.svg?react';
import UsdcIcon from 'assets/icons/usd_coin.svg?react';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import { getUsd } from 'libs/utils';
import { formatDisplayUsdt, numberWithCommas } from 'pages/Pools/helpers';
import { memo, useState } from 'react';
import CountDownTime from '../CountDownTime';
import { TooltipIconBtn } from '../Tooltip';
import styles from './index.module.scss';
import { BiddingInfo } from '@oraichain/oraidex-contracts-sdk/build/CoharvestBidPool.types';

const HarvestInfo = (props: {
  poolValue: string;
  onEnd: () => void;
  onStart: () => void;
  bidInfo: BiddingInfo;
  openExplainModal: () => void;
  isCurrentRound: boolean;
}) => {
  const { poolValue, onEnd, onStart, bidInfo, openExplainModal, isCurrentRound } = props;
  const { data: prices } = useCoinGeckoPrices();
  const [visible, setVisible] = useState(false);
  const [theme] = useConfigReducer('theme');

  const USDC_TOKEN_INFO = oraichainTokens.find((e) => e.coinGeckoId === 'usd-coin');
  const amountUsd = getUsd(poolValue, USDC_TOKEN_INFO, prices);

  return (
    <div className={styles.harvestInfo}>
      <div className={styles.contentWrapper}>
        <div className={`${styles.content} ${!isCurrentRound ? styles.inPast : ''}`}>
          <div className={styles.value}>
            <span className={styles.heading}>
              Total Rewards
              <TooltipIconBtn
                placement="auto"
                visible={visible}
                setVisible={setVisible}
                content={
                  <div className={`${styles.tooltip} ${styles[theme]}`}>
                    Reward pool: 20% of all fees generated via OraiBridge, Order Book, and Futures trading are deposited
                    into the pool in USDC
                  </div>
                }
              />
            </span>

            <div className={styles.balance}>
              <UsdcIcon />
              {numberWithCommas(toDisplay(poolValue))} USDC
            </div>
            <div className={styles.usd}>{formatDisplayUsdt(amountUsd)}</div>
          </div>
          <div className={styles.countdown}>
            <CountDownTime bidInfo={bidInfo} onEnd={onEnd} onStart={onStart} isCurrentRound={isCurrentRound} />
          </div>
        </div>
        <div className={styles.shadow}></div>
      </div>

      <div className={styles.explain} onClick={openExplainModal}>
        <div>
          <TooltipIcon onClick={openExplainModal} width={20} height={20} />
        </div>
        <span>Total Rewards will be distributed at the end of the round. Starting from Pool 1% to Pool 25%.</span>
      </div>
    </div>
  );
};

export default memo(HarvestInfo);
