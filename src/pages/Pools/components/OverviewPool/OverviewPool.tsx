import { BTC_CONTRACT, fetchRetry, toDisplay } from '@oraichain/oraidex-common';
import BootsIconDark from 'assets/icons/boost-icon-dark.svg?react';
import BootsIcon from 'assets/icons/boost-icon.svg?react';
import IconCopyAddress from 'assets/icons/ic_copy_address.svg?react';
import SuccessIcon from 'assets/icons/toast_success.svg?react';
import classNames from 'classnames';
import { formatDisplayUsdt, formatNumberKMB } from 'helper/format';
import useConfigReducer from 'hooks/useConfigReducer';
import { useCopyClipboard } from 'hooks/useCopyClipboard';
import useTheme from 'hooks/useTheme';
import { reduceString } from 'libs/utils';
import { useGetPairInfo } from 'pages/Pools/hooks/useGetPairInfo';
import { useEffect, useState } from 'react';
import { PoolDetail } from 'types/pool';
import styles from './OverviewPool.module.scss';
import { DEFAULT_TOKEN_ICON_URL } from 'helper/constants';

export const OverviewPool = ({ poolDetailData }: { poolDetailData: PoolDetail }) => {
  const theme = useTheme();

  const { pairAmountInfoData, lpTokenInfoData } = useGetPairInfo(poolDetailData);
  const { token1, token2 } = poolDetailData;

  const [oraiBtcAllocation, setOraiBtcAllocation] = useState({
    oraiBalanceDisplay: '0',
    btcBalanceDisplay: '0'
  });
  const [isShowMore] = useState(false);
  const isLight = theme === 'light';
  const IconBoots = isLight ? BootsIcon : BootsIconDark;

  const { isCopied, handleCopy, copiedValue } = useCopyClipboard();

  let [BaseTokenIcon, QuoteTokenIcon] = [DEFAULT_TOKEN_ICON_URL, DEFAULT_TOKEN_ICON_URL];
  if (token1) BaseTokenIcon = theme === 'light' ? token1.iconLight || token1.icon : token1.icon;
  if (token2) QuoteTokenIcon = theme === 'light' ? token2.iconLight || token2.icon : token2.icon;

  const aprBoost = Number(poolDetailData.info?.aprBoost || 0).toFixed(2);
  const isApproximatelyZero = Number(aprBoost) === 0;
  const totalApr = poolDetailData.info?.apr ? poolDetailData.info.apr.toFixed(2) : 0;
  const originalApr = Number(totalApr) - Number(aprBoost);
  const [cachedReward] = useConfigReducer('rewardPools');
  let poolReward = {
    reward: []
  };

  const { liquidityAddr: stakingToken } = poolDetailData.info || {};
  if (cachedReward && cachedReward.length > 0) {
    poolReward = cachedReward.find((item) => item.liquidity_token === stakingToken);
  }

  const listBTCAddresses = [
    BTC_CONTRACT,
    'factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/obtc'
  ];

  const [token1Denom, token2Denom] = [
    token1?.contractAddress || token1?.denom,
    token2?.contractAddress || token2?.denom
  ];

  useEffect(() => {
    if (!poolDetailData) return;
    const { token2 } = poolDetailData;
    if (!token2) return;
    async function getOraiBtcAllocation() {
      const res = await fetchRetry(
        'https://lcd.orai.io/cosmos/bank/v1beta1/balances/orai1fv5kwdv4z0gvp75ht378x8cg2j7prlywa0g35qmctez9q8u4xryspn6lrd'
      );
      return await res.json();
    }
    if (listBTCAddresses.includes(token2.denom) || listBTCAddresses.includes(token2.contractAddress)) {
      getOraiBtcAllocation().then((data) => {
        const balances = data.balances;
        const oraiBalance = balances.find((item) => item.denom === 'orai');
        const btcBalance = balances.find(
          (item) => item.denom === 'factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/obtc'
        );
        const oraiBalanceDisplay = formatNumberKMB(toDisplay(oraiBalance?.amount || '0'), false);
        const btcBalanceDisplay = formatNumberKMB(toDisplay(btcBalance?.amount || '0', 14), false);
        setOraiBtcAllocation({
          oraiBalanceDisplay,
          btcBalanceDisplay
        });
      });
    }
  }, [poolDetailData]);

  return (
    <div className={styles.overviewWrapper}>
      <div className={styles.infos}>
        <div className={styles.tvl}>
          <div className={styles.box}>
            <p>Liquidity</p>
            <h1>{formatDisplayUsdt(toDisplay(Math.trunc(poolDetailData?.info?.totalLiquidity || 0).toString()))}</h1>
          </div>
          <div className={styles.box}>
            <p>Volume (24H)</p>
            <h1>
              {Number.isNaN(poolDetailData.info?.volume24Hour || 0)
                ? 0
                : formatDisplayUsdt(toDisplay(poolDetailData.info?.volume24Hour || '0'))}
            </h1>
          </div>
        </div>

        <div className={classNames(styles.box, styles.alloc)}>
          <p>Liquidity Allocation</p>
          {listBTCAddresses.includes(token2.denom) || listBTCAddresses.includes(token2.contractAddress) ? (
            <div className={styles.tokens}>
              <div className={classNames(styles.tokenItem, styles[theme])}>
                <img src={BaseTokenIcon} alt="" />
                <span className={styles.value}>{oraiBtcAllocation.oraiBalanceDisplay}</span>
              </div>
              <div className={classNames(styles.tokenItem, styles[theme])}>
                <img src={QuoteTokenIcon} alt="" />
                <span className={styles.value}>{oraiBtcAllocation.btcBalanceDisplay}</span>
              </div>
            </div>
          ) : (
            <div className={styles.tokens}>
              <div className={classNames(styles.tokenItem, styles[theme])}>
                <span className={styles.value}>
                  {formatNumberKMB(
                    toDisplay(pairAmountInfoData?.token1Amount || '0', token1?.decimals, 0),
                    false,
                    token1?.decimals
                  )}
                </span>
                <img src={BaseTokenIcon} alt="" />

                <span className={styles.denom}>
                  {token1Denom?.length < 13 ? token1Denom : reduceString(token1Denom, 7, 6)}
                </span>
                <div className={styles.copyBtn}>
                  {isCopied && copiedValue === token1Denom ? (
                    <SuccessIcon />
                  ) : (
                    <div onClick={(e) => handleCopy(token1Denom)}>
                      <IconCopyAddress />
                    </div>
                  )}
                </div>
              </div>
              <div className={classNames(styles.tokenItem, styles[theme])}>
                <span className={styles.value}>
                  {formatNumberKMB(
                    toDisplay(pairAmountInfoData?.token2Amount || '0', token2?.decimals, 0),
                    false,
                    token2?.decimals
                  )}
                </span>
                <img src={QuoteTokenIcon} alt="" />
                <span className={styles.denom}>
                  {token2Denom?.length < 13 ? token2Denom : reduceString(token2Denom, 7, 6)}
                </span>
                <div className={styles.copyBtn}>
                  {isCopied && copiedValue === token2Denom ? (
                    <SuccessIcon />
                  ) : (
                    <div onClick={(e) => handleCopy(token2Denom)}>
                      <IconCopyAddress />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={styles.reward}>
        <div className={styles.title}>Reward</div>
        <div className={styles.desc}>
          <div className={styles.item}>
            <span>Swap Fee</span>
            <p>
              {isApproximatelyZero ? '≈ ' : ''}
              {aprBoost}%
            </p>
          </div>
          <div className={styles.item}>
            <span className={styles.label}>
              {poolReward?.reward?.join('+')} Boost&nbsp;
              <IconBoots />
            </span>
            <p>{`${originalApr.toFixed(2)}%`}</p>
          </div>
          <div className={styles.item}>
            <span>Total APR</span>
            <p className={styles.total}>{totalApr}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};
