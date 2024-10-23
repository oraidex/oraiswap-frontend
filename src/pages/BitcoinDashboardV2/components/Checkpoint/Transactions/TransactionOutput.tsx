import { toDisplay } from '@oraichain/oraidex-common';
import { FallbackEmptyData } from 'components/FallbackEmptyData';
import { Table, TableHeaderProps } from 'components/Table';
import useConfigReducer from 'hooks/useConfigReducer';
import styles from './Transaction.module.scss';
import { ReactComponent as DefaultIcon } from 'assets/icons/tokens.svg';
import { ReactComponent as BitcoinIcon } from 'assets/icons/bitcoin.svg';
import { ReactComponent as OraiDarkIcon } from 'assets/icons/oraichain.svg';
import { ReactComponent as OraiLightIcon } from 'assets/icons/oraichain_light.svg';
import { TransactionParsedOutput } from 'pages/BitcoinDashboard/@types';
import { isMobile } from '@walletconnect/browser-utils';
import RenderIf from '../../RenderIf/RenderIf';
import TransactionsMobile from './TransactionMobiles/TransactionMobile';

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

export const TransactionOutput: React.FC<{ data: TransactionParsedOutput[] }> = ({ data }) => {
  const [theme] = useConfigReducer('theme');
  const mobile = isMobile();

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
    window.open(`https://blockstream.info/address/${hash}`, '_blank');
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
    address: {
      name: 'Address',
      width: '60%',
      accessor: (data) => (
        <div onClick={() => handleNavigate(data.address)}>
          <span>{`${data.address}`}</span>
        </div>
      ),
      sortField: 'address',
      align: 'left'
    },
    amount: {
      name: 'Amount',
      width: '21%',
      align: 'right',
      sortField: 'value',
      accessor: (data) => <span>{toDisplay(BigInt(data.value || 0), 8)} BTC</span>
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
      <Table headers={headers} data={data} defaultSorted="address" />
    );
  };
  return (
    <div className={styles.transactions}>
      <h2 className={styles.transactions_title}>Transaction Outputs:</h2>
      <div className={styles.transactions_list}>{checkRenderUI()}</div>
    </div>
  );
};
