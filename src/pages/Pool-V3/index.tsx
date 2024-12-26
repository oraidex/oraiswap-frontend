import ArrowIcon from 'assets/icons/down-arrow.svg?react';
import IconCreatePoolV2 from 'assets/icons/ic_create_pool_v2.svg?react';
import IconCreatePoolV3 from 'assets/icons/ic_create_pool_v3.svg?react';
import SearchLightSvg from 'assets/icons/search-svg-light.svg?react';
import SearchSvg from 'assets/icons/search-svg.svg?react';
import classNames from 'classnames';
import { Button } from 'components/Button';
import useConfigReducer from 'hooks/useConfigReducer';
import useOnClickOutside from 'hooks/useOnClickOutside';
import useTheme from 'hooks/useTheme';
import Pools from 'pages/Pools';
import NewPoolModal from 'pages/Pools/NewPoolModal/NewPoolModal';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CreateNewPool } from './components/CreateNewPool';
import PoolList from './components/PoolList';
import PositionList from './components/PositionList';
import { useGetPoolList } from './hooks/useGetPoolList';
import styles from './index.module.scss';

const cx = classNames.bind(styles);
// import BannerNoticePool from './components/BannerNoticePool';

enum PoolV3PageType {
  POOL = 'pools',
  POSITION = 'positions',
  LP_V2 = 'mypools'
}

export enum POOL_TYPE {
  ALL = 'All pools',
  V3 = 'Pool V3',
  V2 = 'Pool V2'
}

type TabRender = {
  id: PoolV3PageType;
  value: string;
  content: React.FC;
};

const listTab = Object.values(PoolV3PageType);
const listTabRender: TabRender[] = [
  { id: PoolV3PageType.POOL, value: 'Pools', content: PoolList },
  { id: PoolV3PageType.POSITION, value: 'My LPs V3', content: PositionList },
  { id: PoolV3PageType.LP_V2, value: 'My LPs V2', content: Pools }
];

const PoolV3 = () => {
  const theme = useTheme();
  const refFilter = useRef();
  const [prices] = useConfigReducer('coingecko');
  const navigate = useNavigate();
  let [searchParams] = useSearchParams();
  const type = searchParams.get('type') as PoolV3PageType;
  const [search, setSearch] = useState<string>();
  const [openFilter, setOpenFilter] = useState<boolean>(false);
  const [openOptionCreatePool, setOpenOptionCreatePool] = useState<boolean>(false);
  const [poolType, setPoolType] = useState<POOL_TYPE>(POOL_TYPE.ALL);
  const SearchIcon = theme === 'light' ? SearchLightSvg : SearchSvg;
  const { poolList } = useGetPoolList(prices);

  const [isOpenNewPoolModalV2, setIsOpenNewPoolModalV2] = useState(false);
  const [isOpenNewPoolModalV3, setIsOpenNewPoolModalV3] = useState(false);

  useEffect(() => {
    if (!listTab.includes(type)) {
      navigate(`/pools?type=${PoolV3PageType.POOL}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const Content = listTabRender.find((tab) => tab.id === type)?.content ?? PoolList;

  useOnClickOutside(refFilter, () => {
    setOpenFilter(false);
  });

  const handleOutsideClick = () => {
    setOpenOptionCreatePool(false);
  };

  const refOpenOptionCreatePool = useRef(null);
  useOnClickOutside(refOpenOptionCreatePool, () => handleOutsideClick());

  return (
    <>
      {/* <BannerNoticePool /> */}
      <div className={classNames(styles.poolV3, 'small_container')}>
        <div className={styles.header}>
          <div className={styles.headerTab}>
            {listTabRender.map((e) => {
              return (
                <Link
                  to={`/pools?type=${e.id}`}
                  key={e.id}
                  className={classNames(styles.item, { [styles.active]: type === e.id })}
                >
                  {e.value}
                </Link>
              );
            })}
          </div>

          {type === PoolV3PageType.POOL && (
            <div className={styles.right}>
              <div className={styles.dropDown} ref={refFilter}>
                <div className={styles.btn} onClick={() => setOpenFilter(true)}>
                  <span>{poolType}</span>
                  <div>
                    <ArrowIcon />
                  </div>
                </div>
                {openFilter && (
                  <div className={styles.dropdownContent}>
                    {Object.entries(POOL_TYPE).map(([key, value], idx) => {
                      return (
                        <div
                          className={styles.filterItem}
                          key={`filterItem-${idx}-${key}`}
                          onClick={() => {
                            setPoolType(value);
                            setOpenFilter(false);
                          }}
                        >
                          {value}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className={styles.search}>
                <span>
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  placeholder="Search pool"
                  value={search}
                  onChange={(e) => {
                    e.preventDefault();
                    setSearch(e.target.value);
                  }}
                  style={
                    {
                      // paddingLeft: 40,
                      // backgroundImage: `url(${bgUrl})`,
                      // backgroundRepeat: 'no-repeat',
                      // backgroundPosition: '16px center'
                    }
                  }
                />
              </div>
              {isOpenNewPoolModalV3 && (
                <CreateNewPool
                  pools={poolList}
                  setShowModal={setIsOpenNewPoolModalV3}
                  showModal={isOpenNewPoolModalV3}
                />
              )}
              <div className={styles.dropDown}>
                <div className={styles.btnAdd}>
                  <Button
                    type="primary-sm"
                    onClick={() => {
                      setOpenOptionCreatePool(!openOptionCreatePool);
                    }}
                  >
                    Create New Pool
                  </Button>
                </div>
                {openOptionCreatePool && (
                  <div ref={refOpenOptionCreatePool} className={`${styles.dropdownContent} ${styles.dropdownCreate}`}>
                    <div
                      className={styles.filterItem}
                      onClick={() => {
                        setIsOpenNewPoolModalV3(true);
                        setOpenOptionCreatePool(false);
                      }}
                    >
                      <div className={`${styles.icon} ${styles[theme]}`}>
                        <IconCreatePoolV3 />
                      </div>
                      <div>
                        <div className={styles.typePool}>Pool V3</div>
                        <div className={styles.desPool}>Concentrated Liquidity</div>
                      </div>
                    </div>
                    <div
                      className={styles.filterItem}
                      onClick={() => {
                        setIsOpenNewPoolModalV2(true);
                        setOpenOptionCreatePool(false);
                      }}
                    >
                      <div className={`${styles.icon} ${styles[theme]}`}>
                        <IconCreatePoolV2 />
                      </div>
                      <div>
                        <div className={styles.typePool}>Pool V2</div>
                        <div className={styles.desPool}>Full range liquidity</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {isOpenNewPoolModalV2 && (
                <NewPoolModal
                  open={() => setIsOpenNewPoolModalV2(true)}
                  close={() => setIsOpenNewPoolModalV2(false)}
                  isOpen={isOpenNewPoolModalV2}
                />
              )}
            </div>
          )}
        </div>
        <div className={classNames(styles.content, styles[theme], styles[type])}>
          {Content && <Content search={search} filterType={poolType} />}
        </div>
      </div>
    </>
  );
};

export default PoolV3;
