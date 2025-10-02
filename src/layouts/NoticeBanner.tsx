import CloseBannerIcon from 'assets/icons/close.svg?react';
import { ReactElement, useEffect, useState } from 'react';
import axios from 'rest/request';
import styles from './NoticeBanner.module.scss';
import useConfigReducer from 'hooks/useConfigReducer';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configure';
import { useGetPools, useGetRewardInfo } from 'pages/Pools/hooks';
import { PoolInfoResponse } from 'types/pool';
import { isEqual } from 'lodash';
import { BTC_CONTRACT } from '@oraichain/oraidex-common';
import { useGetPositions } from 'pages/Pool-V3/hooks/useGetPosition';

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
  // Start: Fetch pool v2 & v3
  // Fetch pool v2
  const lpPools = useSelector((state: RootState) => state.token.lpPools);
  const [address] = useConfigReducer('address');
  const { totalRewardInfoData } = useGetRewardInfo({
    stakerAddr: address
  });
  const isPoolWithLiquidity = (pool: PoolInfoResponse) => {
    const liquidityAddress = pool?.liquidityAddr;
    return parseInt(lpPools[liquidityAddress]?.balance) > 0;
  };

  const findBondAmount = (pool: PoolInfoResponse) => {
    if (!totalRewardInfoData) return 0;
    const rewardInfo = totalRewardInfoData.reward_infos.find(({ staking_token }) =>
      isEqual(staking_token, pool.liquidityAddr)
    );
    return rewardInfo ? parseInt(rewardInfo.bond_amount) : 0;
  };
  const pools = useGetPools();
  const filteredPools = pools.filter((pool) => isPoolWithLiquidity(pool) || findBondAmount(pool) > 0);
  const existPoolLegacyBTCV2 =
    filteredPools.filter(
      (item) => item.secondAssetInfo.includes(BTC_CONTRACT) || item.firstAssetInfo.includes(BTC_CONTRACT)
    ).length > 0;

  // Fetch pool v3
  const { positions } = useGetPositions(address);
  const existPoolLegacyBTCV3 =
    positions.filter(
      (item) => item.pool_key.token_x.includes(BTC_CONTRACT) || item.pool_key.token_y.includes(BTC_CONTRACT)
    ).length > 0;

  const existPoolLegacyBTC = existPoolLegacyBTCV2 || existPoolLegacyBTCV3;

  useEffect(() => {
    if (existPoolLegacyBTC) {
      setBanners([
        {
          attributes: {
            body_message: 'Legacy BTC pool will be removed soon. Please withdraw your lp.',
            updatedAt: new Date().getTime().toString(),
            createdAt: new Date().getTime().toString(),
            headline: 'Notice:',
            media: '',
            publishedAt: new Date().getTime().toString(),
            slider_time: 5
          },
          id: 1
        }
      ]);
    } else {
      setBanners([]);
    }
  }, [existPoolLegacyBTC, address]);

  // End: Fetch pool v2 & v3

  const [bannerIdx, setBannersIdx] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const BASE_URL = import.meta.env.VITE_APP_STRAPI_BASE_URL || 'https://cms.oraidex.io';
  useEffect(() => {
    const fetchBanners = async () => {
      try {
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
          <img src={BASE_URL + bannerInfo.media.data.attributes.url} alt="banner-icon" width="30" height="30" />
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
