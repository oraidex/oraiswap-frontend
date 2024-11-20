import { toDisplay } from '@oraichain/oraidex-common';
import Loading from 'assets/gif/loading.gif';
import AddLPIcon from 'assets/icons/addLP_ic.svg?react';
import BootsIconDark from 'assets/icons/boost-icon-dark.svg?react';
import BootsIcon from 'assets/icons/boost-icon.svg?react';
import IconInfo from 'assets/icons/infomationIcon.svg?react';
import classNames from 'classnames';
import { TooltipIcon } from 'components/Tooltip';
import { formatDisplayUsdt, numberWithCommas, parseAssetOnlyDenom } from 'pages/Pools/helpers';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.scss';
import { POOL_TYPE } from 'pages/Pool-V3';

const PoolItemDataMobile = ({
  item,
  theme,
  liquidity,
  volume,
  aprInfo,
  setIsOpenCreatePosition,
  setCurrentPool,
  setPairDenomsDeposit
}) => {
  const navigate = useNavigate();
  const [openTooltip, setOpenTooltip] = useState(false);

  const isLight = theme === 'light';
  const IconBoots = isLight ? BootsIcon : BootsIconDark;
  const {
    FromTokenIcon,
    ToTokenIcon,
    feeTier,
    tokenXinfo,
    tokenYinfo,
    poolKey,
    type,
    url,
    firstAssetInfo,
    secondAssetInfo
  } = item;

  const isInactive = tokenXinfo?.name === 'BTC (Legacy)' || tokenYinfo?.name === 'BTC (Legacy)';

  return (
    <div className={styles.mobilePoolItem}>
      <div className={classNames(styles.itemMobile, styles.flexStart)}>
        <div className={styles.name} onClick={() => navigate(url)}>
          <div className={styles.info}>
            <div className={classNames(styles.icons, styles[theme])}>
              <FromTokenIcon />
              <ToTokenIcon />
            </div>
            <span className={styles.title}>
              {tokenXinfo?.name} / {tokenYinfo?.name}
              <span className={classNames(styles.tag, { [styles.v3]: type === POOL_TYPE.V3 })}>
                {type === POOL_TYPE.V3 ? 'V3' : 'V2'}
              </span>
            </span>
          </div>

          {type === POOL_TYPE.V3 && (
            <div>
              <span className={styles.fee}>Fee: {toDisplay(BigInt(feeTier), 10)}%</span>
            </div>
          )}

          {isInactive && (
            <div>
              <span className={styles.inactive}>Inactive</span>
            </div>
          )}
        </div>
        <div
          title="Add Position"
          className={classNames('newPosition')}
          onClick={(event) => {
            if (type === POOL_TYPE.V3) {
              setIsOpenCreatePosition(true);
              setCurrentPool(item);
            } else {
              event.stopPropagation();
              setPairDenomsDeposit(
                `${parseAssetOnlyDenom(JSON.parse(firstAssetInfo))}_${parseAssetOnlyDenom(JSON.parse(secondAssetInfo))}`
              );
            }
          }}
        >
          <AddLPIcon />
        </div>
      </div>
      <div className={styles.itemMobile}>
        <div className={styles.label}>Liquidity</div>
        <div className={styles.textRight}>
          <span className={classNames(styles.amount, { [styles.loading]: !liquidity })}>
            {liquidity || liquidity === 0 ? (
              formatDisplayUsdt(liquidity)
            ) : (
              <img src={Loading} alt="loading" width={30} height={30} />
            )}
          </span>
        </div>
      </div>

      <div className={styles.itemMobile}>
        <div className={styles.label}>Volume (24H)</div>
        <div className={styles.textRight}>
          <span className={styles.amount}>{formatDisplayUsdt(volume)}</span>
        </div>
      </div>
      <div className={styles.itemMobile}>
        <div className={styles.label}>APR</div>
        <div className={styles.apr}>
          <span className={styles.amount}>
            {aprInfo.apr.min === aprInfo.apr.max
              ? `${numberWithCommas(aprInfo.apr.min * 100, undefined, { maximumFractionDigits: 1 })}`
              : `${numberWithCommas(aprInfo.apr.min * 100, undefined, {
                  maximumFractionDigits: 1
                })} - ${numberWithCommas(aprInfo.apr.max * 100, undefined, { maximumFractionDigits: 1 })}`}
            %
          </span>
          <TooltipIcon
            className={styles.tooltipWrapper}
            placement="top"
            visible={openTooltip}
            icon={<IconInfo />}
            setVisible={setOpenTooltip}
            content={
              <div className={classNames(styles.tooltip, styles[theme])}>
                <div className={styles.itemInfo}>
                  <span>Swap fee</span>
                  <span className={styles.value}>
                    {aprInfo.swapFee.min === aprInfo.swapFee.max
                      ? `${numberWithCommas(aprInfo.swapFee.min * 100, undefined, { maximumFractionDigits: 1 })}`
                      : `${numberWithCommas(aprInfo.swapFee.min * 100, undefined, {
                          maximumFractionDigits: 1
                        })} - ${numberWithCommas(aprInfo.swapFee.max * 100, undefined, {
                          maximumFractionDigits: 1
                        })}`}
                    %
                  </span>
                </div>
                <div className={styles.itemInfo}>
                  <span>
                    Incentives Boost&nbsp;
                    <IconBoots />
                  </span>
                  <span className={styles.value}>
                    {aprInfo.incentivesApr.min === aprInfo.incentivesApr.max
                      ? `${numberWithCommas(aprInfo.incentivesApr.min * 100, undefined, { maximumFractionDigits: 1 })}`
                      : `${numberWithCommas(aprInfo.incentivesApr.min * 100, undefined, {
                          maximumFractionDigits: 1
                        })} - ${numberWithCommas(aprInfo.incentivesApr.max * 100, undefined, {
                          maximumFractionDigits: 1
                        })}`}
                    %
                  </span>
                </div>
                <div className={styles.itemInfo}>
                  <span>Total APR</span>
                  <span className={styles.totalApr}>
                    {aprInfo.apr.min === aprInfo.apr.max
                      ? `${numberWithCommas(aprInfo.apr.min * 100, undefined, { maximumFractionDigits: 1 })}`
                      : `${numberWithCommas(aprInfo.apr.min * 100, undefined, {
                          maximumFractionDigits: 1
                        })} - ${numberWithCommas(aprInfo.apr.max * 100, undefined, { maximumFractionDigits: 1 })}`}
                    %
                  </span>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default PoolItemDataMobile;
