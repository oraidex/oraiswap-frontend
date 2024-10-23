import { minimize } from 'helper';
import styles from './index.module.scss';
import { TokenItemType } from '@oraichain/oraidex-common';
import { FC } from 'react';
import classNames from 'classnames';
import { numberWithCommas } from 'helper/format';

interface PriceDetailProps {
  leftInput: number;
  rightInput: number;
  currentPrice: number;
  tokenX: TokenItemType;
  tokenY: TokenItemType;
  isXToY: boolean;
}

const PriceDetail: FC<PriceDetailProps> = ({ leftInput, rightInput, currentPrice, tokenX, tokenY, isXToY }) => {
  return (
    <div className={styles.minMaxPriceWrapper}>
      <div className={styles.item}>
        <div className={styles.minMaxPrice}>
          <div className={styles.minMaxPriceTitle}>
            <p>Min Price</p>
          </div>
          <div className={styles.minMaxPriceValue}>
            <p className={styles.amount}>{minimize(leftInput.toString())}</p>
            <p className={styles.pair}>
              {isXToY
                ? `${tokenY.name.toUpperCase()} / ${tokenX.name.toUpperCase()}`
                : `${tokenX.name.toUpperCase()} / ${tokenY.name.toUpperCase()}`}
            </p>
          </div>
        </div>
        <div className={styles.percent}>
          <p>Min Current Price:</p>
          <span className={classNames(styles.value, { [styles.positive]: false })}>
            {(((+leftInput - currentPrice) / currentPrice) * 100).toLocaleString(undefined, {
              maximumFractionDigits: 3
            })}
            %
          </span>
        </div>
      </div>

      <div className={styles.item}>
        <div className={styles.minMaxPrice}>
          <div className={styles.minMaxPriceTitle}>
            <p>Max Price</p>
          </div>
          <div className={styles.minMaxPriceValue}>
            <p className={styles.amount}>{minimize(rightInput.toString())}</p>
            <p className={styles.pair}>
              {isXToY
                ? `${tokenY.name.toUpperCase()} / ${tokenX.name.toUpperCase()}`
                : `${tokenX.name.toUpperCase()} / ${tokenY.name.toUpperCase()}`}
            </p>
          </div>
        </div>
        <div className={classNames(styles.percent, styles.maxCurrentPrice)}>
          <p>Max Current Price:</p>
          <span className={classNames(styles.value, { [styles.positive]: true })}>
            {leftInput !== 0 ? numberWithCommas(((+rightInput - currentPrice) / currentPrice) * 100, undefined, {
              maximumFractionDigits: 3
            }) : '9999999'}
            %
          </span>
        </div>
      </div>
    </div>
  );
};

export default PriceDetail;
