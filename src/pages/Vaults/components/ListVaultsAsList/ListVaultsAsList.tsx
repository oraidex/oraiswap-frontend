import { FallbackEmptyData } from 'components/FallbackEmptyData';
import { Table, TableHeaderProps } from 'components/Table';
import useConfigReducer from 'hooks/useConfigReducer';
import { formatDisplayUsdt } from 'pages/Pools/helpers';
import { useNavigate } from 'react-router-dom';
import styles from './ListVaultsAsList.module.scss';
import { ReactComponent as OraiIcon } from 'assets/icons/oraichain.svg';
import { ReactComponent as BoostIconDark } from 'assets/icons/ic_apr_boost_dark.svg';
import { ReactComponent as BoostIconLight } from 'assets/icons/ic_apr_boost_light.svg';

type ListPoolProps = {};

export type VaultItemData = {
  symbols: string;
  apr: number;
  tvl: number;
  myShare: number;
};

export const ListVaultsAsList: React.FC<ListPoolProps> = ({}) => {
  const [theme] = useConfigReducer('theme');
  const navigate = useNavigate();

  const listVaults: VaultItemData[] = [
    {
      symbols: 'ORAI',
      apr: 12.23,
      tvl: 123456789,
      myShare: 1000
    },
    {
      symbols: 'ORAI',
      apr: 12.23,
      tvl: 123456789,
      myShare: 1003
    },
    {
      symbols: 'ORAI',
      apr: 12.23,
      tvl: 123456789,
      myShare: 1000
    },
    {
      symbols: 'ORAI',
      apr: 12.23,
      tvl: 123456789,
      myShare: 1000
    },
    {
      symbols: 'ORAI',
      apr: 12.23,
      tvl: 123456789,
      myShare: 1000
    },
    {
      symbols: 'ORAI',
      apr: 12.23,
      tvl: 123456789,
      myShare: 1000
    },
    {
      symbols: 'ORAI',
      apr: 12.23,
      tvl: 123456789,
      myShare: 1000
    }
  ];

  const headers: TableHeaderProps<VaultItemData> = {
    symbols: {
      name: 'Vault',
      accessor: (data) => (
        <div className={styles.strategy}>
          <div className={styles.strategyLogo}>
            <OraiIcon width={24} height={24} />
          </div>
          <div className={styles.strategyName}>
            <div className={styles.strategyNameTitle}>Strategy</div>
            <div className={styles.strategyNameValue}>ORAI</div>
          </div>
        </div>
      ),
      sortField: 'symbols',
      width: '25%',
      align: 'left'
    },
    apr: {
      name: 'APR',
      width: '25%',
      accessor: (data) => (
        <div className={styles.infoApr}>
          {theme === 'dark' ? <BoostIconDark /> : <BoostIconLight />}
          12.23%
        </div>
      ),
      sortField: 'apr',
      align: 'left'
    },
    tvl: {
      name: 'TVL',
      width: '25%',
      align: 'left',
      sortField: 'tvl',
      accessor: (data) => <span className={!data.tvl && styles.my_stake_lp}>{formatDisplayUsdt(data.tvl)}</span>
    },
    claimable: {
      name: 'My Share',
      width: '25%',
      align: 'left',
      sortField: 'myShare',
      accessor: (data) => {
        return <span className={styles.text_number}>{data.myShare} USDT</span>;
      }
    }
  };

  const handleClickRow = (event: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
    event.stopPropagation();
    navigate(`/vaults/123`);
  };

  return (
    <div className={styles.listVault}>
      <div className={styles.listVaultView}>
        {listVaults.length > 0 ? (
          <Table headers={headers} data={listVaults} handleClickRow={handleClickRow} defaultSorted="tvl" />
        ) : (
          <FallbackEmptyData />
        )}
      </div>
    </div>
  );
};
