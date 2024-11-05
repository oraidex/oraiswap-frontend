import CloseIcon from 'assets/icons/close.svg?react';
import SettingIcon from 'assets/icons/setting.svg?react';
import classNames from 'classnames';
import useConfigReducer from 'hooks/useConfigReducer';
import { useGetPositions } from 'pages/Pool-V3/hooks/useGetPosition';
import { useRef, useState } from 'react';
import SlippageSetting from '../SettingSlippage';
import ZapOutForm from '../ZapOutForm';
import styles from './index.module.scss';

export const openInNewTab = (url: string): void => {
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (newWindow) newWindow.opener = null;
};

const ZapOut = ({
  position,
  incentives,
  showModal,
  setShowModal
}: {
  position: any;
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  incentives: { [key: string]: number };
}) => {
  const [walletAddress] = useConfigReducer('address');
  const [isOpen, setIsOpen] = useState(false);
  const [slippage, setSlippage] = useState(1);
  const refContent = useRef();
  const { refetchPositions } = useGetPositions(walletAddress);

  const onCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className={classNames(styles.createNewPool, { [styles.activeWrapper]: showModal })}>
      <div
        onClick={() => setShowModal(false)}
        className={classNames(styles.overlay, { [styles.activeOverlay]: showModal })}
      ></div>
      <div className={classNames(styles.modalWrapper, { [styles.activeModal]: showModal })}>
        <div className={styles.contentWrapper} ref={refContent}>
          <div className={styles.header}>
            <div>Remove Position</div>
            <div className={styles.headerActions}>
              <div className={styles.setting}>
                <SettingIcon onClick={() => setIsOpen(true)} />
                <SlippageSetting isOpen={isOpen} setIsOpen={setIsOpen} setSlippage={setSlippage} slippage={slippage} />
              </div>
              <div onClick={() => onCloseModal()}>
                <CloseIcon />
              </div>
            </div>
          </div>
          <ZapOutForm
            showModal={showModal}
            onCloseModal={async () => {
              setShowModal(false);
              await refetchPositions();
            }}
            slippage={1}
            tokenFrom={position.tokenX}
            tokenTo={position.tokenY}
            position={position}
            incentives={incentives}
          />
        </div>
      </div>
    </div>
  );
};

export default ZapOut;
