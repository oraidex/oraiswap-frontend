import { toDisplay } from '@oraichain/oraidex-common';
import NoDataDark from 'assets/images/nodata-bid-dark.svg?react';
import NoData from 'assets/images/nodata-bid.svg?react';
import useConfigReducer from 'hooks/useConfigReducer';
import { getUsd, reduceString } from 'libs/utils';
import { TIMER } from 'pages/CoHarvest/constants';
import { dateFormat } from 'pages/CoHarvest/helpers';
import { formatDisplayUsdt, numberWithCommas } from 'pages/Pools/helpers';
import styles from './index.module.scss';

const AllBidding = ({ list, isLoading }) => {
  const [theme] = useConfigReducer('theme');
  if (isLoading) return <div className={styles.loadingDiv}></div>;

  return (
    <div className={styles.allBid}>
      {list?.length > 0 ? (
        list
          .sort((a, b) => b.premium_slot - a.premium_slot)
          .map((item, index) => {
            return (
              <div className={styles.item} key={index}>
                <div className={styles.right}>
                  <div className={styles.percent}>{item.premium_slot} %</div>
                  <div className={styles.info}>
                    <div className={styles.wallet}>{reduceString(item.bidder, 8, 7)}</div>
                    <div>{dateFormat(new Date(item.timestamp * TIMER.MILLISECOND))}</div>
                  </div>
                </div>
                <div className={styles.amount}>
                  <div className={styles.token}>{numberWithCommas(toDisplay(item.amount))} ORAIX</div>
                  {formatDisplayUsdt(item.amountUSD)}
                </div>
              </div>
            );
          })
      ) : (
        <div className={styles.nodata}>
          {theme === 'light' ? <NoData /> : <NoDataDark />}
          <span>Place a bid and take it all!</span>
        </div>
      )}
    </div>
  );
};

export default AllBidding;
