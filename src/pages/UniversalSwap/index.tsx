import { isMobile } from '@walletconnect/browser-utils';
import cn from 'classnames/bind';
import ModalCustom from 'components/ModalCustom';
import { EVENT_CONFIG_THEME } from 'config/eventConfig';
import useTemporaryConfigReducer from 'hooks/useTemporaryConfigReducer';
import useTheme from 'hooks/useTheme';
import Content from 'layouts/Content';
import { DuckDb } from 'libs/duckdb';
// import { useGetPriceChange } from 'pages/Pools/hooks';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { selectCurrentSwapFilterTime, selectCurrentSwapTabChart } from 'reducer/chartSlice';
import {
  selectChartTimeFrame,
  selectCurrentFromToken,
  selectCurrentToToken,
  selectCurrentToken,
  setChartTimeFrame
} from 'reducer/tradingSlice';
import { FILTER_TIME_CHART } from 'reducer/type';
import { AssetsTab, HeaderTab, HeaderTop, HistoryTab, TabsTxs } from './Component';
import ChartUsdPrice from './Component/ChartUsdPrice';
import { TransactionProcess } from './Modals';
import SwapComponent from './Swap';
import { initPairSwap } from './Swap/hooks/useFillToken';
import { NetworkFilter, TYPE_TAB_HISTORY, initNetworkFilter } from './helpers';
import { ChartTokenType, useChartUsdPrice } from './hooks/useChartUsdPrice';
import styles from './index.module.scss';
import classNames from 'classnames';
import Lottie from 'lottie-react';

const cx = cn.bind(styles);

const Swap: React.FC = () => {
  const [[fromTokenDenom, toTokenDenom], setSwapTokens] = useState<[string, string]>(initPairSwap);
  const [networkFilter, setNetworkFilter] = useState<NetworkFilter>(initNetworkFilter);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const mobileMode = isMobile();
  const [searchParams] = useSearchParams();
  const [event] = useTemporaryConfigReducer('event');
  const theme = useTheme();

  let tab = searchParams.get('type');

  const [priceUsd, setPriceUsd] = useState(0);
  const [percentChangeUsd, setPercentChangeUsd] = useState<string | number>(0);
  const [initPriceUsd, setInitPriceUsd] = useState(0);
  const [initPercentChangeUsd, setInitPercentChangeUsd] = useState<string | number>(0);
  const currentPair = useSelector(selectCurrentToken);
  const tokenTo = useSelector(selectCurrentToToken);
  const tf = useSelector(selectChartTimeFrame);

  // get data for mobile
  useChartUsdPrice(
    FILTER_TIME_CHART.DAY,
    tokenTo?.coinGeckoId,
    ChartTokenType.Price,
    setInitPriceUsd,
    setInitPercentChangeUsd
  );

  // const { priceChange } = useGetPriceChange({
  //   base_denom: currentPair.info.split('-')[0],
  //   quote_denom: currentPair.info.split('-')[1],
  //   tf
  // });

  const initDuckdb = async () => {
    window.duckDb = await DuckDb.create();
  };

  useEffect(() => {
    if (!window.duckDb) initDuckdb();
  }, [window.duckDb]);

  const configTheme = EVENT_CONFIG_THEME[theme][event];

  const { topImg, bottomImg, topJson, bottomJson } = configTheme.animation;

  const hasAnimationsOrImages = topImg || bottomImg || topJson || bottomJson;
  const animations = [
    { condition: topJson, className: styles.top, type: 'json', data: topJson },
    { condition: bottomJson, className: styles.bottom, type: 'json', data: bottomJson },
    { condition: topImg, className: styles.top, type: 'img', src: topImg },
    { condition: bottomImg, className: styles.bottom, type: 'img', src: bottomImg }
  ];

  return (
    <>
      {hasAnimationsOrImages && (
        <div className={classNames(styles.wrapperEvent, styles[event])}>
          {animations.map(({ condition, className, type, data, src }, index) =>
            condition ? (
              type === 'json' ? (
                <Lottie key={index} className={className} animationData={data} autoPlay={true} loop={true} />
              ) : (
                <img key={index} className={className} src={src} alt="" />
              )
            ) : null
          )}
        </div>
      )}
      <Content nonBackground>
        <div className={cx('swap-container')}>
          <div className={cx('swap-col', 'w60')}>
            <div>
              {!mobileMode && (
                <Chart
                  toTokenDenom={toTokenDenom}
                  setPriceUsd={setPriceUsd}
                  priceUsd={priceUsd}
                  setPercentChangeUsd={setPercentChangeUsd}
                  percentChangeUsd={percentChangeUsd}
                />
              )}

              {/* <RoutingSection /> */}
              <TabsTxs setNetworkFilter={setNetworkFilter} networkFilter={networkFilter} />
              {tab === TYPE_TAB_HISTORY.HISTORY ? (
                <HistoryTab networkFilter={networkFilter.value} />
              ) : (
                <AssetsTab networkFilter={networkFilter.value} />
              )}
            </div>
          </div>
          <div className={cx('swap-col', 'w40')}>
            {/* {mobileMode && (
              <div className={styles.luckyDraw}>
                <LuckyDraw />
              </div>
            )} */}
            {mobileMode && (
              <HeaderTop
                hideChart
                priceUsd={initPriceUsd}
                // priceChange={priceChange}
                percentChangeUsd={initPercentChangeUsd}
                chartTokenType={ChartTokenType.Price}
                onClickAction={() => setOpenModal(true)}
              />
            )}
            {configTheme.swapBox.top && (
              <div className={styles.wrapperTop}>
                <img className={styles.swapTop} src={configTheme.swapBox.top} alt="" />
              </div>
            )}
            <SwapComponent fromTokenDenom={fromTokenDenom} toTokenDenom={toTokenDenom} setSwapTokens={setSwapTokens} />
            {configTheme.swapBox.bottom && (
              <img className={styles.swapBottom} src={configTheme.swapBox.bottom} alt="" />
            )}
          </div>
        </div>

        <ModalCustom open={openModal} onClose={() => setOpenModal(false)} title="Chart" showOnBottom>
          <Chart
            toTokenDenom={toTokenDenom}
            setPriceUsd={setPriceUsd}
            priceUsd={priceUsd}
            setPercentChangeUsd={setPercentChangeUsd}
            percentChangeUsd={percentChangeUsd}
            showTokenInfo={false}
          />
        </ModalCustom>
      </Content>
    </>
  );
};

const Chart = ({
  toTokenDenom,
  setPriceUsd,
  priceUsd,
  percentChangeUsd,
  setPercentChangeUsd,
  showTokenInfo = true
}: {
  toTokenDenom: string;
  setPriceUsd: React.Dispatch<React.SetStateAction<number>>;
  priceUsd: number;
  percentChangeUsd: string | number;
  setPercentChangeUsd: React.Dispatch<React.SetStateAction<string | number>>;
  showTokenInfo?: boolean;
}) => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const [hideChart, setHideChart] = useState<boolean>(false);
  const [isTxsProcess, setIsTxsProcress] = useState<boolean>(false);
  const [chartTokenType, setChartTokenType] = useState(ChartTokenType.Price);

  const currentPair = useSelector(selectCurrentToken);
  const currentFromToken = useSelector(selectCurrentFromToken);
  const currentToToken = useSelector(selectCurrentToToken);
  const filterTimeChartUsd = useSelector(selectCurrentSwapFilterTime);
  const tabChart = useSelector(selectCurrentSwapTabChart);
  const tf = useSelector(selectChartTimeFrame);

  // const { priceChange } = useGetPriceChange({
  //   base_denom: currentPair.info.split('-')[0],
  //   quote_denom: currentPair.info.split('-')[1],
  //   tf
  // });

  const handleChangeChartTimeFrame = (resolution: number) => {
    dispatch(setChartTimeFrame(resolution));
  };

  return (
    <div>
      <HeaderTab
        chartTokenType={chartTokenType}
        setChartTokenType={setChartTokenType}
        setHideChart={setHideChart}
        hideChart={hideChart}
        toTokenDenom={toTokenDenom}
        priceUsd={priceUsd}
        // priceChange={priceChange}
        percentChangeUsd={percentChangeUsd}
        showTokenInfo={showTokenInfo}
      />
      <div className={cx('tv-chart', hideChart ? 'hidden' : '')}>
        {isTxsProcess && <TransactionProcess close={() => setIsTxsProcress(!isTxsProcess)} />}
        <div className={cx(`chartItem`, hideChart ? 'hidden' : '', 'activeChart')}>
          <ChartUsdPrice
            activeAnimation={hideChart}
            filterDay={filterTimeChartUsd}
            onUpdateCurrentItem={setPriceUsd}
            onUpdatePricePercent={setPercentChangeUsd}
            chartTokenType={chartTokenType}
          />
        </div>
      </div>
    </div>
  );
};

export default Swap;
