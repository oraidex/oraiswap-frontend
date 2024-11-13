import useConfigReducer from 'hooks/useConfigReducer';
import styles from './RefundBTC.module.scss';
import { chainInfos, oraichainTokensWithIcon, parseAssetInfo, toDisplay } from '@oraichain/oraidex-common';
import { Button } from 'components/Button';
import Loader from 'components/Loader';
import { useEffect, useState } from 'react';
import { displayToast, TToastType } from 'components/Toasts/Toast';
import { handleErrorTransaction } from 'helper';
import { AssetInfo, RefundBtcClient } from '@oraichain/oraidex-contracts-sdk';
import { oraichainTokens } from 'config/bridgeTokens';
import useTheme from 'hooks/useTheme';
import { TokenIcon, tokensIconInfos } from 'config/iconInfos';
import { formatUnits } from 'ethers/lib/utils';
import { DeliverTxResponse, isDeliverTxFailure } from '@cosmjs/stargate';

const REFUND_BTC_CONTRACT_ADDRESS = 'orai1c4lm5luwfx3078k5uqt6lg8xgawz9v4vaafhtz7xnn2e96ndhmdsqq8gd6';

interface RewardTokenInfo {
  info: AssetInfo;
  amount: string;
}

const RefundBTC = () => {
  const [address] = useConfigReducer('address');
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [rewardTokens, setRewardTokens] = useState<RewardTokenInfo[]>([]);

  console.log({
    oraichainTokens
  });

  const handleClaim = async () => {
    setLoading(true);
    displayToast(TToastType.TX_BROADCASTING);
    try {
      const refundBTCClient = new RefundBtcClient(window.client, address, REFUND_BTC_CONTRACT_ADDRESS);
      const result = await refundBTCClient.claim('auto', '', []);
      displayToast(TToastType.TX_SUCCESSFUL, {
        customLink: `https://scan.orai.io/txs/${result.transactionHash}`
      });
    } catch (error) {
      console.log('error in claim: ', error);
      handleErrorTransaction(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const refundBTCClient = new RefundBtcClient(window.client, address, REFUND_BTC_CONTRACT_ADDRESS);
      const rewardTokens = (await refundBTCClient.rewardTokens({
        addr: address
      })) as any;
      setRewardTokens(rewardTokens);
    })();
  }, [address]);

  return (
    <div className={styles.escrow}>
      <h3 className={styles.escrow_title}>Refund BTC:</h3>
      <div className={styles.stakeInfo}>
        <div className={styles.info}>
          <div className={styles.item}>
            <div className={styles.title}>Claimable your tokens from unwithdrawal LPs:</div>
            {rewardTokens
              .map((item, index) => {
                const denom = parseAssetInfo(item.info);
                const tokenDetailInfo = oraichainTokens.find(
                  (token) => token.denom === denom || token.contractAddress === denom
                );
                if (!tokenDetailInfo) {
                  return null;
                }
                const iconImage = tokensIconInfos.find(
                  (item) => item.coinGeckoId === tokenDetailInfo.coinGeckoId
                ) as TokenIcon;
                console.log({ iconImage }, { tokenDetailInfo });
                const lightIcon = iconImage?.IconLight || iconImage.Icon;
                const darkIcon = iconImage.Icon;
                const Icon = (theme === 'light' ? lightIcon : darkIcon) as any;
                return (
                  <div key={index} className={styles.usd}>
                    <div className={styles.balance}>
                      <Icon height={40} width={40} />
                      {formatUnits(item.amount, tokenDetailInfo?.decimals || 0)} {tokenDetailInfo?.name}
                    </div>
                  </div>
                );
              })
              .filter((item) => !!item)}
            {/* <div className={styles.usd}>{toDisplay((data?.escrow_balance || 0).toString(), 14)} BTC</div> */}
          </div>
        </div>

        <div className={styles.itemBtn}>
          <Button type="primary" onClick={() => handleClaim()} disabled={loading || rewardTokens.length === 0}>
            {loading && <Loader width={22} height={22} />}&nbsp;
            <span>Claim</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RefundBTC;
