import { FallbackEmptyData } from 'components/FallbackEmptyData';
import { Table, TableHeaderProps } from 'components/Table';
import useConfigReducer from 'hooks/useConfigReducer';
import { useNavigate } from 'react-router-dom';
import styles from './Transaction.module.scss';
import { ReactComponent as DefaultIcon } from 'assets/icons/tokens.svg';
import { ReactComponent as BitcoinIcon } from 'assets/icons/bitcoin.svg';
import { ReactComponent as OraiDarkIcon } from 'assets/icons/oraichain.svg';
import { ReactComponent as OraiLightIcon } from 'assets/icons/oraichain_light.svg';
import { TransactionParsedInput } from 'pages/BitcoinDashboard/@types';

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

export const TransactionInput: React.FC<{ data: TransactionParsedInput[] }> = ({ data }) => {
  const [theme] = useConfigReducer('theme');
  const navigate = useNavigate();
  const oraichainAddress = useConfigReducer('cosmosAddress')[0]?.Oraichain;

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

  console.log(data);

  const headers: TableHeaderProps<TransactionParsedInput> = {
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
      width: '68%',
      accessor: (data) => (
        <div onClick={() => handleNavigate(data.txid)}>
          <span>{`${data.txid}`}</span>
        </div>
      ),
      sortField: 'txid',
      align: 'left'
    },
    vout: {
      name: 'Vout',
      width: '13%',
      align: 'right',
      sortField: 'vout',
      accessor: (data) => <span>{data.vout}</span>
    }
  };

  return (
    <div className={styles.listpools}>
      <h2 className={styles.listpools_title}>Transaction Inputs:</h2>
      <div className={styles.listpools_list}>
        {(data?.length || 0) > 0 ? <Table headers={headers} data={data} defaultSorted="txid" /> : <FallbackEmptyData />}
      </div>
    </div>
  );
};
