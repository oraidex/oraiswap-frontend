import { useState } from 'react';
import NumberFormat from 'react-number-format';
import styles from './index.module.scss';

import { toDisplay } from '@oraichain/oraidex-common';
import { ORAIX_DECIMAL } from 'pages/CoHarvest/constants';
import { numberWithCommas } from 'pages/Pools/helpers';
import { getIconWallet } from 'helper';

export type InputBalanceType = {
  amount: string | number;
  onChangeAmount: any;
  balance: string;
  disable?: boolean;
};

const InputBalance = ({ amount, onChangeAmount, disable = false, balance }: InputBalanceType) => {
  const [coeff, setCoeff] = useState(0);

  return (
    <div className={styles.inputBalance}>
      <div className={styles.title}>
        <span className={styles.bid}>Bid amount</span>
        <span className={styles.bal}>
          {getIconWallet()} <span className={styles.token}>{numberWithCommas(toDisplay(balance))} ORAIX</span>
        </span>
      </div>
      <div className={styles.input}>
        <NumberFormat
          placeholder="0"
          thousandSeparator
          className={styles.amount}
          decimalScale={6}
          disabled={disable}
          type="text"
          value={amount}
          onChange={() => {
            setCoeff(0);
          }}
          isAllowed={(values) => {
            const { floatValue } = values;
            // allow !floatValue to let user can clear their input
            return !floatValue || (floatValue >= 0 && floatValue <= 1e10);
          }}
          onValueChange={({ floatValue }) => {
            onChangeAmount?.(floatValue);
          }}
        />
        <span className={styles.symbol}>ORAIX</span>
      </div>
      <div className={styles.coeff}>
        {[0.25, 0.5, 0.75, 1].map((e) => {
          return (
            <button
              key={e}
              className={`${styles.button} ${coeff === e ? styles.active : ''}`}
              onClick={(event) => {
                event.stopPropagation();
                if (coeff === e) {
                  setCoeff(0);
                  onChangeAmount(0);
                  return;
                }

                onChangeAmount(toDisplay(balance, ORAIX_DECIMAL) * e);
                setCoeff(e);
              }}
            >
              {e * 100}%
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InputBalance;
