import { toDisplay, TokenItemType } from '@oraichain/oraidex-common';
import { FeeTier, PoolWithPoolKey } from '@oraichain/oraidex-contracts-sdk/build/OraiswapV3.types';
import OpenBlankTabIcon from 'assets/icons/arrow_right_ic.svg?react';
import BackIcon from 'assets/icons/back.svg?react';
import CloseIcon from 'assets/icons/close.svg?react';
import SettingIcon from 'assets/icons/setting.svg?react';
import classNames from 'classnames';
import { Button } from 'components/Button';
import { ALL_FEE_TIERS_DATA } from 'libs/contractSingleton';
import { Dispatch, SetStateAction, useCallback, useRef, useState } from 'react';
import CreateNewPosition from '../CreateNewPosition';
import CreatePoolForm from '../CreatePoolForm';
import { extractDenom } from '../PriceRangePlot/utils';
import SelectToken from '../SelectToken';
import SlippageSetting from '../SettingSlippage';
import styles from './index.module.scss';

enum STEP_CREATE_POOL {
  SELECT_POOL,
  ADD_LIQUIDITY
}

export const CreateNewPool = ({
  pools,
  showModal,
  setShowModal
}: {
  pools: PoolWithPoolKey[];
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
}) => {
  const [tokenFrom, setTokenFrom] = useState<TokenItemType>();
  const [tokenTo, setTokenTo] = useState<TokenItemType>();
  const [fee, setFee] = useState<FeeTier>(ALL_FEE_TIERS_DATA[0]);
  const [step, setStep] = useState<STEP_CREATE_POOL>(STEP_CREATE_POOL.SELECT_POOL);
  const [isOpen, setIsOpen] = useState(false);
  const [slippage, setSlippage] = useState(1);
  const [moveToAddLiquidity, setMoveToAddLiquidity] = useState(false);
  const refContent = useRef();

  const isPoolExisted = useCallback(
    (fee: FeeTier) =>
      (pools || []).find(
        (p) =>
          [extractDenom(tokenFrom), extractDenom(tokenTo)].every((e) =>
            [p.pool_key?.token_x, p.pool_key?.token_y].includes(e)
          ) && fee.fee === p.pool_key?.fee_tier?.fee
      ),
    [pools, tokenFrom, tokenTo]
  );

  const onCloseModal = () => {
    setShowModal(false);
    setStep(STEP_CREATE_POOL.SELECT_POOL);
    setTokenFrom(null);
    setTokenTo(null);
  };

  return (
    <>
      {moveToAddLiquidity ? (
        <CreateNewPosition
          showModal={moveToAddLiquidity}
          setShowModal={setMoveToAddLiquidity}
          pool={isPoolExisted(fee)}
        />
      ) : (
        <div className={styles.createNewPool}>
          <div
            onClick={() => setShowModal(false)}
            className={classNames(styles.overlay, { [styles.activeOverlay]: showModal })}
          ></div>
          <div className={classNames(styles.modalWrapper, { [styles.activeModal]: showModal })}>
            <div className={styles.contentWrapper} ref={refContent}>
              <div className={styles.header}>
                <div
                  className={classNames(styles.back, { [styles.activeBack]: step === STEP_CREATE_POOL.ADD_LIQUIDITY })}
                  onClick={() => setStep(STEP_CREATE_POOL.SELECT_POOL)}
                >
                  <BackIcon />
                </div>
                <div>Create New Pool</div>
                <div className={styles.headerActions}>
                  {step === STEP_CREATE_POOL.ADD_LIQUIDITY && (
                    <div className={styles.setting}>
                      <SettingIcon onClick={() => setIsOpen(true)} />
                      <SlippageSetting
                        isOpen={isOpen}
                        setIsOpen={setIsOpen}
                        setSlippage={setSlippage}
                        slippage={slippage}
                      />
                    </div>
                  )}
                  <div onClick={() => onCloseModal()}>
                    <CloseIcon />
                  </div>
                </div>
              </div>
              <div className={styles.stepTitle}>
                <h1>{step === STEP_CREATE_POOL.ADD_LIQUIDITY ? 'Add Liquidity' : 'Select pool'}</h1>
                <div
                  className={classNames(styles.step, {
                    [styles.activeAllStep]: step === STEP_CREATE_POOL.ADD_LIQUIDITY
                  })}
                >
                  <span className={styles.currentStep}>{step + 1}</span>/<span>2</span>
                </div>
              </div>
              {step === STEP_CREATE_POOL.ADD_LIQUIDITY ? (
                <CreatePoolForm
                  slippage={slippage}
                  tokenFrom={tokenFrom}
                  tokenTo={tokenTo}
                  feeTier={fee}
                  poolData={pools}
                  onCloseModal={onCloseModal}
                />
              ) : (
                <div className={styles.content}>
                  <div className={styles.select}>
                    <div className={styles.selectContent}>
                      <SelectToken
                        token={tokenFrom}
                        handleChangeToken={(tk) => setTokenFrom(tk)}
                        otherTokenDenom={tokenTo?.denom}
                        customClassButton={styles.customSelect}
                      />
                      <SelectToken
                        token={tokenTo}
                        handleChangeToken={(tk) => setTokenTo(tk)}
                        otherTokenDenom={tokenFrom?.denom}
                        customClassButton={styles.customSelect}
                      />
                    </div>
                    {tokenFrom && tokenTo ? (
                      <div className={styles.fee}>
                        {ALL_FEE_TIERS_DATA.map((e, index) => {
                          const existedPool = isPoolExisted(e);
                          return (
                            <div
                              className={classNames(styles.feeItem, { [styles.chosen]: e.fee === fee.fee })}
                              key={`${index}-${e}-fee`}
                              onClick={() => {
                                setFee(e);
                                if (existedPool) {
                                  setMoveToAddLiquidity(true);
                                  return;
                                }
                              }}
                            >
                              <div className={styles.valueFee}>
                                <span>
                                  Fee:&nbsp;
                                  {toDisplay(e.fee.toString(), 10)}%
                                </span>
                                <span className={styles.descFee}>
                                  {!existedPool ? 'Not yet created' : 'Pool already created'}
                                </span>
                              </div>
                              {!existedPool ? null : (
                                <div>
                                  <OpenBlankTabIcon />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={styles.initFee}>
                        <p className={styles.initFeeTxt}>Fee tier</p>
                        <p>...</p>
                      </div>
                    )}
                  </div>
                  <div className={styles.next}>
                    <Button
                      disabled={!tokenFrom || !tokenTo || !!isPoolExisted(fee)}
                      type="primary"
                      onClick={() => {
                        setStep(STEP_CREATE_POOL.ADD_LIQUIDITY);
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
