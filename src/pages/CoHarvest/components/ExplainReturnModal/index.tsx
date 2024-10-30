import styles from './index.module.scss';
import OraiXIcon from 'assets/icons/oraix.svg?react';
import OraiXLightIcon from 'assets/icons/oraix_light.svg?react';
import UsdcIcon from 'assets/icons/usd_coin.svg?react';
import DistributionStartLottie from 'assets/lottie/distribution_RENDER.json';
import DistributionStartLottieDark from 'assets/lottie/distribution_RENDER_dark.json';
import useConfigReducer from 'hooks/useConfigReducer';
import useOnClickOutside from 'hooks/useOnClickOutside';
import Lottie from 'lottie-react';
import { useRef } from 'react';

const ExplainReturnModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [theme] = useConfigReducer('theme');

  const ref = useRef(null);

  useOnClickOutside(ref, () => {
    onClose();
  });

  if (!open) {
    return null;
  }

  return (
    <div className={styles.explainModal} ref={ref}>
      <div className={styles.overlay} onClick={onClose}></div>
      <div className={styles.explainContentWrapper}>
        <div className={styles.title}>How are my returns calculated?</div>

        <div className={styles.content}>
          <div className={styles.distribution}>
            <div className={styles.lottieWrapper}>
              {/* <img src={distributionStartImg} alt="distributionStartImg" /> */}
              <Lottie
                animationData={theme === 'light' ? DistributionStartLottie : DistributionStartLottieDark}
                autoPlay={open}
                loop
              />
              {/* <div>Higher bonus, Harder to win</div> */}
            </div>

            <div className={styles.desc}>
              <span>Total Rewards will be distributed at the end of the round. Starting from Pool 1% to Pool 25%.</span>
              <span>
                At the end of the round, your returns will be automatically provided in USDC at the prevailing price (0%
                slippage). In certain cases, you may receive a partial or full refund of your bid in ORAIX.
              </span>
              <div className={styles.formula}>
                <div className={styles.accumulateWrapper}>
                  <div className={styles.acc}>Your Returning Received</div>
                  <span>=</span>
                </div>
                <div className={styles.elementWrapper}>
                  <div className={styles.element}>
                    <UsdcIcon width={16} height={16} />
                    <span>Rewards with Bonus</span>
                  </div>
                  <div>+</div>
                  <div className={styles.element}>
                    {theme === 'light' ? (
                      <OraiXLightIcon width={16} height={16} />
                    ) : (
                      <OraiXIcon width={16} height={16} />
                    )}
                    <span>Refund</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.hint}>
            💡 Bid confidently, as there's nothing to lose on the road to bountiful earnings!
          </div>
          <div className={styles.summaryWrapper}>
            <div className={styles.summary}>
              <div className={styles.summaryTitle}>How it calculated:</div>
              <span>
                <i>{'Rewards_with_Bonus = ORAIXPrice_At_RoundEnded * TotalBidded_on_Pool_InORAIX * ('}</i>100
                <i>{' + Bonus)% * YourPortion_on_Pool% * N'}</i>
              </span>
              <span>
                <i>{'Refund = YourBidAmount_on_Pool_InORAIX * ('}</i>1<i>{' - N)'}</i>
              </span>
              <span>
                <i>N</i> is your win ratio. The value of <i>N</i> will vary depending on the following three cases:
              </span>
            </div>
            <div className={styles.case}>
              <div className={styles.highlight}>Case 1 - Get big returns</div>
              <div className={styles.caseTitle}>
                <span>Fully accepted Pool</span>
                <span className={styles.note}>(Total Rewards fully distributed with bonus)</span>
              </div>
              <div className={styles.caseContent}>
                <i>N</i>
                {' = 1 '}
                <i>&rArr; Refund = 0</i>
              </div>
            </div>
            <div className={styles.case}>
              <div className={styles.highlight}>Case 2 - Refund all your ORAIX</div>
              <div className={styles.caseTitle}>
                <span>Not accepted Pool</span>
                <span className={styles.note}>(Total Rewards fully distributed with bonus)</span>
              </div>
              <div className={styles.caseContent}>
                <i>N</i>
                {' = 0 '}
                <i>&rArr; Refund = YourBidAmount_on_Pool_InORAIX</i>
              </div>
            </div>
            <div className={styles.case}>
              <div className={styles.highlight}>Case 3 - Get very small returns</div>
              <div className={styles.caseTitle}>
                <span>Partial accepted Pool</span>
                <span className={styles.note}>(Partial distribution of Total Rewards with bonus)</span>
              </div>
              <div className={styles.caseContent}>
                <i>N = Left_TotalRewards / TotalBiddedValue_on_Pool</i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplainReturnModal;
