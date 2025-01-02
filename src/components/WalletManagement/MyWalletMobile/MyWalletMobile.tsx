import { isMobile } from '@walletconnect/browser-utils';
import AddIcon from 'assets/icons/Add-icon-black-only.svg?react';
import CopyIcon from 'assets/icons/copy.svg?react';
import SuccessIcon from 'assets/icons/toast_success.svg?react';
import DefaultIcon from 'assets/icons/tokens.svg?react';
import { Button } from 'components/Button';
import ToggleSwitch from 'components/ToggleSwitch';
import { type NetworkType } from 'components/WalletManagement/walletConfig';
import { ThemeContext } from 'context/theme-context';
import copy from 'copy-to-clipboard';
import {
  btcNetworksWithIcon,
  cosmosNetworksWithIcon,
  evmNetworksIconWithoutTron,
  solanaNetworksWithIcon,
  tronNetworksWithIcon
} from 'helper';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import useOnClickOutside from 'hooks/useOnClickOutside';
import { getTotalUsd, reduceString } from 'libs/utils';
import { formatDisplayUsdt } from 'pages/Pools/helpers';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from 'store/configure';
import { ModalDisconnect } from '../ModalDisconnect';
import styles from './MyWalletMobile.module.scss';
import { OraiIcon } from '@oraichain/oraidex-common';

export const MyWalletMobile: React.FC<{
  setIsShowMyWallet: (isShow: boolean) => void;
  isShowMyWallet: boolean;
  isShowChooseWallet: boolean;
  setIsShowChooseWallet: (isShowChooseWallet: boolean) => void;
}> = ({ setIsShowMyWallet, isShowMyWallet, isShowChooseWallet, setIsShowChooseWallet }) => {
  const { theme, setTheme } = useContext(ThemeContext);
  const [oraiAddress] = useConfigReducer('address');
  const [tronAddress] = useConfigReducer('tronAddress');
  const [metamaskAddress] = useConfigReducer('metamaskAddress');
  const [cosmosAddresses] = useConfigReducer('cosmosAddress');
  const [btcAddress] = useConfigReducer('btcAddress');
  const [solAddress] = useConfigReducer('solAddress');

  const [currentDisconnectingNetwork, setCurrentDisconnectingNetwork] = useState<NetworkType>(null);
  const [isShowDisconnect, setIsShowDisconnect] = useState(false);

  const amounts = useSelector((state: RootState) => state.token.amounts);
  const { data: prices } = useCoinGeckoPrices();
  const totalUsd = getTotalUsd(amounts, prices);

  const [copiedValue, setCopiedAddressCoordinates] = useState('');
  const [timeoutCopyId, setTimeoutCopyId] = useState<number>(0);

  const myWalletRef = useRef(null);
  useOnClickOutside(myWalletRef, () => {
    // just close when no modal is open
    !isShowChooseWallet && !isShowDisconnect && setIsShowMyWallet(false);
  });

  useEffect(() => {
    if (copiedValue) {
      const TIMEOUT_COPY = 2000;
      const timeoutId = setTimeout(() => {
        setCopiedAddressCoordinates('');
      }, TIMEOUT_COPY);

      setTimeoutCopyId(Number(timeoutId));
      return () => clearTimeout(timeoutId);
    }
  }, [copiedValue]);

  const copyWalletAddress = (e, address: string) => {
    timeoutCopyId && clearTimeout(timeoutCopyId);
    if (address) {
      e.stopPropagation();
      copy(address);

      setCopiedAddressCoordinates(address);
    }
  };

  const renderCosmosAddresses = () => {
    if (!oraiAddress) return <></>;

    return (
      <div className={styles.addressByNetworkItem}>
        {cosmosNetworksWithIcon.map((network) => {
          const chainAddress = cosmosAddresses?.[network.chainId];
          let NetworkIcon = theme === 'dark' ? network.chainSymbolImageUrl : network.chainSymbolImageUrl;
          if (!NetworkIcon) NetworkIcon = OraiIcon;

          return !chainAddress ? null : (
            <div className={styles.addressByChainInNetwork} key={network.chainId}>
              <div className={styles.left}>
                <div className={styles.icon}>
                  <div className={styles.iconChain}>
                    <img src={NetworkIcon} width={30} height={30} />
                  </div>
                </div>
                <div className={styles.info}>
                  <div className={styles.chainName}>{network.chainName}</div>
                  <div className={styles.chainAddress}>
                    <span>{reduceString(chainAddress, 6, 6)}</span>
                    <div className={styles.copyBtn} onClick={(e) => copyWalletAddress(e, chainAddress)}>
                      {copiedValue === chainAddress ? (
                        <SuccessIcon width={15} height={15} />
                      ) : (
                        <CopyIcon width={15} height={15} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderEvmAddresses = () => {
    if (!metamaskAddress) return <></>;
    return (
      <div className={styles.addressByNetworkItem}>
        {evmNetworksIconWithoutTron.map((network, index) => {
          const chainAddress = metamaskAddress;
          let NetworkIcon = theme === 'dark' ? network.chainSymbolImageUrl : network.chainSymbolImageUrl;
          if (!NetworkIcon) NetworkIcon = OraiIcon;
          return (
            <div className={styles.addressByChainInNetwork} key={network.chainId}>
              <div className={styles.left}>
                <div className={styles.icon}>
                  <div className={styles.iconChain}>
                    <img src={NetworkIcon} width={30} height={30} />
                  </div>
                </div>
                <div className={styles.info}>
                  <div className={styles.chainName}>{network.chainName}</div>
                  <div className={styles.chainAddress}>
                    <span>{reduceString(chainAddress, 6, 6)}</span>
                    <div className={styles.copyBtn} onClick={(e) => copyWalletAddress(e, chainAddress)}>
                      {copiedValue === chainAddress ? (
                        <SuccessIcon width={15} height={15} />
                      ) : (
                        <CopyIcon width={15} height={15} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTronAddresses = () => {
    if (!tronAddress) return <></>;

    return (
      <div className={styles.addressByNetworkItem}>
        {tronNetworksWithIcon.map((network) => {
          let NetworkIcon = theme === 'dark' ? network.chainSymbolImageUrl : network.chainSymbolImageUrl;
          if (!NetworkIcon) NetworkIcon = DefaultIcon;
          return (
            <div key={network.chainId} className={styles.addressByChainInNetwork}>
              <div className={styles.left}>
                <div className={styles.icon}>
                  <div className={styles.iconChain}>
                    <img src={NetworkIcon} width={30} height={30} alt="network-icon" />
                  </div>
                </div>
                <div className={styles.info}>
                  <div className={styles.chainName}>{network.chainName}</div>
                  <div className={styles.chainAddress}>
                    <span>{reduceString(tronAddress, 6, 6)}</span>
                    <div className={styles.copyBtn} onClick={(e) => copyWalletAddress(e, tronAddress)}>
                      {copiedValue === tronAddress ? (
                        <SuccessIcon width={15} height={15} />
                      ) : (
                        <CopyIcon width={15} height={15} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  const renderBtcAddresses = () => {
    if (!btcAddress) return <></>;

    return (
      <div className={styles.addressByNetworkItem}>
        {btcNetworksWithIcon.map((network) => {
          let NetworkIcon = theme === 'dark' ? network.chainSymbolImageUrl : network.chainSymbolImageUrl;
          if (!NetworkIcon) NetworkIcon = DefaultIcon;
          return (
            <div key={network.chainId} className={styles.addressByChainInNetwork}>
              <div className={styles.left}>
                <div className={styles.icon}>
                  <div className={styles.iconChain}>
                    <img src={NetworkIcon} width={30} height={30} alt="network-icon" />
                  </div>
                </div>
                <div className={styles.info}>
                  <div className={styles.chainName}>{network.chainName}</div>
                  <div className={styles.chainAddress}>
                    <span>{reduceString(btcAddress, 6, 6)}</span>
                    <div className={styles.copyBtn} onClick={(e) => copyWalletAddress(e, btcAddress)}>
                      {copiedValue === btcAddress ? (
                        <SuccessIcon width={15} height={15} />
                      ) : (
                        <CopyIcon width={15} height={15} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSolAddresses = () => {
    if (!solAddress) return <></>;

    return (
      <div className={styles.addressByNetworkItem}>
        {solanaNetworksWithIcon.map((network) => {
          let NetworkIcon = theme === 'dark' ? network.chainSymbolImageUrl : network.chainSymbolImageUrl;
          if (!NetworkIcon) NetworkIcon = DefaultIcon;
          return (
            <div key={network.chainId} className={styles.addressByChainInNetwork}>
              <div className={styles.left}>
                <div className={styles.icon}>
                  <div className={styles.iconChain}>
                    <img src={NetworkIcon} width={30} height={30} alt="network-icon" />
                  </div>
                </div>
                <div className={styles.info}>
                  <div className={styles.chainName}>{network.chainName}</div>
                  <div className={styles.chainAddress}>
                    <span>{reduceString(solAddress, 6, 6)}</span>
                    <div className={styles.copyBtn} onClick={(e) => copyWalletAddress(e, solAddress)}>
                      {copiedValue === solAddress ? (
                        <SuccessIcon width={15} height={15} />
                      ) : (
                        <CopyIcon width={15} height={15} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
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
          {renderSolAddresses()}
          {renderEvmAddresses()}
          {renderTronAddresses()}
          {renderBtcAddresses()}
        </div>
      </div>
    </div>
  );
};
