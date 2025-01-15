import CloseIcon from 'assets/icons/close.svg?react';
import { ComponentType, FC, useState } from 'react';
import ReactModal from 'react-modal';
import styles from './Modal.module.scss';
import useTheme from 'hooks/useTheme';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const ModalSafeForReact18 = ReactModal as ComponentType<ReactModal['props']>;

ReactModal.setAppElement('#oraiswap');

const Modal: FC<Modal> = ({ className, isOpen, close, children, isCloseBtn = false }) => {
  const theme = useTheme();
  
  return (
    <ModalSafeForReact18
      className={`${styles.modal} ${className || ''}`}
      overlayClassName={`${styles.overlay} ${className || ''}`}
      preventScroll
      htmlOpenClassName={styles.open}
      isOpen={isOpen}
      onRequestClose={close}
    >
      {isCloseBtn && (
        <div className={styles.close}>
          <span className={cx('close-icon', theme)} onClick={close}>
            <CloseIcon width={20} height={20} />
          </span>
        </div>
      )}
      {children}
    </ModalSafeForReact18>
  );
}

export default Modal;

/* modal */
export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
};
