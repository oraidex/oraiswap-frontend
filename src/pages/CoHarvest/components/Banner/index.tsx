import styles from './index.module.scss';

import DownIcon from 'assets/icons/arrow_down.svg?react';
import CloseBannerIcon from 'assets/icons/close.svg?react';

const BannerHistory = ({
  openBanner,
  setOpenBanner
}: {
  openBanner: boolean;
  setOpenBanner: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  if (!openBanner) return null;

  return (
    <div className={styles.bannerWrapper}>
      <div className={styles.content}>
        <div className={styles.text}>
          📣 &nbsp;NEW ROUND IS NOW OPEN! Please check the previous round history at the bottom of the page.
        </div>
        <a
          className={styles.button}
          href="#history"
          onClick={() => {
            setOpenBanner(false);
          }}
        >
          Go to History
          <div>
            <DownIcon />
          </div>
        </a>
      </div>
      <div className={styles.closeBanner} onClick={() => setOpenBanner(false)}>
        <CloseBannerIcon />
      </div>
    </div>
  );
};

export default BannerHistory;
