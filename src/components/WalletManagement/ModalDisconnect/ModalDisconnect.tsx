import { ReactComponent as CloseIcon } from 'assets/icons/close-icon.svg';
import { ReactComponent as CopyIcon } from 'assets/icons/copy.svg';
import cn from 'classnames/bind';
import Modal from 'components/Modal';
import useConfigReducer from 'hooks/useConfigReducer';
import { NetworkType, allWallets, walletProvider } from '../walletConfig';
import styles from './ModalDisconnect.module.scss';
import useWalletReducer from 'hooks/useWalletReducer';
import { reduceString } from 'libs/utils';

const cx = cn.bind(styles);

export const ModalDisconnect: React.FC<{
  close: () => void;
  currentDisconnectingNetwork: NetworkType;
  setCurrentDisconnectingNetwork: React.Dispatch<React.SetStateAction<NetworkType>>;
}> = ({ close, currentDisconnectingNetwork, setCurrentDisconnectingNetwork }) => {
  const [theme] = useConfigReducer('theme');
  const [walletByNetworks, setWalletByNetworks] = useWalletReducer('walletsByNetwork');
  const [oraiAddress, setOraiAddress] = useConfigReducer('address');
  const [tronAddress, setTronAddress] = useConfigReducer('tronAddress');
  const [metamaskAddress, setMetamaskAddress] = useConfigReducer('metamaskAddress');
  const chains =
    walletProvider.find((provider) => provider.networkType === currentDisconnectingNetwork)?.networks || [];

  const currentWalletConnected = allWallets.find(
    (item) => item.nameRegistry === walletByNetworks[currentDisconnectingNetwork]
  );

  const checkAddressByWalletType = () => {
    let choosedAddressDisplayByNetwork = '';
    switch (currentDisconnectingNetwork) {
      case 'cosmos':
        choosedAddressDisplayByNetwork = oraiAddress;
        break;
      case 'evm':
        choosedAddressDisplayByNetwork = metamaskAddress;
        break;
      case 'tron':
        choosedAddressDisplayByNetwork = tronAddress;
        break;
      default:
        break;
    }
    return choosedAddressDisplayByNetwork;
  };

  const handleDisconnect = () => {
    setWalletByNetworks({
      ...walletByNetworks,
      [currentDisconnectingNetwork]: null
    });
    switch (currentDisconnectingNetwork) {
      case 'cosmos':
        setOraiAddress(undefined);
        break;
      case 'evm':
        setMetamaskAddress(undefined);
        break;
      case 'tron':
        setTronAddress(undefined);
        break;
      default:
        break;
    }
    close();
  };

  return (
    <Modal
      isOpen={true}
      close={close}
      open={null}
      isCloseBtn={false}
      className={cx('choose_wallet_modal_container', theme)}
    >
      <div className={cx('choose_wallet_modal_wrapper')}>
        <div className={cx('header')}>
          <div>Disconnect wallet</div>
          <div onClick={close} className={cx('close_icon')}>
            <CloseIcon />
          </div>
        </div>

        <div className={cx('connect_error', theme)}>
          <div className={cx('content')}>
            <p className={cx('label')}>
              Are you sure you want to disconnect{' '}
              <span className={cx('wallet-type')}>{currentDisconnectingNetwork.toUpperCase()} network ?</span>
            </p>
            <div className={styles.chains}>
              {chains.map((chain, index) => {
                return (
                  <div className={styles.chainInfo} key={index}>
                    <div className={styles.chainLogo}>
                      {theme === 'dark' ? (
                        <chain.Icon width={20} height={20} />
                      ) : (
                        <chain.IconLight width={20} height={20} />
                      )}
                    </div>
                    <div className={styles.chainName}>{chain.name}</div>
                  </div>
                );
              })}
            </div>
            <div className={cx('content-2')}>
              {currentWalletConnected && <currentWalletConnected.icon width={30} height={30} />}
              <span className={cx('sub-label')}>{reduceString(checkAddressByWalletType(), 6, 6)}</span>
              <CopyIcon />
            </div>
          </div>
          <div className={cx('actions')}>
            <div className={cx('cancel_btn')} onClick={close}>
              Cancel
            </div>
            <div className={cx('try_again_btn')} onClick={handleDisconnect}>
              Disconnect
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
