import { ORAI, toAmount } from '@oraichain/oraidex-common';
import CloseIcon from 'assets/icons/ic_close_modal.svg?react';
import cn from 'classnames/bind';
import { Button } from 'components/Button';
import Loader from 'components/Loader';
import Modal from 'components/Modal';
import { TToastType, displayToast } from 'components/Toasts/Toast';
import { handleCheckAddress, handleErrorTransaction } from 'helper';
import useConfigReducer from 'hooks/useConfigReducer';
import { network } from 'initCommon';
import CosmJs from 'libs/cosmjs';
import { toFixedIfNecessary } from 'pages/Pools/helpers';
import { useGetPoolDetail, useGetRewardInfoDetail } from 'pages/Pools/hooks';
import { useGetPairInfo } from 'pages/Pools/hooks/useGetPairInfo';
import { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Type, generateMiningMsgs } from 'rest/api';
import InputWithOptionPercent from '../InputWithOptionPercent';
import { ModalProps } from '../MyPoolInfo/type';
import styles from './UnstakeLPModal.module.scss';

const cx = cn.bind(styles);

export const UnstakeLPModal: FC<ModalProps> = ({ isOpen, close, open, onLiquidityChange, lpPrice }) => {
  let { poolUrl } = useParams();
  const [theme] = useConfigReducer('theme');
  const [address] = useConfigReducer('address');

  const [actionLoading, setActionLoading] = useState(false);
  const [unbondAmount, setUnbondAmount] = useState<bigint | null>(null);
  const [unbondAmountInUsdt, setUnBondAmountInUsdt] = useState(0);

  const poolDetail = useGetPoolDetail({ pairDenoms: poolUrl });
  const { info: pairInfoData } = poolDetail;
  const { lpTokenInfoData } = useGetPairInfo(poolDetail);

  const { totalRewardInfoData, refetchRewardInfo } = useGetRewardInfoDetail({
    stakerAddr: address,
    poolInfo: poolDetail.info
  });

  const totalBondAmount =
    totalRewardInfoData && totalRewardInfoData.reward_infos[0]
      ? BigInt(totalRewardInfoData.reward_infos[0].bond_amount || '0')
      : BigInt(0);

  // handle update unbond amount in usdt
  useEffect(() => {
    if (!totalBondAmount) return;
    const unbondAmountInUsdt = Number(unbondAmount) * Number(lpPrice);
    setUnBondAmountInUsdt(unbondAmountInUsdt);
  }, [unbondAmount, totalBondAmount, lpPrice]);

  const onUnbonedSuccess = () => {
    onLiquidityChange();
    refetchRewardInfo();
  };

  const handleUnbond = async (parsedAmount: bigint) => {
    if (!poolDetail || !poolDetail.info)
      return displayToast(TToastType.TX_FAILED, { message: 'Pool information does not exist' });

    const oraiAddress = await handleCheckAddress('Oraichain');

    setActionLoading(true);
    displayToast(TToastType.TX_BROADCASTING);
    try {
      const msg = generateMiningMsgs({
        type: Type.UNBOND_LIQUIDITY,
        sender: oraiAddress,
        amount: parsedAmount.toString(),
        lpAddress: poolDetail.info.liquidityAddr
      });

      const result = await CosmJs.execute({
        address: msg.contractAddress,
        walletAddr: oraiAddress,
        handleMsg: msg.msg,
        gasAmount: { denom: ORAI, amount: '0' },
        funds: msg.funds
      });
      if (result) {
        displayToast(TToastType.TX_SUCCESSFUL, {
          customLink: `${network.explorer}/tx/${result.transactionHash}`
        });
        onUnbonedSuccess();
      }
    } catch (error) {
      console.log('error in unbond: ', error);
      handleErrorTransaction(error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} close={close} open={open} isCloseBtn={false} className={cx('modal')}>
      <div className={cx('container', theme)}>
        <div className={cx('header')}>
          <div className={cx('title', theme)}>Unstake LP</div>
          <div className={cx('btn-group')}>
            <div className={cx('btn-close')} onClick={close}>
              <CloseIcon />
            </div>
          </div>
        </div>
        {/* <div className={cx('apr')}>Current APR: {toFixedIfNecessary(pairInfoData?.apr.toString() || '0', 2)}%</div> */}

        <InputWithOptionPercent
          onValueChange={({ floatValue }) => {
            if (floatValue === undefined) setUnbondAmount(null);
            else setUnbondAmount(toAmount(floatValue, lpTokenInfoData?.decimals));
          }}
          value={unbondAmount}
          token={lpTokenInfoData}
          setAmountFromPercent={setUnbondAmount}
          totalAmount={totalBondAmount}
          apr={toFixedIfNecessary(pairInfoData?.apr.toString() || '0', 2)}
          prefixText="Staked LP Balance: "
          amountInUsdt={unbondAmountInUsdt}
        />
        {(() => {
          let disableMsg: string;
          if (unbondAmount <= 0) disableMsg = 'Enter an amount';
          if (unbondAmount > totalBondAmount) disableMsg = `Insufficient LP token balance`;
          const disabled = actionLoading || unbondAmount <= 0 || unbondAmount > totalBondAmount || !pairInfoData;

          return (
            <div className={cx('btn-confirm')}>
              <Button onClick={() => handleUnbond(unbondAmount)} type="primary" disabled={disabled}>
                {actionLoading && <Loader width={22} height={22} />}
                {disableMsg || 'Unstake'}
              </Button>
            </div>
          );
        })()}
      </div>
    </Modal>
  );
};
