import CloseBannerIcon from 'assets/icons/close.svg?react';
import { ReactElement, useEffect, useState } from 'react';
import axios from 'rest/request';
import styles from './NoticeBanner.module.scss';

const INTERVAL_TIME = 5000;

export type Banner = {
  attributes: {
    headline: string;
    body_message: string;
    slider_time: number;
    media: any;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    link?: string;
    icon?: ReactElement;
    linkText?: string;
  };
  id: number;
};
export const NoticeBanner = ({
  openBanner,
  setOpenBanner
}: {
  openBanner: boolean;
  setOpenBanner: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [bannerIdx, setBannersIdx] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_APP_STRAPI_BASE_URL || 'https://nice-fireworks-d26703b63e.strapiapp.com';
        const res = await axios.get('api/banners?populate=*', { baseURL: BASE_URL });
        return res.data.data;
      } catch (error) {
        return [];
      }
    };
    fetchBanners().then((banners) => setBanners(banners));
  }, []);

  useEffect(() => {
    if (!banners?.length) {
      setOpenBanner(false);
      return;
    }

    setOpenBanner(true);

    if (banners.length === 1) return;

    const carousel = () => {
      setBannersIdx((bannerIdx) => {
        if (bannerIdx === banners.length - 1) {
          return 0;
        }
        return bannerIdx + 1;
      });
    };

    const interval = setInterval(carousel, INTERVAL_TIME);

    return () => {
      clearInterval(interval);
    };
  }, [banners]);

  if (!openBanner || !banners[bannerIdx]) return <></>;

  const bannerInfo = banners[bannerIdx].attributes;

  return (
    <div className={styles.noticeWrapper}>
      <div className={`${styles.note} ${bannerInfo.headline ? '' : styles.onlyText}`}>
        {bannerInfo.media?.data?.attributes?.url && (
          <img src={bannerInfo.media.data.attributes.url} alt="banner-icon" width="30" height="30" />
        )}
        <div className={`${styles.text}`}>
          {bannerInfo.headline && <span className={styles.title}>{bannerInfo.headline}</span>}
          <span>
            {bannerInfo.body_message && <span>{bannerInfo.body_message} &nbsp;</span>}
            {bannerInfo.link && (
              <a className={styles.link} rel="noreferrer" href={bannerInfo.link || ''} target="_blank">
                {bannerInfo.linkText || 'Click here'}
              </a>
            )}
          </span>
        </div>
      </div>
      <div className={styles.closeBanner} onClick={() => setOpenBanner(false)}>
        <CloseBannerIcon />
      </div>
    </div>
  );
};
