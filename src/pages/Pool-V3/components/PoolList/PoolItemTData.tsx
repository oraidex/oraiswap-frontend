import { toDisplay } from '@oraichain/oraidex-common';
import Loading from 'assets/gif/loading.gif';
import BootsIconDark from 'assets/icons/boost-icon-dark.svg?react';
import BootsIcon from 'assets/icons/boost-icon.svg?react';
import IconInfo from 'assets/icons/infomationIcon.svg?react';
import classNames from 'classnames';
import { Button } from 'components/Button';
import { TooltipIcon } from 'components/Tooltip';
import { formatDisplayUsdt, numberWithCommas, parseAssetOnlyDenom } from 'pages/Pools/helpers';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.scss';
import { POOL_TYPE } from 'pages/Pool-V3';

const PoolItemTData = ({
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
    totalLiquidity: liquidityV2,
    volume24Hour: volumeV2,
    firstAssetInfo,
    secondAssetInfo
  } = item;
  const isInactive = tokenXinfo?.name === 'BTC (Legacy)' || tokenYinfo?.name === 'BTC (Legacy)';

  return (
    <>
      <td>
        <div className={styles.name} onClick={() => navigate(url)}>
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
      </td>
      <td className={styles.textRight}>
        <span className={classNames(styles.amount, { [styles.loading]: !liquidity })}>
          {liquidity || liquidity === 0 ? (
            formatDisplayUsdt(liquidity)
          ) : (
            <img src={Loading} alt="loading" width={30} height={30} />
          )}
        </span>
      </td>
      <td className={styles.textRight}>
        <span className={styles.amount}>{formatDisplayUsdt(volume)}</span>
      </td>
      <td>
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
      </td>

      <td className={styles.actions}>
        <Button
          className="newPosition"
          type="third-sm"
          disabled={isInactive}
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
          {/* {type === POOL_TYPE.V3 ? 'Add Position' : 'Add LP'} */}
          Add LP
        </Button>
      </td>
    </>
  );
};

export default PoolItemTData;
