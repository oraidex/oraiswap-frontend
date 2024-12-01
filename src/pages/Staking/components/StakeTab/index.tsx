import { ORAI, toAmount } from '@oraichain/oraidex-common';
import { TToastType, displayToast } from 'components/Toasts/Toast';
import { handleCheckAddress, handleErrorTransaction } from 'helper';
import useConfigReducer from 'hooks/useConfigReducer';
import { useLoadOraichainTokens } from 'hooks/useLoadTokens';
import { network } from 'index';
import CosmJs from 'libs/cosmjs';
import { ORAIX_TOKEN_INFO } from 'pages/Staking/constants';
import { useGetMyStakeRewardInfo, useGetStakeInfo } from 'pages/Staking/hooks';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Type, generateMiningMsgs } from 'rest/api';
import { RootState } from 'store/configure';
import InputBalance from '../InputBalance';
import styles from './index.module.scss';

const StakeTab = () => {
  const [address] = useConfigReducer('address');
  const amounts = useSelector((state: RootState) => state.token.amounts);
  const loadOraichainToken = useLoadOraichainTokens();

  const balance = amounts['oraix'];
  const [amount, setAmount] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);

  const { refetchStakeInfo } = useGetStakeInfo(ORAIX_TOKEN_INFO.contractAddress);
  const { refetchMyStakeRewardInfo } = useGetMyStakeRewardInfo(ORAIX_TOKEN_INFO.contractAddress, address);

  const handleBond = async () => {
    if (!amount) return displayToast(TToastType.TX_FAILED, { message: 'Stake Amount is required' });

    setLoading(true);
    displayToast(TToastType.TX_BROADCASTING);
    try {
      const oraiAddress = await handleCheckAddress('Oraichain');

      // generate bonding msg
      const msg = generateMiningMsgs({
        type: Type.BOND_STAKING_CW20,
        sender: oraiAddress,
        amount: toAmount(amount).toString(),
        lpAddress: ORAIX_TOKEN_INFO.contractAddress
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

        refetchMyStakeRewardInfo();
        refetchStakeInfo();
        loadOraichainToken(address, [ORAIX_TOKEN_INFO.contractAddress]);
      }
    } catch (error) {
      console.log('error in bond: ', error);
      handleErrorTransaction(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.stakeTab}>
      <InputBalance loading={loading} onSubmit={handleBond} balance={balance} amount={amount} setAmount={setAmount} />
    </div>
  );
};

export default StakeTab;
