import { BigDecimal } from '@oraichain/oraidex-common';
import { OraiswapRouterQueryClient } from '@oraichain/oraidex-contracts-sdk';
import LoadingBox from 'components/LoadingBox';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import { network, oraichainTokens, tokenMap } from 'initCommon';
import { INIT_AMOUNT_SIMULATE, TAB_HISTORY } from 'pages/CoHarvest/constants';
import {
  useGetAllBids,
  useGetBidHistoryWithPotentialReturn,
  useGetBiddingFilter,
  useGetHistoryBid
} from 'pages/CoHarvest/hooks/useGetBidRound';
import { useTabRoute } from 'pages/CoHarvest/hooks/useQueryRoute';
import { useSimulate } from 'pages/UniversalSwap/Swap/hooks';
import { memo, useState } from 'react';
import AllBidding from '../AllBidding';
import ListHistory from '../ListHistory';
import MyBidding from '../MyBidding';
import styles from './index.module.scss';

const BiddingHistory = ({ round, filterRound, setFilterRound, handleUpdateRoundURL }) => {
  const ORAIX_TOKEN_INFO = oraichainTokens.find((e) => e.coinGeckoId === 'oraidex');
  const USDC_TOKEN_INFO = oraichainTokens.find((e) => e.coinGeckoId === 'usd-coin');

  // const [showFilter, setShowFilter] = useState(false);

  const originalFromToken = tokenMap['oraix'];
  const originalToToken = tokenMap['usdc'];
  const routerClient = new OraiswapRouterQueryClient(window.client, network.router);

  const [activeTab, setActiveTab] = useState(TAB_HISTORY.MY_BID);

  const { simulateData: averageRatio } = useSimulate(
    'simulate-average-data-co-harvest',
    ORAIX_TOKEN_INFO,
    USDC_TOKEN_INFO,
    originalFromToken,
    originalToToken,
    routerClient,
    INIT_AMOUNT_SIMULATE
  );

  const exchangeRate = new BigDecimal(averageRatio?.displayAmount || 0).div(INIT_AMOUNT_SIMULATE).toString();
  const { data: prices } = useCoinGeckoPrices();
  const { biddingInfo } = useGetBiddingFilter(filterRound);
  const { historyBidPool } = useGetHistoryBid(filterRound);
  const { historyAllBidPool, isLoading: loadingAllBid } = useGetAllBids(filterRound, biddingInfo, prices, exchangeRate);
  const { listPotentialReturn, isLoading: loadingMyBid } = useGetBidHistoryWithPotentialReturn({
    listBidHistories: historyBidPool,
    exchangeRate,
    biddingInfo,
    prices
  });

  const { handleUpdateTabURL } = useTabRoute(setActiveTab);

  return (
    <div className={styles.biddingHistory} id="history">
      <div className={styles.historyList}>
        <ListHistory
          handleUpdateRoundURL={handleUpdateRoundURL}
          activeRound={round}
          filterRound={filterRound}
          setFilterRound={setFilterRound}
        />
      </div>

      <div className={styles.historyDetail}>
        <span className={styles.titleRound}>Round #{filterRound}</span>
        <div className={styles.tabWrapper}>
          <div className={styles.tabTitle}>
            <div
              onClick={() => {
                // setActiveTab(TAB_HISTORY.MY_BID)
                handleUpdateTabURL(TAB_HISTORY.MY_BID);
              }}
              className={`${styles.title} ${activeTab === TAB_HISTORY.MY_BID ? styles.active : ''}`}
            >
              My bids history
            </div>
            <div
              onClick={() => {
                // setActiveTab(TAB_HISTORY.ALL_BID)
                handleUpdateTabURL(TAB_HISTORY.ALL_BID);
              }}
              className={`${styles.title} ${activeTab === TAB_HISTORY.ALL_BID ? styles.active : ''}`}
            >
              All Bidding
            </div>
          </div>
        </div>
        <div className={styles.content}>
          {activeTab === TAB_HISTORY.MY_BID && (
            <LoadingBox loading={loadingMyBid} className={styles.loadingDivWrapper}>
              {/* {listPotentialReturn && listPotentialReturn.length <= 0 ? null : (
                <span className={styles.title}>Round #{filterRound}</span>
              )} */}
              <MyBidding list={listPotentialReturn} isLoading={loadingMyBid} />
            </LoadingBox>
          )}
          {activeTab === TAB_HISTORY.ALL_BID && (
            <LoadingBox loading={loadingAllBid} className={styles.loadingDivWrapper}>
              {/* {historyAllBidPool.length <= 0 ? null : <span className={styles.title}>Round #{filterRound}</span>} */}
              <AllBidding list={historyAllBidPool} isLoading={loadingAllBid} />
            </LoadingBox>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(BiddingHistory);
