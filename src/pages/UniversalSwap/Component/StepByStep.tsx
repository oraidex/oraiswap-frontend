import cn from 'classnames/bind';
import styles from './StepByStep.module.scss';
import { FC, useState } from 'react';
import OraiIcon from 'assets/icons/oraichain_light.svg';

const cx = cn.bind(styles);

interface ModalProps {}

export const StepByStep: FC<ModalProps> = () => {
  return (
    <div className={cx('stepbystep')}>
      <ul className={cx('stepbar')}>
        <li className={cx('active')}>
          <div>Approve</div>
          <div className={cx('info-step')}>
            <img src={OraiIcon} width={14} height={14} alt="orai" />
            <div className={cx('info-step-balance')}>95 ORAI</div>
          </div>
        </li>
        <li className={cx('next')}>Confirmed</li>
        <li>
          <div>Swap</div>
          <div className={cx('info-step')}>
            <img src={OraiIcon} width={14} height={14} alt="orai" />
            <div className={cx('info-step-balance')}>238.32 USDT</div>
          </div>
        </li>
        <li>Bridge</li>
        <li>
          <div>Completed</div>
          <div className={cx('info-step')}>
            <img src={OraiIcon} width={14} height={14} alt="orai" />
            <div className={cx('info-step-balance')}>238.25 USDT</div>
          </div>
        </li>
      </ul>
    </div>
  );
};
