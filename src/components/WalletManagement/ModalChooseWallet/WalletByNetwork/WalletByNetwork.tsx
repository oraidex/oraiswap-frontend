import { WalletType as WalletCosmosType } from '@oraichain/oraidex-common';
import { Button } from 'components/Button';
import { TToastType, displayToast } from 'components/Toasts/Toast';
import type { WalletNetwork, WalletProvider, WalletType } from 'components/WalletManagement/walletConfig';
import { getListAddressCosmos, setStorageKey, switchWalletTron } from 'helper';
import useConfigReducer from 'hooks/useConfigReducer';
import useTheme from 'hooks/useTheme';
import useWalletReducer from 'hooks/useWalletReducer';
import Keplr from 'libs/keplr';
import { initClient } from 'libs/utils';
import { useState } from 'react';
import { WalletItem } from '../WalletItem';
import styles from './WalletByNetwork.module.scss';
import { useInactiveConnect } from 'hooks/useMetamask';
import Metamask from 'libs/metamask';
import DefaultIcon from 'assets/icons/tokens.svg?react';
import { ChainEnableByNetwork, triggerUnlockOwalletInEvmNetwork } from 'components/WalletManagement/wallet-helper';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export type ConnectStatus = 'init' | 'confirming-switch' | 'confirming-disconnect' | 'loading' | 'failed' | 'success';
export const WalletByNetwork = ({ walletProvider }: { walletProvider: WalletProvider }) => {
  const { networks, wallets, networkType } = walletProvider;
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>('init');
  const [currentWalletConnecting, setCurrentWalletConnecting] = useState<WalletNetwork | null>(null);
  const theme = useTheme();
  const [, setOraiAddress] = useConfigReducer('address');
  const [, setTronAddress] = useConfigReducer('tronAddress');
  const [, setBtcAddress] = useConfigReducer('btcAddress');
  const [, setMetamaskAddress] = useConfigReducer('metamaskAddress');
  const [solAddress, setSolanaAddress] = useConfigReducer('solAddress');
  const [, setCosmosAddress] = useConfigReducer('cosmosAddress');
  const [walletByNetworks, setWalletByNetworks] = useWalletReducer('walletsByNetwork');
  const connect = useInactiveConnect();

  const solanaWallet = useWallet();
  const { visible, setVisible } = useWalletModal();

  const handleConfirmSwitch = async () => {
    setConnectStatus('loading');
    await handleConnectWalletByNetwork(currentWalletConnecting);
  };

  const handleConnectWalletInCosmosNetwork = async (walletType: WalletCosmosType | 'eip191') => {
    try {
      window.Keplr = new Keplr(walletType);
      setStorageKey('typeWallet', walletType);
      await initClient();
      const oraiAddr = await window.Keplr.getKeplrAddr();
      setOraiAddress(oraiAddr);

      const { listAddressCosmos } = await getListAddressCosmos(oraiAddr, walletType);

      setCosmosAddress(listAddressCosmos);
    } catch (error) {
      console.trace({ errorCosmos: error });
      throw new Error(error?.message ?? JSON.stringify(error));
    }
  };

  const handleConnectWalletInEvmNetwork = async (walletType: WalletType) => {
    if (walletType === 'owallet') await triggerUnlockOwalletInEvmNetwork(networkType as ChainEnableByNetwork);

    // re-polyfill ethereum for dapp
    window.ethereumDapp = walletType === 'owallet' ? window.eth_owallet : window.ethereum;

    // if chain id empty, we switch to default network which is BSC
    if (!window.ethereumDapp || !window.ethereumDapp.chainId) {
      await window.Metamask.switchNetwork(Networks.bsc);
    }
    await connect(undefined, walletType);
  };

  const handleConnectWalletInTronNetwork = async (walletType: WalletType) => {
    if (walletType === 'owallet') await triggerUnlockOwalletInEvmNetwork(networkType as ChainEnableByNetwork);

    // re-polyfill tronWeb
    window.tronWebDapp = walletType === 'owallet' ? window.tronWeb_owallet : window.tronWeb;
    window.tronLinkDapp = walletType === 'owallet' ? window.tronLink_owallet : window.tronLink;

    window.Metamask = new Metamask(window.tronWebDapp);

    const { tronAddress } = await switchWalletTron(walletType);
    setTronAddress(tronAddress);
  };

  const handleConnectWalletInBtcNetwork = async (walletType: WalletType) => {
    if (walletType === 'owallet') {
      // TODO: need check when use multi wallet support bitcoin
    }
    const btcAddress = await window.Bitcoin.getAddress();
    setBtcAddress(btcAddress);
  };

  const handleConnectWalletInSolanaNetwork = async (walletType: WalletType) => {
    let selectType = 'Phantom';
    if (walletType === 'owallet') {
      // TODO: need check when use multi wallet support solana
      selectType = 'OWallet';
    }
    await solanaWallet.select(selectType as any);
    const solanaConnect = await window.solana.connect();
    if (solanaConnect?.publicKey) {
      setSolanaAddress(solanaConnect?.publicKey.toBase58());
    }
  };

  const handleConnectWalletByNetwork = async (wallet: WalletNetwork) => {
    try {
      setConnectStatus('loading');
      switch (networkType) {
        case 'cosmos':
          await handleConnectWalletInCosmosNetwork(wallet.nameRegistry as WalletCosmosType);
          break;
        case 'evm':
          await handleConnectWalletInEvmNetwork(wallet.nameRegistry);
          break;
        case 'tron':
          await handleConnectWalletInTronNetwork(wallet.nameRegistry as WalletCosmosType);
          break;
        case 'bitcoin':
          await handleConnectWalletInBtcNetwork(wallet.nameRegistry);
          break;
        case 'solana':
          await handleConnectWalletInSolanaNetwork(wallet.nameRegistry);
          break;
        default:
          setConnectStatus('init');
          break;
      }
      setWalletByNetworks({
        ...walletByNetworks,
        [networkType]: wallet.nameRegistry
      });
      setCurrentWalletConnecting(null);
      setConnectStatus('init');
    } catch (error) {
      console.log('error handleConnectWalletByNetwork: ', error);
      setConnectStatus('failed');
      const msg = error.message ? error.message : JSON.stringify(error);
      displayToast(TToastType.WALLET_FAILED, { message: msg });
    }
  };

  const handleClickConnect = async (wallet: WalletNetwork) => {
    try {
      setCurrentWalletConnecting(wallet);
      if (walletByNetworks[networkType] && walletByNetworks[networkType] !== wallet.nameRegistry) {
        setConnectStatus('confirming-switch');
      } else {
        await handleConnectWalletByNetwork(wallet);
      }
    } catch (error) {
      console.log({ errorConnect: error });
      displayToast(TToastType.METAMASK_FAILED, {
        message: typeof error === 'object' ? error.message : JSON.stringify(error)
      });
    }
  };

  const handleClickDisconnect = async () => {
    setConnectStatus('confirming-disconnect');
  };

  const handleDisconnect = async () => {
    setWalletByNetworks({
      ...walletByNetworks,
      [networkType]: null
    });
    switch (networkType) {
      case 'cosmos':
        setOraiAddress(undefined);
        break;
      case 'evm':
        setMetamaskAddress(undefined);
        break;
      case 'tron':
        setTronAddress(undefined);
        break;
      case 'bitcoin':
        setBtcAddress(undefined);
        break;
      case 'solana':
        await solanaWallet.disconnect();
        setSolanaAddress(undefined);
        break;
      default:
        break;
    }
    setConnectStatus('init');
  };

  const renderNetworkContent = () => {
    const currentWalletType = walletByNetworks[networkType];
    const currentWalletName = currentWalletType
      ? wallets.find((w) => w.nameRegistry === currentWalletType)?.name
      : null;

    let content;
    switch (connectStatus) {
      case 'init':
      case 'loading':
        content = (
          <div
            className={`${styles.wallets} ${
              networkType === 'cosmos' ? styles.flexJustifyStart : styles.flexJustifyBetween
            }`}
          >
            {wallets.map((w) => {
              return (
                <WalletItem
                  isActive={w.isActive}
                  key={w.name + Math.random()}
                  wallet={w}
                  handleClickConnect={handleClickConnect}
                  handleClickDisconnect={handleClickDisconnect}
                  networkType={networkType}
                  connectStatus={connectStatus}
                  currentWalletConnecting={currentWalletConnecting}
                />
              );
            })}
          </div>
        );
        break;
      case 'confirming-switch':
        content = (
          <div className={styles.swithWallet}>
            <h4>Switch wallet?</h4>
            <div className={styles.switchText}>
              Disconnect from {currentWalletName} and connect to {currentWalletConnecting?.name}
            </div>
            <div className={styles.groupBtns}>
              <Button onClick={() => setConnectStatus('init')} type="secondary-sm">
                Cancel
              </Button>
              <Button onClick={handleConfirmSwitch} type="primary-sm">
                Switch
              </Button>
            </div>
          </div>
        );
        break;
      case 'failed':
        content = (
          <div className={styles.swithWallet}>
            <h4>Fail to connect to wallet</h4>
            <div className={styles.switchText}>Unfortunately, we did not receive the confirmation.</div>
            <div className={styles.groupBtns}>
              <Button onClick={() => setConnectStatus('init')} type="secondary-sm">
                Cancel
              </Button>
              <Button onClick={handleConfirmSwitch} type="primary-sm">
                Try again
              </Button>
            </div>
          </div>
        );
        break;
      case 'confirming-disconnect':
        content = (
          <div className={styles.swithWallet}>
            <h4>Disconnect wallet?</h4>
            <div className={styles.switchText}>Are you sure you want to disconnect {currentWalletName}?</div>
            <div className={styles.groupBtns}>
              <Button onClick={() => setConnectStatus('init')} type="secondary-sm">
                Cancel
              </Button>
              <Button onClick={handleDisconnect} type="primary-sm">
                Disconnect
              </Button>
            </div>
          </div>
        );
        break;
      default:
        content = <></>;
    }
    return content;
  };

  const renderNetworkIcons = () => {
    return networks.map((network, index) => {
      let NetworkIcon = theme === 'dark' ? network.Icon : network.IconLight;
      if (!NetworkIcon) NetworkIcon = DefaultIcon;
      return (
        <div className={styles.networkIcon} key={network.chainName + index}>
          <NetworkIcon width={20} height={20} />
        </div>
      );
    });
  };

  return (
    <div
      className={`${styles.walletByNetwork} ${styles[theme]} ${networkType === 'cosmos' ? styles.fullWitdth : null}`}
    >
      <div className={styles.header}>
        <div className={styles.networkIcons}>{renderNetworkIcons()}</div>
      </div>
      <div className={styles.content}>{renderNetworkContent()}</div>
    </div>
  );
};
