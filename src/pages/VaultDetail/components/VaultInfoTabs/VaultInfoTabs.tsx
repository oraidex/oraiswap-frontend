import { useState } from 'react';
import styles from './VaultInfoTabs.module.scss';
import { StrategyExplainedTab } from '../StrategyExplainedTab';
import { PerformanceTab } from '../PerformanceTab';

export type VaultInfoTab = 'performance' | 'strategy_explained';
export const VaultInfoTabs = () => {
  const [tab, setTab] = useState<VaultInfoTab>('performance');

  const generateTabContent = () => {
    return tab === 'performance' ? <PerformanceTab /> : <StrategyExplainedTab />;
  };

  return (
    <div className={styles.vaultInfoTabs}>
      <div className={styles.tabWrapper}>
        <div
          onClick={() => setTab('performance')}
          className={`${styles.tab} ${tab === 'performance' ? styles.active : ''}`}
        >
          Performance
        </div>
        <div
          onClick={() => setTab('strategy_explained')}
          className={`${styles.tab} ${tab === 'strategy_explained' ? styles.active : ''}`}
        >
          Strategy Explained
        </div>
      </div>

      <div className={styles.tabContent}>{generateTabContent()}</div>
    </div>
  );
};
