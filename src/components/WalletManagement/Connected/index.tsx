import { isMobile } from '@walletconnect/browser-utils';
import DownArrowIcon from 'assets/icons/down-arrow.svg?react';
import cn from 'classnames/bind';
import { allWallets } from 'components/WalletManagement/walletConfig';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import useWalletReducer from 'hooks/useWalletReducer';
import { getTotalUsd } from 'libs/utils';
import { formatDisplayUsdt } from 'pages/Pools/helpers';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configure';
import styles from './index.module.scss';
const cx = cn.bind(styles);

const Connected: React.FC<{ setIsShowMyWallet: (isShow: boolean) => void }> = ({ setIsShowMyWallet }) => {
  const mobileMode = isMobile();
  const [theme] = useConfigReducer('theme');
  const amounts = useSelector((state: RootState) => state.token.amounts);
  const { data: prices } = useCoinGeckoPrices();
  const [tokenPoolPrices] = useConfigReducer('tokenPoolPrices');

  const totalUsd = getTotalUsd(amounts, prices, tokenPoolPrices);
  const [walletsByNetwork] = useWalletReducer('walletsByNetwork');

  const renderConnectedWalletLogo = () => {
    const connectedWallets = Object.values(walletsByNetwork).reduce((acc, currentWalletType) => {
      if (!currentWalletType) return acc;

      const wallet = allWallets.find((wallet) => wallet.nameRegistry === currentWalletType);
      if (!wallet) return acc;

      if (!acc.find((item) => item.name === wallet.name)) acc.push(wallet);
      return acc;
    }, []);

    return Array.from(connectedWallets).map((connectedWalletIcon, index) => {
      return (
        <div className={cx('wallet_icon')} key={connectedWalletIcon.nameRegistry}>
          <connectedWalletIcon.icon width={20} height={20} />
        </div>
      );
    });
  };

  return (
    <div className={cx('connected_container', theme)} onClick={() => setIsShowMyWallet(true)}>
      {renderConnectedWalletLogo()}
      {!mobileMode && (
        <>
          <div className={cx('content')}>
            <div className={cx('title')}>My Wallets</div>
            <div className={cx('money')}>{formatDisplayUsdt(totalUsd)}</div>
          </div>
          <div className={cx('down_icon')}>
            <DownArrowIcon />
          </div>
        </>
      )}
    </div>
  );
};

export default Connected;
