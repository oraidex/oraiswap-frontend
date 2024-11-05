import { toAmount, toDisplay } from '@oraichain/oraidex-common';
import { Cw20StakingClient } from '@oraichain/oraidex-contracts-sdk';
import { LockInfoResponse } from '@oraichain/oraidex-contracts-sdk/build/Cw20Staking.types';
import OraiXIcon from 'assets/icons/oraix.svg?react';
import OraiXLightIcon from 'assets/icons/oraix_light.svg?react';
import ConfirmIcon from 'assets/images/restake.svg?react';
import ConfirmIconLight from 'assets/images/restaking-light.svg?react';
import { Button } from 'components/Button';
import ModalConfirm from 'components/ConfirmModal';
import Loader from 'components/Loader';
import { TToastType, displayToast } from 'components/Toasts/Toast';
import { network } from 'config/networks';
import { handleErrorTransaction } from 'helper';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import { useLoadOraichainTokens } from 'hooks/useLoadTokens';
import { getUsd } from 'libs/utils';
import { formatDisplayUsdt, numberWithCommas } from 'pages/Pools/helpers';
import { ORAIX_TOKEN_INFO, STAKE_TAB, STAKING_PERIOD, TIMER } from 'pages/Staking/constants';
import { getDiffDay } from 'pages/Staking/helpers';
import { useGetLockInfo, useGetMyStakeRewardInfo, useGetStakeInfo } from 'pages/Staking/hooks';
import { useState } from 'react';
import InputBalance, { UN_STAKE_ENUM } from '../InputBalance';
import styles from './index.module.scss';

const UnStakeTab = () => {
  const { data: prices } = useCoinGeckoPrices();
  const [theme] = useConfigReducer('theme');
  const [address] = useConfigReducer('address');
  const loadOraichainToken = useLoadOraichainTokens();
  const [amount, setAmount] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [unstakeType, setUnstakeType] = useState<UN_STAKE_ENUM>();
  const [loadingWithdraw, setLoadingWithdraw] = useState<boolean>(false);
  const [loadingRestake, setLoadingRestake] = useState<boolean>(false);

  const { refetchStakeInfo } = useGetStakeInfo(ORAIX_TOKEN_INFO.contractAddress);
  const { myStakeRewardInfo, refetchMyStakeRewardInfo } = useGetMyStakeRewardInfo(
    ORAIX_TOKEN_INFO.contractAddress,
    address
  );
  const { lockInfo, refetchLockInfo } = useGetLockInfo(ORAIX_TOKEN_INFO.contractAddress, address);

  const stakedAmount = myStakeRewardInfo?.stakedAmount || '0';

  const listUnstake: LockInfoResponse[] = lockInfo?.lock_infos || [];

  const isEnableWithdraw = listUnstake.find((unstakeItem) => {
    const timeLeft = getDiffDay(Date.now(), unstakeItem.unlock_time * TIMER.MILLISECOND);

    return !timeLeft;
  });

  const handleUnstake = async () => {
    if (!amount) return displayToast(TToastType.TX_FAILED, { message: 'Unstake Amount is required' });

    setLoading(true);
    displayToast(TToastType.TX_BROADCASTING);
    try {
      const cw20StakingClient = new Cw20StakingClient(window.client, address, network.staking_oraix);

      const result = await cw20StakingClient.unbond({
        amount: toAmount(amount).toString(),
        stakingToken: ORAIX_TOKEN_INFO.contractAddress,
        unbondPeriod: unstakeType === UN_STAKE_ENUM.NORMAL ? undefined : TIMER.SECOND_OF_DAY
      });

      if (result) {
        displayToast(TToastType.TX_SUCCESSFUL, {
          customLink: `${network.explorer}/txs/${result.transactionHash}`
        });
        refetchStakeInfo();
        refetchMyStakeRewardInfo();
        refetchLockInfo();
        loadOraichainToken(address, [ORAIX_TOKEN_INFO.contractAddress]);
        setOpen(false);
      }
    } catch (error) {
      console.log('error in unbond: ', error);
      handleErrorTransaction(error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setLoadingWithdraw(true);
    displayToast(TToastType.TX_BROADCASTING);
    try {
      const cw20StakingClient = new Cw20StakingClient(window.client, address, network.staking_oraix);

      const result = await cw20StakingClient.unbond({
        amount: '0',
        stakingToken: ORAIX_TOKEN_INFO.contractAddress
      });

      if (result) {
        displayToast(TToastType.TX_SUCCESSFUL, {
          customLink: `${network.explorer}/txs/${result.transactionHash}`
        });

        refetchStakeInfo();
        refetchMyStakeRewardInfo();
        refetchLockInfo();
        loadOraichainToken(address, [ORAIX_TOKEN_INFO.contractAddress]);
      }
    } catch (error) {
      console.log('error in withdraw: ', error);
      handleErrorTransaction(error);
    } finally {
      setLoadingWithdraw(false);
    }
  };

  const handleRestake = async () => {
    setLoadingRestake(true);
    displayToast(TToastType.TX_BROADCASTING);
    try {
      const cw20StakingClient = new Cw20StakingClient(window.client, address, network.staking_oraix);

      const result = await cw20StakingClient.restake({
        stakingToken: ORAIX_TOKEN_INFO.contractAddress
      });

      if (result) {
        displayToast(TToastType.TX_SUCCESSFUL, {
          customLink: `${network.explorer}/txs/${result.transactionHash}`
        });

        refetchStakeInfo();
        refetchMyStakeRewardInfo();
        refetchLockInfo();
        loadOraichainToken(address, [ORAIX_TOKEN_INFO.contractAddress]);
      }
    } catch (error) {
      console.log('error in restake: ', error);
      handleErrorTransaction(error);
    } finally {
      setLoadingRestake(false);
    }
  };

  return (
    <div className={styles.unstakeTab}>
      <InputBalance
        onSubmit={(unstakeType) => {
          setOpen(true);
          setUnstakeType(unstakeType);
        }}
        balance={stakedAmount}
        label="Staked amount"
        type={STAKE_TAB.UnStake}
        amount={amount}
        loading={loading}
        setAmount={setAmount}
        showLoading={false}
      />

      <div className={styles.note}>
        To withdraw your stake, you will need to activate a{' '}
        <span className={styles.noteHighlight}>30-day unbonding period no fee</span> or{' '}
        <span className={styles.noteHighlight}>only 24-hour unbonding period with a 10% fee</span>. You may withdraw at
        any time, but your tokens will become available again only after this duration
      </div>

      <div className={styles.result}>
        {listUnstake?.length <= 0 ? null : (
          <div className={styles.header}>
            <span>Available to withdraw</span>
            <div className={styles.btnGroup}>
              <Button
                type="secondary-sm"
                onClick={() => handleRestake()}
                disabled={loadingRestake || listUnstake?.length <= 0}
              >
                {loadingRestake && <Loader width={18} height={18} />}&nbsp; Cancel Unstaking
              </Button>
              <Button
                type="primary-sm"
                onClick={() => handleWithdraw()}
                disabled={loadingWithdraw || !isEnableWithdraw}
              >
                {loadingWithdraw && <Loader width={18} height={18} />}&nbsp; Withdraw All
              </Button>
            </div>
          </div>
        )}

        {listUnstake?.length <= 0 ? null : (
          <div className={styles.list}>
            {listUnstake.map((unstakeItem, key) => {
              const amountUsd = getUsd(unstakeItem.amount, ORAIX_TOKEN_INFO, prices);
              const timeLeft = getDiffDay(Date.now(), unstakeItem.unlock_time * TIMER.MILLISECOND);
              const percent = (timeLeft * 100) / STAKING_PERIOD;

              return (
                <div className={styles.item} key={`${key}-${unstakeItem.unlock_time}`}>
                  <div className={styles.title}>
                    <div className={`${styles.usd} ${!timeLeft ? styles.active : ''}`}>
                      {formatDisplayUsdt(amountUsd)}
                    </div>
                    {!timeLeft ? null : (
                      <div className={styles.timeleft}>
                        <span>{timeLeft} days left</span>
                        <div className={styles.pie}>
                          <div
                            className={styles.progress}
                            style={{
                              background:
                                theme === 'light'
                                  ? `conic-gradient(#2F5711 ${percent}%, #EFEFEF ${percent}%)`
                                  : `conic-gradient(#D7F5BF ${percent}%, #494949 ${percent}%)`
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`${styles.value} ${!timeLeft ? styles.activeValue : ''}`}>
                    {theme === 'light' ? <OraiXLightIcon /> : <OraiXIcon />}
                    <span>{numberWithCommas(toDisplay(unstakeItem.amount))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ModalConfirm
        loading={loading}
        open={open}
        onOpen={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onConfirm={() => handleUnstake()}
        content={
          <div className={styles.contentConfirm}>
            <div className={styles.desc}>
              Unstaking <span className={styles.noteHighlight}>would stop the reward</span> and lock the token for a
              <span className={styles.noteHighlight}>
                {' '}
                {unstakeType === UN_STAKE_ENUM.NORMAL
                  ? '30-day unbonding period with no fee'
                  : 'only 24-hour unbonding period with a 10% fee'}
              </span>
              . You can also choose to cancel the unstaking process during cooldown.
            </div>
            <div>Are you sure you want to unstake?</div>
          </div>
        }
        Icon={theme === 'light' ? ConfirmIconLight : ConfirmIcon}
        title="Unstaking confirmation"
        // showIcon={false}
      />
    </div>
  );
};

export default UnStakeTab;
