import { isMobile } from '@walletconnect/browser-utils';
import CloseIcon from 'assets/icons/close-icon.svg?react';
import { Button } from 'components/Button';
import useOnClickOutside from 'hooks/useOnClickOutside';
import { useRef } from 'react';
import styles from './index.module.scss';

export type SwapWarningModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  impact: number;
};

const SwapWarningModal = ({ open, onClose, onConfirm, impact }: SwapWarningModalProps) => {
  const ref = useRef(null);
  const mobileMode = isMobile();

  useOnClickOutside(ref, () => {
    onClose();
  });

  const btnConfirmType = mobileMode ? 'primary-sm' : 'primary';
  const btnCancelType = mobileMode ? 'third-sm' : 'third';

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

        <div className={styles.title}> Confirmation </div>

        <div className={styles.content}>
          <div className={styles.desc}>
            This swap has price impact over <span className={styles.impact}> {impact}% </span>, Are you sure you have
            reviewed the swap detail?
          </div>
        </div>
        <div className={styles.button}>
          <Button type={btnCancelType} onClick={onClose}>
            Cancel
          </Button>
          <Button type={btnConfirmType} onClick={onConfirm}>
            Yes, I have reviewed
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SwapWarningModal;
