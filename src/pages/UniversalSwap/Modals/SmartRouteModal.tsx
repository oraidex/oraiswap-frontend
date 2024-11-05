import CloseIcon from 'assets/icons/close.svg?react';
import cn from 'classnames/bind';
import useConfigReducer from 'hooks/useConfigReducer';
import { FC } from 'react';
import styles from './SmartRouteModal.module.scss';

const cx = cn.bind(styles);

interface ModalProps {
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setIndSmartRoute: React.Dispatch<React.SetStateAction<Array<number>>>;
  isBotomSheet?: boolean;
  children?: React.ReactElement;
}

export const SmartRouteModal: FC<ModalProps> = ({ setVisible, isBotomSheet, children, setIndSmartRoute }) => {
  const [theme] = useConfigReducer('theme');
  return (
    <div className={cx('tooltip-smart-route', `${theme}-modal`, { isBotomSheet })}>
      <div className={cx('header')}>
        <div className={cx('title')}>Smart Routes</div>
        <CloseIcon
          className={cx('close-icon')}
          onClick={() => {
            setVisible(false);
            setIndSmartRoute([0, 0]);
          }}
        />
      </div>
      <div>{children}</div>
    </div>
  );
};
