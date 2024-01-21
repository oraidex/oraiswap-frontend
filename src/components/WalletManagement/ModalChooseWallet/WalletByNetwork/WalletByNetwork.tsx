import { useState } from 'react';
import { WalletProvider } from '../ModalChooseWallet';
import { WalletItem } from '../WalletItem';
import styles from './WalletByNetwork.module.scss';
import { Button } from 'components/Button';
import useTheme from 'hooks/useTheme';
import { useChains } from '@cosmos-kit/react-lite';
import { useWallet } from '@cosmos-kit/react';
import { MainWalletBase } from '@cosmos-kit/core';
import useConfigReducer from 'hooks/useConfigReducer';
import { getListAddressCosmos, switchWalletCosmos } from 'helper';

export type ConnectStatus = 'init' | 'confirming-switch' | 'confirming-disconnect' | 'loading' | 'failed' | 'success';
export const WalletByNetwork = ({ walletProvider }: { walletProvider: WalletProvider }) => {
  const { networks, wallets, networkType } = walletProvider;
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>('init');
  const [currentWalletConnected, setCurrentWalletConnected] = useState<MainWalletBase | null>(null);
  const [currentWalletConnecting, setCurrentWalletConnecting] = useState<MainWalletBase | null>(null);
  const theme = useTheme();
  const [_oraiAddress, setOraiAddress] = useConfigReducer('address');
  const [tronAddress, setTronAddress] = useConfigReducer('tronAddress');
  const [metamaskAddress, setMetamaskAddress] = useConfigReducer('metamaskAddress');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_cosmosAddress, setCosmosAddress] = useConfigReducer('cosmosAddress');
  const chains = useChains(['oraichain', 'cosmoshub', 'osmosis', 'injective', 'noble']);
  const connected = Object.values(chains).every((chain) => chain.isWalletConnected);
  const { connect, openView, disconnect, isWalletConnected } = chains.oraichain;
  console.log({ _oraiAddress });
  const wallet = useWallet();
  const renderNetworkContent = () => {
    let content;
    switch (connectStatus) {
      case 'init':
        content = (
          <div className={styles.wallets}>
            {wallets.map((w, index) => {
              return (
                <WalletItem
                  isActive={w.isActive}
                  key={w.name + Math.random()}
                  wallet={w}
                  setConnectStatus={setConnectStatus}
                  connectStatus={connectStatus}
                  currentWallet={wallet.mainWallet?.walletName}
                  setCurrentWalletConnected={setCurrentWalletConnected}
                  setCurrentWalletConnecting={setCurrentWalletConnecting}
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
              Disconnect from {wallet.mainWallet?.walletPrettyName} and connect to{' '}
              {currentWalletConnecting.walletPrettyName}
            </div>
            <div className={styles.groupBtns}>
              <Button onClick={() => setConnectStatus('init')} type="secondary">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  switchWalletCosmos(
                    currentWalletConnecting.walletName === 'owallet-extension'
                      ? 'owallet'
                      : currentWalletConnecting.walletName === 'keplr-extension'
                      ? 'keplr'
                      : 'leapSnap'
                  );
                  await currentWalletConnected?.disconnect();
                  await currentWalletConnecting.connect();
                  setConnectStatus('init');
                  const oraiAddr = await window.Keplr.getKeplrAddr();
                  setOraiAddress(oraiAddr);
                  const { listAddressCosmos } = await getListAddressCosmos(oraiAddr);
                  setCosmosAddress(listAddressCosmos);
                  setCurrentWalletConnected(currentWalletConnecting);
                  setCurrentWalletConnecting(null);
                }}
                type="primary"
              >
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
              <Button onClick={() => setConnectStatus('init')} type="secondary">
                Cancel
              </Button>
              <Button onClick={() => setConnectStatus('confirming-switch')} type="primary">
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
            <div className={styles.switchText}>
              Are you sure you want to disconnect {currentWalletConnected?.walletPrettyName}?
            </div>
            <div className={styles.groupBtns}>
              <Button onClick={() => setConnectStatus('init')} type="secondary">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await currentWalletConnected.disconnect();
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
                    default:
                      break;
                  }
                  setConnectStatus('init');
                }}
                type="primary"
              >
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
      return (
        <div className={styles.networkIcon} key={network.chainName + index}>
          <network.icon />
          {network.name ? <span style={{ marginLeft: '4px' }}>{network.name}</span> : null}
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
