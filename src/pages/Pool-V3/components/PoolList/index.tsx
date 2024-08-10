import { toDisplay } from '@oraichain/oraidex-common';
import Loading from 'assets/gif/loading.gif';
import { ReactComponent as BootsIconDark } from 'assets/icons/boost-icon-dark.svg';
import { ReactComponent as BootsIcon } from 'assets/icons/boost-icon.svg';
import { ReactComponent as IconInfo } from 'assets/icons/infomationIcon.svg';
import { ReactComponent as NoDataDark } from 'assets/images/NoDataPool.svg';
import { ReactComponent as NoData } from 'assets/images/NoDataPoolLight.svg';
import SearchLightSvg from 'assets/images/search-light-svg.svg';
import SearchSvg from 'assets/images/search-svg.svg';
import classNames from 'classnames';
import { TooltipIcon } from 'components/Tooltip';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useTheme from 'hooks/useTheme';
import SingletonOraiswapV3, { fetchPoolAprInfo, poolKeyToString } from 'libs/contractSingleton';
import { formatPoolData, parsePoolKeyString } from 'pages/Pool-V3/helpers/format';
import { formatDisplayUsdt, numberWithCommas } from 'pages/Pools/helpers';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.scss';
import useConfigReducer from 'hooks/useConfigReducer';
import LoadingBox from 'components/LoadingBox';
import { useGetFeeDailyData } from 'pages/Pool-V3/hooks/useGetFeeDailyData';
import { useGetPoolLiqAndVol } from 'pages/Pool-V3/hooks/useGetPoolLiqAndVol';
import { useGetPoolPositionInfo } from 'pages/Pool-V3/hooks/useGetPoolPositionInfo';

const PoolList = () => {
  const { data: prices } = useCoinGeckoPrices();
  const [liquidityPools, setLiquidityPools] = useConfigReducer('liquidityPools');
  const [volumnePools, setVolumnePools] = useConfigReducer('volumnePools');
  const [aprInfo, setAprInfo] = useConfigReducer('aprPools');
  const [openTooltip, setOpenTooltip] = useState(false);

  const theme = useTheme();

  const bgUrl = theme === 'light' ? SearchLightSvg : SearchSvg;

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState<string>();
  const [dataPool, setDataPool] = useState([...Array(0)]);
  const yesterdayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) - 1;

  const { feeDailyData } = useGetFeeDailyData(yesterdayIndex);
  const { poolLiquidities, poolVolume } = useGetPoolLiqAndVol(yesterdayIndex);
  const { poolPositionInfo } = useGetPoolPositionInfo(prices);
  // console.log({ poolPositionInfo });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const pools = await SingletonOraiswapV3.getPools();
        const fmtPools = (pools || [])
          .map((p) => {
            const isLight = theme === 'light';
            return formatPoolData(p, isLight);
          })
          .filter((e) => e.isValid);
        // .sort((a, b) => Number(b.pool.liquidity) - Number(a.pool.liquidity));
        setDataPool(fmtPools);
      } catch (error) {
        console.log('error: get pools', error);
      } finally {
        setLoading(false);
      }
    })();

    return () => {};
  }, [theme]);

  const totalLiquidity = useMemo(() => {
    if (liquidityPools && Object.values(liquidityPools).length) {
      return Object.values(liquidityPools).reduce((acc, cur) => Number(acc) + Number(cur), 0);
    }
    return 0;
  }, [liquidityPools]);

  useEffect(() => {
    if (dataPool.length && poolLiquidities) {
      setLiquidityPools(poolLiquidities);
      setVolumnePools(
        Object.keys(poolVolume).map((poolAddress) => {
          return {
            apy: 0,
            poolAddress,
            fee: 0,
            volume24: poolVolume[poolAddress],
            tokenX: null,
            tokenY: null,
            tvl: null
          };
        })
      );
    }
  }, [dataPool?.length, Object.values(poolLiquidities).length]);

  useEffect(() => {
    const getAPRInfo = async () => {
      const poolKeys = dataPool.map((pool) => parsePoolKeyString(pool.poolKey));

      const res = await fetchPoolAprInfo(poolKeys, prices, poolPositionInfo, feeDailyData);
      setAprInfo(res);
    };
    if (dataPool.length && prices && Object.keys(poolPositionInfo).length) {
      getAPRInfo();
    }
  }, [dataPool, prices, Object.keys(poolPositionInfo).length]);

  return (
    <div className={styles.poolList}>
      <div className={styles.headerTable}>
        <div className={styles.total}>
          <p>Total liquidity</p>
          {totalLiquidity === 0 || totalLiquidity ? (
            <h1>{formatDisplayUsdt(Number(totalLiquidity) || 0)}</h1>
          ) : (
            <img src={Loading} alt="loading" width={32} height={32} />
          )}
        </div>
        <div className={styles.search}>
          <input
            type="text"
            placeholder="Search pool"
            value={search}
            onChange={(e) => {
              e.preventDefault();
              setSearch(e.target.value);
            }}
            style={{
              paddingLeft: 40,
              backgroundImage: `url(${bgUrl})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: '16px center'
            }}
          />
        </div>
      </div>
      <LoadingBox loading={loading} styles={{ minHeight: '60vh', height: 'fit-content' }}>
        <div className={styles.list}>
          {dataPool?.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Pool name</th>
                    <th style={{ width: '15%' }} className={styles.textRight}>
                      Liquidity
                    </th>
                    <th style={{ width: '15%' }} className={styles.textRight}>
                      Volume (24H)
                    </th>
                    <th style={{ width: '15%' }} className={classNames(styles.textRight, styles.aprHeader)}>
                      APR
                      <TooltipIcon
                        className={styles.tooltipWrapper}
                        placement="top"
                        visible={openTooltip}
                        icon={<IconInfo />}
                        setVisible={setOpenTooltip}
                        content={
                          <div className={classNames(styles.tooltipApr, styles[theme])}>
                            <h3 className={styles.titleApr}>How are APRs calculated?</h3>
                            <p className={styles.desc}>
                              All APRs are estimated. They are calculated by taking the average APR for liquidity in the
                              pool.
                            </p>
                            <br />
                            <p className={styles.desc}>
                              In concentrated pools, most users will receive lower rewards. This is due to positions
                              that are more concentrated, which capture more of the incentives.
                            </p>
                          </div>
                        }
                      />
                    </th>
                    <th style={{ width: '15%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {dataPool
                    .filter((p) => {
                      if (!search) return true;

                      const { tokenXinfo, tokenYinfo } = p;

                      return (
                        (tokenXinfo && tokenXinfo.name.toLowerCase().includes(search.toLowerCase())) ||
                        (tokenYinfo && tokenYinfo.name.toLowerCase().includes(search.toLowerCase()))
                      );
                    })
                    .sort((a, b) => (liquidityPools?.[b?.poolKey] || 0) - (liquidityPools?.[a?.poolKey] || 0))
                    .map((item, index) => {
                      let volumn = 0;
                      if (item?.poolKey) {
                        const findPool = volumnePools && volumnePools.find((vo) => vo.poolAddress === item?.poolKey);
                        if (findPool) volumn = findPool.volume24;
                      }

                      return (
                        <tr className={styles.item} key={`${index}-pool-${item?.id}`}>
                          <PoolItemTData
                            item={item}
                            theme={theme}
                            volumn={volumn}
                            liquidity={liquidityPools?.[item?.poolKey]}
                            aprInfo={{
                              apr: 0,
                              incentives: [],
                              swapFee: 0,
                              incentivesApr: 0,
                              ...aprInfo?.[item?.poolKey]
                            }}
                          />
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            !loading && (
              <div className={styles.nodata}>
                {theme === 'light' ? <NoData /> : <NoDataDark />}
                <span>No Pools!</span>
              </div>
            )
          )}
        </div>
      </LoadingBox>
    </div>
  );
};

const PoolItemTData = ({ item, theme, liquidity, volumn, aprInfo }) => {
  const navigate = useNavigate();
  const [openTooltip, setOpenTooltip] = useState(false);

  const isLight = theme === 'light';
  const IconBoots = isLight ? BootsIcon : BootsIconDark;
  const { FromTokenIcon, ToTokenIcon, feeTier, tokenXinfo, tokenYinfo, poolKey } = item;

  return (
    <>
      <td>
        <div className={styles.name} onClick={() => navigate(`/pools-v3/${encodeURIComponent(poolKey)}`)}>
          <div className={classNames(styles.icons, styles[theme])}>
            <FromTokenIcon />
            <ToTokenIcon />
          </div>
          <span>
            {tokenXinfo?.name} / {tokenYinfo?.name}
          </span>

          <div>
            <span className={styles.fee}>Fee: {toDisplay(BigInt(feeTier), 10)}%</span>
          </div>
        </div>
      </td>
      <td className={styles.textRight}>
        <span className={classNames(styles.amount, { [styles.loading]: !liquidity })}>
          {liquidity ? formatDisplayUsdt(liquidity) : (liquidity === 0 ? formatDisplayUsdt(0) : <img src={Loading} alt="loading" width={30} height={30} />)}
        </span>
      </td>
      <td className={styles.textRight}>
        <span className={styles.amount}>{formatDisplayUsdt(volumn)}</span>
      </td>
      <td>
        <div className={styles.apr}>
          <span className={styles.amount}>
            {numberWithCommas(aprInfo.apr * 100, undefined, { maximumFractionDigits: 2 })}%
          </span>
          <TooltipIcon
            className={styles.tooltipWrapper}
            placement="top"
            visible={openTooltip}
            icon={<IconInfo />}
            setVisible={setOpenTooltip}
            content={
              <div className={classNames(styles.tooltip, styles[theme])}>
                <div className={styles.itemInfo}>
                  <span>Swap fee</span>
                  <span className={styles.value}>
                    {numberWithCommas(aprInfo.swapFee * 100, undefined, { maximumFractionDigits: 2 })}%
                  </span>
                </div>
                <div className={styles.itemInfo}>
                  <span>
                    Incentives Boost&nbsp;
                    <IconBoots />
                  </span>
                  <span className={styles.value}>
                    {numberWithCommas(aprInfo.incentivesApr * 100, undefined, { maximumFractionDigits: 2 })}%
                  </span>
                </div>
                <div className={styles.itemInfo}>
                  <span>Total APR</span>
                  <span className={styles.totalApr}>
                    {numberWithCommas(aprInfo.apr * 100, undefined, { maximumFractionDigits: 2 })}%
                  </span>
                </div>
              </div>
            }
          />
        </div>
      </td>
      <td className={styles.actions}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/new-position/${encodeURIComponent(poolKeyToString(item.pool_key))}`);
          }}
          className={styles.add}
        >
          Add Position
        </button>
      </td>
    </>
  );
};

export default PoolList;
