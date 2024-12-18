import { isMobile } from '@walletconnect/browser-utils';
import AddIcon from 'assets/icons/Add-icon-black-only.svg?react';
import CopyIcon from 'assets/icons/copy.svg?react';
import DisconnectIcon from 'assets/icons/ic_logout.svg?react';
import SuccessIcon from 'assets/icons/toast_success.svg?react';
import { Button } from 'components/Button';
import ToggleSwitch from 'components/ToggleSwitch';
import { ThemeContext } from 'context/theme-context';
import {
  cosmosWallets,
  tronWallets,
  evmWallets,
  btcWallets,
  type NetworkType,
  WalletNetwork,
  solanaWallets,
  tonWallets
} from 'components/WalletManagement/walletConfig';
import {
  tronNetworksWithIcon,
  cosmosNetworksWithIcon,
  evmNetworksIconWithoutTron,
  getListAddressCosmos,
  btcNetworksWithIcon,
  solanaNetworksWithIcon,
  tonNetworksWithIcon
} from 'helper';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import { useCopyClipboard } from 'hooks/useCopyClipboard';
import useOnClickOutside from 'hooks/useOnClickOutside';
import useWalletReducer from 'hooks/useWalletReducer';
import { getTotalUsd, reduceString } from 'libs/utils';
import { formatDisplayUsdt } from 'pages/Pools/helpers';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from 'store/configure';
import { ModalDisconnect } from '../ModalDisconnect';
import styles from './MyWallet.module.scss';
import DefaultIcon from 'assets/icons/tokens.svg?react';
import { DisconnectButton } from '../DiconnectButton';

export const MyWallet: React.FC<{
  setIsShowMyWallet: (isShow: boolean) => void;
  isShowMyWallet: boolean;
  isShowChooseWallet: boolean;
  setIsShowChooseWallet: (isShowChooseWallet: boolean) => void;
}> = ({ setIsShowMyWallet, isShowMyWallet, isShowChooseWallet, setIsShowChooseWallet }) => {
  const { theme, setTheme } = useContext(ThemeContext);
  const [oraiAddress] = useConfigReducer('address');
  const [tronAddress] = useConfigReducer('tronAddress');
  const [btcAddress] = useConfigReducer('btcAddress');
  const [solAddress] = useConfigReducer('solAddress');
  const [tonAddress] = useConfigReducer('tonAddress');

  const [metamaskAddress] = useConfigReducer('metamaskAddress');
  const [cosmosAddresses, setCosmosAddress] = useConfigReducer('cosmosAddress');
  const [walletByNetworks] = useWalletReducer('walletsByNetwork');

  const [currentDisconnectingNetwork, setCurrentDisconnectingNetwork] = useState<NetworkType>(null);
  const [isShowDisconnect, setIsShowDisconnect] = useState(false);

  const amounts = useSelector((state: RootState) => state.token.amounts);
  const { data: prices } = useCoinGeckoPrices();
  const totalUsd = getTotalUsd(amounts, prices);
  const { isCopied, copiedValue, handleCopy } = useCopyClipboard();

  useEffect(() => {
    const iframe = document.getElementById('iframe-v3');
    if (iframe) iframe.style.filter = `invert(${theme === 'dark' ? 0 : 100}%)`;
  }, [theme]);

  const myWalletRef = useRef(null);
  useOnClickOutside(myWalletRef, () => {
    // just close when no modal is open
    !isShowChooseWallet && !isShowDisconnect && setIsShowMyWallet(false);
  });

  useEffect(() => {
    (async () => {
      const listAddress = cosmosAddresses ? Object.values(cosmosAddresses).filter((e) => e) : [];
      if (oraiAddress && listAddress.length < cosmosNetworksWithIcon.length) {
        const { listAddressCosmos } = await getListAddressCosmos(oraiAddress, walletByNetworks.cosmos);
        setCosmosAddress(listAddressCosmos);
      }
    })();
  }, []);

  const renderWalletAddress = (
    networkWithIcons: any[],
    walletNetwork: WalletNetwork,
    getChainAddress: (network: any) => string
  ) => {
    return (
      <div className={styles.addressByNetworkItem}>
        {networkWithIcons.map((network, index) => {
          const chainAddress = getChainAddress(network);
          // let NetworkIcon = theme === 'dark' ? network.Icon : network.IconLight;
          let NetworkIcon = network.chainSymbolImageUrl;
          if (!NetworkIcon) NetworkIcon = DefaultIcon;

          return !chainAddress ? null : (
            <div className={styles.addressByChainInNetwork} key={network.chainId}>
              <div className={styles.left}>
                <div className={styles.icon}>
                  <div className={styles.iconChain}>
                    {/* <NetworkIcon width={30} height={30} /> */}
                    <img src={NetworkIcon} width={30} height={30} alt="network-icon" />
                  </div>

                  <div className={styles.iconWalletByChain}>
                    <walletNetwork.icon width={18} height={18} />
                  </div>
                </div>
                <div className={styles.info}>
                  <div className={styles.chainName}>{network.chainName}</div>
                  <div className={styles.chainAddress}>
                    <span>{reduceString(chainAddress, 6, 6)}</span>
                    <div className={styles.copyBtn} onClick={(e) => handleCopy(chainAddress)}>
                      {isCopied && copiedValue === chainAddress ? (
                        <SuccessIcon width={15} height={15} />
                      ) : (
                        <CopyIcon width={15} height={15} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {index === 0 && (
                <DisconnectButton
                  setIsShowDisconnect={setIsShowDisconnect}
                  onSetCurrentDisconnectingNetwork={() => setCurrentDisconnectingNetwork(network.typeChain)}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderCosmosAddresses = () => {
    if (!oraiAddress || !cosmosAddresses) return <></>;
    const cosmosWalletConnected = cosmosWallets.find((item) => item.nameRegistry === walletByNetworks.cosmos);
    if (!cosmosWalletConnected) return <></>;

    const cosmosNetworks = cosmosNetworksWithIcon.map((evm) => ({ ...evm, typeChain: 'cosmos' }));
    return renderWalletAddress(cosmosNetworks, cosmosWalletConnected, (network) => cosmosAddresses?.[network.chainId]);
  };

  const renderEvmAddresses = () => {
    if (!metamaskAddress) return <></>;

    const evmWalletConnected = evmWallets.find((item) => item.nameRegistry === walletByNetworks.evm);
    if (!evmWalletConnected) return <></>;

    const evmNetworks = evmNetworksIconWithoutTron.map((evm) => ({ ...evm, typeChain: 'evm' }));
    return renderWalletAddress(evmNetworks, evmWalletConnected, (_network) => metamaskAddress);
  };

  const renderTronAddresses = () => {
    if (!tronAddress) return <></>;

    const tronWalletConnected = tronWallets.find((item) => item.nameRegistry === walletByNetworks.tron);
    if (!tronWalletConnected) return <></>;

    const tronNetworks = tronNetworksWithIcon.map((evm) => ({ ...evm, typeChain: 'tron' }));
    return renderWalletAddress(tronNetworks, tronWalletConnected, (_network) => tronAddress);
  };

  const renderBtcAddresses = () => {
    if (!btcAddress) return null;
    const btcWalletConnected = btcWallets.find((item) => item.nameRegistry === walletByNetworks.bitcoin);
    if (!btcWalletConnected) return <></>;

    const btcNetworks = btcNetworksWithIcon.map((evm) => ({ ...evm, typeChain: 'bitcoin' }));
    return renderWalletAddress(btcNetworks, btcWalletConnected, (_network) => btcAddress);
  };

  const renderSolAddresses = () => {
    if (!solAddress) return null;
    const solWalletConnected = solanaWallets.find((item) => item.nameRegistry === walletByNetworks.solana);
    if (!solWalletConnected) return <></>;

    const solNetworks = solanaNetworksWithIcon.map((evm) => ({ ...evm, typeChain: 'solana' }));
    return renderWalletAddress(solNetworks, solWalletConnected, (_network) => solAddress);
  };

  const renderTonAddresses = () => {
    if (!tonAddress) return null;
    const tonWalletConnected = tonWallets.find((item) => item.nameRegistry === walletByNetworks.ton);

    if (!tonWalletConnected) return <></>;

    const tonNetworks = tonNetworksWithIcon.map((evm) => ({ ...evm, typeChain: 'ton' }));
    return renderWalletAddress(tonNetworks, tonWalletConnected, (_network) => tonAddress);
  };

  return (
    <div
      ref={myWalletRef}
      className={`${styles.myWallets} ${styles[theme]} ${isShowMyWallet ? styles.open : styles.close}`}
    >
      {isShowDisconnect && (
        <ModalDisconnect
          close={() => setIsShowDisconnect(false)}
          currentDisconnectingNetwork={currentDisconnectingNetwork}
          setCurrentDisconnectingNetwork={setCurrentDisconnectingNetwork}
        />
      )}
      <div className={styles.header}>
        <div className={styles.balance}>
          <h3>My Wallets</h3>
          <div>{formatDisplayUsdt(totalUsd)}</div>
        </div>
        {!isMobile() && (
          <div className={styles.btnAddWallet}>
            <Button
              type="primary"
              onClick={() => {
                setIsShowChooseWallet(true);
              }}
              icon={<AddIcon />}
            >
              Add Wallet
            </Button>
          </div>
        )}
      </div>

      <div className={styles.myWalletsWrapper}>
        <div className={styles.toggle}>
          <div className={styles.toggleMode}>
            <div className={styles.toggleModeIcon}>
              <span className={styles.text}>Dark mode</span>
            </div>
            <ToggleSwitch
              small={true}
              id="toggle-mode"
              checked={theme === 'dark'}
              onChange={() => {
                setTheme(theme === 'dark' ? 'light' : 'dark');
              }}
            />
          </div>
        </div>
        <div className={styles.listAddressByNetwork}>
          {renderCosmosAddresses()}
          {renderEvmAddresses()}
          {renderTronAddresses()}
          {renderBtcAddresses()}
          {renderSolAddresses()}
          {renderTonAddresses()}
        </div>
      </div>
    </div>
  );
};
