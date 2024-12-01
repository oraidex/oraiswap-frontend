import { ORAI, toAmount } from '@oraichain/oraidex-common';
import CloseIcon from 'assets/icons/ic_close_modal.svg?react';
import cn from 'classnames/bind';
import { Button } from 'components/Button';
import Loader from 'components/Loader';
import Modal from 'components/Modal';
import { TToastType, displayToast } from 'components/Toasts/Toast';
import { handleCheckAddress, handleErrorTransaction } from 'helper';
import useConfigReducer from 'hooks/useConfigReducer';
import { network } from 'index';
import CosmJs from 'libs/cosmjs';
import { toFixedIfNecessary } from 'pages/Pools/helpers';
import { useGetPoolDetail, useGetRewardInfoDetail } from 'pages/Pools/hooks';
import { useGetPairInfo } from 'pages/Pools/hooks/useGetPairInfo';
import { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Type, generateMiningMsgs } from 'rest/api';
import { RootState } from 'store/configure';
import InputWithOptionPercent from '../InputWithOptionPercent';
import { ModalProps } from '../MyPoolInfo/type';
import styles from './StakeLPModal.module.scss';

const cx = cn.bind(styles);

export const StakeLPModal: FC<ModalProps> = ({ isOpen, close, open, myLpBalance, myLpUsdt, onLiquidityChange }) => {
  let { poolUrl } = useParams();
  const lpPools = useSelector((state: RootState) => state.token.lpPools);
  const [theme] = useConfigReducer('theme');
  const [address] = useConfigReducer('address');
  const poolDetail = useGetPoolDetail({ pairDenoms: poolUrl });
  const { info: pairInfoData } = poolDetail;
  const { lpTokenInfoData } = useGetPairInfo(poolDetail);

  const { refetchRewardInfo } = useGetRewardInfoDetail({
    stakerAddr: address,
    poolInfo: poolDetail.info
  });
  const [bondAmount, setBondAmount] = useState<bigint | null>(null);
  const [bondAmountInUsdt, setBondAmountInUsdt] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const lpTokenBalance = BigInt(pairInfoData ? lpPools[pairInfoData?.liquidityAddr]?.balance || '0' : 0);

  // handle update bond amount in usdt
  useEffect(() => {
    if (!myLpBalance) return;
    const bondAmountInUsdt = (Number(bondAmount) / Number(myLpBalance)) * Number(myLpUsdt);
    setBondAmountInUsdt(bondAmountInUsdt);
  }, [bondAmount, myLpBalance, myLpUsdt]);

  const onBonedSuccess = () => {
    onLiquidityChange();
    refetchRewardInfo();
  };

  const handleBond = async (parsedAmount: bigint) => {
    if (!poolDetail || !poolDetail.info)
      return displayToast(TToastType.TX_FAILED, { message: 'Pool information does not exist' });

    setActionLoading(true);
    displayToast(TToastType.TX_BROADCASTING);
    try {
      const oraiAddress = await handleCheckAddress('Oraichain');
      // generate bonding msg
      const msg = generateMiningMsgs({
        type: Type.BOND_LIQUIDITY,
        sender: oraiAddress,
        amount: parsedAmount.toString(),
        lpAddress: poolDetail.info.liquidityAddr
      });

      // execute msg
      const result = await CosmJs.execute({
        address: msg.contractAddress,
        walletAddr: oraiAddress,
        handleMsg: msg.msg,
        gasAmount: { denom: ORAI, amount: '0' },
        funds: msg.funds
      });
      if (result) {
        displayToast(TToastType.TX_SUCCESSFUL, {
          customLink: `${network.explorer}/txs/${result.transactionHash}`
        });
        onBonedSuccess();
      }
    } catch (error) {
      console.log('error in bond: ', error);
      handleErrorTransaction(error);
    } finally {
      setActionLoading(false);
    }
  };
  return (
    <Modal isOpen={isOpen} close={close} open={open} isCloseBtn={false} className={cx('modal')}>
      <div className={cx('container', theme)}>
        <div className={cx('header')}>
          <div className={cx('title', theme)}>Stake LP</div>
          <div className={cx('btn-group')}>
            <div className={cx('btn-close')} onClick={close}>
              <CloseIcon />
            </div>
          </div>
        </div>

        <InputWithOptionPercent
          onValueChange={({ floatValue }) => {
            if (floatValue === undefined) setBondAmount(null);
            else setBondAmount(toAmount(floatValue, lpTokenInfoData?.decimals));
          }}
          value={bondAmount}
          token={lpTokenInfoData}
          setAmountFromPercent={setBondAmount}
          totalAmount={lpTokenBalance}
          apr={toFixedIfNecessary(pairInfoData?.apr.toString() || '0', 2)}
          amountInUsdt={bondAmountInUsdt}
        />
        {(() => {
          let disableMsg: string;
          if (bondAmount <= 0) disableMsg = 'Enter an amount';
          if (bondAmount > lpTokenBalance) disableMsg = `Insufficient LP token balance`;

          const disabled = actionLoading || bondAmount <= 0 || bondAmount > lpTokenBalance;
          return (
            <div className={cx('btn-confirm')}>
              <Button onClick={() => handleBond(bondAmount)} type="primary" disabled={disabled}>
                {actionLoading && <Loader width={22} height={22} />}
                {disableMsg || 'Stake'}
              </Button>
            </div>
          );
        })()}
      </div>
    </Modal>
  );
};
