import { toDisplay } from '@oraichain/oraidex-common';
import { ReactComponent as TooltipIcon } from 'assets/icons/icon_tooltip.svg';
import Search from 'components/SearchInput';
import TokenBalance from 'components/TokenBalance';
import useConfigReducer from 'hooks/useConfigReducer';
import { useDebounce } from 'hooks/useDebounce';
import useTheme from 'hooks/useTheme';
import {
  useGetCheckpointData,
  useGetCheckpointFee,
  useGetCheckpointQueue,
  useGetDepositFee,
  useGetWithdrawalFee
} from 'pages/BitcoinDashboardV2/hooks';
import React, { useEffect, useState } from 'react';
import styles from './Checkpoint.module.scss';
import { TransactionInput, TransactionOutput } from './Transactions';

const Checkpoint: React.FC<{}> = ({}) => {
  const theme = useTheme();
  const [btcAddress, setBtcAddress] = useConfigReducer('btcAddress');
  const checkpointQueue = useGetCheckpointQueue();
  const [checkpointInputValue, setCheckpointInputValue] = useState<number | null>(checkpointQueue?.index || null);
  const checkpointIndex = useDebounce(checkpointInputValue, 500);
  const depositFee = useGetDepositFee(checkpointIndex);
  const withdrawalFee = useGetWithdrawalFee(btcAddress, checkpointIndex);
  const checkpointFee = useGetCheckpointFee(checkpointIndex);
  const checkpointData = useGetCheckpointData(checkpointIndex);

  useEffect(() => {
    (async () => {
      try {
        const btcAddr = btcAddress ?? (await window.Bitcoin.getAddress());

        setBtcAddress(btcAddr);
      } catch (e) {}
    })();
  }, []);

  const renderNotification = () => {
    if (checkpointIndex == checkpointQueue?.index && checkpointFee?.checkpoint_fees) {
      if (checkpointFee?.checkpoint_fees > checkpointData?.fee_collected) {
        return (
          <span>{`Predict Hash: ${checkpointData?.transaction.hash}, We need at least ${toDisplay(
            BigInt(checkpointFee?.checkpoint_fees - checkpointData?.fee_collected || 0),
            8
          )} BTC fee to make this checkpoint executed. (${toDisplay(
            BigInt(checkpointData?.fee_collected || 0),
            8
          )}/${toDisplay(BigInt(checkpointFee?.checkpoint_fees || 0), 8)} BTC)`}</span>
        );
      }

      return (
        <span>{`Predict Hash: ${
          checkpointData?.transaction.hash
        }, Enough fee waiting for previous checkpoint to be completed (${toDisplay(
          BigInt(checkpointData?.fee_collected || 0),
          8
        )}/${toDisplay(BigInt(checkpointFee?.checkpoint_fees || 0), 8)} BTC)`}</span>
      );
    } else {
      return <span>{`Hash: ${checkpointData?.transaction.hash}`}</span>;
    }
  };

  return (
    <div className={styles.checkpoint}>
      <div className={styles.checkpoint_detail_checkpoint}>
        <div className={styles.checkpoint_data}>
          <div className={styles.checkpoint_data_item}>
            <span className={styles.checkpoint_data_name}>Current Checkpoint</span>
            <br />
            <TokenBalance
              balance={checkpointIndex || checkpointQueue?.index || 0}
              prefix=""
              suffix=""
              className={styles.checkpoint_data_value}
              decimalScale={6}
            />
          </div>
          <div className={styles.checkpoint_data_item}>
            <span className={styles.checkpoint_data_name}>Status</span>
            <br />
            <span className={styles.checkpoint_data_value}>{checkpointData?.status}</span>
          </div>
          <div className={styles.checkpoint_data_item}>
            <span className={styles.checkpoint_data_name}>Deposit Fee</span>
            <br />
            <TokenBalance
              balance={toDisplay(BigInt(depositFee?.deposit_fees || 0), 14)}
              prefix=""
              suffix="BTC"
              className={styles.checkpoint_data_value}
              decimalScale={6}
            />
          </div>
          <div className={styles.checkpoint_data_item}>
            <span className={styles.checkpoint_data_name}>Withdrawal Fee</span>
            <br />
            <span className={styles.checkpoint_data_value}>
              <TokenBalance
                balance={toDisplay(BigInt(withdrawalFee?.withdrawal_fees || 0), 14)}
                prefix=""
                suffix="BTC"
                className={styles.checkpoint_data_value}
                decimalScale={6}
              />
            </span>
          </div>
        </div>
        <div className={styles.checkpoint_search_checkpoint}>
          <Search
            className={styles.checkpoint_search_checkpoint_input}
            onChange={(e) => {
              if (e.target.value.length != 0) {
                setCheckpointInputValue(parseInt(e.target.value));
              }
            }}
            placeholder="Search checkpoint index number"
            theme={theme}
          />
        </div>
      </div>
      <div className={styles.explain}>
        <div>
          <TooltipIcon width={20} height={20} />
        </div>
        {renderNotification()}
      </div>
      {checkpointData?.transaction ? <TransactionInput data={checkpointData.transaction.data.input} /> : <></>}
      {checkpointData?.transaction ? <TransactionOutput data={checkpointData.transaction.data.output} /> : <></>}
    </div>
  );
};

export default Checkpoint;
