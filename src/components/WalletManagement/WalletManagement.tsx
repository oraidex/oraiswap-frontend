import { useWallet } from '@cosmos-kit/react';
import { isMobile } from '@walletconnect/browser-utils';
import cn from 'classnames/bind';
import { Button } from 'components/Button';
import type { Wallet as WalletResetType } from 'components/ConnectWallet/useResetBalance';
import { useResetBalance } from 'components/ConnectWallet/useResetBalance';
import useConfigReducer from 'hooks/useConfigReducer';
import useLoadTokens from 'hooks/useLoadTokens';
import { FC, useEffect, useState } from 'react';
import Connected from './Connected';
import { ModalChooseWallet } from './ModalChooseWallet';
import { MyWallet } from './MyWallet';
import styles from './WalletManagement.module.scss';
const cx = cn.bind(styles);

export const WalletManagement: FC<{}> = () => {
  const [theme] = useConfigReducer('theme');
  const [isShowChooseWallet, setIsShowChooseWallet] = useState(true);
  const [isShowMyWallet, setIsShowMyWallet] = useState(false);
  const wallet = useWallet();
  const loadTokenAmounts = useLoadTokens();
  const [oraiAddress] = useConfigReducer('address');
  const [tronAddress] = useConfigReducer('tronAddress');
  const [metamaskAddress] = useConfigReducer('metamaskAddress');
  const { handleResetBalance } = useResetBalance();

  // load balance every time change address
  useEffect(() => {
    loadTokenAmounts({ oraiAddress, tronAddress, metamaskAddress });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oraiAddress, tronAddress, metamaskAddress]);

  // reset balance when disconnect
  useEffect(() => {
    if (!metamaskAddress || !tronAddress || !oraiAddress) {
      let arrResetBalance: WalletResetType[] = [];
      if (!metamaskAddress) arrResetBalance.push('metamask');
      if (!tronAddress) arrResetBalance.push('tron');
      if (!oraiAddress) arrResetBalance.push('keplr');
      arrResetBalance.length && handleResetBalance(arrResetBalance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oraiAddress, tronAddress, metamaskAddress]);

  const isAnyWalletConnected = !!wallet.mainWallet;
  return (
    <div className={cx('connect-wallet-container', theme)}>
      {!isAnyWalletConnected ? (
        <Button
          type="primary"
          onClick={() => {
            setIsShowChooseWallet(true);
          }}
        >
          Connect Wallet
        </Button>
      ) : (
        <Connected setIsShowMyWallet={setIsShowMyWallet} />
      )}
      <MyWallet
        setIsShowChooseWallet={setIsShowChooseWallet}
        isShowMyWallet={isShowMyWallet}
        setIsShowMyWallet={setIsShowMyWallet}
        isShowChooseWallet={isShowChooseWallet}
      />
      {isShowChooseWallet && !isMobile() ? (
        <ModalChooseWallet
          close={() => {
            setIsShowChooseWallet(false);
          }}
        />
      ) : null}
    </div>
  );
};