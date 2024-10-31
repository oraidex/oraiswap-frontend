import CloseIcon from 'assets/icons/close.svg?react';
import { ComponentType, FC, useState } from 'react';
import ReactModal from 'react-modal';
import styles from './Modal.module.scss';

const ModalSafeForReact18 = ReactModal as ComponentType<ReactModal['props']>;

ReactModal.setAppElement('#oraiswap');

const Modal: FC<Modal> = ({ className, isOpen, close, children, isCloseBtn = false }) => (
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
        <span onClick={close}>
          <CloseIcon color={'#ffffff'} width={20} height={20} />
        </span>
      </div>
    )}
    {children}
  </ModalSafeForReact18>
);

export default Modal;

/* modal */
export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
};
