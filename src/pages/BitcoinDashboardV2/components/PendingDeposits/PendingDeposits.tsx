import { toDisplay } from '@oraichain/oraidex-common';
import { FallbackEmptyData } from 'components/FallbackEmptyData';
import { Table, TableHeaderProps } from 'components/Table';
import useConfigReducer from 'hooks/useConfigReducer';
import styles from './PendingDeposits.module.scss';
import { ReactComponent as DefaultIcon } from 'assets/icons/tokens.svg';
import { ReactComponent as BitcoinIcon } from 'assets/icons/bitcoin.svg';
import { ReactComponent as OraiDarkIcon } from 'assets/icons/oraichain.svg';
import { ReactComponent as OraiLightIcon } from 'assets/icons/oraichain_light.svg';
import { ReactComponent as TooltipIcon } from 'assets/icons/icon_tooltip.svg';
import { useGetContractConfig, useGetPendingDeposits } from '../../hooks/lcd.hook';
import { CheckpointStatus, DepositInfo, TransactionParsedInput } from '../../@types';
import { useEffect } from 'react';
import { useGetCheckpointData, useGetCheckpointQueue, useGetDepositFee } from 'pages/BitcoinDashboardV2/hooks';
import { useRelayerFeeToken } from 'hooks/useTokenFee';
import { btcTokens, oraichainTokens } from 'config/bridgeTokens';
import TransactionsMobile from '../Checkpoint/Transactions/TransactionMobiles/TransactionMobile';
import { isMobile } from '@walletconnect/browser-utils';
import RenderIf from '../RenderIf/RenderIf';

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

export const PendingDeposits: React.FC<{}> = ({}) => {
  const [theme] = useConfigReducer('theme');
  const mobile = isMobile();
  const [oraichainAddress] = useConfigReducer('address');
  const contractConfig = useGetContractConfig();
  const depositFee = useGetDepositFee();
  const fetchedPendingDeposits = useGetPendingDeposits(oraichainAddress);
  const checkpointQueue = useGetCheckpointQueue();
  const buildingCheckpointIndex = checkpointQueue?.index || 0;
  const checkpointData = useGetCheckpointData(buildingCheckpointIndex);
  const checkpointPreviousData = useGetCheckpointData(
    buildingCheckpointIndex > 1 ? buildingCheckpointIndex - 1 : buildingCheckpointIndex
  );
  const [allPendingDeposits, setAllPendingDeposits] = useConfigReducer('allPendingDeposits');

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

  const handleNavigate = (txid: String) => {
    window.open(`https://blockstream.info/tx/${txid}`, '_blank');
  };

  const isExitsDeposit = (arr: DepositInfo[] | TransactionParsedInput[], findItem: DepositInfo): [boolean, number] => {
    let indexFinded = arr.findIndex((item, _) => item.txid === findItem.txid);
    return [indexFinded === -1 ? false : true, indexFinded];
  };

  useEffect(() => {
    if (
      !oraichainAddress ||
      !checkpointData ||
      !checkpointPreviousData ||
      !fetchedPendingDeposits ||
      !checkpointQueue
    ) {
      return;
    }
    const depositPendingUpdate = handleUpdateTxPending();
    if (!depositPendingUpdate) return;
    const depositPendingPopout = handlePopOutPending(depositPendingUpdate);
    if (!depositPendingPopout) return;
    console.log(allPendingDeposits, 'allPendingDeposits');
    setAllPendingDeposits({
      ...allPendingDeposits,
      [oraichainAddress]: depositPendingPopout
    });
  }, [checkpointData, checkpointPreviousData, oraichainAddress, fetchedPendingDeposits, checkpointQueue]);
  const handleUpdateTxPending = () => {
    // /**
    //  * @devs: This one will handle update pendingDeposits to localStorage,
    //  * if there is no cache, set current pending deposits with latest building
    //  * checkpoint index.
    //  */

    let pendingDeposits = allPendingDeposits?.[oraichainAddress] ? [...allPendingDeposits[oraichainAddress]] : []; // Fix read-only
    for (let i = 0; i < fetchedPendingDeposits.length; i++) {
      try {
        let [isExits, itemIndex] = isExitsDeposit(pendingDeposits, fetchedPendingDeposits[i]);
        if (!isExits) {
          pendingDeposits = [...pendingDeposits, fetchedPendingDeposits[i]];
          continue;
        }
        pendingDeposits[itemIndex] = fetchedPendingDeposits[i];
      } catch (err) {
        console.log(err);
      }
    }
    return pendingDeposits;
  };
  const handlePopOutPending = (depositPendingUpdate: DepositInfo[]) => {
    /**
     * @devs: This will pop out pending deposits if stored building checkpoint is less than
     * current building checkpoint index. (if there is any signing state, minus building
     * checkpoint index to 1).
     */

    const checkpointInput = checkpointData.transaction.data.input;
    const checkpointPreviousInput = checkpointPreviousData.transaction.data.input;
    // @ts-ignore
    const isSigningStatus = checkpointPreviousData.status === CheckpointStatus.Signing;
    const pendingDeposits = depositPendingUpdate.filter(
      (item) =>
        isExitsDeposit(checkpointInput, item)[0] ||
        isExitsDeposit(fetchedPendingDeposits, item)[0] ||
        (isExitsDeposit(checkpointPreviousInput, item)[0] && isSigningStatus)
    );
    return pendingDeposits ?? [];
  };

  const headers: TableHeaderProps<DepositInfo> = {
    flow: {
      name: 'Flow',
      accessor: (_) => (
        <div className={styles.symbols}>
          <div className={styles.symbols_logo}>{generateIcon(tokens.bitcoin, tokens.oraichain)}</div>
        </div>
      ),
      width: '12%',
      align: 'left'
    },
    txid: {
      name: 'Transaction Id',
      width: '50%',
      accessor: (data) => (
        <div onClick={() => handleNavigate(data.txid)}>
          <span>{`${data.txid}`}</span>
        </div>
      ),
      sortField: 'txid',
      align: 'left'
    },
    amount: {
      name: 'Amount',
      width: '13%',
      align: 'left',
      sortField: 'amount',
      accessor: (data) => (
        <span>
          {(
            data.amount -
            (contractConfig?.token_fee?.nominator * data.amount) / contractConfig?.token_fee?.denominator -
            toDisplay(BigInt(depositFee?.deposit_fees || 0), 14)
          ).toFixed(6)}{' '}
          BTC
        </span>
      )
    },
    vout: {
      name: 'Vout',
      width: '13%',
      align: 'right',
      sortField: 'vout',
      accessor: (data) => <span>{data.vout}</span>
    },
    confirmations: {
      name: 'Confirmations',
      width: '12%',
      align: 'right',
      sortField: 'confirmations',
      accessor: (data) => <span>{data.confirmations}</span>
    }
  };
  const checkRenderUI = () => {
    if (!allPendingDeposits?.[oraichainAddress]?.length) return <FallbackEmptyData />;

    return mobile ? (
      <TransactionsMobile
        generateIcon={() => generateIcon(tokens.bitcoin, tokens.oraichain)}
        symbols={'BTC/ORAI'}
        transactions={allPendingDeposits?.[oraichainAddress]}
      />
    ) : (
      <Table headers={headers} data={allPendingDeposits?.[oraichainAddress]} defaultSorted="confirmations" />
    );
  };
  return (
    <div className={styles.pending_deposits}>
      <div className={styles.explain}>
        <div>
          <TooltipIcon width={20} height={20} />
        </div>
        <span>
          After a pending deposit disappears, it will show up as transaction hash in lastest checkpoint index.
        </span>
      </div>
      <h2 className={styles.pending_deposits_title}>Pending Deposits:</h2>
      <div className={styles.pending_deposits_list}>{checkRenderUI()}</div>
    </div>
  );
};
