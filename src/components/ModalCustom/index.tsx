import { isMobile } from '@walletconnect/browser-utils';
import CloseIconDefault from 'assets/icons/close.svg?react';
import useOnClickOutside from 'hooks/useOnClickOutside';
import { FunctionComponent, PropsWithChildren, useRef } from 'react';
import styles from './index.module.scss';
import classNames from 'classnames';

export type ModalCustomProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number;
  showOnBottom?: boolean;
  CloseIcon?: FunctionComponent;
  className?: string;
  overlayClassName?: string;
};

const ModalCustom = ({
  open,
  onClose,
  title,
  width,
  children,
  showOnBottom,
  CloseIcon,
  className,
  overlayClassName
}: PropsWithChildren<ModalCustomProps>) => {
  const ref = useRef(null);

  useOnClickOutside(ref, () => {
    onClose();
  });

  return (
    <>
      <div
        className={classNames(styles.overlay, { [styles.openOverlay]: open }, overlayClassName)}
        onClick={onClose}
      ></div>
      <div className={classNames(styles.modalCustom, { [styles.isBottomSheet]: showOnBottom, [styles.open]: open })}>
        <div
          ref={ref}
          className={classNames(
            styles.modalContent,
            {
              [styles.showOnBottom]: showOnBottom,
              [styles.openContent]: open
            },
            className
          )}
        >
          <div className={styles.closeIcon} onClick={onClose}>
            {CloseIcon ? <CloseIcon /> : <CloseIconDefault />}
          </div>

          {title && <div className={styles.title}>{title}</div>}

          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </>
  );
};

export default ModalCustom;
