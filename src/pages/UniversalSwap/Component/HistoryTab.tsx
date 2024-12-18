import ArrowImg from 'assets/icons/arrow_right.svg';
import OpenNewWindowImg from 'assets/icons/open_new_window.svg';
import cn from 'classnames/bind';
import { FallbackEmptyData } from 'components/FallbackEmptyData';
import { Table, TableHeaderProps } from 'components/Table';
import useTheme from 'hooks/useTheme';
import { TransactionHistory } from 'libs/duckdb';
import { reduceString, timeSince } from 'libs/utils';
import { formatDisplayUsdt } from 'pages/Pools/helpers';
import { useState } from 'react';
import { getExplorerScan } from '../helpers';
import { useGetTransHistory } from '../Swap/hooks';
import styles from './HistoryTab.module.scss';
import { chainInfosWithIcon, flattenTokensWithIcon } from 'initCommon';

const cx = cn.bind(styles);
const RowsComponent: React.FC<{
  rows: TransactionHistory;
}> = ({ rows }) => {
  const theme = useTheme();
  const [fromToken, toToken] = [
    flattenTokensWithIcon.find((token) => token.coinGeckoId === rows.fromCoingeckoId),
    flattenTokensWithIcon.find((token) => token.coinGeckoId === rows.toCoingeckoId)
  ];
  if (!fromToken || !toToken) return <></>;

  const [fromChain, toChain] = [
    chainInfosWithIcon.find((chainInfo) => chainInfo.chainId === rows.fromChainId),
    chainInfosWithIcon.find((chainInfo) => chainInfo.chainId === rows.toChainId)
  ];
  if (!fromChain || !toChain) return <></>;

  return (
    <div>
      <div className={styles.history}>
        {/* TODO: show later */}
        <div className={styles.time}>
          <div className={styles.type}>{rows.type}</div>
          <div className={styles.timestamp}>{timeSince(Number(rows.timestamp))}</div>
        </div>
        <div className={styles.from}>
          <div className={styles.list}>
            <div className={styles.img}>
              {theme === 'light' ? (
                <img src={fromToken.iconLight} alt="" width={26} height={26} />
              ) : (
                <img src={fromToken.icon} alt="" width={26} height={26} />
              )}
              <div className={styles.imgChain}>
                {theme === 'light' ? (
                  <img src={fromChain.chainSymbolImageUrl} alt="" width={14} height={14} />
                ) : (
                  <img src={fromChain.chainSymbolImageUrl} alt="" width={14} height={14} />
                )}
              </div>
            </div>
            <div className={styles.value}>
              <div className={styles.subBalance}>
                {'-'}
                {rows.fromAmount}
                <span className={styles.denom}>{fromToken.name}</span>
              </div>
              <div className={styles.timestamp}>{formatDisplayUsdt(rows.fromAmountInUsdt)}</div>
            </div>
          </div>
        </div>
        <div className={styles.icon}>
          <img src={ArrowImg} width={26} height={26} alt="filter" />
        </div>
        <div className={styles.to}>
          <div className={styles.list}>
            <div className={styles.img}>
              {theme === 'light' ? (
                <img src={toToken.iconLight} alt="" width={26} height={26} />
              ) : (
                <img src={toToken.icon} alt="" width={26} height={26} />
              )}
              <div className={styles.imgChain}>
                {theme === 'light' ? (
                  <img src={toChain.chainSymbolImageUrl} alt="" width={14} height={14} />
                ) : (
                  <img src={toChain.chainSymbolImageUrl} alt="" width={14} height={14} />
                )}
              </div>
            </div>
            <div className={styles.value}>
              <div className={styles.addBalance}>
                {'+'}
                {rows.toAmount}
                <span className={styles.denom}>{toToken.name}</span>
              </div>
              <div className={styles.timestamp}>{formatDisplayUsdt(rows.toAmountInUsdt)}</div>
            </div>
          </div>
        </div>
        <div className={styles.txhash}>
          <div className={styles.type}>TxHash</div>
          <div
            className={styles.link}
            onClick={() => window.open(`${getExplorerScan(rows.fromChainId)}/${rows.initialTxHash}`)}
          >
            <span>{reduceString(rows.initialTxHash, 6, 4)}</span>
            <div className={styles.open_link}>
              <img src={OpenNewWindowImg} width={11} height={11} alt="filter" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HistoryTab: React.FC<{
  networkFilter: string;
}> = ({ networkFilter }) => {
  const { transHistory } = useGetTransHistory();
  const [selectedData, setSelectedData] = useState(null);
  const headers: TableHeaderProps<TransactionHistory> = {
    assets: {
      name: '',
      accessor: (data) => <RowsComponent rows={data} />,
      width: '100%',
      align: 'left'
    }
  };

  return (
    <div className={cx('historyTab')}>
      <div className={styles.historyData}>
        <h2>Latest 20 transactions</h2>
        {transHistory && transHistory.length > 0 ? (
          <Table
            headers={headers}
            data={transHistory}
            stylesColumn={{
              padding: '16px 0'
            }}
            handleClickRow={(e, data) => {
              setSelectedData(data);
            }}
          />
        ) : (
          <FallbackEmptyData />
        )}
      </div>
    </div>
  );
};
