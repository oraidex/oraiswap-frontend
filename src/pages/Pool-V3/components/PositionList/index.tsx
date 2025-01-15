import NoDataDark from 'assets/images/NoDataPool.svg?react';
import NoData from 'assets/images/NoDataPoolLight.svg?react';
import LoadingBox from 'components/LoadingBox';
import useConfigReducer from 'hooks/useConfigReducer';
import useTheme from 'hooks/useTheme';
import { convertPosition } from 'pages/Pool-V3/helpers/helper';
import { useEffect, useState } from 'react';
import { getFeeClaimData } from 'rest/graphClient';
import PositionItem from '../PositionItem';
import styles from './index.module.scss';
import { useGetPositions } from 'pages/Pool-V3/hooks/useGetPosition';
import { useGetPoolList } from 'pages/Pool-V3/hooks/useGetPoolList';

const PositionList = () => {
  const theme = useTheme();

  const isLight = theme === 'light';

  const [cachePrices] = useConfigReducer('coingecko');
  const [address] = useConfigReducer('address');

  const [loading, setLoading] = useState(false);
  const [dataPosition, setDataPosition] = useState<any[]>([]);
  const { positions, isFetchingPositions } = useGetPositions(address);
  const { poolList, poolPrice } = useGetPoolList(cachePrices);

  useEffect(() => {
    (async () => {
      try {
        // setLoading(true);
        if (!address) {
          setDataPosition([]);
          return;
        }

        if (!positions.length || !poolList.length || isFetchingPositions) {
          return;
        }

        const feeClaimData = await getFeeClaimData(address);
        const positionsMap = await convertPosition({
          positions: positions.map((po, ind) => ({ ...po, ind })),
          poolsData: poolList,
          cachePrices: poolPrice,
          address,
          isLight,
          feeClaimData
        });

        setDataPosition(positionsMap);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        // setLoading(false);
      }
    })();

    return () => {};
  }, [address, poolList, positions, isLight, isFetchingPositions, poolPrice]);

  return (
    <div className={styles.positionList}>
      <LoadingBox loading={loading} styles={{ minHeight: '60vh', height: 'fit-content' }}>
        {dataPosition.length ? (
          dataPosition.map((position, key) => {
            return (
              <div className={styles.item} key={`position-list-item-${key}`}>
                <PositionItem position={position} />
              </div>
            );
          })
        ) : (
          <div className={styles.nodata}>
            {theme === 'light' ? <NoData /> : <NoDataDark />}
            <span>No Positions!</span>
          </div>
        )}
      </LoadingBox>
    </div>
  );
};

export default PositionList;
