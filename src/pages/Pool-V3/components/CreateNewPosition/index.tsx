import { PoolWithPoolKey } from '@oraichain/oraidex-contracts-sdk/build/OraiswapV3.types';
import { poolKeyToString } from '@oraichain/oraiswap-v3';
import CloseIcon from 'assets/icons/close.svg?react';
import classNames from 'classnames';
import { oraichainTokens } from '@oraichain/oraidex-common';
import { getIcon } from 'helper';
import useTheme from 'hooks/useTheme';
import { useRef, useState } from 'react';
import styles from './index.module.scss';
import cn from 'classnames/bind';
import { useGetPositions } from 'pages/Pool-V3/hooks/useGetPosition';
import useConfigReducer from 'hooks/useConfigReducer';
import { extractAddress } from 'pages/Pool-V3/helpers/format';
import { useDispatch } from 'react-redux';
import { setToDefault } from 'reducer/poolDetailV3';
import CreatePositionForm from '../CreatePositionForm';


const cx = cn.bind(styles);
export const openInNewTab = (url: string): void => {
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (newWindow) newWindow.opener = null;
};

const CreateNewPosition = ({
  pool,
  showModal,
  setShowModal
}: {
  pool: PoolWithPoolKey;
  showModal?: boolean;
  setShowModal?: (isModal: boolean) => void;
}) => {
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [slippage, setSlippage] = useState(1);
  const refContent = useRef();
  const theme = useTheme();
  const [walletAddress] = useConfigReducer('address');
  const { refetchPositions } = useGetPositions(walletAddress);

  const onCloseModal = () => {
    setShowModal(false);
    dispatch(setToDefault());
  };

  const tokenFrom = oraichainTokens.find((e) => extractAddress(e) === pool.pool_key.token_x);
  const tokenTo = oraichainTokens.find((e) => extractAddress(e) === pool.pool_key.token_y);

  const isLightTheme = theme === 'light';
  const TokenFromIcon =
    tokenFrom &&
    getIcon({
      isLightTheme,
      type: 'token',
      coinGeckoId: tokenFrom.coinGeckoId,
      width: 20,
      height: 20
    });

  const TokenToIcon =
    tokenTo &&
    getIcon({
      isLightTheme,
      type: 'token',
      coinGeckoId: tokenTo.coinGeckoId,
      width: 20,
      height: 20
    });

  return (
    <div className={classNames(styles.createNewPool, { [styles.activeWrapper]: showModal })}>
      <div
        onClick={() => setShowModal(false)}
        className={classNames(styles.overlay, { [styles.activeOverlay]: showModal })}
      ></div>
      <div className={classNames(styles.modalWrapper, { [styles.activeModal]: showModal })}>
        <div className={styles.contentWrapper} ref={refContent}>
          <div className={styles.header}>
            <div className={styles.poolInfoWrapper}>
              <div className={classNames(styles.icons, styles[theme])}>
                <div className={styles.tokenIcon}>
                  {TokenFromIcon}
                  {TokenToIcon}
                </div>
                <span className={styles.pairName}>
                  {tokenFrom.name} / {tokenTo.name}
                </span>
                {/* <TooltipHover
                  setIsVisible={setIsVisible}
                  isVisible={isVisible}
                  content={
                    <div>
                      <div className={classNames(styles.infoPool, styles[theme])}>
                        <div className={classNames(styles.infoPoolName)}>
                          {tokenFrom.name} / {tokenTo.name}
                          <span>v3</span>
                        </div>
                        <div className={styles.infoPoolfee}>
                          <span>Fee: {Number(pool.pool_key.fee_tier.fee) / 10 ** 10}%</span>
                        </div>
                        <div className={styles.infoPoolfee}>
                          <span>0.01% Spread</span>
                        </div>
                      </div>
                      <div className={classNames(styles.infoMarket)}>
                        Market ID: {reduceString(poolKeyToString(pool.pool_key), 16, 20)}
                      </div>
                    </div>
                  }
                  position="bottom"
                  children={
                    
                  }
                /> */}
              </div>

              <div className={styles.fee}>Fee: {Number(pool.pool_key.fee_tier.fee) / 10 ** 10}%</div>
            </div>
            <div className={styles.headerActions}>
              <div className={styles.btn} onClick={() => onCloseModal()}>
                <CloseIcon />
              </div>
            </div>
          </div>
          <CreatePositionForm
            poolId={poolKeyToString(pool.pool_key)}
            showModal={showModal}
            slippage={slippage}
            onCloseModal={async () => {
              onCloseModal();
              await refetchPositions();
              dispatch(setToDefault());
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateNewPosition;
