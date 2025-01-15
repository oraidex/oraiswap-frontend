import { TokenItemType } from '@oraichain/oraidex-common';
import CloseIcon from 'assets/icons/close-icon.svg?react';
import IconCopyAddress from 'assets/icons/ic_copy_address.svg?react';
import SuccessIcon from 'assets/icons/toast_success.svg?react';
import classNames from 'classnames';
import { Button } from 'components/Button';
import Modal from 'components/Modal';
import { DEFAULT_TOKEN_ICON_URL } from 'helper/constants';
import { useCopyClipboard } from 'hooks/useCopyClipboard';
import useTheme from 'hooks/useTheme';
import { reduceString } from 'libs/utils';
import { useDispatch, useSelector } from 'react-redux';
import { updateAddedTokens } from 'reducer/token';
import { RootState } from 'store/configure';
import styles from './ModalConfirmUnverifiedToken.module.scss';
import { useEffect, useState } from 'react';
import { flattenTokens } from 'initCommon';

const ModalConfirmUnverifiedToken: React.FC<{
  handleReject: () => void;
  handleConfirm: () => void;
  token: TokenItemType;
}> = ({ handleReject, handleConfirm, token }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { addedTokens = [] } = useSelector((state: RootState) => state.token);
  const [isMaliciousToken, setIsMaliciousToken] = useState<boolean>(false);

  useEffect(() => {
    if (flattenTokens.find((flattenToken) => flattenToken.name === token.name)) {
      setIsMaliciousToken(true);
    }
  }, [token]);

  const handleConfirmation = () => {
    const isTokenAdded = (addedTokens || []).find((addedToken) => addedToken.denom === token.denom);
    if (!isTokenAdded) dispatch(updateAddedTokens([token]));
    handleConfirm();
  };

  const { isCopied, handleCopy } = useCopyClipboard();

  return (
    <Modal
      isOpen={true}
      close={handleReject}
      open={() => {}}
      isCloseBtn={false}
      className={classNames(styles.confirmationContainer, `${styles[theme]}`)}
    >
      <div className={styles.confirmationModalWrapper}>
        <div className={styles.header}>
          <div>Confirmation</div>
          <div onClick={handleReject} className={styles.closeIcon}>
            <CloseIcon />
          </div>
        </div>
        <div className={styles.confirmInfo}>
          <div className={styles.title}>This token is not on the default token lists</div>
          {isMaliciousToken && (
            <div className={styles.malicious}>This token has a same name with a verified token!</div>
          )}
          <div className={styles.description}>
            By clicking below, you understand that you are fully responsible for confirming the token you are trading.
          </div>
        </div>
        <div className={styles.infoToken}>
          <div className={styles.mainInfoToken}>
            <img
              style={{ borderRadius: '100%' }}
              width={32}
              height={32}
              src={token.icon ?? DEFAULT_TOKEN_ICON_URL}
              alt=""
            />
            <div>
              <div className={styles.tokenName}>{token?.name}</div>
              <div className={styles.address}>{reduceString(token.denom, 6, 6)}</div>
            </div>
          </div>
          <div className={styles.copyBtn}>
            {isCopied ? (
              <SuccessIcon />
            ) : (
              <div onClick={(e) => handleCopy(token.denom)}>
                <IconCopyAddress />
              </div>
            )}
          </div>
        </div>

        <div className={styles.cta}>
          <Button onClick={handleReject} type="secondary">
            {'Cancel'}
          </Button>
          <Button onClick={handleConfirmation} type="primary">
            {'I understand, confirm'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalConfirmUnverifiedToken;
