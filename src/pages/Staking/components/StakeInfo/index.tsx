import { CW20_STAKING_CONTRACT, ORAI, TokenItemType, calculateMinReceive, toDisplay } from '@oraichain/oraidex-common';
import OraiXIcon from 'assets/icons/oraix.svg?react';
import OraiXLightIcon from 'assets/icons/oraix_light.svg?react';
import UsdcIcon from 'assets/icons/usd_coin.svg?react';
import useConfigReducer from 'hooks/useConfigReducer';
import { Cw20StakingClient, OraiswapRouterQueryClient } from '@oraichain/oraidex-contracts-sdk';
import { Type, UniversalSwapHelper } from '@oraichain/oraidex-universal-swap';
import { Button } from 'components/Button';
import Loader from 'components/Loader';
import { TToastType, displayToast } from 'components/Toasts/Toast';
import { handleErrorTransaction } from 'helper';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import { useLoadOraichainTokens } from 'hooks/useLoadTokens';
import { flattenTokens, network, oraichainTokens } from 'initCommon';
import CosmJs from 'libs/cosmjs';
import { getUsd } from 'libs/utils';
import { formatDisplayUsdt, numberWithCommas } from 'pages/Pools/helpers';
import { ORAIX_TOKEN_INFO, USDC_TOKEN_INFO } from 'pages/Staking/constants';
import { useGetLockInfo, useGetMyStakeRewardInfo } from 'pages/Staking/hooks';
import { getRouterConfig } from 'pages/UniversalSwap/Swap/hooks';
import { useEffect, useState } from 'react';
import { generateContractMessages, generateMiningMsgs } from 'rest/api';
import CompoundModal from '../CompoundModal';
import styles from './index.module.scss';

const StakeInfo = () => {
  const [theme] = useConfigReducer('theme');
  const [address] = useConfigReducer('address');
  const { data: prices } = useCoinGeckoPrices();
  const loadOraichainToken = useLoadOraichainTokens();
  const { myStakeRewardInfo, refetchMyStakeRewardInfo } = useGetMyStakeRewardInfo(
    ORAIX_TOKEN_INFO.contractAddress,
    address
  );
  const { lockInfo, refetchLockInfo } = useGetLockInfo(ORAIX_TOKEN_INFO.contractAddress, address);

  const stakedAmount = myStakeRewardInfo?.stakedAmount || '0';
  const reward = myStakeRewardInfo?.rewardPending || '0';
  const USDC_TOKEN = USDC_TOKEN_INFO as TokenItemType;
  const ORAIX_TOKEN = ORAIX_TOKEN_INFO as TokenItemType;

  const stakeAmountUsd = getUsd(stakedAmount, ORAIX_TOKEN, prices);
  const rewardUsd = getUsd(reward, USDC_TOKEN, prices);
  const [openCompound, setOpenCompound] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingCompound, setLoadingCompound] = useState<boolean>(false);
  const [estOraixSwap, setEstOraixSwap] = useState<number>(0);

  const routerClient = new OraiswapRouterQueryClient(window.client, network.mixer_router);

  useEffect(() => {
    (async () => {
      const simulateData = await UniversalSwapHelper.handleSimulateSwap({
        flattenTokens: flattenTokens,
        oraichainTokens: oraichainTokens,
        originalFromInfo: USDC_TOKEN,
        originalToInfo: ORAIX_TOKEN,
        originalAmount: toDisplay(reward),
        routerClient,
        routerOption: {
          useIbcWasm: true
        },
        routerConfig: getRouterConfig()
      });

      setEstOraixSwap(simulateData?.displayAmount || 0);
    })();
  }, [openCompound]);

  const handleClaim = async () => {
    // if (!amount) return displayToast(TToastType.TX_FAILED, { message: 'Stake Amount is required' });

    setLoading(true);
    displayToast(TToastType.TX_BROADCASTING);
    try {
      const cw20StakingClient = new Cw20StakingClient(window.client, address, network.staking_oraix);

      const result = await cw20StakingClient.withdraw({
        stakingToken: ORAIX_TOKEN_INFO.contractAddress
      });

      if (result) {
        displayToast(TToastType.TX_SUCCESSFUL, {
          customLink: `${network.explorer}/tx/${result.transactionHash}`
        });
        loadOraichainToken(address, [USDC_TOKEN_INFO.contractAddress]);
        refetchMyStakeRewardInfo();
        refetchLockInfo();
      }
    } catch (error) {
      console.log('error in claim: ', error);
      handleErrorTransaction(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompoundStaking = async () => {
    setLoadingCompound(true);
    displayToast(TToastType.TX_BROADCASTING);
    try {
      const msgClaim = {
        contractAddress: CW20_STAKING_CONTRACT,
        msg: {
          withdraw: {
            staking_token: ORAIX_TOKEN_INFO.contractAddress
          }
        }
      };

      const [averageRatioData] = await Promise.all([
        UniversalSwapHelper.handleSimulateSwap({
          flattenTokens: flattenTokens,
          oraichainTokens: oraichainTokens,
          originalFromInfo: USDC_TOKEN,
          originalToInfo: ORAIX_TOKEN,
          originalAmount: 1,
          routerClient,
          routerOption: {
            useIbcWasm: true
          },
          routerConfig: getRouterConfig()
        })
      ]);

      const slippage = 2;
      const minimumReceive = calculateMinReceive(averageRatioData.amount, reward, slippage, USDC_TOKEN.decimals);

      const msgSwap = generateContractMessages({
        type: Type.SWAP,
        fromInfo: USDC_TOKEN,
        toInfo: ORAIX_TOKEN,
        amount: reward,
        sender: address,
        minimumReceive
      });

      const msgStake = generateMiningMsgs({
        type: Type.BOND_STAKING_CW20,
        sender: address,
        amount: minimumReceive,
        lpAddress: ORAIX_TOKEN_INFO.contractAddress
      });

      const result = await CosmJs.executeMultiple({
        msgs: [msgClaim, msgSwap, msgStake],
        walletAddr: address,
        gasAmount: { denom: ORAI, amount: '0' }
      });
      console.log('result tx hash: ', result);

      if (result) {
        console.log('in correct result');
        displayToast(TToastType.TX_SUCCESSFUL, {
          customLink: `${network.explorer}/tx/${result.transactionHash}`
        });

        loadOraichainToken(address, [USDC_TOKEN_INFO.contractAddress, ORAIX_TOKEN_INFO.contractAddress]);
        refetchMyStakeRewardInfo();
        refetchLockInfo();
        setOpenCompound(false);
      }
    } catch (error) {
      console.log('error in com: ', error);
      handleErrorTransaction(error);
    } finally {
      setLoadingCompound(false);
    }
  };

  return (
    <div className={styles.stakeInfo}>
      <div className={styles.info}>
        <div className={styles.item}>
          <div className={styles.title}>Staked Amount</div>

          <div className={styles.usd}>{formatDisplayUsdt(stakeAmountUsd)}</div>

          <div className={styles.value}>
            {theme === 'light' ? <OraiXLightIcon /> : <OraiXIcon />}
            <span>{numberWithCommas(toDisplay(stakedAmount))} ORAIX</span>
          </div>
        </div>

        <div className={styles.item}>
          <div className={styles.title}>Claimable Rewards</div>

          <div className={styles.usd}>{formatDisplayUsdt(rewardUsd)}</div>

          <div className={styles.value}>
            <UsdcIcon />
            <span>{numberWithCommas(toDisplay(reward))} USDC</span>
          </div>
        </div>
      </div>

      <div className={styles.itemBtn}>
        <Button
          type="primary"
          // onClick={() => handleCompoundStaking()}
          onClick={() => setOpenCompound(true)}
          disabled={loadingCompound || toDisplay(reward) <= 0}
        >
          {loadingCompound && <Loader width={22} height={22} />}&nbsp;
          <span>Compound</span>
        </Button>
        <button className={styles.claim} onClick={() => handleClaim()} disabled={loading || toDisplay(reward) <= 0}>
          {/* {loading && <Loader width={22} height={22} />} */}
          <span>Claim Rewards</span>
        </button>
      </div>

      <CompoundModal
        loading={loadingCompound}
        onClose={() => setOpenCompound(false)}
        open={openCompound}
        onConfirm={() => handleCompoundStaking()}
        reward={numberWithCommas(toDisplay(String(reward)), undefined, { maximumFractionDigits: 6 })}
        oraixAmount={numberWithCommas(estOraixSwap, undefined, { maximumFractionDigits: 6 })}
        estOraixSwap={estOraixSwap}
      />
    </div>
  );
};

export default StakeInfo;
