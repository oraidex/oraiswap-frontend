import OraidexBetaIcon from 'assets/icons/ic_beta.svg?react';
import BridgeIcon from 'assets/icons/ic_bridge.svg?react';
import BtcDashboardIcon from 'assets/icons/ic_btc_dashboard.svg?react';
import CohavestIcon from 'assets/icons/ic_cohavest.svg?react';
import StakingIcon from 'assets/icons/ic_staking.svg?react';
import UniversalSwapIcon from 'assets/icons/ic_universalswap.svg?react';
import LogoDownloadOwalletIcon from 'assets/icons/logo_download.svg?react';
import DownloadOwalletIcon from 'assets/icons/logo_owallet_gateway.svg?react';
import DownloadOwalletIconDark from 'assets/icons/logo_owallet_gateway_dark.svg?react';
import PoolV3Icon from 'assets/icons/pool-v3.svg?react';
import PoolV3Lottie from 'assets/lottie/poolv3-beta.json';
import classNames from 'classnames';
import React, { ReactElement, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.scss';
import useTheme from 'hooks/useTheme';
import { EVENT_CONFIG_THEME } from 'config/eventConfig';
import Lottie from 'lottie-react';
import useTemporaryConfigReducer from 'hooks/useTemporaryConfigReducer';
import ModalDownloadOwallet from 'components/Modals/ModalDownloadOwallet/ModalDownloadOwallet';
import { isMobile } from '@walletconnect/browser-utils';

const Sidebar: React.FC<{}> = React.memo(() => {
  const location = useLocation();
  const [link, setLink] = useState('');
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [isOpenQrCodeOwallet, setIsOpenQrCodeOwallet] = useState(false);

  const [event] = useTemporaryConfigReducer('event');
  const configTheme = EVENT_CONFIG_THEME[theme][event];

  useEffect(() => {
    setLink(location.pathname);
  }, [location]);

  const renderLink = (to: string, title: string, onClick: any, icon: ReactElement, externalLink = false) => {
    if (externalLink)
      return (
        <a
          target={isMobile() ? '_self' : '_blank'}
          href={to}
          className={classNames(styles.menu_item, styles[theme])}
          onClick={() => {
            setOpen(!open);
            onClick(to);
          }}
          rel="noreferrer"
        >
          <div className={classNames(styles.eventItem, styles[event])}>
            {configTheme.sideBar.leftLinkImg && (
              <img className={styles.left} src={configTheme.sideBar.leftLinkImg} alt="" />
            )}
            {configTheme.sideBar.rightLinkImg && (
              <img className={styles.right} src={configTheme.sideBar.rightLinkImg} alt="" />
            )}
          </div>
          {icon}
          <span className={classNames(styles[theme], styles.menu_item_text)}>{title}</span>
        </a>
      );

    const isActive = (link.includes(to) && link?.length === to?.length) || (link === '/' && to === '/universalswap');
    return (
      <Link
        to={to}
        onClick={() => {
          setOpen(!open);
          onClick(to);
        }}
        className={classNames(
          styles.menu_item,
          {
            [styles.active]: isActive
          },
          styles[theme]
        )}
      >
        <div className={classNames(styles.eventItem, styles[event])}>
          {configTheme.sideBar.leftLinkImg && (
            <img className={styles.left} src={configTheme.sideBar.leftLinkImg} alt="" />
          )}
          {configTheme.sideBar.rightLinkImg && (
            <img className={styles.right} src={configTheme.sideBar.rightLinkImg} alt="" />
          )}
        </div>

        {icon}
        <span className={classNames(styles.menu_item_text, { [styles.active]: link === to }, styles[theme])}>
          {title}
          {to === `/bitcoin-dashboard-v2` && (
            <span className={classNames(styles.suffix)}>
              <Lottie animationData={PoolV3Lottie} autoPlay={open} loop />
            </span>
          )}
        </span>
      </Link>
    );
  };

  const isBeta = window.location.host === 'beta.oraidex.io';

  return (
    <>
      <div className={classNames(styles.sidebar, { [styles.open]: open })}>
        <div>
          <div className={classNames(styles.menu_items)}>
            {renderLink('/universalswap', 'Swap', setLink, <UniversalSwapIcon />)}
            {renderLink('/bridge', 'Bridge', setLink, <BridgeIcon />)}
            {renderLink(`/pools`, 'Pools', setLink, <PoolV3Icon />)}
            {renderLink('/staking', 'Staking', setLink, <StakingIcon />)}
            {/* {renderLink('/co-harvest', 'Co-Harvest', setLink, <CohavestIcon />)} */}
            {renderLink('/bitcoin-dashboard-v2', 'BTC V2', setLink, <BtcDashboardIcon />)}

            {!isBeta && renderLink('https://beta.oraidex.io', 'OraiDEX Beta', setLink, <OraidexBetaIcon />, true)}
          </div>
        </div>

        <div className={styles.footerWrapper}>
          {/* <div className={styles.luckyDraw}>
            <LuckyDraw />
          </div> */}
          <div className={styles.wrapperEvent}>
            {configTheme.sideBar.bottomImg && <img className={styles.top} src={configTheme.sideBar.bottomImg} alt="" />}
          </div>
          <div className={styles.menu_footer} onClick={() => setIsOpenQrCodeOwallet(true)}>
            {theme === 'light' ? <DownloadOwalletIcon /> : <DownloadOwalletIconDark />}
            <div className={styles.download}>
              <span>Download</span>
              <LogoDownloadOwalletIcon />
            </div>
          </div>
        </div>
      </div>
      {isOpenQrCodeOwallet && <ModalDownloadOwallet close={() => setIsOpenQrCodeOwallet(false)} />}
    </>
  );
});

export default Sidebar;
