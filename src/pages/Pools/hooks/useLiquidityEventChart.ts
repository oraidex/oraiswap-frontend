import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import { useGetPoolLiquidityVolume } from 'pages/Pool-V3/hooks/useGetPoolLiquidityVolume';
import { useGetPoolList } from 'pages/Pool-V3/hooks/useGetPoolList';
import { useEffect, useState } from 'react';
import { FILTER_DAY } from 'reducer/type';
import { getChartPoolsV3ByDay, MILIS_PER_DAY } from 'rest/graphClient';
import axios from 'rest/request';

export const useLiquidityEventChart = (
  type: FILTER_DAY,
  onUpdateCurrentItem?: React.Dispatch<React.SetStateAction<number>>,
  pair?: string
) => {
  const { data: price } = useCoinGeckoPrices();
  const { poolPrice } = useGetPoolList(price);
  const { poolLiquidities } = useGetPoolLiquidityVolume(poolPrice);
  const [currentDataLiquidity, setCurrentDataLiquidity] = useState([]);
  const [currentItem, setCurrentItem] = useState<{
    value: number;
    time: string | number;
  }>({ value: 0, time: 0 });

  const onCrossMove = (item) => {
    setCurrentItem(item);
    onUpdateCurrentItem && onUpdateCurrentItem(item?.value || 0);
  };

  const onMouseLiquidityLeave = () => {
    if (currentDataLiquidity.length > 0) {
      setCurrentItem(currentDataLiquidity[currentDataLiquidity.length - 1]);
      onUpdateCurrentItem && onUpdateCurrentItem(currentDataLiquidity[currentDataLiquidity.length - 1]?.value || 0);
    }
  };

  const onChangeRangeLiquidity = async (value: FILTER_DAY = FILTER_DAY.DAY) => {
    try {
      let dataV2 = [];

      if (pair) {
        dataV2 = await getDataLiquidityHistoricalByPair(pair, value);
      } else {
        dataV2 = await getDataLiquidityHistoricalAll(value);
        dataV2 = dataV2.slice(-90); // just get latest 90 days data of liquidity
      }

      const poolsV3VData = await getChartPoolsV3ByDay();
      const dataVolumeV3 = poolsV3VData.map((poolV3) => {
        const dayIndex = poolV3.keys[0];
        const currentDayIndex = Math.round(new Date().getTime() / MILIS_PER_DAY);
        if (Number(dayIndex) === currentDayIndex) {
          const totalLiqudity = Object.values(poolLiquidities).reduce((acc, cur) => acc + cur, 0);

          return {
            time: new Date(dayIndex * MILIS_PER_DAY).toJSON(),
            value: totalLiqudity
          };
        }
        return {
          time: new Date(dayIndex * MILIS_PER_DAY).toJSON(),
          value: poolV3.sum.tvlUSD
        };
      });

      const combinedData = dataVolumeV3
        .map((dataV3ByDay) => {
          const dataV2ByDay = dataV2.find((item) => item.time === dataV3ByDay.time);

          return {
            time: dataV3ByDay.time,
            value: (dataV2ByDay?.value ?? 0) + (dataV3ByDay?.value ?? 0)
          };
        })
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      setCurrentDataLiquidity(combinedData);
      if (combinedData.length > 0) {
        setCurrentItem({ ...combinedData[combinedData.length - 1] });
        onUpdateCurrentItem && onUpdateCurrentItem(combinedData[combinedData.length - 1]?.value || 0);
      }
    } catch (e) {
      console.log('Liquidity ERROR:', e);
    }
  };

  useEffect(() => {
    if (!Object.keys(poolLiquidities).length) return;
    onChangeRangeLiquidity(type);
  }, [type, poolLiquidities]);

  return {
    currentDataLiquidity,
    currentItem,
    onCrossMove,
    onMouseLiquidityLeave
  };
};
export const MINIMUM_YEAR_STATISTIC = 2000;

export const getDataLiquidityHistoricalAll = async (type: FILTER_DAY = FILTER_DAY.DAY) => {
  try {
    const res = await axios.get('/v1/liquidity/historical/all-charts', {
      params: {
        type
      }
    });
    return (res.data || []).filter((item) => item?.time && new Date(item?.time).getFullYear() > MINIMUM_YEAR_STATISTIC);
  } catch (e) {
    console.error('getDataLiquidityHistoricalAll', e);
    return [];
  }
};

export const getDataLiquidityHistoricalByPair = async (pair: string, type: FILTER_DAY = FILTER_DAY.DAY) => {
  try {
    const res = await axios.get('/v1/liquidity/historical/chart', {
      params: {
        type,
        pair
      }
    });
    return (res.data || []).filter((item) => item?.time && new Date(item?.time).getFullYear() > MINIMUM_YEAR_STATISTIC);
  } catch (e) {
    console.error(`getDataLiquidityHistoricalByPair - pair: ${pair}`, e);
    return [];
  }
};
