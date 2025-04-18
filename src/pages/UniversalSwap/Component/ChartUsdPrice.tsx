import useConfigReducer from 'hooks/useConfigReducer';
import { ChartOptions, ColorType, DeepPartial, LineStyle, TickMarkType, Time, createChart } from 'lightweight-charts';
import { TIMER } from 'pages/CoHarvest/constants';
import { formatDateChart, formatNumberKMB } from 'pages/CoHarvest/helpers';
import { numberWithCommas, toFixedIfNecessary } from 'pages/Pools/helpers';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentFromToken, selectCurrentToToken } from 'reducer/tradingSlice';
import { FILTER_TIME_CHART } from 'reducer/type';
import { formatTimeDataChart, getTokenIsStableCoin } from '../helpers';
import { ChartTokenType, useChartUsdPrice } from '../hooks/useChartUsdPrice';
import styles from './ChartUsdPrice.module.scss';
import { parseTokenInfoRawDenom } from '@oraichain/oraidex-common';

export type ChartUsdPropsType = {
  filterDay: FILTER_TIME_CHART;
  onUpdateCurrentItem?: React.Dispatch<React.SetStateAction<number>>;
  onUpdatePricePercent?: React.Dispatch<React.SetStateAction<number>>;
  activeAnimation?: boolean;
  chartTokenType: ChartTokenType;
  percentChangeUsd?: number
};

const ChartUsdPrice = ({
  filterDay,
  onUpdateCurrentItem,
  onUpdatePricePercent,
  activeAnimation = false,
  chartTokenType = ChartTokenType.Price,
  percentChangeUsd
}: ChartUsdPropsType) => {
  const chartRef = useRef(null);
  const containerRef = useRef(null);
  const serieRef = useRef(null);
  const resizeObserver = useRef(null);
  const [theme] = useConfigReducer('theme');
  const currentToToken = useSelector(selectCurrentToToken);
  const currentFromToken = useSelector(selectCurrentFromToken);
  const toTokenDenomIsStable = getTokenIsStableCoin(currentToToken);
  const getTokenDenom = toTokenDenomIsStable
    ? currentFromToken
      ? parseTokenInfoRawDenom(currentFromToken)
      : 'cw20:orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh:USDT'
    : currentToToken
      ? parseTokenInfoRawDenom(currentToToken)
      : 'orai';

  const {
    currentData: data,
    currentItem,
    onCrossMove: crossMove,
    onMouseLeave
  } = useChartUsdPrice(filterDay, getTokenDenom, chartTokenType, onUpdateCurrentItem, onUpdatePricePercent);

  function handleResizeObserver(entries: ResizeObserverEntry[]) {
    window.requestAnimationFrame((): void | undefined => {
      if (!Array.isArray(entries) || !entries.length) {
        return;
      }

      const { width, height } = entries[0].contentRect;
      chartRef.current.applyOptions({ width, height });
      setTimeout(() => {
        chartRef.current.timeScale().fitContent();
      }, 0);
    });
  }

  useEffect(() => {
    resizeObserver.current = new ResizeObserver((entries) => {
      handleResizeObserver(entries);
    });

    resizeObserver.current.observe(containerRef.current, {
      box: 'content-box'
    });
    return () => {
      resizeObserver.current.disconnect();
    };
  }, []);

  const defaultOption: DeepPartial<ChartOptions> = {
    handleScroll: {
      vertTouchDrag: false
    },
    rightPriceScale: {
      borderColor: theme === 'light' ? '#EFEFEF' : '#232521',
      borderVisible: false,
      scaleMargins: {
        top: 0.2,
        bottom: chartTokenType === ChartTokenType.Price ? 0.2 : 0
      }
    },
    leftPriceScale: {
      visible: false,
      borderColor: theme === 'light' ? '#EFEFEF' : '#232521'
    },
    layout: {
      background: {
        type: ColorType.Solid,
        color: 'transparent'
      },
      textColor: theme === 'light' ? '#686A66' : '#979995'
    },
    localization: {
      locale: 'en-US',
      dateFormat: 'dd MMM, yyyy',
      priceFormatter: (price) => {
        if (chartTokenType === ChartTokenType.Volume) {
          return formatNumberKMB(Number(price));
        }

        return `$${numberWithCommas(toFixedIfNecessary(Number(price).toString(), 6), undefined, {
          maximumFractionDigits: 6
        })}`;
      }
    },
    grid: {
      horzLines: {
        visible: false,
      },
      vertLines: {
        visible: false,
      }
    },
    crosshair: {
      horzLine: {
        visible: false,
        labelVisible: false,
        style: LineStyle.Dotted,
        width: 1,
        color: theme === 'light' ? '#A6BE93' : '#A6BE93',
        labelBackgroundColor: '#aee67f'
      },
      vertLine: {
        visible: true,
        labelVisible: false,
        style: LineStyle.Solid,
        width: 1,
        color: theme === 'light' ? '#DFE0DE' : '#494949',
        labelBackgroundColor: '#aee67f'
      }
    },
    timeScale: {
      rightOffset: 1,
      barSpacing: 28,

      borderColor: theme === 'light' ? '#EFEFEF' : '#232521',
      // borderColor: 'red',
      timeVisible: true,
      secondsVisible: false,

      rightBarStaysOnScroll: true,
      lockVisibleTimeRangeOnResize: true,
      ticksVisible: false,

      fixLeftEdge: true,
      fixRightEdge: true,

      tickMarkFormatter: (time: Time, tickMarkType: TickMarkType, locale: string) => {
        // formatTime Feb 1, Mar 2,....
        const timestamp = Number(time) * TIMER.MILLISECOND;
        return formatDateChart(timestamp);
      }
    },
  };

  const redSettingAreaSeries = {
    topColor: 'rgba( 239, 83, 80, 0.05)',
    bottomColor: 'rgba( 239, 83, 80, 0.28)',
    lineColor: 'rgba( 239, 83, 80, 1)',
  }

  const defaultSettingAreaSeries = {
    topColor: theme === 'light' ? '#EEF9E5' : '#32392D',
    bottomColor: theme === 'light' ? '#fff' : '#181A17',
    lineColor: theme === 'light' ? '#A6BE93' : '#A6BE93',
  }

  const settingAreaSeries = percentChangeUsd < 0 ? redSettingAreaSeries : defaultSettingAreaSeries;

  useEffect(() => {
    // Initialization
    if (chartRef.current === null) {
      const chart = createChart(containerRef.current, defaultOption);

      serieRef.current = chart.addAreaSeries({
        priceLineVisible: false,
        ...settingAreaSeries,
      });

      chartRef.current = chart;
    }

    const hover = (event) => {
      let item = event?.seriesData?.get(serieRef.current); // || { time: '', value: '' };
      crossMove(item);
    };
    chartRef.current.subscribeCrosshairMove(hover);

    return () => {
      chartRef.current.unsubscribeCrosshairMove(hover);
    };
  }, [crossMove]);

  useEffect(() => {
    if (!chartRef?.current) return;

    chartRef.current.applyOptions(defaultOption);

    // remove current series
    chartRef.current.removeSeries(serieRef.current);

    if (chartTokenType === ChartTokenType.Volume) {
      serieRef.current = chartRef.current.addHistogramSeries({
        color: theme === 'light' ? '#A6BE93' : '#A6BE93'
      });
    } else {
      serieRef.current = chartRef.current.addAreaSeries({
        ...settingAreaSeries,
        lineWidth: 3
      });
    }

    // update new theme series with current data
    let newData = data?.map((val) => {
      if (chartTokenType === ChartTokenType.Volume) {
        return {
          ...val,
          value: val.volume,
          time: Math.floor(new Date(val?.time).getTime() / 1000)
        };
      }
      return {
        ...val,
        time: Math.floor(new Date(val?.time).getTime() / 1000)
      };
    });
    serieRef?.current?.setData(newData);
    chartRef?.current?.timeScale()?.fitContent();
  }, [theme, data, chartTokenType]);

  const showTime = formatTimeDataChart(currentItem?.time || 0, filterDay, data?.[data?.length - 1]?.time);

  console.log({
    containerRef: containerRef.current,
    filterDay
  });

  return (
    <div className={`${styles.chartUsdPrice} ${activeAnimation ? styles.activeAnimation : ''}`}>
      <div className={styles.header}>
        {/* {!token ? null : <div className={styles.value}>{formatDisplayUsdt(currentItem.value || '0')}</div>} */}
        <div>{showTime}</div>
      </div>
      <div className={styles.chartContainer}>
        <div onMouseLeave={onMouseLeave} className={styles.chartRoot} ref={containerRef} />
      </div>
    </div>
  );
};

export default ChartUsdPrice;
