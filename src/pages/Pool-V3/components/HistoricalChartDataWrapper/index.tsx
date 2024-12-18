import { FC } from 'react';
import HistoricalPriceChart from '../HistoricalPriceChart';
import styles from './index.module.scss';
import { TokenItemType } from '@oraichain/oraidex-common';
import { TimeDuration, TokenPairHistoricalPrice } from 'reducer/poolDetailV3';
import { Dec } from '@keplr-wallet/unit';
import useTheme from 'hooks/useTheme';


interface HistoricalChartDataWrapperProps {
  tokenX: TokenItemType;
  tokenY: TokenItemType;
  historicalChartData: TokenPairHistoricalPrice[];
  fullRange: boolean;
  yRange: [number, number];
  addRange: [number, number];
  currentPrice: number;
  hoverPrice: number;
  isXToY: boolean;
  setHoverPrice: (price: number) => void;
  setHistoricalRange: (range: TimeDuration) => void;

}

const HistoricalChartDataWrapper: FC<HistoricalChartDataWrapperProps> = ({
  hoverPrice,
  tokenX,
  tokenY,
  historicalChartData,
  fullRange,
  yRange,
  addRange,
  currentPrice,
  isXToY,
  setHoverPrice,
  setHistoricalRange,
}) => {
  // const formattedPrice =
  //   formatPretty(new Dec(hoverPrice), {
  //     maxDecimals: 8,
  //     notation: 'standard'
  //   }) || '';
  const theme = useTheme();

  const chartDataToNow = [...historicalChartData];
  // if (historicalChartData.length > 0) {
    chartDataToNow.push({
      close: currentPrice,
      time: Date.now()
    });
  // }

  return (
    <div className={styles.chartPrice}>
      <HistoricalPriceChart
        data={chartDataToNow}
        annotations={(fullRange ? [new Dec(yRange[0] * 1.05), new Dec(yRange[1] * 0.95)] : addRange) as any}
        domain={yRange as [number, number]}
        onPointerHover={setHoverPrice}
        onPointerOut={() => {
          setHoverPrice(currentPrice);
        }}
        extendLeft={historicalChartData[0]?.close <= 0.001 ? 30 : 10}
        xNumTicks={2}
        theme={theme}
      />
    </div>
  );
};

export default HistoricalChartDataWrapper;
