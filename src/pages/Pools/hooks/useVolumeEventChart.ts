import { useEffect, useRef, useState } from 'react';
import axios from 'rest/request';
import { getInclude } from '../helpers';
import { MINIMUM_YEAR_STATISTIC } from './useLiquidityEventChart';
import { FILTER_DAY } from 'reducer/type';
import { getChartPoolsV3ByDay, MILIS_PER_DAY } from 'rest/graphClient';
import { useGetPoolList } from 'pages/Pool-V3/hooks/useGetPoolList';
import { useGetPoolLiquidityVolume } from 'pages/Pool-V3/hooks/useGetPoolLiquidityVolume';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';

export const useVolumeEventChart = (
  type: FILTER_DAY,
  onUpdateCurrentItem?: React.Dispatch<React.SetStateAction<number>>,
  pair?: string
) => {
  const { data: price } = useCoinGeckoPrices();
  const { poolPrice } = useGetPoolList(price);
  const { poolVolume } = useGetPoolLiquidityVolume(poolPrice); // volumeV2, liquidityV2

  const [currentDataVolume, setCurrentDataVolume] = useState([]);

  const [currentItem, setCurrentItem] = useState<{
    value: number;
    time: string | number;
  }>({ value: 0, time: 0 });

  const dataClick = useRef({ time: { day: 1, month: 1, year: 1 }, value: 0, clickedTwice: true });

  const onCrossMove = (item) => {
    setCurrentItem(item);
    onUpdateCurrentItem && onUpdateCurrentItem(item?.value || 0);
  };

  const onMouseVolumeLeave = () => {
    if (currentDataVolume.length > 0)
      if (dataClick.current.clickedTwice) {
        const lastElt = currentDataVolume[currentDataVolume.length - 1];
        setCurrentItem({ time: lastElt.time, value: lastElt.value });
        onUpdateCurrentItem && onUpdateCurrentItem(lastElt?.value || 0);
      }
  };

  const onClickChart = (e) => {
    const index = getInclude(currentDataVolume, (item) => {
      return item.time.year === e.time.year && item.time.month === e.time.month && item.time.day === e.time.day;
    });
    if (index > -1) {
      const same =
        e.time.year === dataClick.current.time.year &&
        e.time.month === dataClick.current.time.month &&
        e.time.day === dataClick.current.time.day;

      dataClick.current = {
        time: currentDataVolume[index].time,
        value: currentDataVolume[index].value,
        clickedTwice: same ? !dataClick.current.clickedTwice : false
      };
    }
  };

  const onChangeRangeVolume = async (value: FILTER_DAY = FILTER_DAY.DAY) => {
    try {
      let dataV2 = [];

      if (pair) {
        dataV2 = await getDataVolumeHistoricalByPair(pair, value);
      } else {
        dataV2 = await getDataVolumeHistoricalAll(value);
        dataV2 = dataV2.slice(-90); // just get latest 90 days data of volume
      }

      const poolsV3VData = await getChartPoolsV3ByDay();
      const dataVolumeV3 = poolsV3VData.map((poolV3) => {
        const dayIndex = poolV3.keys[0];
        const currentDayIndex = Math.round(new Date().getTime() / MILIS_PER_DAY);
        if (Number(dayIndex) === currentDayIndex) {
          const latest24hVolume = Object.values(poolVolume).reduce((acc, cur) => acc + cur, 0);

          return {
            time: new Date(dayIndex * MILIS_PER_DAY).toJSON(),
            value: latest24hVolume
          };
        }
        return {
          time: new Date(dayIndex * MILIS_PER_DAY).toJSON(),
          value: poolV3.sum.volumeInUSD
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

      setCurrentDataVolume(combinedData);
      if (combinedData.length > 0) {
        setCurrentItem({ ...combinedData[combinedData.length - 1] });
        onUpdateCurrentItem && onUpdateCurrentItem(combinedData[combinedData.length - 1]?.value || 0);
      }
    } catch (e) {
      console.log('Volume ERROR: e', e);
    }
  };

  useEffect(() => {
    if (!Object.keys(poolVolume).length) return;
    onChangeRangeVolume(type);
  }, [type, poolVolume]);

  return {
    currentDataVolume,
    currentItem,
    onCrossMove,
    onClickChart,
    onMouseVolumeLeave
  };
};

export const getDataVolumeHistoricalAll = async (type: FILTER_DAY = FILTER_DAY.DAY) => {
  try {
    const res = await axios.get('/v1/volume/historical/all-charts', {
      params: {
        type
      }
    });
    return (res.data || []).filter((item) => item?.time && new Date(item?.time).getFullYear() > MINIMUM_YEAR_STATISTIC);
  } catch (e) {
    console.error('getDataVolumeHistoricalAll', e);
    return [];
  }
};

export const getDataVolumeHistoricalByPair = async (pair: string, type: FILTER_DAY = FILTER_DAY.DAY) => {
  try {
    const res = await axios.get('/v1/volume/historical/chart', {
      params: {
        type,
        pair
      }
    });
    return (res.data || []).filter((item) => item?.time && new Date(item?.time).getFullYear() > MINIMUM_YEAR_STATISTIC);
  } catch (e) {
    console.error(`getDataVolumeHistoricalByPair - pair: ${pair}`, e);
    return [];
  }
};
