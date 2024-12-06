import styles from './index.module.scss';
import ArrowImg from 'assets/icons/arrow_right.svg';

export const TooltipSwapBridge = ({
  type,
  pathChainId,
  TokenInIcon,
  TokenOutIcon,
  NetworkFromIcon,
  NetworkToIcon,
  symbolOut,
  symbolIn
}) => {
  return (
    <div className={styles.tooltipUniversalSwap}>
      <div className={styles.tooltipUniversalSwapType}>{type === 'Swap' ? pathChainId : 'IBC Transfer'}</div>

      <div className={styles.tooltipUniversalSwapRoutes}>
        <div className={styles.tooltipUniversalSwapRoute}>
          <div className={styles.tooltipUniversalSwapRouteImg}>
            <img src={TokenInIcon} alt="" width={40} height={40} />
            <div className={styles.tooltipUniversalSwapRouteImgAbs}>
              <div>
                <img src={NetworkFromIcon} alt="" />
              </div>
            </div>
          </div>
          <div>{symbolIn}</div>
        </div>
        <div>
          <img src={ArrowImg} width={26} height={26} alt="arrow" />
        </div>
        <div className={styles.tooltipUniversalSwapRoute}>
          <div className={styles.tooltipUniversalSwapRouteImg}>
            <img src={TokenOutIcon} alt="" width={40} height={40} />
            <div className={styles.tooltipUniversalSwapRouteImgAbs}>
              <div>{type === 'Swap' ? <img src={NetworkFromIcon} alt="" /> : <img src={NetworkToIcon} alt="" />}</div>
            </div>
          </div>
          <div>{symbolOut}</div>
        </div>
      </div>
    </div>
  );
};
