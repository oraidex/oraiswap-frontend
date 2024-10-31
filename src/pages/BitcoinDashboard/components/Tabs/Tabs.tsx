import classNames from 'classnames';
import { FC, useEffect } from 'react';
import styles from './style.module.scss';
import { useSearchParams } from 'react-router-dom';

export enum KeysFilter {
  pending_deposits = 'pending_deposits',
  pending_withdraws = 'pending_withdraws',
  checkpoint = 'checkpoint',
  escrow = 'escrow'
}

const LIST_FILTERS = [
  {
    key: KeysFilter.pending_deposits,
    text: 'Pending Deposits'
  },
  {
    key: KeysFilter.pending_withdraws,
    text: 'Pending Withdraws'
  },
  {
    key: KeysFilter.checkpoint,
    text: 'Checkpoint'
  },
  {
    key: KeysFilter.escrow,
    text: 'Your Stucked oBTC'
  }
];

export const Tabs: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab');

  useEffect(() => {
    if (!tab) {
      setSearchParams({
        tab: KeysFilter.pending_deposits
      });
    }
  }, []);

  return (
    <div className={styles.pool_filter}>
      <div className={styles.pool_filter_list}>
        {LIST_FILTERS.map((item) => (
          <div
            key={item.key}
            className={classNames(item.key === tab ? styles.filter_active : null, styles.filter_item)}
            onClick={() => {
              setSearchParams({
                tab: item.key
              });
            }}
          >
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
};
