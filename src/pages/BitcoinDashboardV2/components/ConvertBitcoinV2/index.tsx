import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import React, { useContext, useEffect, useState } from 'react';
import styles from './index.module.scss';
import { formatDisplayUsdt, numberWithCommas } from 'helper/format';
import { calculateTimeoutTimestamp, toAmount, toDisplay } from '@oraichain/oraidex-common';
import { ReactComponent as BitcoinIcon } from 'assets/icons/bitcoin.svg';
import { getUsd } from 'libs/utils';
import Loader from 'components/Loader';
import { Button } from 'components/Button';
import NumberFormat from 'react-number-format';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configure';
import { CwBitcoinContext } from 'context/cw-bitcoin-context';
import { Decimal } from '@cosmjs/math';
import { OBTCContractAddress, OraiBtcSubnetChain, OraichainChain } from 'libs/nomic/models/ibc-chain';
import { DeliverTxResponse, toBinary } from '@cosmjs/cosmwasm-stargate';
import { isDeliverTxFailure } from '@cosmjs/stargate';
import { displayToast, TToastType } from 'components/Toasts/Toast';
import { getStorageKey, handleErrorTransaction } from 'helper';
import { useDepositFeesBitcoinV2, useGetWithdrawlFeesBitcoin } from 'pages/Balance/helpers';
import { useRelayerFeeToken } from 'hooks/useTokenFee';
import { btcTokens, oraichainTokens } from 'config/bridgeTokens';
import { PendingWithdraws } from 'pages/BitcoinDashboard/components/PendingWithdraws';
import { useGetPendingDeposits } from 'pages/BitcoinDashboardV2/hooks';

export const BTC_TOKEN = oraichainTokens.find((e) => e.coinGeckoId === 'bitcoin');
const ConvertBitcoinV2: React.FC<{}> = ({}) => {
  const cwBitcoinContext = useContext(CwBitcoinContext);
  const { relayerFee } = useRelayerFeeToken(
    btcTokens.find((item) => item.name === 'BTC'),
    oraichainTokens.find((item) => item.name === 'BTC')
  );
  const withdrawFeeBtc = useGetWithdrawlFeesBitcoin({
    enabled: true,
    bitcoinAddress: cwBitcoinContext?.depositAddress?.bitcoinAddress
  });
  const depositFeeV2Btc = useDepositFeesBitcoinV2(true);
  const [oraiAddress] = useConfigReducer('address');
  const PENDING_WITHDRAW_STORAGE_KEY = `PENDING_WITHDRAW_${oraiAddress}`;
  const amounts = useSelector((state: RootState) => state.token.amounts);
  const [coeff, setCoeff] = useState(0);
  const { data: prices } = useCoinGeckoPrices();
  const [amount, setAmount] = useState<number>(0);
  const amountUSD = getUsd(toAmount(amount), BTC_TOKEN, prices);
  const [loading, setLoading] = useState<boolean>(false);
  const [fee, setFee] = useState<number>(0);
  const [cachePendingWithdrawAddrs, setCachePendingWithdrawAddrs] = useState<string[]>([]);
  let label = 'Balance';
  let balance = amounts['usat'] ?? '0';

  const processTxResult = (rpc: string, result: DeliverTxResponse, customLink?: string) => {
    if (isDeliverTxFailure(result)) {
      displayToast(TToastType.TX_FAILED, {
        message: result.rawLog
      });
    } else {
      displayToast(TToastType.TX_SUCCESSFUL, {
        customLink: customLink ?? `${rpc}/tx?hash=0x${result.transactionHash}`
      });
    }
  };

  const handleConvertBTC = async () => {
    if (amount < fee) {
      displayToast(TToastType.TX_FAILED, {
        message: 'Amount must be greater than fee!'
      });
      return;
    }
    setLoading(true);
    try {
      const { bitcoinAddress: address } = cwBitcoinContext.depositAddress;
      if (!address) throw Error('BTC V2 deposit address is not found!');
      const destinationAddress = await window.Keplr.getKeplrAddr(OraiBtcSubnetChain.chainId as any);
      if (!destinationAddress) throw Error('Not found your oraibtc-subnet address!');
      const DEFAULT_TIMEOUT = 60 * 60 * 5;
      const amountInput = BigInt(
        Decimal.fromUserInput(toAmount(amount.toString(), 6).toString(), 8).atomics.toString()
      );
      const transferAmount = Decimal.fromAtomics(amountInput.toString(), 8).toString();
      const result = await window.client.execute(
        oraiAddress,
        OBTCContractAddress,
        {
          send: {
            contract: OraichainChain.source.port.split('.')[1],
            amount: transferAmount,
            msg: toBinary({
              local_channel_id: OraichainChain.source.channelId,
              remote_address: destinationAddress,
              remote_denom: OraichainChain.source.nBtcIbcDenom,
              timeout: Number(calculateTimeoutTimestamp(DEFAULT_TIMEOUT)),
              memo: `withdraw:${address}`
            })
          }
        },
        'auto'
      );
      processTxResult(
        'https://rpc.orai.io',
        // @ts-ignore-check
        result,
        '/bitcoin-dashboard?tab=pending_withdraws'
      );
    } catch (err) {
      console.log('handleConvertBTC', err);
      handleErrorTransaction(err, {
        tokenName: 'BTC',
        chainName: 'Oraichain'
      });
    } finally {
      setLoading(false);
      const value = JSON.parse(getStorageKey(PENDING_WITHDRAW_STORAGE_KEY) ?? '[]');
      value.push(cwBitcoinContext.depositAddress?.bitcoinAddress);
      setCachePendingWithdrawAddrs(value);
      localStorage.setItem(PENDING_WITHDRAW_STORAGE_KEY, JSON.stringify(value));
    }
  };

  // const getBitcoinAddress = async (txid: string, vout: number): Promise<string> => {
  //   const data = await fetch(`https://blockstream.info/api/tx/${txid}`).then((res) => res.json());
  //   return data.vout[vout].scriptpubkey_address;
  // };

  // useEffect(() => {
  //   (async () => {
  //     let pendingAddrs = await Promise.all(
  //       fetchedPendingDeposits.map(async (item) => {
  //         try {
  //           const address = await getBitcoinAddress(item.txid, item.vout);
  //           return {
  //             txid: item.txid,
  //             address,
  //             value: item.amount / 1_000_000
  //           };
  //         } catch (err) {
  //           return undefined;
  //         }
  //       })
  //     );
  //     setPendingDepositV2Addrs(pendingAddrs.filter((item) => item !== undefined));
  //   })();
  // }, [fetchedPendingDeposits]);

  useEffect(() => {
    const value = JSON.parse(getStorageKey(PENDING_WITHDRAW_STORAGE_KEY) ?? '[]') as string[];
    setCachePendingWithdrawAddrs([...value]);
  }, []);

  useEffect(() => {
    if (withdrawFeeBtc?.withdrawal_fees && depositFeeV2Btc?.deposit_fees) {
      setFee(
        parseInt(depositFeeV2Btc?.deposit_fees ?? '0') / 10 ** 14 +
          parseInt(withdrawFeeBtc?.withdrawal_fees ?? '0') / 10 ** 14 +
          relayerFee
      );
    }
  }, [relayerFee, withdrawFeeBtc, depositFeeV2Btc]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.inputBalance}>
          <div className={styles.title}>
            <span className={styles.text}>Convert Legacy BTC to BTC V2</span>
            <div className={styles.info}>
              <span className={styles.balance}>
                {label}:{' '}
                <span className={styles.token}>
                  {numberWithCommas(toDisplay(balance), undefined, {
                    minimumFractionDigits: 6,
                    maximumFractionDigits: 6
                  })}{' '}
                  BTC
                </span>
              </span>
              <span className={styles.balance}>
                {'Fee'}:{' '}
                <span className={styles.token}>
                  {numberWithCommas(fee, undefined, {
                    minimumFractionDigits: 6,
                    maximumFractionDigits: 6
                  })}{' '}
                  BTC
                </span>
              </span>
            </div>
          </div>
          <div className={styles.inputWrapper}>
            <div className={styles.input}>
              <div className={styles.symbol}>
                <BitcoinIcon />
              </div>
              <NumberFormat
                placeholder="0"
                thousandSeparator
                className={styles.amount}
                decimalScale={6}
                disabled={false}
                type="text"
                value={amount}
                onChange={() => {
                  setCoeff(0);
                }}
                isAllowed={(values) => {
                  const { floatValue } = values;
                  // allow !floatValue to let user can clear their input
                  return !floatValue || (floatValue >= 0 && floatValue <= 1e14);
                }}
                onValueChange={({ floatValue }) => {
                  setAmount(floatValue);
                }}
              />
              <span className={styles.usd}>{formatDisplayUsdt(amountUSD)}</span>
            </div>

            <div className={`${styles.stakeBtn} ${styles.inDesktop}`}>
              <Button
                type="primary"
                // disabled={loading || withdrawFeeBtc?.withdrawal_fees === undefined}
                onClick={handleConvertBTC}
              >
                {loading && <Loader width={22} height={22} />}&nbsp;
                {'Convert'}
              </Button>
            </div>
          </div>
          <div className={styles.coeff}>
            {[0.25, 0.5, 0.75, 1].map((e) => {
              return (
                <button
                  key={e}
                  className={`${styles.button} ${coeff === e ? styles.active : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (coeff === e) {
                      setCoeff(0);
                      setAmount(0);
                      return;
                    }
                    setAmount(toDisplay(balance, 6) * e);
                    setCoeff(e);
                  }}
                >
                  {e * 100}%
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <PendingWithdraws
        btcAddresses={cachePendingWithdrawAddrs}
        withdrawFee={BigInt(Math.floor(parseInt(depositFeeV2Btc?.deposit_fees ?? '0') / 1_000_000))}
        showTx={false}
      />
    </div>
  );
};

export default ConvertBitcoinV2;
