import SearchInput from 'components/SearchInput';
import useConfigReducer from 'hooks/useConfigReducer';
import useTheme from 'hooks/useTheme';
import { isEqual } from 'lodash';
import { useGetRewardInfo } from 'pages/Pools/hooks';
import { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configure';
import { PoolInfoResponse } from 'types/pool';
import styles from './style.module.scss';

export enum KeyFilterPool {
  my_pool = 'my_pool',
  all_pool = 'all_pool'
}

const LIST_FILTER_POOL = [
  {
    key: KeyFilterPool.all_pool,
    text: 'All Pools'
  },
  {
    key: KeyFilterPool.my_pool,
    text: 'My Pools'
  }
];

type FilterProps = {
  setFilteredPools: React.Dispatch<React.SetStateAction<PoolInfoResponse[]>>;
  setIsOpenNewTokenModal: (status: boolean) => void;
  pools: PoolInfoResponse[];
};
export const Filter: FC<FilterProps> = ({ setFilteredPools, setIsOpenNewTokenModal, pools }) => {
  const [typeFilter, setTypeFilter] = useConfigReducer('filterDefaultPool');
  const [searchValue, setSearchValue] = useState('');
  const lpPools = useSelector((state: RootState) => state.token.lpPools);
  const theme = useTheme();
  const [address] = useConfigReducer('address');

  const { totalRewardInfoData } = useGetRewardInfo({
    stakerAddr: address
  });

  // TODO: need to seprate to helper file, write test case.
  const isPoolWithLiquidity = (pool: PoolInfoResponse) => {
    const liquidityAddress = pool?.liquidityAddr;
    return parseInt(lpPools[liquidityAddress]?.balance) > 0;
  };

  const findBondAmount = (pool: PoolInfoResponse) => {
    if (!totalRewardInfoData) return 0;
    const rewardInfo = totalRewardInfoData.reward_infos.find(({ staking_token }) =>
      isEqual(staking_token, pool.liquidityAddr)
    );
    return rewardInfo ? parseInt(rewardInfo.bond_amount) : 0;
  };

  useEffect(() => {
    if (!pools.length) return;

    let filteredPools: PoolInfoResponse[];
    // filter by type filter: my pool || all pool
    // if (typeFilter === KeyFilterPool.my_pool) {
    //   filteredPools = pools.filter((pool) => isPoolWithLiquidity(pool) || findBondAmount(pool) > 0);
    // } else filteredPools = [...pools];

    // filter by search value
    // FIXME: change to only my pools // quangdz1704
    filteredPools = pools.filter(
      (pool) =>
        (isPoolWithLiquidity(pool) || findBondAmount(pool) > 0) &&
        pool.symbols.toLowerCase().includes(searchValue.toLowerCase())
    );
    setFilteredPools(filteredPools);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, searchValue, pools.length, totalRewardInfoData]);

  return (
    <div className={styles.pool_filter}>
      <div className={styles.pool_filter_right}>
        <div className={styles.pool_search}>
          <SearchInput
            theme={theme}
            placeholder="Search by address, asset, type"
            onSearch={(value) => setSearchValue(value)}
          />
        </div>
        {/* <Button type="secondary-sm" onClick={() => setIsOpenNewTokenModal(true)}>
          {theme === 'light' ? <IconAddLight /> : <IconAdd />}
          &nbsp; New Pool
        </Button> */}
      </div>
    </div>
  );
};
