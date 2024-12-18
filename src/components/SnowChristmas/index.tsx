import React from 'react';
import styles from './index.module.scss';

const SnowChristmas: React.FC<{ theme: string }> = ({ theme }) => {
  return (
    <div className={styles.snowflakes} aria-hidden="true">
      <div className={styles.snowflake} style={{ fontSize: 30 }}>
        ❅
      </div>
      <div className={styles.snowflake}>❅</div>
      <div className={styles.snowflake} style={{ fontSize: 40 }}>
        ❆
      </div>
      <div className={styles.snowflake}>❅</div>
      <div className={styles.snowflake} style={{ fontSize: 30 }}>
        ❆
      </div>
      <div className={styles.snowflake} style={{ fontSize: 22 }}>
        ❅
      </div>
      <div className={styles.snowflake} style={{ fontSize: 35 }}>
        ❆
      </div>
      <div className={styles.snowflake} style={{ fontSize: 20 }}>
        ❅
      </div>
      <div className={styles.snowflake} style={{ fontSize: 50 }}>
        ❆
      </div>
      <div className={styles.snowflake} style={{ fontSize: 20 }}>
        ❆
      </div>
      <div className={styles.snowflake} style={{ fontSize: 20 }}>
        ❆
      </div>
      <div className={styles.snowflake} style={{ fontSize: 20 }}>
        ❆
      </div>
      <div className={styles.snowflake} style={{ fontSize: 20 }}>
        ❆
      </div>
    </div>
  );
};

export default SnowChristmas;
