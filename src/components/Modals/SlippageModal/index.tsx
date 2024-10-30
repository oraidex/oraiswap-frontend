import CloseIcon from 'assets/icons/close.svg?react';
import TransSetting from 'assets/images/trans_setting.svg?react';
import cn from 'classnames/bind';
import { DEFAULT_MANUAL_SLIPPAGE, DEFAULT_SLIPPAGE, OPTIONS_SLIPPAGE } from '@oraichain/oraidex-common';
import { FC, useState } from 'react';
import NumberFormat, { NumberFormatValues } from 'react-number-format';
import styles from './SlippageModal.module.scss';
import useConfigReducer from 'hooks/useConfigReducer';

const cx = cn.bind(styles);

interface ModalProps {
  setUserSlippage: React.Dispatch<React.SetStateAction<number>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const SlippageModal: FC<ModalProps> = ({ setUserSlippage, setVisible }) => {
  const [indexChosenOption, setIndexChosenOption] = useState(OPTIONS_SLIPPAGE.indexOf(DEFAULT_SLIPPAGE));
  const [manualSlippage, setManualSlippage] = useState(DEFAULT_MANUAL_SLIPPAGE);
  const [theme] = useConfigReducer('theme');

  return (
    <div className={cx('setting', `${theme}-modal`)}>
      <div className={cx('header')}>
        <div className={cx('title')}>
          <img className={cx('btn')} src={TransSetting} alt="btn" />
          <div>Transaction settings</div>
        </div>
        <CloseIcon className={cx('close-icon')} onClick={() => setVisible(false)} />
      </div>
      <div className={cx('subtitle')}>Slippage tolerance</div>
      <div className={cx('options')}>
        {OPTIONS_SLIPPAGE.map((option, idx) => (
          <div
            className={cx('item', {
              isChosen: indexChosenOption === idx
            })}
            key={idx}
            onClick={() => {
              setUserSlippage(option);
              setIndexChosenOption(idx);
            }}
          >
            {option}%
          </div>
        ))}
        <div
          className={cx('item', 'border', {
            isChosen: indexChosenOption === OPTIONS_SLIPPAGE.length
          })}
          onClick={() => {
            setUserSlippage(manualSlippage ?? 0);
            setIndexChosenOption(OPTIONS_SLIPPAGE.length);
          }}
        >
          <NumberFormat
            className={cx('input')}
            thousandSeparator
            decimalScale={6}
            type="text"
            onValueChange={({ floatValue }: NumberFormatValues) => {
              setManualSlippage(floatValue ?? 0);
              setUserSlippage(floatValue ?? 0);
            }}
            value={manualSlippage}
          />
          %
        </div>
      </div>
    </div>
  );
};

export default SlippageModal;
