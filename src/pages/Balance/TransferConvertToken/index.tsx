import { NetworkChainId } from '@oraichain/common';
import { BigDecimal, BTC_CONTRACT, parseTokenInfoRawDenom, toDisplay, TokenItemType } from '@oraichain/oraidex-common';
import loadingGif from 'assets/gif/loading.gif';
import ArrowDownIcon from 'assets/icons/arrow.svg?react';
import ArrowDownIconLight from 'assets/icons/arrow_light.svg?react';
import SuccessIcon from 'assets/icons/toast_success.svg?react';
import classNames from 'classnames';
import Input from 'components/Input';
import Loader from 'components/Loader';
import PowerByOBridge from 'components/PowerByOBridge';
import ToggleSwitch from 'components/ToggleSwitch';
import TokenBalance from 'components/TokenBalance';
import { TonChainId } from 'context/ton-provider';
import copy from 'copy-to-clipboard';
import { filterChainBridge, getAddressTransfer, networks } from 'helper';
import { CWBitcoinFactoryDenom } from 'helper/constants';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import useTokenFee, { useRelayerFeeToken } from 'hooks/useTokenFee';
import useWalletReducer from 'hooks/useWalletReducer';
import { btcChains, cosmosTokens, evmChains, flattenTokens, tokenMap, tonTokens } from 'initCommon';
import { reduceString } from 'libs/utils';
import { useGetContractConfig } from 'pages/BitcoinDashboardV2/hooks';
import { AMOUNT_BALANCE_ENTRIES } from 'pages/UniversalSwap/helpers';
import { FC, useEffect, useState } from 'react';
import NumberFormat from 'react-number-format';
import {
  calcMaxAmount,
  checkValidAmount,
  FormatNumberFixed,
  getRemoteTokenDenom,
  renderTransferConvertButton,
  useDepositFeesBitcoinV2,
  useGetWithdrawlFeesBitcoinV2
} from '../helpers';
import useGetFee from '../hooks/useGetFee';
import useGetFeeSol from '../hooks/useGetFeeSol';
import useTonBridgeHandler, { EXTERNAL_MESSAGE_FEE } from '../hooks/useTonBridgeHandler';
import styles from './index.module.scss';
import { getStatusMemeBridge } from 'program/web3';

const TransferConvertToken: FC<{
  token: TokenItemType;
  amountDetail?: { amount: string; usd: number };
  onClickTransfer: any;
  subAmounts?: object;
  isFastMode?: boolean;
  setIsFastMode?: Function;
  setToNetwork: Function;
  toToken?: TokenItemType;
}> = ({ token, amountDetail, onClickTransfer, subAmounts, isFastMode, setIsFastMode, setToNetwork, toToken }) => {
  const bridgeNetworks = networks.filter((item) => filterChainBridge(token, item));
  const [[convertAmount, convertUsd], setConvertAmount] = useState([undefined, 0]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toNetworkChainId, setToNetworkChainId] = useState<NetworkChainId>(bridgeNetworks[0]?.chainId);
  const [isOpen, setIsOpen] = useState(false);
  const [chainInfo] = useConfigReducer('chainInfo');
  const [theme] = useConfigReducer('theme');
  const [addressTransfer, setAddressTransfer] = useState('');
  const { data: prices } = useCoinGeckoPrices();
  const [walletByNetworks] = useWalletReducer('walletsByNetwork');
  const contractConfig = useGetContractConfig();
  const [tokenPoolPrices] = useConfigReducer('tokenPoolPrices');

  useEffect(() => {
    if (chainInfo) setConvertAmount([undefined, 0]);
  }, [chainInfo]);

  useEffect(() => {
    (async () => {
      if (token.chainId) {
        const defaultToChainId = bridgeNetworks[0]?.chainId;
        const findNetwork = networks.find((net) => net.chainId === defaultToChainId);
        const address = await getAddressTransfer(findNetwork, walletByNetworks);
        setAddressTransfer(address);
        setToNetworkChainId(defaultToChainId);
        setToNetwork(defaultToChainId);
      }
    })();
  }, [token.chainId]);

  // list of tokens where it exists in at least two different chains
  const listedTokens = cosmosTokens.filter((t) => t.chainId !== token.chainId && t.coinGeckoId === token.coinGeckoId);
  const maxAmount = toDisplay(
    amountDetail.amount, // amount detail here can be undefined
    token?.decimals
  );

  const onTransferConvert = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const isValid = checkValidAmount(convertAmount, maxAmount);
      if (!isValid) return;
      setTransferLoading(true);

      // from EVM token -> ORAICHAIN.
      if (evmChains.find((chain) => chain.chainId === token.chainId)) {
        await onClickTransfer(convertAmount, toNetworkChainId);
        return;
      }
      return await onClickTransfer(convertAmount, toNetworkChainId);
    } catch (error) {
      console.log({ error });
    } finally {
      setTransferLoading(false);
    }
  };

  // get token fee & relayer fee
  const toNetwork = bridgeNetworks.find((n) => n.chainId === toNetworkChainId);
  const to =
    toToken ?? flattenTokens.find((t) => t.coinGeckoId === token.coinGeckoId && t.chainId === toNetworkChainId);

  const remoteTokenDenomFrom = getRemoteTokenDenom(token);
  const remoteTokenDenomTo = getRemoteTokenDenom(to);
  const fromTokenFee = useTokenFee(remoteTokenDenomFrom) || 0;
  const toTokenFee = useTokenFee(remoteTokenDenomTo) || 0;

  const { bridgeFee: bridgeFeeTon, tokenFee: tonTokenFee } = useGetFee({
    token,
    fromNetwork: token.chainId,
    toNetwork: toNetworkChainId
  });

  const isMemeBridge = getStatusMemeBridge(token);
  const { solFee, isOraichainToSol, isSolToOraichain } = useGetFeeSol({
    originalFromToken: token,
    toChainId: toNetworkChainId,
    amountToken: convertAmount,
    toToken,
    isMemeBridge
  });

  const { deductNativeAmount, checkBalanceBridgeByNetwork } = useTonBridgeHandler({
    token,
    fromNetwork: token.chainId,
    toNetwork: toNetworkChainId
  });

  let bridgeFee = fromTokenFee + toTokenFee;
  const isFromOraichainToBitcoin = token.chainId === 'Oraichain' && toNetworkChainId === ('bitcoin' as any);
  const isFromBitcoinToOraichain = token.chainId === ('bitcoin' as string) && toNetworkChainId === 'Oraichain';
  let { relayerFee: relayerFeeTokenFee } = useRelayerFeeToken(token, to);
  relayerFeeTokenFee = to ? relayerFeeTokenFee : 0;

  // BTC fee
  const depositFeeBtcV2Result = useDepositFeesBitcoinV2(true);
  const withdrawalFeeBtcV2Result = useGetWithdrawlFeesBitcoinV2({
    enabled: isFromOraichainToBitcoin,
    bitcoinAddress: addressTransfer
  });
  const depositFeeBtc = depositFeeBtcV2Result;
  const withdrawalFeeBtc = isFastMode
    ? { withdrawal_fees: depositFeeBtcV2Result?.deposit_fees }
    : withdrawalFeeBtcV2Result;

  if (token.name === 'BTC') {
    if (contractConfig?.token_fee.denominator != 0) {
      bridgeFee = (contractConfig?.token_fee.nominator * 100) / contractConfig?.token_fee.denominator;
    } else {
      bridgeFee = 0;
    }
    // not support relayer fee yet
    relayerFeeTokenFee = 0;
  }

  let toDisplayBTCFee = 0;
  if (depositFeeBtc && isFromBitcoinToOraichain) {
    // TODO: usat decimal 14
    toDisplayBTCFee = new BigDecimal(depositFeeBtc.deposit_fees ?? 0).div(1e14).toNumber();
  }

  if (withdrawalFeeBtc && isFromOraichainToBitcoin) {
    // TODO: usat decimal 14
    toDisplayBTCFee = new BigDecimal(withdrawalFeeBtc.withdrawal_fees ?? 0).div(1e14).toNumber();
  }

  let receivedAmount = convertAmount
    ? convertAmount * (1 - bridgeFee / 100) - relayerFeeTokenFee - toDisplayBTCFee - (bridgeFeeTon || 0)
    : 0;

  let msgBridgeFee = 0;
  let suffixe = token.name;
  if (isSolToOraichain || isOraichainToSol) {
    msgBridgeFee = solFee.totalFee;
  } else if (bridgeFeeTon) {
    msgBridgeFee = bridgeFeeTon;
  } else {
    msgBridgeFee = bridgeFee;
    suffixe = '%';
  }

  const renderBridgeFee = () => {
    const [balanceMax, setBalanceMax] = useState(0);
    let msgTokenFee = null;
    let msgRelayerFee = null;
    let msgBTCfee = null;
    let msgTonMax = null;

    useEffect(() => {
      (async () => {
        if (toNetworkChainId === TonChainId) {
          const tokenOnTon = tonTokens.find(
            (tk) => tk.chainId === toNetworkChainId && tk.coinGeckoId === token.coinGeckoId
          );

          const maxBalance = await checkBalanceBridgeByNetwork(token.chainId, tokenOnTon);
          setBalanceMax(maxBalance || 0);
        }
      })();
    }, [token, toNetworkChainId]);

    if (tonTokenFee > 0) {
      msgTokenFee = (
        <div className={styles.relayerFee}>
          - Token fee:
          <span>
            {tonTokenFee} {token.name}{' '}
          </span>
        </div>
      );
    }

    if (relayerFeeTokenFee > 0) {
      msgRelayerFee = (
        <div className={styles.relayerFee}>
          - Relayer fee:
          <span>
            {relayerFeeTokenFee} {token.name}
          </span>
        </div>
      );
    }

    const msgReceiveAmount = (
      <>
        - Received amount:{' '}
        <span>
          {FormatNumberFixed({
            value: Math.max(Number(isSolToOraichain || isOraichainToSol ? solFee.sendAmount : receivedAmount), 0)
          })}{' '}
          {token.name}
        </span>
      </>
    );

    if (!!toDisplayBTCFee) {
      msgBTCfee = (
        <>
          {' '}
          - BTC fee: <span>{toDisplayBTCFee} BTC </span>
        </>
      );
    }

    if (toNetworkChainId === TonChainId) {
      msgTonMax = (
        <p>
          Available amount:{' '}
          <span>
            {balanceMax.toFixed(6)} {token.name}
          </span>
        </p>
      );
    }

    return (
      <div className={styles.bridgeFee}>
        Bridge fee: <span>{msgBridgeFee + ' ' + suffixe}</span>
        {msgTokenFee}
        {msgRelayerFee}
        {msgReceiveAmount}
        {msgBTCfee}
        {msgTonMax}
      </div>
    );
  };

  const isBTCLegacy = token?.contractAddress === BTC_CONTRACT;

  return (
    <div className={classNames(styles.tokenFromGroup, styles.small)} style={{ flexWrap: 'wrap' }}>
      <div className={styles.tokenSubAmouts}>
        {subAmounts &&
          Object.keys(subAmounts)?.length > 0 &&
          Object.keys(subAmounts).map((denom, idx) => {
            const subAmount = subAmounts[denom] ?? '0';
            const evmToken = tokenMap[denom];
            return (
              <div key={idx} className={styles.itemSubAmounts}>
                <TokenBalance
                  balance={{
                    amount: subAmount,
                    denom: evmToken.name,
                    decimals: evmToken.decimals
                  }}
                  decimalScale={token.decimals}
                />
              </div>
            );
          })}
      </div>
      <div className={styles.tokenFromGroupBalance}>
        <div className={styles.network}>
          <div className={styles.loading}>
            {transferLoading && <img alt="loading" src={loadingGif} width={180} height={180} />}
          </div>
          <div className={styles.box}>
            <div className={styles.transfer}>
              <div
                className={styles.content}
                onClick={(e) => {
                  e.stopPropagation();
                  copy(addressTransfer);
                  setCopied(true);
                }}
              >
                <div className={classNames(styles.title, styles[theme])}>Transfer to</div>
                <div className={styles.address}>
                  {reduceString(addressTransfer, 10, 7)}
                  {copied ? <SuccessIcon width={20} height={20} /> : null}
                </div>
              </div>
            </div>
            <div className={styles.search}>
              <div
                className={classNames(styles.search_filter, styles[theme])}
                onClick={(event) => {
                  event.stopPropagation();
                  setCopied(false);
                  if (bridgeNetworks.length > 1) setIsOpen(!isOpen);
                }}
              >
                <div className={styles.search_box}>
                  {toNetwork && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div className={styles.search_logo}>
                        {theme === 'light' ? (
                          <img width={44} height={44} src={toNetwork.chainSymbolImageUrl} alt="chainSymbolImageUrl" />
                        ) : (
                          <img width={44} height={44} src={toNetwork.chainSymbolImageUrl} alt="chainSymbolImageUrl" />
                        )}
                      </div>
                      <span className={classNames(styles.search_text, styles[theme])}>{toNetwork.chainName}</span>
                    </div>
                  )}
                  {bridgeNetworks.length > 1 && (
                    <div
                      style={{
                        rotate: isOpen ? '180deg' : '0deg',
                        transition: 'all 0.3s ease-in-out'
                      }}
                    >
                      {theme === 'light' ? <ArrowDownIconLight /> : <ArrowDownIcon />}
                    </div>
                  )}
                </div>
              </div>
              {isOpen && (
                <div>
                  <ul className={classNames(styles.items, styles[theme])}>
                    {networks
                      .filter((item) => filterChainBridge(token, item))
                      .map((net) => {
                        return (
                          <li
                            key={net.chainId}
                            onClick={async (e) => {
                              e.stopPropagation();
                              const address = await getAddressTransfer(net, walletByNetworks);
                              setAddressTransfer(address);
                              setToNetworkChainId(net.chainId);
                              setToNetwork(net.chainId);
                              setIsOpen(false);
                            }}
                          >
                            {net && (
                              <div className={classNames(styles.items_chain)}>
                                <div>
                                  <img width={44} height={44} src={net.chainSymbolImageUrl} alt="chainSymbolImageUrl" />
                                </div>
                                <div className={classNames(styles.items_title, styles[theme])}>{net.chainName}</div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ width: '100%' }}>
          <div className={styles.balanceDescription}>
            Convert Amount:{' '}
            <TokenBalance balance={convertUsd} className={styles.balanceDescription} prefix="~$" decimalScale={2} />
          </div>
          <div className={styles.balanceAmount}>
            <div>
              <NumberFormat
                placeholder="0"
                thousandSeparator
                decimalScale={Math.min(6, token?.decimals)}
                customInput={Input}
                value={convertAmount}
                onClick={(event) => {
                  event.stopPropagation();
                }}
                onValueChange={({ floatValue }) => {
                  if (!floatValue) return setConvertAmount([undefined, 0]);
                  const usdValue =
                    floatValue * (prices[token.coinGeckoId] ?? tokenPoolPrices[parseTokenInfoRawDenom(token)] ?? 0);
                  setConvertAmount([floatValue!, usdValue]);
                }}
                className={classNames(styles.amount, styles[theme])}
              />
            </div>

            <div className={styles.balanceFromGroup}>
              {AMOUNT_BALANCE_ENTRIES.map(([coeff, text]) => (
                <button
                  key={coeff}
                  className={classNames(styles.balanceBtn, styles[theme])}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (token.chainId === TonChainId && token.coinGeckoId === 'the-open-network') {
                      const finalAmount = new BigDecimal(maxAmount)
                        .sub(toDisplay(deductNativeAmount || 0n, token.decimals))
                        .sub(deductNativeAmount > 0n ? EXTERNAL_MESSAGE_FEE : 0)
                        .toNumber();

                      setConvertAmount([finalAmount * coeff, amountDetail.usd * coeff]);
                    } else {
                      const finalAmount = calcMaxAmount({
                        maxAmount,
                        token,
                        coeff
                      });

                      setConvertAmount([finalAmount * coeff, amountDetail.usd * coeff]);
                    }
                  }}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>
        {renderBridgeFee()}

        {token.denom === CWBitcoinFactoryDenom && (
          <div className={styles.fastMode}>
            <span>Fast Mode</span>{' '}
            <ToggleSwitch
              customSwitchClass={styles.switch}
              small
              id={'fast-mode-id'}
              checked={isFastMode}
              onChange={() => setIsFastMode((fastMode) => !fastMode)}
            />
          </div>
        )}
      </div>
      <div className={styles.transferTab}>
        {(() => {
          if (
            listedTokens.length > 0 ||
            evmChains.find((chain) => chain.chainId === token.chainId) ||
            btcChains.find((chain) => chain.chainId !== token.chainId)
          ) {
            const isValidateFeeTon = bridgeFeeTon ? convertAmount < bridgeFeeTon : false;
            const isValidateAmount = !convertAmount || convertAmount <= 0 || convertAmount > maxAmount;
            const isCosmosToCosmos = token?.cosmosBased && to?.cosmosBased;
            const isValidateFee = !msgBridgeFee && !isCosmosToCosmos;
            // const isSolBridge = token.chainId === solChainId || toNetworkChainId === solChainId;
            // const isBridgeBitcoin = token.chainId === ('bitcoin' as any) || toNetworkChainId === ('bitcoin' as any);
            const isDisabled =
              isValidateFee ||
              isValidateAmount ||
              transferLoading ||
              !addressTransfer ||
              receivedAmount < 0 ||
              isBTCLegacy ||
              isValidateFeeTon;

            return (
              <button
                disabled={isDisabled}
                className={classNames(styles.tfBtn, styles[theme])}
                onClick={onTransferConvert}
              >
                {transferLoading && <Loader width={20} height={20} />}
                <span>
                  <strong>{renderTransferConvertButton(toNetworkChainId, token, toNetwork, receivedAmount)}</strong>
                </span>
              </button>
            );
          }
        })()}
      </div>

      <PowerByOBridge theme={theme} />
    </div>
  );
};
export default TransferConvertToken;
