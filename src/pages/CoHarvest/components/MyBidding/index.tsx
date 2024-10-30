import { oraichainTokens, toDisplay } from '@oraichain/oraidex-common';
import BiddingIconLight from 'assets/icons/bidding-icon-light.svg?react';
import BiddingIcon from 'assets/icons/bidding-icon.svg?react';
import DrawIconLight from 'assets/icons/draw-icon-light.svg?react';
import DrawIcon from 'assets/icons/draw-icon.svg?react';
import WinIconLight from 'assets/icons/win-icon-light.svg?react';
import WinIcon from 'assets/icons/win-icon.svg?react';
import NoDataDark from 'assets/images/nodata-bid-dark.svg?react';
import NoData from 'assets/images/nodata-bid.svg?react';
import useConfigReducer from 'hooks/useConfigReducer';
import { getUsd } from 'libs/utils';
import { BidStatus } from 'pages/CoHarvest/constants';
import { formatDisplayUsdt, numberWithCommas } from 'pages/Pools/helpers';
import styles from './index.module.scss';

const MyBidding = ({ list, isLoading }) => {
  const [theme] = useConfigReducer('theme');

  const StatusIcon = {
    [BidStatus.BIDDING]: theme === 'light' ? BiddingIconLight : BiddingIcon,
    [BidStatus.WIN]: theme === 'light' ? WinIconLight : WinIcon,
    [BidStatus.DRAW]: theme === 'light' ? DrawIconLight : DrawIcon
  };

  if (isLoading) return <div className={styles.loadingDiv}></div>;

  return (
    <div className={styles.myBid}>
      {list?.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>BID AMOUNT</th>
                <th>INTEREST</th>
                <th>BID STATUS</th>
                <th>RETURNING RECEIVED</th>
              </tr>
            </thead>
            <tbody>
              {list
                .sort((a, b) => b.premium_slot - a.premium_slot)
                .map((item, index) => {
                  const Status = StatusIcon[item.status] || BiddingIcon;

                  return (
                    <tr className={styles.item} key={index}>
                      <td className={styles.index}>{index + 1}</td>
                      <td className={styles.bid}>
                        <div>{formatDisplayUsdt(item.amountUSD)}</div>
                        {/* <div className={styles.detailPrice}>{toDisplay(item.amount || '0')} ORAIX</div> */}
                        <div className={styles.detailPrice}>{numberWithCommas(toDisplay(item.amount))} ORAIX</div>
                      </td>
                      <td className={styles.slot}>
                        <span>{item.premium_slot || 0}%</span>
                      </td>
                      <td className={`${styles.status} ${styles[item.status]}`}>
                        <Status />
                        <span>
                          {item.status}&nbsp;
                          {item.percent ? `${item.percent}%` : ``}
                        </span>
                      </td>
                      <td className={styles.return}>
                        <div
                          className={`${styles.returnValue} ${
                            item.status !== BidStatus.BIDDING ? styles[item.status] : ''
                          }`}
                        >
                          ≈ {formatDisplayUsdt(item.potentialReturnUSD)}
                        </div>
                        {item.estimateResidueBid !== '0' && (
                          <div className={styles.detailPrice}>
                            {numberWithCommas(toDisplay(item.estimateResidueBid))} ORAIX Refund
                          </div>
                        )}
                        {item.estimateReceive !== '0' && (
                          <div className={styles.detailPrice}>
                            {numberWithCommas(toDisplay(item.estimateReceive))} USDC
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.nodata}>
          {theme === 'light' ? <NoData /> : <NoDataDark />}
          <span>Place a bid and take it all!</span>
        </div>
      )}
    </div>
  );
};

export default MyBidding;
