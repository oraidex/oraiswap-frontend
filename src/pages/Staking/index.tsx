import { isMobile } from '@walletconnect/browser-utils';
import styles from './index.module.scss';
import Header from './components/Header';
import StakeInfo from './components/StakeInfo';
import StakingForm from './components/StakingForm';
import Summary from './components/Summary';
import FAQ from './components/FAQ';

const StakingPage = () => {
  const mobileMode = isMobile();

  return (
    <div className={styles.container}>
      {!mobileMode ? (
        <div className={styles.staking}>
          <Header />
          <div className={styles.contentWrapper}>
            <div className={styles.action}>
              <StakeInfo />
              <StakingForm />
              <FAQ />
            </div>

            <div className={styles.info}>
              <Summary />
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.staking}>
          <Header />
          <div className={styles.contentWrapper}>
            <StakeInfo />
            <StakingForm />
            <Summary />
            <FAQ />
          </div>
        </div>
      )}
    </div>
  );
};

export default StakingPage;
