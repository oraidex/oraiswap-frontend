import { ORAI, toAmount } from '@oraichain/oraidex-common';
import CloseIcon from 'assets/icons/ic_close_modal.svg?react';
import cn from 'classnames/bind';
import { Button } from 'components/Button';
import Loader from 'components/Loader';
import Modal from 'components/Modal';
import { displayToast, TToastType } from 'components/Toasts/Toast';
import TokenBalance from 'components/TokenBalance';
import { network } from 'config/networks';
import { handleCheckAddress, handleErrorTransaction } from 'helper';
import useConfigReducer from 'hooks/useConfigReducer';
import CosmJs from 'libs/cosmjs';
import { useGetPoolDetail } from 'pages/Pools/hooks';
import { useGetPairInfo } from 'pages/Pools/hooks/useGetPairInfo';
import { FC, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { generateContractMessages, Type } from 'rest/api';
import { RootState } from 'store/configure';
import InputWithOptionPercent from '../InputWithOptionPercent';
import { ModalProps } from '../MyPoolInfo/type';
import styles from './WithdrawLiquidityModal.module.scss';

const cx = cn.bind(styles);

export const WithdrawLiquidityModal: FC<ModalProps> = ({
  isOpen,
  close,
  open,
  onLiquidityChange,
  myLpUsdt,
  myLpBalance
}) => {
  const [theme] = useConfigReducer('theme');
  const { poolUrl } = useParams();
  const poolDetail = useGetPoolDetail({ pairDenoms: poolUrl });

  const { token1, token2, info: pairInfoData } = poolDetail;
  const { lpTokenInfoData, pairAmountInfoData } = useGetPairInfo(poolDetail);
  const lpPools = useSelector((state: RootState) => state.token.lpPools);
  const [lpAmountBurn, setLpAmountBurn] = useState<bigint | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const lpTokenBalance = BigInt(pairInfoData ? lpPools[pairInfoData?.liquidityAddr]?.balance ?? '0' : 0);
  const token1Amount = BigInt(pairAmountInfoData?.token1Amount || 0);
  const token2Amount = BigInt(pairAmountInfoData?.token2Amount || 0);

  const handleWithdrawLiquidity = async (amount: string) => {
    if (!pairInfoData) return;
    setActionLoading(true);
    displayToast(TToastType.TX_BROADCASTING);
    try {
      const oraiAddress = await handleCheckAddress('Oraichain');

      const msg = generateContractMessages({
        type: Type.WITHDRAW,
        sender: oraiAddress,
        lpAddr: lpTokenInfoData!.contractAddress!,
        amount,
        pair: pairInfoData.pairAddr
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
          customLink: `${network.explorer}/txs/${result.transactionHash}`
        });
        setLpAmountBurn(0n);
        onLiquidityChange(-lpAmountBurnUsdt);
      }
    } catch (error) {
      console.log('error in Withdraw Liquidity: ', error);
      handleErrorTransaction(error);
    } finally {
      setActionLoading(false);
    }
  };

  const Token1Icon = theme === 'light' ? token1?.IconLight || token1?.Icon : token1?.Icon;
  const Token2Icon = theme === 'light' ? token2?.IconLight || token2?.Icon : token2?.Icon;

  const totalSupply = BigInt(lpTokenInfoData?.total_supply || 0);
  const lp1BurnAmount =
    totalSupply === BigInt(0) || !lpAmountBurn ? BigInt(0) : (token1Amount * BigInt(lpAmountBurn)) / totalSupply;
  const lp2BurnAmount =
    totalSupply === BigInt(0) || !lpAmountBurn ? BigInt(0) : (token2Amount * BigInt(lpAmountBurn)) / totalSupply;
  const lpAmountBurnUsdt = !myLpBalance ? 0 : (Number(lpAmountBurn) / Number(myLpBalance)) * Number(myLpUsdt);
  return (
    <Modal isOpen={isOpen} close={close} open={open} isCloseBtn={false} className={cx('modal')}>
      <div className={cx('container', theme)}>
        <div className={cx('header')}>
          <div className={cx('title', theme)}>Withdraw LP</div>
          <div className={cx('btn-group')}>
            <div className={cx('btn-close')} onClick={close}>
              <CloseIcon />
            </div>
          </div>
        </div>

        <InputWithOptionPercent
          onValueChange={({ floatValue }) => {
            if (floatValue === undefined) setLpAmountBurn(null);
            else setLpAmountBurn(toAmount(floatValue, lpTokenInfoData?.decimals));
          }}
          value={lpAmountBurn}
          token={lpTokenInfoData}
          setAmountFromPercent={setLpAmountBurn}
          totalAmount={lpTokenBalance}
          prefixText="Token Balance: "
          amountInUsdt={lpAmountBurnUsdt}
        />

        <div className={cx('detail')}>
          <div className={cx('row', theme)}>
            <div className={cx('row-title')}>
              <span>Receive</span>
            </div>
            <div className={cx('row-amount')}>
              <div className={cx('token')}>
                {Token1Icon && <Token1Icon className={cx('logo')} />}
                <div className={cx('title', theme)}>
                  <div>{token1?.name}</div>
                  <div className={cx('des')}>Oraichain</div>
                </div>
              </div>
              <div className={cx('input-amount')}>
                <TokenBalance
                  balance={{
                    amount: lp1BurnAmount,
                    decimals: token1?.decimals
                  }}
                  decimalScale={6}
                />
              </div>
            </div>
            <div className={cx('row-amount')}>
              <div className={cx('token')}>
                {Token2Icon && <Token2Icon className={cx('logo')} />}
                <div className={cx('title', theme)}>
                  <div>{token2?.name}</div>
                  <div className={cx('des')}>Oraichain</div>
                </div>
              </div>
              <div className={cx('input-amount')}>
                <TokenBalance
                  balance={{
                    amount: lp2BurnAmount,
                    decimals: token2?.decimals
                  }}
                  decimalScale={6}
                />
              </div>
            </div>
          </div>
        </div>
        {(() => {
          let disableMsg: string;
          if (lpAmountBurn <= 0) disableMsg = 'Enter an amount';
          if (lpAmountBurn > lpTokenBalance) disableMsg = `Insufficient LP token balance`;

          const disabled = actionLoading || !lpTokenInfoData || !pairInfoData || !!disableMsg;
          return (
            <div className={cx('btn-confirm')}>
              <Button
                onClick={() => handleWithdrawLiquidity(lpAmountBurn.toString())}
                type="primary"
                disabled={disabled}
              >
                {actionLoading && <Loader width={22} height={22} />}
                {disableMsg || 'Confirm'}
              </Button>
            </div>
          );
        })()}
      </div>
    </Modal>
  );
};
