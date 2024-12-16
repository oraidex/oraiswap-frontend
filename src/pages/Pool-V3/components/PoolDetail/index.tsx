import { toDisplay } from '@oraichain/oraidex-common';
import AddIcon from 'assets/icons/Add.svg?react';
import BackIcon from 'assets/icons/back.svg?react';
import BootsIconDark from 'assets/icons/boost-icon-dark.svg?react';
import BootsIcon from 'assets/icons/boost-icon.svg?react';
import NoDataDark from 'assets/images/NoDataPool.svg?react';
import NoData from 'assets/images/NoDataPoolLight.svg?react';
import classNames from 'classnames';
import { Button } from 'components/Button';
import LoadingBox from 'components/LoadingBox';
import Tabs from 'components/TabCustom';
import { formatNumberKMB, numberWithCommas } from 'helper/format';
import useConfigReducer from 'hooks/useConfigReducer';
import useTheme from 'hooks/useTheme';
import SingletonOraiswapV3, { fetchPoolAprInfo, poolKeyToString } from 'libs/contractSingleton';
import { formatPoolData, getIconPoolData, PoolWithTokenInfo } from 'pages/Pool-V3/helpers/format';
import { convertPosition } from 'pages/Pool-V3/helpers/helper';
import { useGetAllPositions } from 'pages/Pool-V3/hooks/useGetAllPosition';
import { useGetFeeDailyData } from 'pages/Pool-V3/hooks/useGetFeeDailyData';
import { useGetPoolDetail } from 'pages/Pool-V3/hooks/useGetPoolDetail';
import { useGetPoolLiquidityVolume } from 'pages/Pool-V3/hooks/useGetPoolLiquidityVolume';
import { useGetPoolList } from 'pages/Pool-V3/hooks/useGetPoolList';
import { useGetPositions } from 'pages/Pool-V3/hooks/useGetPosition';
import { formatDisplayUsdt } from 'pages/Pools/helpers';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFeeClaimData } from 'rest/graphClient';
import CreateNewPosition from '../CreateNewPosition';
import PositionItem from '../PositionItem';
import TransactionHistory from '../TransactionHistory';
import styles from './index.module.scss';
import { usePoolIcons } from 'pages/Pool-V3/hooks/usePoolIcons';

const PoolV3Detail = () => {
  const [address] = useConfigReducer('address');
  const [cachePrices] = useConfigReducer('coingecko');
  const { poolList, poolPrice } = useGetPoolList(cachePrices);
  const { poolLiquidities, poolVolume } = useGetPoolLiquidityVolume(poolPrice);
  const [isOpenCreatePosition, setIsOpenCreatePosition] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const { poolId } = useParams<{ poolId: string }>();

  const [tokenX, tokenY, fee, tick] = poolId.split('-');
  const poolKeyString = poolKeyToString({
    token_x: tokenX,
    token_y: tokenY,
    fee_tier: {
      fee: Number(fee),
      tick_spacing: Number(tick)
    }
  });
  const isLight = theme === 'light';
  const IconBoots = isLight ? BootsIcon : BootsIconDark;

  const { FromTokenIcon, ToTokenIcon, tokenXinfo, tokenYinfo } = usePoolIcons(tokenX, tokenY, isLight);
  const isInactive = tokenXinfo?.name === 'BTC (Legacy)' || tokenYinfo?.name === 'BTC (Legacy)';
  const totalLiquidity = poolLiquidities?.[poolId] ?? 0;
  const volumn24h = poolVolume?.[poolId] ?? 0;

  const [dataPosition, setDataPosition] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [poolDetail, setPoolDetail] = useState<PoolWithTokenInfo>();
  const [statusRemove, setStatusRemove] = useState<boolean>(undefined);
  const [liquidity, setLiquidity] = useState({
    total: totalLiquidity,
    allocation: {}
  });

  const { feeDailyData } = useGetFeeDailyData();
  const { allPosition } = useGetAllPositions();
  const { positions: userPositions } = useGetPositions(address);
  const { liquidityDistribution } = useGetPoolDetail(poolKeyString, poolPrice);

  useEffect(() => {
    (async () => {
      try {
        if (!(poolList.length && allPosition && poolId)) return;
        if (liquidityDistribution !== null) {
          setLiquidity(liquidityDistribution);
          return;
        }

        const pool = poolList.find((p) => poolKeyToString(p.pool_key) === poolKeyString);
        const liquidity = await SingletonOraiswapV3.getLiquidityByPool(pool, poolPrice, allPosition);
        setLiquidity(liquidity);
      } catch (error) {
        console.log('error: get pool detail', error);
      } finally {
        if (poolList.length === 0) {
          return;
        }
        const pool = poolList.find((p) => poolKeyToString(p.pool_key) === poolKeyString);
        const isLight = theme === 'light';
        const fmtPool = await formatPoolData(pool, isLight);
        setPoolDetail(fmtPool as any);
      }
    })();
  }, [poolId, allPosition, poolList, theme, poolPrice, poolKeyString, liquidityDistribution]);

  const [aprInfo, setAprInfo] = useConfigReducer('aprPools');

  useEffect(() => {
    const getAPRInfo = async () => {
      const res = await fetchPoolAprInfo(
        [poolDetail],
        poolPrice,
        {
          [poolKeyString]: liquidity.total
        },
        feeDailyData
      );
      setAprInfo({
        ...aprInfo,
        [poolKeyString]: res[poolKeyString]
      });
    };

    if (poolDetail && poolPrice && liquidity && poolDetail.poolKey === poolKeyString) {
      getAPRInfo();
    }
  }, [liquidity.total, feeDailyData, poolDetail, poolPrice, poolKeyString]);

  const { spread, pool_key } = poolDetail || {};
  const { allocation, total } = liquidity;

  const [balanceX, balanceY] = [
    allocation[pool_key?.token_x]?.balance || 0,
    allocation[pool_key?.token_y]?.balance || 0
  ];

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (!(poolList.length && userPositions.length && poolPrice && address)) return setDataPosition([]);
        // if (dataPosition.length) return;
        const feeClaimData = await getFeeClaimData(address);

        const positionsMap = convertPosition({
          positions: userPositions.map((po, ind) => ({ ...po, ind })),
          poolsData: poolList,
          cachePrices: poolPrice,
          address,
          isLight,
          feeClaimData
        });
        const filteredPositions = positionsMap
          .filter((pos) => poolKeyToString(pos.pool_key) === poolKeyString)
          .sort((a, b) => a.token_id - b.token_id);

        setDataPosition(filteredPositions);
      } catch (error) {
        console.log({ error });
      } finally {
        setLoading(false);
        setStatusRemove(false);
      }
    })();

    return () => {};
  }, [address, poolList.length, userPositions]);

  const calcShowApr = (apr: number) =>
    numberWithCommas(apr * 100, undefined, {
      maximumFractionDigits: 1
    });

  const showTotalIncentive = () => {
    if (!aprInfo[poolKeyString]?.incentivesApr) return '--';

    const { min: incentiveMin, max: incentiveMax } = aprInfo[poolKeyString].incentivesApr || { min: 0, max: 0 };

    return incentiveMin === incentiveMax
      ? calcShowApr(incentiveMax)
      : `${calcShowApr(incentiveMin)} - ${calcShowApr(incentiveMax)}`;
  };

  return (
    <div className={classNames(styles.poolDetail, 'small_container')}>
      <div className={styles.header}>
        <div className={styles.name}>
          <div className={styles.back} onClick={() => navigate('/pools')}>
            <BackIcon />
          </div>
          <div className={styles.info}>
            <div className={classNames(styles.icons, styles[theme])}>
              {FromTokenIcon}
              {ToTokenIcon}
            </div>
            <span>
              {tokenXinfo?.name?.toUpperCase()} / {tokenYinfo?.name?.toUpperCase()}
            </span>
            <span className={classNames(styles.tag, styles.v3)}>V3</span>
          </div>
          <div className={styles.fee}>
            <span className={styles.item}>Fee: {toDisplay((fee || 0).toString(), 10)}%</span>
            {/* <span className={styles.item}>{toDisplay((spread || 0).toString(), 3)}% Spread</span> */}
            <span className={styles.item}>0.01% Spread</span>
          </div>
        </div>

        <div className={styles.addPosition}>
          <Button
            disabled={!poolDetail || isInactive}
            onClick={() => {
              setIsOpenCreatePosition(true);
            }}
            type="primary-sm"
          >
            <div>
              <AddIcon />
              &nbsp;
            </div>
            Add LP
          </Button>
          {isOpenCreatePosition && poolDetail && (
            <CreateNewPosition
              showModal={isOpenCreatePosition}
              setShowModal={setIsOpenCreatePosition}
              pool={poolDetail}
            />
          )}
        </div>
      </div>
      <div className={styles.detail}>
        <div className={styles.infos}>
          <div className={styles.tvl}>
            <div className={styles.box}>
              <p>Liquidity</p>
              <h1>{formatDisplayUsdt(totalLiquidity || 0)}</h1>
              {/* <span className={classNames(styles.percent, { [styles.positive]: true })}>
              {true ? '+' : '-'}
              {numberWithCommas(2.07767, undefined, { maximumFractionDigits: 1 })}%
            </span> */}
            </div>
            <div className={styles.box}>
              <p>Volume (24H)</p>
              <h1>{Number.isNaN(volumn24h) ? 0 : formatDisplayUsdt(volumn24h)}</h1>
              {/* <span className={classNames(styles.percent, { [styles.positive]: false })}>
              {false ? '+' : '-'}
              {numberWithCommas(2.07767, undefined, { maximumFractionDigits: 1 })}%
            </span> */}
            </div>
          </div>

          <div className={classNames(styles.box, styles.alloc)}>
            <p>Liquidity Allocation</p>
            {/* <div className={styles.tokensAlloc}>
              <div className={styles.base} style={{ width: `50%` }}></div>
              <div className={styles.quote} style={{ width: `50%` }}></div>
            </div> */}
            <div className={styles.tokens}>
              <div className={classNames(styles.tokenItem, styles[theme])}>
                {FromTokenIcon}
                {/* <span>{tokenXinfo?.name?.toUpperCase()}</span> */}
                <span className={styles.value}>{formatNumberKMB(balanceX, false)}</span>
              </div>
              <div className={classNames(styles.tokenItem, styles[theme])}>
                {ToTokenIcon}
                {/* <span>{tokenYinfo?.name?.toUpperCase()}</span> */}
                <span className={styles.value}>{formatNumberKMB(balanceY, false)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.reward}>
          <div className={styles.title}>Reward</div>
          <div className={styles.desc}>
            <div className={styles.item}>
              <span>Incentive</span>
              <p>
                {!aprInfo[poolKeyString]?.incentives?.length
                  ? '--'
                  : [...new Set(aprInfo[poolKeyString].incentives)].join(', ')}
              </p>
            </div>
            <div className={styles.item}>
              <span>Swap Fee</span>
              <p>
                {aprInfo[poolKeyString]?.swapFee.min === aprInfo[poolKeyString]?.swapFee.max
                  ? `${numberWithCommas(aprInfo[poolKeyString]?.swapFee.min * 100, undefined, {
                      maximumFractionDigits: 1
                    })}`
                  : `${numberWithCommas(aprInfo[poolKeyString]?.swapFee.min * 100, undefined, {
                      maximumFractionDigits: 1
                    })} - ${numberWithCommas(aprInfo[poolKeyString]?.swapFee.max * 100, undefined, {
                      maximumFractionDigits: 1
                    })}`}
                %
              </p>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>
                Incentive Boost&nbsp;
                <IconBoots />
              </span>
              <p>{showTotalIncentive()}%</p>
            </div>
            <div className={styles.item}>
              <span>Total APR</span>
              <p className={styles.total}>
                {aprInfo[poolKeyString]?.apr.min === aprInfo[poolKeyString]?.apr.max
                  ? `${numberWithCommas(aprInfo[poolKeyString]?.apr.min * 100, undefined, {
                      maximumFractionDigits: 1
                    })}`
                  : `${numberWithCommas(aprInfo[poolKeyString]?.apr.min * 100, undefined, {
                      maximumFractionDigits: 1
                    })} - ${numberWithCommas(aprInfo[poolKeyString]?.apr.max * 100, undefined, {
                      maximumFractionDigits: 1
                    })}`}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <Tabs
          tabKey="tab"
          listTabs={[
            {
              id: 'LP',
              value: `My Liquidity (${dataPosition?.length ?? 0})`,
              content: (
                <LoadingBox loading={loading} styles={{ height: '30vh' }}>
                  <div className={styles.list}>
                    {dataPosition.length
                      ? dataPosition.map((position, index) => {
                          return (
                            <div className={styles.positionWrapper} key={`pos-${index}`}>
                              <PositionItem position={position} />
                            </div>
                          );
                        })
                      : !loading && (
                          <div className={styles.nodata}>
                            {theme === 'light' ? <NoData /> : <NoDataDark />}
                            <span>No Positions!</span>
                          </div>
                        )}
                  </div>
                </LoadingBox>
              )
            },
            {
              id: 'txs',
              value: 'Transactions',
              content: (
                <TransactionHistory poolKey={poolDetail?.poolKey} baseToken={tokenXinfo} quoteToken={tokenYinfo} />
              )
            }
          ]}
        />
      </div>
    </div>
  );
};

export default PoolV3Detail;
