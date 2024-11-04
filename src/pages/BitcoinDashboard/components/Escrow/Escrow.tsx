import useConfigReducer from 'hooks/useConfigReducer';
import styles from './Escrow.module.scss';
import { toDisplay } from '@oraichain/oraidex-common';
import { Button } from 'components/Button';
import Loader from 'components/Loader';
import { useContext, useState } from 'react';
import { displayToast, TToastType } from 'components/Toasts/Toast';
import { handleErrorTransaction } from 'helper';
import { useGetEscrowBalance } from 'pages/BitcoinDashboard/hooks';
import { OraiBTCBridgeNetwork } from 'config/chainInfos';
import { fromBech32, toBech32 } from '@cosmjs/encoding';
import { NomicContext } from 'context/nomic-context';
import { SigningStargateClient } from '@cosmjs/stargate';
import { coin, StdFee } from '@cosmjs/amino';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { collectWallet } from 'libs/cosmjs';
import { calculateTimeoutTimestamp, IBC_TRANSFER_TIMEOUT } from '@oraichain/oraidex-common';
import { OraiBtcSubnetChain } from 'libs/nomic/models/ibc-chain';

const Escrow = () => {
  const [address] = useConfigReducer('address');
  const [loading, setLoading] = useState<boolean>(false);
  const data = useGetEscrowBalance(deriveNomicAddress(address));
  const nomic = useContext(NomicContext);

  function deriveNomicAddress(addr: string) {
    if (!addr) {
      return undefined;
    }
    const address = fromBech32(addr);
    return toBech32(OraiBTCBridgeNetwork.bech32Config.bech32PrefixAccAddr, address.data);
  }

  const handleClaim = async () => {
    setLoading(true);
    displayToast(TToastType.TX_BROADCASTING);
    try {
      const btcAddr = await window.Bitcoin.getAddress();
      if (!btcAddr) throw Error('Not found your bitcoin address!');
      // @ts-ignore-check
      const oraiBtcAddress = deriveNomicAddress(address);
      const timeoutTimestampSeconds = calculateTimeoutTimestamp(IBC_TRANSFER_TIMEOUT);
      if (btcAddr && oraiBtcAddress) {
        const signer = await collectWallet(OraiBTCBridgeNetwork.chainId);
        const client = await SigningStargateClient.connectWithSigner(OraiBTCBridgeNetwork.rpc, signer);

        const accountInfo = await nomic.getAccountInfo(oraiBtcAddress);

        const ibcTransferMsg = {
          typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
          value: {
            sourcePort: OraiBtcSubnetChain.source.port,
            sourceChannel: OraiBtcSubnetChain.source.channelId,
            sender: oraiBtcAddress,
            receiver: address,
            token: coin((data?.escrow_balance || 0).toString(), OraiBtcSubnetChain.source.nBtcIbcDenom),
            timeoutHeight: undefined,
            timeoutTimestamp: timeoutTimestampSeconds
          }
        };
        const txRaw = await client.sign(
          oraiBtcAddress,
          [ibcTransferMsg],
          {
            amount: [coin('0', OraiBTCBridgeNetwork.stakeCurrency.coinMinimalDenom)],
            gas: '20000000'
          } as StdFee,
          '',
          {
            accountNumber: 0,
            chainId: OraiBTCBridgeNetwork.chainId,
            sequence: accountInfo?.account?.sequence
          }
        );

        const txBytes = TxRaw.encode(txRaw).finish();
        const result = await client.broadcastTx(txBytes);

        if (result.code === 0) {
          displayToast(TToastType.TX_SUCCESSFUL);
        } else {
          displayToast(TToastType.TX_FAILED);
        }
      }
    } catch (error) {
      console.log('error in claim: ', error);
      handleErrorTransaction(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.escrow}>
      <h3 className={styles.escrow_title}>Escrow:</h3>
      <div className={styles.stakeInfo}>
        <div className={styles.info}>
          <div className={styles.item}>
            <div className={styles.title}>Total Stucked BTC Amount:</div>
            <div className={styles.usd}>{toDisplay((data?.escrow_balance || 0).toString(), 14)} BTC</div>
          </div>
        </div>

        <div className={styles.itemBtn}>
          <Button type="primary" onClick={() => handleClaim()} disabled={loading || !(data?.escrow_balance > 0)}>
            {loading && <Loader width={22} height={22} />}&nbsp;
            <span>Claim</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Escrow;
