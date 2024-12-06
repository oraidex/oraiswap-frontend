import { useTonAddress, useTonConnectModal, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useEffect } from 'react';
import useConfigReducer from './useConfigReducer';
import useWalletReducer from './useWalletReducer';

const useTonConnectAddress = () => {
  const userFriendlyAddress = useTonAddress();
  const wallet = useTonWallet();
  const { open: openConnect } = useTonConnectModal();
  const [tonConnectUI] = useTonConnectUI();
  const [tonAddress, setTonAddress] = useConfigReducer('tonAddress');
  const [walletByNetworks, setWalletByNetworks] = useWalletReducer('walletsByNetwork');

  useEffect(() => {
    if (!(userFriendlyAddress && wallet)) {
      setTonAddress(undefined);
      setWalletByNetworks({
        ...walletByNetworks,
        ton: null
      });
      return;
    }

    setTonAddress(userFriendlyAddress);

    setWalletByNetworks({
      ...walletByNetworks,
      ton: 'ton'
    });

    // handleSetTonWallet({
    //   tonWallet:
    //     wallet?.["appName"] ||
    //     (wallet?.device?.appName?.toLowerCase() as TonWallet),
    // });
  }, [userFriendlyAddress, wallet]);

  const handleDisconnectTon = async () => {
    try {
      if (tonConnectUI.connected) {
        await tonConnectUI.disconnect();
      }

      if (tonAddress && walletByNetworks.ton) {
        // && walletType === tonWallet
        // handleSetTonAddress({ tonAddress: undefined });
        // handleSetTonWallet({ tonWallet: undefined });

        setTonAddress(undefined);
      }
    } catch (error) {
      console.log('error disconnect TON :>>', error);
    }
  };

  const handleConnectTon = () => {
    try {
      openConnect();
    } catch (error) {
      console.log('error', error);
    }
  };

  return {
    handleConnectTon,
    handleDisconnectTon
  };
};

export default useTonConnectAddress;
