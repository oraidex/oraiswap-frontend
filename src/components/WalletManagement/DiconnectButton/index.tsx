import DisconnectIcon from 'assets/icons/ic_logout.svg?react';
import React from 'react';
import styles from './index.module.scss';

export const DisconnectButton: React.FC<{
  setIsShowDisconnect: (isShowDisconnect: boolean) => void;
  onSetCurrentDisconnectingNetwork: () => void;
}> = ({ setIsShowDisconnect, onSetCurrentDisconnectingNetwork }) => {
  return (
    <div className={styles.right}>
      <div
        className={styles.disconnectBtn}
        onClick={() => {
          setIsShowDisconnect(true);
          onSetCurrentDisconnectingNetwork();
        }}
        title="Disconnect"
      >
        <DisconnectIcon width={25} height={25} />
      </div>
    </div>
  );
};
