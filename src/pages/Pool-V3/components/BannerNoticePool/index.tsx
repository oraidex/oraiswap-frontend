import CloseIcon from 'assets/icons/close.svg?react';
import HamsterIcon from 'assets/icons/hmstr.svg?react';
import PepeIcon from 'assets/icons/pepe.svg?react';
import DogecoinIcon from 'assets/icons/dogecoin.svg?react';
import UsdcIcon from 'assets/icons/usd_coin.svg?react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './index.module.scss';

import {
  PEPE_ORAICHAIN_EXT_DENOM,
  HMSTR_ORAICHAIN_DENOM,
  USDC_CONTRACT,
  DOGE_BNB_ORAICHAIN_DENOM
} from '@oraichain/oraidex-common';
import useTemporaryConfigReducer from 'hooks/useTemporaryConfigReducer';

const urlPepe = `/pools/v3/${encodeURIComponent(PEPE_ORAICHAIN_EXT_DENOM)}-${encodeURIComponent(
  USDC_CONTRACT
)}-3000000000-100`;

const urlHmstr = `/pools/v3/${encodeURIComponent(HMSTR_ORAICHAIN_DENOM)}-${encodeURIComponent(
  USDC_CONTRACT
)}-3000000000-100`;

const urlDoge = `/pools/v3/${encodeURIComponent(DOGE_BNB_ORAICHAIN_DENOM)}-${encodeURIComponent(
  USDC_CONTRACT
)}-3000000000-100`;

const INTERVAL_TIME = 3000;

const NoticeList = [
  {
    url: urlDoge,
    XIcon: DogecoinIcon,
    YIcon: UsdcIcon,
    Xname: 'DOGE',
    Yname: 'USDC'
  }
];

const BannerNoticePool = () => {
  const [isShowBanner] = useTemporaryConfigReducer('customBanner');
  const [open, setOpen] = useState(!!isShowBanner);
  const [bannerIdx, setBannersIdx] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (NoticeList.length === 1) return;

    const carousel = () => {
      setBannersIdx((bannerIdx) => {
        if (bannerIdx === NoticeList.length - 1) {
          return 0;
        }
        return bannerIdx + 1;
      });
    };

    const interval = setInterval(carousel, INTERVAL_TIME);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (!open) {
    return null;
  }

  const { XIcon, YIcon, Xname, Yname, url } = NoticeList[bannerIdx];

  return (
    <div className={styles.banner}>
      <div className={styles.content} onClick={() => navigate(url)}>
        {/* <div className={styles.logo}>
          <PepeIcon />
          <UsdcIcon />
        </div> */}
        <div className={styles.text}>
          <div className={styles.logo}>
            <XIcon />
            <YIcon />
          </div>
          <span className={styles.txtContent}>
            New Listing Alert:{' '}
            <span className={styles.coin}>
              {Xname}/{Yname}.
            </span>{' '}
            <Link to={url}>Add LP Now!</Link> 🚀
          </span>
        </div>

        {/* 
        <div className="sc-f636c9bb-0 ipvWEv">
          <svg>
            <circle r="9" cx="10" cy="10"></circle>
            <circle r="9" cx="10" cy="10" style={{stroke-dashoffset: 103.385}}></circle>
          </svg>
          <svg
            viewBox="0 0 24 24"
            color="primary"
            width="20px"
            xmlns="http://www.w3.org/2000/svg"
            className="sc-df97f1b-0 egdMRr"
          >
            <path d="M5 13H16.17L11.29 17.88C10.9 18.27 10.9 18.91 11.29 19.3C11.68 19.69 12.31 19.69 12.7 19.3L19.29 12.71C19.68 12.32 19.68 11.69 19.29 11.3L12.71 4.7C12.32 4.31 11.69 4.31 11.3 4.7C10.91 5.09 10.91 5.72 11.3 6.11L16.17 11H5C4.45 11 4 11.45 4 12C4 12.55 4.45 13 5 13Z"></path>
          </svg>
        </div> */}
      </div>

      <div className={styles.close} onClick={() => setOpen(false)}>
        <CloseIcon />
      </div>
    </div>
  );
};

export default BannerNoticePool;
