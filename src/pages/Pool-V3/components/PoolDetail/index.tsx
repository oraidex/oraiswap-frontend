import { toDisplay } from '@oraichain/oraidex-common';
import AddIcon from 'assets/icons/Add.svg?react';
import BackIcon from 'assets/icons/back.svg?react';
import NoDataDark from 'assets/images/NoDataPool.svg?react';
import NoData from 'assets/images/NoDataPoolLight.svg?react';
import classNames from 'classnames';
import { Button } from 'components/Button';
import LoadingBox from 'components/LoadingBox';
import Tabs from 'components/TabCustom';
import { formatNumberKMB, numberWithCommas } from 'helper/format';
import useConfigReducer from 'hooks/useConfigReducer';
import useTheme from 'hooks/useTheme';
import { formatDisplayUsdt } from 'pages/Pools/helpers';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CreateNewPosition from '../CreateNewPosition';
import PositionItem from '../PositionItem';
import TransactionHistory from '../TransactionHistory';
import styles from './index.module.scss';
import useOsmosisV3Pool from './hooks/useOsmosisV3Pool';
import useOraichainV3Pool from './hooks/useOraichainV3Pool';

const PoolV3Detail = () => {
  const { poolId, network } = useParams<{ poolId: string, network: string }>();
  const [address] = useConfigReducer('address');
  const [isOpenCreatePosition, setIsOpenCreatePosition] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const {
    poolDetail,
    IconBoots,
    isInactive,
    totalLiquidity,
    volume24h,
    aprInfo,
    balanceX,
    balanceY,
    dataPosition,
    loading,
    poolKeyString,
    FromTokenIcon,
    ToTokenIcon,
    tokenXInfo,
    tokenYInfo,
    fee,
  } = (network === 'oraichain' ? useOraichainV3Pool : useOsmosisV3Pool)(poolId, theme);

  console.log({dataPosition})

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
              {FromTokenIcon && <FromTokenIcon />}
              {ToTokenIcon && <ToTokenIcon />}
            </div>
            <span>
              {tokenXInfo?.name?.toUpperCase()} / {tokenYInfo?.name?.toUpperCase()}
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
              <h1>{Number.isNaN(volume24h) ? 0 : formatDisplayUsdt(volume24h)}</h1>
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
                {FromTokenIcon && <FromTokenIcon />}
                {/* <span>{tokenXInfo?.name?.toUpperCase()}</span> */}
                <span className={styles.value}>{formatNumberKMB(balanceX, false)}</span>
              </div>
              <div className={classNames(styles.tokenItem, styles[theme])}>
                {ToTokenIcon && <ToTokenIcon />}
                {/* <span>{tokenYInfo?.name?.toUpperCase()}</span> */}
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
                <TransactionHistory poolKey={poolDetail?.poolKey} baseToken={tokenXInfo} quoteToken={tokenYInfo} />
              )
            }
          ]}
        />
      </div>
    </div>
  );
};

export default PoolV3Detail;
