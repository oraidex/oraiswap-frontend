import { CW20_DECIMALS, parseTokenInfoRawDenom, toDisplay } from '@oraichain/oraidex-common';
import { CoinGeckoId } from '@oraichain/oraidex-common/build/network';
import { oraichainTokens } from 'initCommon';
import { toFixedIfNecessary } from 'pages/Pools/helpers';
import { useEffect, useState } from 'react';
import { FILTER_TIME_CHART } from 'reducer/type';
import axios from 'rest/request';

export enum ChartTokenType {
  Price = 'Price',
  Volume = 'Volume'
}

export type ChartDataValue = {
  value: number;
  time: number;
  volume: number;
};

const KeyMapByChartType: Record<ChartTokenType, keyof ChartDataValue> = {
  [ChartTokenType.Price]: 'value',
  [ChartTokenType.Volume]: 'volume'
};

export const useChartUsdPrice = (
  type: FILTER_TIME_CHART,
  token: CoinGeckoId,
  chartType: ChartTokenType,
  onUpdateCurrentItem?: React.Dispatch<React.SetStateAction<number>>,
  onUpdatePricePercent?: React.Dispatch<React.SetStateAction<string | number>>
) => {
  const [currentData, setCurrentData] = useState<ChartDataValue[]>([]);
  const [changePercent, setChangePercent] = useState<string | number>(0);

  // TODO: add loading animation later.
  const [isLoading, setIsLoading] = useState(false);

  const [currentItem, setCurrentItem] = useState<ChartDataValue>({ value: 0, time: 0, volume: 0 });

  const keyValue = KeyMapByChartType[chartType];

  const onCrossMove = (item) => {
    if (!item) return;

    setCurrentItem(item);
    onUpdateCurrentItem && onUpdateCurrentItem(item?.value || 0);

    if (currentData?.length) {
      const pricePercent = getPriceUsdChange(currentData[0]?.value || 0, item?.value || 0);

      setChangePercent(pricePercent);
      onUpdatePricePercent && onUpdatePricePercent(pricePercent);
    }
  };

  const onMouseLeave = () => {
    if (currentData.length > 0) {
      setCurrentItem(currentData[currentData.length - 1]);
      onUpdateCurrentItem && onUpdateCurrentItem(currentData[currentData.length - 1]?.[keyValue] || 0);

      const pricePercent = getPriceUsdChange(
        currentData[0]?.[keyValue] || 0,
        currentData[currentData.length - 1]?.[keyValue] || 0
      );
      setChangePercent(pricePercent);
      onUpdatePricePercent && onUpdatePricePercent(pricePercent);
    } else {
      setCurrentItem({ value: 0, time: 0, volume: 0 });
      onUpdateCurrentItem && onUpdateCurrentItem(0);
    }
  };

  const onChangeRange = async (type: FILTER_TIME_CHART = FILTER_TIME_CHART.DAY) => {
    try {
      setIsLoading(true);
      const tokenOnOraichain = oraichainTokens.find((t) => t.coinGeckoId === token && t.decimals === CW20_DECIMALS);
      const tokenDenom = parseTokenInfoRawDenom(tokenOnOraichain);

      const data = await getDataPriceMarket(tokenDenom, type);

      const fmtData = (data || []).map((item) => {
        return {
          time: Number(item.time) * 1000,
          value: item.price || 0,
          volume: toFixedIfNecessary(toDisplay(Number(item.volume || 0).toString()).toString(), 2)
        };
      });

      if (fmtData?.length) {
        const pricePercent = getPriceUsdChange(
          fmtData[0]?.[keyValue] || 0,
          fmtData[fmtData.length - 1]?.[keyValue] || 0
        );

        setChangePercent(pricePercent);
        onUpdatePricePercent && onUpdatePricePercent(pricePercent);
      }

      setCurrentData(fmtData);
      if (fmtData.length > 0) {
        setCurrentItem({ ...fmtData[fmtData.length - 1] });
        onUpdateCurrentItem && onUpdateCurrentItem(fmtData[fmtData.length - 1]?.[keyValue] || 0);
      } else {
        setCurrentItem({ value: 0, time: 0, volume: 0 });
        onUpdateCurrentItem && onUpdateCurrentItem(0);
      }
    } catch (e) {
      console.log(' ERROR: e', 'background: #FF0000; color:#FFFFFF', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    onChangeRange(type);
  }, [type, token]);

  useEffect(() => {
    onMouseLeave();
  }, [chartType]);

  return {
    changePercent,
    currentData,
    currentItem,
    onCrossMove,
    onMouseLeave
  };
};

// map to seconds
export const FILTER_DAYS = {
  [FILTER_TIME_CHART['DAY']]: {
    range: 24 * 60 * 60,
    tf: 10 * 60
  },
  [FILTER_TIME_CHART['7DAY']]: {
    range: 7 * 24 * 60 * 60,
    tf: 60 * 60
  },
  [FILTER_TIME_CHART['MONTH']]: {
    range: 30 * 24 * 60 * 60,
    tf: 1 * 60 * 60
  },
  [FILTER_TIME_CHART['3MONTH']]: {
    range: 90 * 24 * 60 * 60,
    tf: 3 * 60 * 60
  }
};

export const getDataPriceMarket = async (tokenDenom: string, type: FILTER_TIME_CHART = FILTER_TIME_CHART.DAY) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const res = await axios.get(`v1/price-usd-chart`, {
      params: {
        denom: tokenDenom,
        tf: FILTER_DAYS[type].tf,
        startTime: now - FILTER_DAYS[type].range,
        endTime: now
      }
    });

    return res?.data || [];
  } catch (e) {
    console.error('getCoinPriceMarket', e);
    return [];
  }
};

export const getPriceUsdChange = (startValue: number, endValue: number) => {
  if (!startValue) return '0.00';
  return toFixedIfNecessary((((endValue - startValue) / startValue) * 100).toString(), 2);
};
