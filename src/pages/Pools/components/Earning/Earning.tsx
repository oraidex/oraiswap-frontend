import { CW20_DECIMALS, ORAI, TokenItemType, toDisplay } from '@oraichain/oraidex-common';
import classNames from 'classnames';
import { Button } from 'components/Button';
import Loader from 'components/Loader';
import { TToastType, displayToast } from 'components/Toasts/Toast';
import TokenBalance from 'components/TokenBalance';
import { handleErrorTransaction } from 'helper';
import useConfigReducer from 'hooks/useConfigReducer';
import useTheme from 'hooks/useTheme';
import { cw20TokenMap, network, tokenMap } from 'initCommon';
import CosmJs from 'libs/cosmjs';
import { getUsd } from 'libs/utils';
import { isEqual } from 'lodash';
import { useGetMyStake, useGetPoolDetail, useGetRewardInfoDetail, xOCH_PRICE } from 'pages/Pools/hooks';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Type, fetchTokenInfo, generateMiningMsgs } from 'rest/api';
import { WithdrawLP } from 'types/pool';
import styles from './Earning.module.scss';

type TokenItemTypeExtended = TokenItemType & {
  amount: bigint;
  pendingWithdraw: bigint;
};
export const Earning = ({ onLiquidityChange }: { onLiquidityChange: () => void }) => {
  let { poolUrl } = useParams();
  const theme = useTheme();
  const [address] = useConfigReducer('address');
  const [cachePrices] = useConfigReducer('coingecko');
  const [pendingRewards, setPendingRewards] = useState<TokenItemTypeExtended[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const poolDetailData = useGetPoolDetail({ pairDenoms: poolUrl });
  const { myStakes } = useGetMyStake({
    stakerAddress: address,
    pairDenoms: poolUrl
  });

  const { info } = poolDetailData;

  const { totalRewardInfoData, refetchRewardInfo } = useGetRewardInfoDetail({
    stakerAddr: address,
    poolInfo: poolDetailData.info
  });

  useEffect(() => {
    if (totalRewardInfoData && info) {
      setNewReward();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalRewardInfoData, info]);

  const setNewReward = async () => {
    const rewardPerSecInfoData = JSON.parse(info?.rewardPerSec || '{"assets": []}');
    const totalRewardAmount = BigInt(totalRewardInfoData?.reward_infos[0]?.pending_reward ?? 0);
    // unit LP
    const rewardPerSecInfoDataIsArray = rewardPerSecInfoData.assets && Array.isArray(rewardPerSecInfoData.assets);
    const totalRewardPerSec =
      rewardPerSecInfoDataIsArray &&
      rewardPerSecInfoData.assets.map((asset) => BigInt(asset.amount)).reduce((a, b) => a + b, BigInt(0));

    const result =
      rewardPerSecInfoDataIsArray &&
      rewardPerSecInfoData.assets
        // .filter((asset) => parseInt(asset.amount))
        .map(async (asset) => {
          const pendingWithdraw = BigInt(
            totalRewardInfoData.reward_infos[0]?.pending_withdraw.find((e) => isEqual(e.info, asset.info))?.amount ?? 0
          );

          const amount =
            (!totalRewardPerSec ? 0n : (totalRewardAmount * BigInt(asset.amount)) / totalRewardPerSec) +
            pendingWithdraw;
          let token =
            'token' in asset.info
              ? cw20TokenMap[asset.info.token.contract_addr]
              : tokenMap[asset.info.native_token.denom];

          // only for atom/scatom pool
          if (!token && 'token' in asset.info && asset.info?.token?.contract_addr) {
            const tokenInfo = await fetchTokenInfo({
              contractAddress: asset.info.token.contract_addr,
              name: '',
              org: 'Oraichain',
              denom: '',
              Icon: undefined,
              chainId: 'Oraichain',
              rpc: '',
              decimals: 0,
              coinGeckoId: 'scatom',
              cosmosBased: undefined,
              icon: undefined
            });

            token = {
              ...tokenInfo,
              denom: tokenInfo?.symbol
            };
          }
          return {
            ...token,
            amount,
            pendingWithdraw
          };
        });

    const res = await Promise.all(result);
    setPendingRewards(res);
  };

  const onBondingAction = () => {
    refetchRewardInfo();
    onLiquidityChange();
  };

  const handleClaimReward = async () => {
    if (!poolDetailData || !poolDetailData.info)
      return displayToast(TToastType.TX_FAILED, { message: 'Pool information does not exist' });

    setActionLoading(true);
    displayToast(TToastType.TX_BROADCASTING);
    try {
      const msg = generateMiningMsgs({
        type: Type.WITHDRAW_LIQUIDITY_MINING,
        sender: address,
        lpAddress: poolDetailData.info.liquidityAddr
      } as WithdrawLP);

      const result = await CosmJs.execute({
        address: msg.contractAddress,
        walletAddr: address,
        handleMsg: msg.msg,
        gasAmount: { denom: ORAI, amount: '0' },
        funds: msg.funds
      });

      if (result) {
        displayToast(TToastType.TX_SUCCESSFUL, {
          customLink: `${network.explorer}/txs/${result.transactionHash}`
        });
        onBondingAction();
      }
    } catch (error) {
      console.log('error when claim reward: ', error);
      handleErrorTransaction(error);
    } finally {
      setActionLoading(false);
    }
  };

  const generateIcon = (pendingReward: TokenItemTypeExtended) => {
    return pendingReward.Icon ? (
      theme === 'light' ? (
        pendingReward.IconLight ? (
          <pendingReward.IconLight style={{ width: 18, marginRight: 6 }} />
        ) : (
          <pendingReward.Icon style={{ width: 18, marginRight: 6 }} />
        )
      ) : (
        <pendingReward.Icon style={{ width: 18, marginRight: 6 }} />
      )
    ) : (
      <></>
    );
  };
  const disabledClaim = actionLoading || !pendingRewards.some((pendingReward) => pendingReward.amount !== 0n);

  const totalEarned = myStakes[0]?.earnAmountInUsdt || 0;

  const { liquidityAddr: stakingToken } = poolDetailData.info || {};
  const [cachedReward] = useConfigReducer('rewardPools');
  let poolReward = {
    reward: []
  };

  if (cachedReward && cachedReward.length > 0) {
    poolReward = cachedReward.find((item) => item.liquidity_token === stakingToken);
  }

  return (
    <div className={styles.earningWrapper}>
      <section className={styles.earning}>
        <div className={styles.earningLeft}>
          <div className={`${styles.assetEarning}${' '}${pendingRewards.length === 1 ? styles.single : ''}`}>
            <div className={styles.title}>
              <span>Total Earned</span>
            </div>
            <div className={classNames(styles.amount, styles.total)}>
              <TokenBalance
                balance={toDisplay(BigInt(Math.trunc(totalEarned)), CW20_DECIMALS)}
                prefix="$"
                decimalScale={4}
              />
            </div>
          </div>
          {pendingRewards.length > 0 &&
            pendingRewards
              .sort((a, b) => a.denom.localeCompare(b.denom))
              .map((pendingReward, idx) => {
                return (
                  <div className={styles.assetEarning} key={idx}>
                    <div className={styles.title}>
                      {generateIcon(pendingReward)}
                      <span>{pendingReward.name.toUpperCase()} Earning</span>
                    </div>
                    <div className={styles.amountWrapper}>
                      <div className={styles.amount}>
                        <TokenBalance
                          balance={getUsd(
                            pendingReward.amount,
                            pendingReward,
                            cachePrices,
                            pendingReward.coinGeckoId === 'scatom' && xOCH_PRICE
                          )}
                          prefix="$"
                          decimalScale={4}
                        />
                      </div>
                      <div className={styles.amountOrai}>
                        <TokenBalance
                          balance={{
                            amount: pendingReward.amount,
                            denom: pendingReward?.name.toUpperCase(),
                            decimals: 6
                          }}
                          decimalScale={6}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>

        <div className={styles.claim}>
          <Button
            type="primary"
            onClick={() => handleClaimReward()}
            disabled={disabledClaim}
            icon={actionLoading ? <Loader width={20} height={20} /> : null}
          >
            Claim Rewards
          </Button>
        </div>
      </section>
    </div>
  );
};
