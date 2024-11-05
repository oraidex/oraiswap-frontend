import CloseIcon from 'assets/icons/close-icon.svg?react';
import classNames from 'classnames';
import Modal from 'components/Modal';
import useConfigReducer from 'hooks/useConfigReducer';
import { WalletProvider } from '../walletConfig';
import styles from './ModalChooseWallet.module.scss';
import { WalletByNetwork } from './WalletByNetwork';

export const ModalChooseWallet: React.FC<{
  close: () => void;
  walletProviderWithStatus: WalletProvider[];
}> = ({ close, walletProviderWithStatus }) => {
  const [theme] = useConfigReducer('theme');

  const renderListWalletByNetwork = () => {
    return walletProviderWithStatus.map((item, index) => <WalletByNetwork key={index} walletProvider={item} />);
  };

  return (
    <Modal
      isOpen={true}
      close={close}
      open={() => {}}
      isCloseBtn={false}
      className={classNames(styles.chooseWalletModalContainer, `${styles[theme]}`)}
    >
      <div className={styles.chooseWalletModalWrapper}>
        <div className={styles.header}>
          <div>Connect to OraiDEX</div>
          <div onClick={close} className={styles.closeIcon}>
            <CloseIcon />
          </div>
        </div>
        <div className={styles.listWalletNetworkWrapper}>{renderListWalletByNetwork()}</div>
      </div>
    </Modal>
  );
};
