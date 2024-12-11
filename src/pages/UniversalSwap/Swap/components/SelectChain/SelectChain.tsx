import IconoirCancel from 'assets/icons/iconoir_cancel.svg?react';
import NetworkImg from 'assets/icons/network.svg';
import cn from 'classnames/bind';
import { tokenMap } from 'config/bridgeTokens';
import { chainIcons } from 'config/chainInfos';
import { Themes } from 'context/theme-context';
import { networks } from 'helper';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import { getTotalUsd } from 'libs/utils';
import { isMaintainBridge } from 'pages/Balance';
import { formatDisplayUsdt } from 'pages/Pools/helpers';
import DefaultIcon from 'assets/icons/tokens.svg?react';
import styles from './SelectChain.module.scss';

const cx = cn.bind(styles);
interface InputSwapProps {
  isSelectToken: boolean;
  selectChain: string;
  setSelectChain?: any;
  setIsSelectToken?: React.Dispatch<React.SetStateAction<boolean>>;
  amounts: AmountDetails;
  theme: Themes;
  prices: CoinGeckoPrices<string>;
  filterChainId?: string[];
}

export default function SelectChain({
  isSelectToken,
  setIsSelectToken,
  setSelectChain,
  amounts,
  prices,
  theme,
  filterChainId = []
}: InputSwapProps) {
  // const isAllowChainId = (chainId) => ['kawaii_6886-1', 'bitcoin', 'noble-1', 'Neutaro-1'].includes(chainId);
  const isAllowChainId = (chainId) => ['kawaii_6886-1', 'bitcoin'].includes(chainId);
  const totalUsd = networks.reduce((acc, cur) => {
    if (isAllowChainId(cur.chainId)) return acc;
    const subAmounts = Object.fromEntries(
      Object.entries(amounts).filter(([denom]) => tokenMap[denom] && tokenMap[denom].chainId === cur.chainId)
    );
    const totalUsd = getTotalUsd(subAmounts, prices);
    return acc + totalUsd;
  }, 0);

  const listChains = [...networks]
    .filter((net) => !isAllowChainId(net.chainId) && (!filterChainId.length || filterChainId.includes(net.chainId)))
    .filter((n) => !isMaintainBridge || (isMaintainBridge && n.networkType === 'cosmos' && n.chainId !== 'noble-1'));

  return (
    <>
      {/* <div className={cx('selectChainWrap', isSelectToken ? 'active' : '')}> */}
      {/* {isSelectToken && <div className={styles.selectChainOverlay} onClick={() => setIsSelectToken(false)}></div>} */}
      <div className={`${styles.selectChain} ${isSelectToken ? styles.active : ''}`}>
        <div className={styles.selectChainHeader}>
          <div />
          <div className={styles.selectChainHeaderTitle}>Select network</div>
          <div className={styles.selectChainHeaderClose} onClick={() => setIsSelectToken(false)}>
            <IconoirCancel />
          </div>
        </div>

        <div className={styles.selectChainItemAll}>
          <div className={styles.selectChainItemLeft}>
            <img className={styles.selectChainItemLogo} src={NetworkImg} alt="network" />
            <div className={styles.selectChainItemTitle}>
              <div>{'All networks'}</div>
            </div>
          </div>
          <div className={styles.selectChainItemValue}>{formatDisplayUsdt(totalUsd)}</div>
        </div>

        <div className={styles.selectChainList}>
          <div className={styles.selectChainItems}>
            {listChains
              .map((n) => {
                const subAmounts = Object.fromEntries(
                  Object.entries(amounts).filter(([denom]) => tokenMap[denom] && tokenMap[denom].chainId === n.chainId)
                );
                const totalUsd = getTotalUsd(subAmounts, prices);

                return {
                  ...n,
                  totalUsd
                };
              })
              .sort((a, b) => Number(b.totalUsd || 0) - Number(a.totalUsd || 0))
              .map((item) => {
                let networkIcon = chainIcons.find((chainIcon) => chainIcon.chainId === item.chainId);
                if (!networkIcon) {
                  networkIcon = {
                    ...item,
                    Icon: DefaultIcon,
                    IconLight: DefaultIcon
                  };
                }
                const key = item.chainId.toString();
                const title = item.chainName;
                const balance = '$' + (item.totalUsd > 0 ? item.totalUsd.toFixed(2) : '0');
                return (
                  <div
                    key={key}
                    className={styles.selectChainItem}
                    onClick={() => {
                      setSelectChain(item.chainId);
                      setIsSelectToken(false);
                    }}
                  >
                    <div className={styles.selectChainItemLeft}>
                      {theme === 'light' ? (
                        <networkIcon.IconLight className={styles.selectChainItemLogo} />
                      ) : (
                        <networkIcon.Icon className={styles.selectChainItemLogo} />
                      )}
                      <div className={styles.selectChainItemTitle}>
                        <div>{title}</div>
                      </div>
                    </div>
                    <div className={styles.selectChainItemValue}>{balance}</div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
      {/* </div> */}
    </>
  );
}
