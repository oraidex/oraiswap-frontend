import { isMobile } from '@walletconnect/browser-utils';
import cn from 'classnames/bind';
import { Button } from 'components/Button';
import styles from './WalletManagement.module.scss';
import useConfigReducer from 'hooks/useConfigReducer';
import useLoadTokens from 'hooks/useLoadTokens';
import { useInactiveConnect } from 'hooks/useMetamask';
import useWalletReducer from 'hooks/useWalletReducer';
import { FC, useEffect, useState } from 'react';
import { ConnectedMobile } from './ConnectedMobile';
import { ModalChooseWallet } from './ModalChooseWallet';
import { MyWallet } from './MyWallet';
import { MyWalletMobile } from './MyWalletMobile';
import type { Wallet as WalletResetType } from './useResetBalance';
import { WalletNetwork, WalletProvider, walletProvider } from './walletConfig';
import Connected from './Connected';
import { keplrCheck } from 'helper';
import { useResetBalance } from './useResetBalance';
const cx = cn.bind(styles);

export const WalletManagement: FC<{}> = () => {
  const [theme] = useConfigReducer('theme');
  const [oraiAddress] = useConfigReducer('address');
  const [tronAddress] = useConfigReducer('tronAddress');
  const [btcAddress] = useConfigReducer('btcAddress');
  const [metamaskAddress] = useConfigReducer('metamaskAddress');
  const [walletByNetworks] = useWalletReducer('walletsByNetwork');
  const { handleResetBalance } = useResetBalance();
  const loadTokenAmounts = useLoadTokens();
  const mobileMode = isMobile();
  useInactiveConnect();

  const [walletProviderWithStatus, setWalletProviderWithStatus] = useState<WalletProvider[]>(walletProvider);
  const [isShowChooseWallet, setIsShowChooseWallet] = useState(false);
  const [isShowMyWallet, setIsShowMyWallet] = useState(false);

  // @ts-ignore
  const isCheckOwallet = window.owallet?.isOwallet;
  const version = window?.keplr?.version;
  const isCheckKeplr = !!version && keplrCheck('keplr');
  const isMetamask = window?.ethereum?.isMetaMask;
  //@ts-ignore
  const isTronLink = window?.tronWeb?.isTronLink;

  // update wallet provider with status is active or not
  useEffect(() => {
    function updateWalletStatus(wallet: WalletNetwork) {
      let isActive = true;
      switch (wallet.nameRegistry) {
        case 'keplr':
          isActive = isCheckKeplr;
          break;
        case 'owallet':
          isActive = isCheckOwallet;
          break;
        case 'metamask':
          isActive = isMetamask;
          break;
        case 'tronLink':
          isActive = isTronLink;
          break;
        case 'eip191':
          isActive = isMetamask;
          break;
        case 'bitcoin':
          isActive = isCheckOwallet;
          break;
      }
      return { ...wallet, isActive };
    }

    async function updateWalletProvider() {
      const updatedWalletProvider = walletProviderWithStatus.map((item) => {
        const updatedWallets = item.wallets.map(updateWalletStatus);
        return {
          ...item,
          wallets: updatedWallets
        };
      });
      setWalletProviderWithStatus(updatedWalletProvider);
    }
    updateWalletProvider();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckOwallet, isCheckKeplr, isMetamask, isTronLink]);

  // load balance every time change address
  useEffect(() => {
    const addresses = { oraiAddress, tronAddress, metamaskAddress, btcAddress };
    const filteredAddresses = {};

    for (const key in addresses) {
      if (addresses[key]) {
        filteredAddresses[key] = addresses[key];
      }
    }
    if (Object.keys(filteredAddresses).length > 0) {
      loadTokenAmounts(filteredAddresses);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oraiAddress, tronAddress, metamaskAddress, btcAddress]);

  // reset balance when disconnect
  useEffect(() => {
    if (!metamaskAddress || !tronAddress || !oraiAddress || !btcAddress) {
      let arrResetBalance: WalletResetType[] = [];
      if (!metamaskAddress) arrResetBalance.push('metamask');
      if (!tronAddress) arrResetBalance.push('tron');
      if (!oraiAddress) arrResetBalance.push('keplr');
      if (!btcAddress) arrResetBalance.push('bitcoin');
      arrResetBalance.length && handleResetBalance(arrResetBalance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oraiAddress, tronAddress, metamaskAddress, btcAddress]);

  const isAnyWalletConnected = Object.values(walletByNetworks).some((wallet) => wallet !== null);
  useEffect(() => {
    // close my wallet info when not connect to any wallet
    if (!isAnyWalletConnected) setIsShowMyWallet(false);
  }, [isAnyWalletConnected]);

  return (
    <div className={cx('connect-wallet-container', theme)}>
      {!isAnyWalletConnected && !mobileMode ? (
        <Button
          type="primary"
          onClick={() => {
            setIsShowChooseWallet(true);
          }}
        >
          Connect Wallet
        </Button>
      ) : mobileMode ? (
        <ConnectedMobile setIsShowMyWallet={setIsShowMyWallet} />
      ) : (
        <Connected setIsShowMyWallet={setIsShowMyWallet} />
      )}

      {mobileMode ? (
        <MyWalletMobile
          setIsShowChooseWallet={setIsShowChooseWallet}
          isShowMyWallet={isShowMyWallet}
          setIsShowMyWallet={setIsShowMyWallet}
          isShowChooseWallet={isShowChooseWallet}
        />
      ) : (
        <MyWallet
          setIsShowChooseWallet={setIsShowChooseWallet}
          isShowMyWallet={isShowMyWallet}
          setIsShowMyWallet={setIsShowMyWallet}
          isShowChooseWallet={isShowChooseWallet}
        />
      )}
      {isShowChooseWallet && !isMobile() ? (
        <ModalChooseWallet
          close={() => {
            setIsShowChooseWallet(false);
          }}
          walletProviderWithStatus={walletProviderWithStatus}
        />
      ) : null}
    </div>
  );
};
