import classNames from 'classnames';
import CloseIcon from 'assets/icons/close.svg?react';
import styles from './index.module.scss';
import { Button } from 'components/Button';

const SlippageSetting = ({ isOpen, setIsOpen, slippage, setSlippage }) => {
  return (
    <div className={classNames(styles.contentWrapper, { [styles.active]: isOpen })}>
      <div
        className={classNames(styles.overlay, { [styles.active]: isOpen })}
        onClick={() => {
          setIsOpen(false);
        }}
      ></div>
      <div className={styles.modal}>
        <div className={styles.close} onClick={() => setIsOpen(false)}>
          <CloseIcon />
        </div>
        <span className={styles.title}>Position Transaction Settings</span>
        <div className={styles.content}>
          <h2>Slippage tolerance:</h2>
          <div className={styles.input}>
            <input type="number" value={slippage} onChange={(e) => setSlippage(e.target.value)} />
            <Button type="primary-sm" onClick={() => setSlippage(1)}>
              Auto
            </Button>
          </div>

          <span className={styles.desc}>
            Slippage tolerance is a pricing difference between the price at the confirmation time and the actual price
            of the transaction users are willing to accept when initializing position.
          </span>
        </div>
      </div>
    </div>
  );
};

export default SlippageSetting;
