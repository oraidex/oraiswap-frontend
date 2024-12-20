import { TokenItemType, toDisplay } from '@oraichain/oraidex-common';
import BoostIconDark from 'assets/icons/boost-icon-dark.svg?react';
import BoostIconLight from 'assets/icons/boost-icon.svg?react';
import { Button } from 'components/Button';
import { FallbackEmptyData } from 'components/FallbackEmptyData';
import { Table, TableHeaderProps } from 'components/Table';
import useConfigReducer from 'hooks/useConfigReducer';
import { PoolTableData } from 'pages/Pools';
import { formatDisplayClaimable, formatDisplayUsdt, parseAssetOnlyDenom } from 'pages/Pools/helpers';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PoolInfoResponse } from 'types/pool';
import { AddLiquidityModal } from '../AddLiquidityModal';
import styles from './ListPool.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configure';

type ListPoolProps = {
  poolTableData: PoolTableData[];
  generateIcon: (baseToken: TokenItemType, quoteToken: TokenItemType) => JSX.Element;
};

export const ListPools: React.FC<ListPoolProps> = ({ poolTableData, generateIcon }) => {
  const [pairDenomsDeposit, setPairDenomsDeposit] = useState('');
  const [theme] = useConfigReducer('theme');
  const navigate = useNavigate();
  const allOraichainTokens = useSelector((state: RootState) => state.token.allOraichainTokens);

  const headers: TableHeaderProps<PoolTableData> = {
    symbols: {
      name: 'Pool Name',
      accessor: (data) => {
        const firstTokenDenom = parseAssetOnlyDenom(JSON.parse(data.firstAssetInfo));
        const secondTokenDenom = parseAssetOnlyDenom(JSON.parse(data.secondAssetInfo));

        const tokens = [firstTokenDenom, secondTokenDenom].map(
          (symbol) =>
            allOraichainTokens.find((token) => token.denom === symbol || token.contractAddress === symbol)?.name
        );
        return (
          <div className={styles.symbols}>
            <div className={styles.symbols_logo}>{generateIcon(data.baseToken, data.quoteToken)}</div>
            <span className={styles.symbols_name}>{tokens?.join('/')}</span>
          </div>
        );
      },
      sortField: 'symbols',
      width: '22%',
      align: 'left'
    },
    apr: {
      name: 'APR',
      width: '12%',
      accessor: (data) => (
        <div className={styles.apr}>
          <div className={styles.aprValue}>
            <span>{`${(data.apr || 0).toFixed(2)}%`}</span>&nbsp;
            <div>{theme === 'light' ? <BoostIconLight /> : <BoostIconDark />}</div>
          </div>
          <div className={styles.apr_reward}>
            {data.reward.map((asset) => (
              <span key={asset}>+{asset}</span>
            ))}
          </div>
        </div>
      ),
      sortField: 'apr',
      align: 'left'
    },
    my_stake: {
      name: 'My Staked LP',
      width: '12%',
      align: 'left',
      sortField: 'myStakedLP',
      accessor: (data) => (
        <span className={!data.myStakedLP && styles.my_stake_lp}>{formatDisplayUsdt(data.myStakedLP)}</span>
      )
    },
    claimable: {
      name: 'Claimable',
      width: '10%',
      align: 'left',
      sortField: 'claimable',
      accessor: (data) => {
        const displayValue = formatDisplayClaimable(data.claimable);
        return <span className={displayValue === '0' && styles.text_number}>{displayValue}</span>;
      }
    },
    fee7Days: {
      name: 'Fee (7D)',
      width: '10%',
      align: 'right',
      sortField: 'fee7Days',
      accessor: (data) => <span>{formatDisplayUsdt(toDisplay(data.fee7Days))}</span>
    },
    volume24Hour: {
      name: 'Volume (24H)',
      width: '12%',
      align: 'right',
      sortField: 'volume24Hour',
      accessor: (data) => {
        const value = toDisplay(data.volume24Hour);
        return <span className={!value && styles.text_number}>{formatDisplayUsdt(value)}</span>;
      }
    },
    totalLiquidity: {
      name: 'Liquidity',
      width: '22%',
      align: 'right',
      sortField: 'totalLiquidity',
      accessor: (data) => (
        <div className={styles.liquidity}>
          <span style={{ marginRight: 15 }}>
            {formatDisplayUsdt(toDisplay(parseInt(data.totalLiquidity.toString()).toString()))}
          </span>
          <Button
            type="third-sm"
            className={styles.add}
            onClick={(event) => {
              event.stopPropagation();
              setPairDenomsDeposit(
                `${parseAssetOnlyDenom(JSON.parse(data.firstAssetInfo))}_${parseAssetOnlyDenom(
                  JSON.parse(data.secondAssetInfo)
                )}`
              );
            }}
          >
            Add LP
          </Button>
        </div>
      )
    }
  };

  const handleClickRow = (event: React.MouseEvent<HTMLTableRowElement, MouseEvent>, pool: PoolInfoResponse) => {
    event.stopPropagation();
    const [firstAssetInfo, secondAssetInfo] = [JSON.parse(pool.firstAssetInfo), JSON.parse(pool.secondAssetInfo)];

    navigate(
      `/pools/v2/${encodeURIComponent(parseAssetOnlyDenom(firstAssetInfo))}_${encodeURIComponent(
        parseAssetOnlyDenom(secondAssetInfo)
      )}`
    );
  };

  return (
    <div className={styles.listpools}>
      <div className={styles.listpools_list}>
        {poolTableData.length > 0 ? (
          <Table
            headers={headers}
            data={poolTableData}
            handleClickRow={handleClickRow}
            defaultSorted="totalLiquidity"
          />
        ) : (
          <FallbackEmptyData />
        )}
      </div>
      {pairDenomsDeposit && (
        <AddLiquidityModal
          isOpen={!!pairDenomsDeposit}
          close={() => setPairDenomsDeposit('')}
          pairDenoms={pairDenomsDeposit}
        />
      )}
    </div>
  );
};
