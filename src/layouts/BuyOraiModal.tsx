import useConfigReducer from 'hooks/useConfigReducer';
import styles from './BuyOraiModal.module.scss';

const network = 'oraichain';
const networkList = ['oraichain'].join(',');
const product = 'BUY';
const productList = ['BUY'].join(','); // 'SELL'
const onPayCurrency = 'USD';
const onPayAmount = 200;
const onRevCurrency = 'ORAI';
const offPayCurrency = 'USDC'; // 'USDC_NOBLE_ORAI';
const cryptoList = ['ORAI', 'USDC'].join(',');
const offRevCurrency = 'USD';
const apiKey = import.meta.env.VITE_APP_KADO_API_KEY;

const BuyOraiModal = ({
  open,
  close,
  onAfterLoad,
  isLoadedIframe
}: {
  open: boolean;
  close: () => void;
  onAfterLoad: () => void;
  isLoadedIframe: boolean;
}) => {
  const [theme] = useConfigReducer('theme');
  const [oraiAddress] = useConfigReducer('address');

  const URL = `https://app.kado.money/?onPayCurrency=${onPayCurrency}&onPayAmount=${onPayAmount}&onRevCurrency=${onRevCurrency}&offPayCurrency=${offPayCurrency}&offRevCurrency=${offRevCurrency}&network=${network}&onToAddress=${oraiAddress}&offFromAddress=${oraiAddress}&cryptoList=${cryptoList}&networkList=${networkList}&apiKey=${apiKey}&product=${product}&productList=${productList}&theme=${theme}`;

  return (
    <div className={styles.buyModalWrapper} onClick={() => isLoadedIframe && close()}>
      <div className={`${styles.content} ${isLoadedIframe ? styles.isLoaded : ''}`}>
        <iframe
          src={URL}
          title="buy_orai_ifr"
          onLoad={() => {
            onAfterLoad();
          }}
        />
      </div>
    </div>
  );
};

export default BuyOraiModal;
