import { isMobile } from '@walletconnect/browser-utils';
import CloseIcon from 'assets/icons/close-icon.svg?react';
import InfoIcon from 'assets/icons/toast_info.svg?react';
import { Button } from 'components/Button';
import Loader from 'components/Loader';
import useOnClickOutside from 'hooks/useOnClickOutside';
import { FunctionComponent, ReactNode, useRef } from 'react';
import styles from './index.module.scss';

export type ModalConfirmProps = {
  showLoading?: boolean;
  loading: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onConfirm: () => void;
  confirmBtnText?: string;
  content?: ReactNode;
  title?: string;
  width?: number;
  showIcon?: boolean;
  Icon?: FunctionComponent;
};

const ModalConfirm = ({
  showLoading = true,
  loading,
  open,
  onClose,
  onOpen,
  confirmBtnText = 'Confirm',
  content,
  title,
  width,
  onConfirm,
  showIcon = true,
  Icon = InfoIcon
}: ModalConfirmProps) => {
  const ref = useRef(null);
  const mobileMode = isMobile();

  useOnClickOutside(ref, () => {
    onClose();
  });

  const btnCancelType = mobileMode ? 'third-sm' : 'third';
  const btnConfirmType = mobileMode ? 'primary-sm' : 'primary';

  if (!open) {
    return null;
  }

  return (
    <div className={styles.modalConfirm} ref={ref}>
      <div className={styles.overlay} onClick={onClose}></div>

      <div className={styles.modalContent}>
        <div className={styles.closeIcon} onClick={onClose}>
          <CloseIcon />
        </div>

        {title && <div className={styles.title}>{title}</div>}

        {showIcon && (
          <div className={styles.logo}>
            <Icon />
          </div>
        )}

        <div className={styles.content}>{content}</div>
        <div className={styles.button}>
          <Button type={btnCancelType} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type={btnConfirmType}
            onClick={() => {
              onConfirm();
            }}
          >
            {showLoading && loading && <Loader width={22} height={22} />}&nbsp;
            {confirmBtnText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirm;
