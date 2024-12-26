import { FC, useContext, useEffect, useState } from 'react';
import Modal from 'components/Modal';
import QRCode from 'qrcode';
import copy from 'copy-to-clipboard';
import styles from './index.module.scss';
import useConfigReducer from 'hooks/useConfigReducer';
import TooltipIcon from 'assets/icons/icon_tooltip.svg?react';
import CopyIcon from 'assets/icons/copy.svg?react';
import SuccessIcon from 'assets/icons/toast_success.svg?react';
import BTCToken from 'assets/images/token-btc.svg?react';
import CloseIcon from 'assets/icons/close-icon.svg?react';
import { reduceString } from 'libs/utils';
import { timeAgo } from 'helper';
import { satToBTC, useDepositFeesBitcoinV2, useGetInfoBtc } from '../helpers';
import { useCopy } from 'hooks/useCopy';
import { Link } from 'react-router-dom';
import { BigDecimal, CoinGeckoPrices } from '@oraichain/oraidex-common';
import { useRelayerFeeToken } from 'hooks/useTokenFee';
import { CwBitcoinContext } from 'context/cw-bitcoin-context';
import { flattenTokens } from 'initCommon';

interface ModalProps {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  prices: CoinGeckoPrices<string>;
}

const DepositBtcModal: FC<ModalProps> = ({ isOpen, open, close, prices }) => {
  const [theme] = useConfigReducer('theme');
  const { isCopied, setIsCopied } = useCopy();
  const [urlQRCode, setUrlQRCode] = useState(null);
  const cwBitcoinContext = useContext(CwBitcoinContext);
  const { infoBTC } = useGetInfoBtc();
  const fromToken = flattenTokens.find((flat) => flat.chainId === ('bitcoin' as any));
  const toToken = flattenTokens.find((flat) => flat.chainId === 'Oraichain' && flat.coinGeckoId === 'bitcoin');
  const depositFeeBtc = useDepositFeesBitcoinV2(true);
  const { relayerFee } = useRelayerFeeToken(fromToken, toToken);
  const [addrOrai, setAddrOrai] = useState('');
  const depositBtcAddress = cwBitcoinContext.depositAddress?.bitcoinAddress;

  // TODO:  usat decimal 14
  const minimumDeposit = depositFeeBtc
    ? new BigDecimal(depositFeeBtc.deposit_fees ?? 0).div(1e14).toNumber() + relayerFee
    : relayerFee;
  const displayAmount = (prices?.['bitcoin'] * minimumDeposit).toFixed(2) || '0';
  useEffect(() => {
    (async () => {
      if (depositBtcAddress) {
        const [url, addrOrai] = await Promise.all([
          QRCode.toDataURL(depositBtcAddress),
          window.Keplr.getKeplrAddr('Oraichain')
        ]);
        setAddrOrai(addrOrai);
        setUrlQRCode(url);
      }
    })();
    return () => {};
  }, [depositBtcAddress]);

  return (
    <Modal theme={theme} isOpen={isOpen} close={close} open={open} className={styles[theme]}>
      <div className={styles.deposit}>
        <div className={styles.label}>
          <span className={styles.title}>Transfer BTC V2 to Oraichain</span>
          <button onClick={close}>
            <CloseIcon color="#232521" />
          </button>
        </div>
        <div className={styles.info}>
          <img src={urlQRCode} alt="Qr code" />
          <div className={styles.address}>
            <BTCToken />
            <button
              className={styles.copy}
              onClick={() => {
                if (depositBtcAddress) {
                  copy(depositBtcAddress);
                  setIsCopied(true);
                }
              }}
            >
              <span>{reduceString(depositBtcAddress, 10, 10) ?? '...'}</span>
              {isCopied ? <SuccessIcon width={20} height={20} /> : <CopyIcon />}
            </button>
          </div>

          <div className={styles.error}>
            <div>
              <TooltipIcon width={20} height={20} />
            </div>
            <span>
              This address expires {timeAgo(new Date().getTime() + 86400 * 1000 * 5)}; deposits sent after that will be
              lost. Transactions fail for deposit amounts exceeding {satToBTC(infoBTC?.capacity_limit)} BTC
            </span>
          </div>
        </div>

        <div className={styles.estimate}>
          <Link to={'/bitcoin-dashboard-v2?tab=pending_deposits'} className={styles.viewTxs}>
            View your transactions
          </Link>
        </div>

        <div className={styles.estimate}>
          <div className={styles.timeMinerFee}>
            <span className={styles.fee}>Minimum Deposit:</span>
            <span className={styles.time}>Expected transaction time:</span>
            <span className={styles.addr}>Oraichain Address:</span>
          </div>
          <div className={styles.value}>
            <span>
              {minimumDeposit} BTC (≈${displayAmount})
            </span>
            <span>20 mins - 1.5 hours</span>
            <span>{reduceString(addrOrai, 8, 8)} </span>
          </div>
        </div>
        <div className={styles.warning}>
          <div>
            <TooltipIcon width={20} height={20} />
          </div>
          <span>Warning: Register recovery address for automatic refund once original transaction fail.</span>
        </div>

        <div className={styles.btn} onClick={close}>
          <div>Close</div>
        </div>
      </div>
    </Modal>
  );
};

export default DepositBtcModal;
