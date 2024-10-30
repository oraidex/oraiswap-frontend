import { DEFAULT_SLIPPAGE, OPTIONS_SLIPPAGE } from '@oraichain/oraidex-common';
import CloseIcon from 'assets/icons/close.svg?react';
import IconTooltip from 'assets/icons/icon_tooltip.svg?react';
import WarningIcon from 'assets/icons/warning_icon.svg?react';
import cn from 'classnames/bind';
import useConfigReducer from 'hooks/useConfigReducer';
import { FC, useState } from 'react';
import NumberFormat, { NumberFormatValues } from 'react-number-format';
import { TooltipIcon } from './SettingTooltip';
import styles from './SlippageModal.module.scss';
import ToggleSwitch from 'components/ToggleSwitch';

const cx = cn.bind(styles);

interface ModalProps {
  setUserSlippage: React.Dispatch<React.SetStateAction<number>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  userSlippage: number;
  isBotomSheet?: boolean;
}

export const SlippageModal: FC<ModalProps> = ({ setUserSlippage, setVisible, isBotomSheet, userSlippage }) => {
  const DEFAULT_INFDEX_SLIPPAGE_OPTION = OPTIONS_SLIPPAGE.indexOf(DEFAULT_SLIPPAGE);
  const [indexChosenOption, setIndexChosenOption] = useState(DEFAULT_INFDEX_SLIPPAGE_OPTION);
  const [theme] = useConfigReducer('theme');
  const [manualSlippage, setManualSlippage] = useState<number>();
  const [openTooltip, setOpenTooltip] = useState(false);
  const [isAIRoute, setIsAIRoute] = useConfigReducer('AIRoute');

  return (
    <div className={cx('setting', `${theme}-modal`, { isBotomSheet })}>
      <div className={cx('header')}>
        <div></div>
        <div className={cx('title')}>Settings</div>
        <CloseIcon className={cx('close-icon')} onClick={() => setVisible(false)} />
      </div>

      <div className={cx('ai-smart-route')}>
        <div className={cx('ai-label')}>
          <div className={cx('label')}>Enable AI Smart Route</div>
          <div className={cx('btn-switch')}>
            {/* <ToggleSwitch
              small={true}
              id="toggle-ai-mode"
              checked={isAIRoute}
              onChange={() => {
                setIsAIRoute(!isAIRoute);
              }}
            /> */}
          </div>
        </div>
        <div className={cx('ai-description')}>Use AI to find the best return route for your order</div>
      </div>

      <div className={cx('subtitle')}>
        <div className={cx('label')}>
          Slippage Rate
          <TooltipIcon
            placement="top-start"
            visible={openTooltip}
            icon={<IconTooltip />}
            setVisible={setOpenTooltip}
            content={
              <div className={cx('tooltip', theme)}>
                Set your maximum price slippage. If the price changes beyond this, your transaction may not be
                successful.
              </div>
            }
          />
        </div>
        <div>{userSlippage}%</div>
      </div>
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
            // use prev input as slippage.
            if (manualSlippage) {
              setIndexChosenOption(OPTIONS_SLIPPAGE.length);
              setUserSlippage(manualSlippage);
            }
          }}
        >
          <NumberFormat
            className={cx('input')}
            thousandSeparator
            decimalScale={6}
            placeholder={`Custom`}
            isAllowed={(values) => {
              const { floatValue } = values;
              // allow !floatValue to let user can clear their input
              return !floatValue || (floatValue >= 0 && floatValue <= 100);
            }}
            onValueChange={({ floatValue }: NumberFormatValues) => {
              // if user clear input, change slippage to default config.
              if (floatValue === undefined) {
                setUserSlippage(DEFAULT_SLIPPAGE);
                setIndexChosenOption(DEFAULT_INFDEX_SLIPPAGE_OPTION);
              } else {
                setUserSlippage(floatValue);
                indexChosenOption !== OPTIONS_SLIPPAGE.length && setIndexChosenOption(OPTIONS_SLIPPAGE.length);
              }
              setManualSlippage(floatValue);
            }}
            value={manualSlippage}
          />
          %
        </div>
      </div>

      {!userSlippage && (
        <div className={cx('warning')}>
          <WarningIcon />
          Transaction may fail if configured slippage is 0%
        </div>
      )}
    </div>
  );
};
