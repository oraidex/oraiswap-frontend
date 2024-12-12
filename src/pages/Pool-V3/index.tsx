import SearchLightSvg from 'assets/images/search-light-svg.svg?react';
import SearchSvg from 'assets/images/search-svg.svg?react';
import ArrowIcon from 'assets/icons/down-arrow.svg?react';
import classNames from 'classnames';
import useTheme from 'hooks/useTheme';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import CreateNewPool from './components/CreateNewPool';
import Pools from 'pages/Pools';
import PoolList from './components/PoolList';
import PositionList from './components/PositionList';
import { useGetPoolList } from './hooks/useGetPoolList';
import styles from './index.module.scss';
import useConfigReducer from 'hooks/useConfigReducer';
import BannerNoticePool from './components/BannerNoticePool';
import useOnClickOutside from 'hooks/useOnClickOutside';
import NewPoolModal from 'pages/Pools/NewPoolModal/NewPoolModal';
import { Button } from 'components/Button';
import NewTokenModal from 'pages/Pools/NewTokenModal/NewTokenModal';

export enum PoolV3PageType {
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
  const [poolType, setPoolType] = useState<POOL_TYPE>(POOL_TYPE.ALL);
  const bgUrl = theme === 'light' ? SearchLightSvg : SearchSvg;
  const { poolList } = useGetPoolList(prices);
  const [isOpenNewPoolModal, setIsOpenNewPoolModal] = useState(false);
  const [isOpenNewTokenModal, setIsOpenNewTokenModal] = useState(false);

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
              <CreateNewPool pools={poolList} />
              <div className={styles.btnAdd}>
                <Button type="primary-sm" onClick={() => setIsOpenNewPoolModal(true)}>
                  New Pool V2
                </Button>
              </div>
              <div className={styles.btnAdd}>
                <Button type="primary-sm" onClick={() => setIsOpenNewTokenModal(true)}>
                  New Token
                </Button>
              </div>
              <NewPoolModal open={() => setIsOpenNewPoolModal(true)} close={() => setIsOpenNewPoolModal(false)} isOpen={isOpenNewPoolModal} />
                <NewTokenModal open={() => setIsOpenNewTokenModal(true)} close={() => setIsOpenNewTokenModal(false)} isOpen={isOpenNewTokenModal}/>
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
