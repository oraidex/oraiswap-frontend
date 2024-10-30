import styles from './Routing.module.scss';

import cn from 'classnames/bind';
import { StepByStep } from './StepByStep';

const cx = cn.bind(styles);
export const RoutingSection: React.FC<{}> = () => {
  return (
    <div className={cx('routings')}>
      <div className={cx('container')}>
        <div className={cx('progresses')}>
          <div className={cx('label')}>Order Routing</div>
          <div className={cx('progress')}>
            <StepByStep />
          </div>
        </div>
        <div className={cx('info-progress')}>
          <div>
            <div className={cx('pool')}>
              <div className={cx('key')}>Oraichain Pool: </div>
              <div className={cx('value')}>139,458.97 ORAI </div>
            </div>
            <div className={cx('pool')}>
              <div className={cx('key')}>Oraichain Poollllll: </div>
              <div className={cx('value')}>875.24 USDT</div>
            </div>
          </div>
          <div className={cx('pool')}>
            <div className={cx('key')}>Tron Network Pool: </div>
            <div className={cx('value')}>1,232.32 USDT</div>
          </div>
        </div>
      </div>
    </div>
  );
};
