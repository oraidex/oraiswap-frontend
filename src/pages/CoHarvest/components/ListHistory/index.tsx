import { toDisplay } from '@oraichain/oraidex-common';
import BiddingIconLight from 'assets/icons/bidding-icon-light.svg?react';
import BiddingIcon from 'assets/icons/bidding-icon.svg?react';
import EndedIcon from 'assets/icons/endIcon.svg?react';
import EndedIconLight from 'assets/icons/endIconLight.svg?react';
import OraiXIcon from 'assets/icons/oraix.svg?react';
import OraiXLightIcon from 'assets/icons/oraix_light.svg?react';
import UsdcIcon from 'assets/icons/usd_coin.svg?react';
import useConfigReducer from 'hooks/useConfigReducer';
import { BID_ROUND_STATUS, LIMIT_PAGE } from 'pages/CoHarvest/constants';
import { useGetListBiddingRoundInfo } from 'pages/CoHarvest/hooks/useGetBidRound';
import { numberWithCommas } from 'pages/Pools/helpers';
import { useState } from 'react';
import styles from './index.module.scss';

const ListHistory = ({
  activeRound,
  filterRound,
  setFilterRound,
  handleUpdateRoundURL
}: {
  activeRound: number;
  filterRound: number;
  setFilterRound: React.Dispatch<React.SetStateAction<number>>;
  handleUpdateRoundURL: (round: number) => void;
}) => {
  const [theme] = useConfigReducer('theme');
  const { listBiddingRoundInfo, isLoading } = useGetListBiddingRoundInfo(activeRound);

  const [limit, setLimit] = useState(LIMIT_PAGE);

  // const { handleUpdateRoundURL } = useRoundRoute(activeRound, setFilterRound);

  const StatusIcon = {
    [BID_ROUND_STATUS.ONGOING]: theme === 'light' ? BiddingIconLight : BiddingIcon,
    [BID_ROUND_STATUS.ENDED]: theme === 'light' ? EndedIconLight : EndedIcon
  };

  return (
    <div className={styles.listHistory}>
      <div className={styles.title}>Co-Harvest History</div>

      <div className={styles.header}>
        <span>Round/Total Rewards</span>
        <span>Total Bid</span>
      </div>

      <div className={styles.list}>
        {listBiddingRoundInfo
          .sort((a, b) => b?.bid_info?.round - a?.bid_info?.round)
          .slice(0, limit)
          .map((bid, key) => {
            const statusTxt = bid?.bid_info?.round === activeRound ? BID_ROUND_STATUS.ONGOING : BID_ROUND_STATUS.ENDED;
            const Status = StatusIcon[statusTxt] || EndedIcon;

            return (
              <div
                onClick={() => {
                  // setFilterRound(bid?.bid_info?.round || filterRound)
                  handleUpdateRoundURL(bid?.bid_info?.round || filterRound);
                }}
                className={`${styles.bidItem} ${filterRound === bid?.bid_info?.round ? styles.active : ''}`}
                key={`${key}-${bid?.distribution_info?.total_distribution}`}
              >
                <div className={styles.info}>
                  <span>ROUND #{bid?.bid_info?.round}</span>
                  <div className={styles.status}>
                    <Status />
                    <span className={`${styles[statusTxt]}`}>
                      {bid?.bid_info?.round === activeRound ? BID_ROUND_STATUS.ONGOING : BID_ROUND_STATUS.ENDED}
                    </span>
                  </div>
                </div>
                <div className={styles.value}>
                  <div className={styles.usdc}>
                    <UsdcIcon />
                    <span>{numberWithCommas(toDisplay(bid?.distribution_info?.total_distribution))}</span>
                  </div>
                  <div className={styles.oraix}>
                    {theme === 'light' ? <OraiXLightIcon /> : <OraiXIcon />}
                    <span>{numberWithCommas(toDisplay(bid?.bid_info?.total_bid_amount))} </span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
      {listBiddingRoundInfo?.length > 0 && limit <= listBiddingRoundInfo.length && (
        <div className={styles.loadMore}>
          <span onClick={() => setLimit((limit) => limit + LIMIT_PAGE)}>Load more</span>
        </div>
      )}
    </div>
  );
};

export default ListHistory;
