import cn from 'classnames/bind';
import { useSelector } from 'react-redux';
import useConfigReducer from 'hooks/useConfigReducer';
import WalletIcon from 'assets/icons/wallet-icon.svg?react';
import DownArrowIcon from 'assets/icons/down-arrow.svg?react';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import { getTotalUsd } from 'libs/utils';
import { RootState } from 'store/configure';
import styles from './ConnectedMobile.module.scss';
import { isMobile } from '@walletconnect/browser-utils';
import { formatDisplayUsdt } from 'pages/Pools/helpers';

const cx = cn.bind(styles);

export const ConnectedMobile: React.FC<{ setIsShowMyWallet: (isShow: boolean) => void }> = ({ setIsShowMyWallet }) => {
  const mobileMode = isMobile();

  const [theme] = useConfigReducer('theme');
  const amounts = useSelector((state: RootState) => state.token.amounts);
  const { data: prices } = useCoinGeckoPrices();
  const [tokenPoolPrices] = useConfigReducer('tokenPoolPrices');
  const totalUsd = getTotalUsd(amounts, prices, tokenPoolPrices);

  return (
    <div className={cx('connected_container', theme)} onClick={() => setIsShowMyWallet(true)}>
      <div className={cx('wallet_icon')}>
        <WalletIcon />
      </div>
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
