import { toDisplay } from '@oraichain/oraidex-common';
import { FallbackEmptyData } from 'components/FallbackEmptyData';
import { Table, TableHeaderProps } from 'components/Table';
import useConfigReducer from 'hooks/useConfigReducer';
import styles from './PendingWithdraw.module.scss';
import DefaultIcon from 'assets/icons/tokens.svg?react';
import BitcoinIcon from 'assets/icons/bitcoin.svg?react';
import OraiDarkIcon from 'assets/icons/oraichain.svg?react';
import OraiLightIcon from 'assets/icons/oraichain_light.svg?react';
import { CheckpointStatus, TransactionParsedOutput } from 'pages/BitcoinDashboardV2/@types';
import { useGetCheckpointData, useGetCheckpointQueue } from 'pages/BitcoinDashboardV2/hooks';
import { isMobile } from '@walletconnect/browser-utils';
import TransactionsMobile from '../Checkpoint/Transactions/TransactionMobiles/TransactionMobile';

type Icons = {
  Light: any;
  Dark: any;
};

const tokens = {
  bitcoin: {
    Light: BitcoinIcon,
    Dark: BitcoinIcon
  } as Icons,
  oraichain: {
    Light: OraiLightIcon,
    Dark: OraiDarkIcon
  } as Icons
};

export const PendingWithdraws: React.FC<{
  btcAddresses?: String[];
  withdrawFee?: bigint;
  showTx?: boolean;
  additionOutputs?: TransactionParsedOutput[];
}> = ({ btcAddresses, withdrawFee = 0n, showTx = true, additionOutputs = [] }) => {
  const [theme] = useConfigReducer('theme');
  const mobile = isMobile();
  const fetchedBtcAddrs = useConfigReducer('btcAddress');
  const checkpointQueue = useGetCheckpointQueue();
  const buildingCheckpointIndex = checkpointQueue?.index || 0;
  const checkpointData = useGetCheckpointData(buildingCheckpointIndex);
  const checkpointPreviousData = useGetCheckpointData(
    buildingCheckpointIndex > 1 ? buildingCheckpointIndex - 1 : buildingCheckpointIndex
  );
  /**
   * @dev: If we has signing checkpoint after latest building checkpoint, we will append outputs of pending withdraws in signing to current building checkpoint.
   */
  const hasSigningCheckpoint =
    buildingCheckpointIndex == 0 ? false : checkpointPreviousData?.status == CheckpointStatus.Signing;

  const allOutputs = checkpointData?.transaction.data.output
    ? checkpointData?.transaction.data.output.map((item) => ({ ...item, txid: checkpointData.transaction.hash }))
    : [];
  const previousOutputs = checkpointPreviousData?.transaction.data.output
    ? checkpointPreviousData.transaction.data.output.map((item) => ({
        ...item,
        txid: checkpointPreviousData.transaction.hash
      }))
    : [];
  const finalOutputs = hasSigningCheckpoint ? [...allOutputs, ...previousOutputs] : allOutputs;
  const defaultBtcAddress = fetchedBtcAddrs?.[0] || '';
  const data = [...finalOutputs, ...additionOutputs].filter((item) =>
    (btcAddresses || [defaultBtcAddress]).includes(item.address)
  );

  const generateIcon = (baseToken: Icons, quoteToken: Icons): JSX.Element => {
    let [BaseTokenIcon, QuoteTokenIcon] = [DefaultIcon, DefaultIcon];

    if (baseToken) BaseTokenIcon = theme === 'light' ? baseToken.Light : baseToken.Dark;
    if (quoteToken) QuoteTokenIcon = theme === 'light' ? quoteToken.Light : quoteToken.Dark;

    return (
      <div className={styles.symbols}>
        <BaseTokenIcon className={styles.symbols_logo_left} />
        <QuoteTokenIcon className={styles.symbols_logo_right} />
      </div>
    );
  };

  const handleNavigate = (hash: string) => {
    window.open(showTx ? `https://blockstream.info/tx/${hash}` : `https://blockstream.info/address/${hash}`, '_blank');
  };

  const headers: TableHeaderProps<TransactionParsedOutput> = {
    flow: {
      name: 'Flow',
      accessor: (_) => (
        <div className={styles.symbols}>
          <div className={styles.symbols_logo}>{generateIcon(tokens.oraichain, tokens.bitcoin)}</div>
        </div>
      ),
      width: '12%',
      align: 'left'
    },
    txid: {
      name: showTx ? 'Txid' : 'Address',
      width: '60%',
      accessor: (data) => (
        <div onClick={() => handleNavigate(data.txid)}>
          <span>{`${showTx ? data.txid : data.address}`}</span>
        </div>
      ),
      sortField: 'txid',
      align: 'left'
    },
    amount: {
      name: 'Amount',
      width: '21%',
      align: 'right',
      sortField: 'value',
      accessor: (data) => <span>{toDisplay(BigInt(data.value || 0) - withdrawFee, 8)} BTC</span>
    }
  };
  const checkRenderUI = () => {
    if (!data?.length) return <FallbackEmptyData />;

    return mobile ? (
      <TransactionsMobile
        generateIcon={() => generateIcon(tokens.oraichain, tokens.bitcoin)}
        symbols={'ORAI/BTC'}
        transactions={data}
      />
    ) : (
      <Table headers={headers} data={data} defaultSorted="txid" />
    );
  };
  return (
    <div className={styles.pending_withdraws}>
      <h2 className={styles.pending_withdraws_title}>Pending Withdraws:</h2>
      <div className={styles.pending_withdraws_list}>{checkRenderUI()}</div>
    </div>
  );
};
