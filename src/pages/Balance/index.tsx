import { coin, makeStdTx } from '@cosmjs/amino';
import { toBinary } from '@cosmjs/cosmwasm-stargate';
import { Decimal } from '@cosmjs/math';
import { DeliverTxResponse, GasPrice, isDeliverTxFailure } from '@cosmjs/stargate';
import { Tendermint37Client } from '@cosmjs/tendermint-rpc';
import {
  getTokenOnOraichain,
  toAmount,
  TokenItemType,
  calculateTimeoutTimestamp,
  getCosmosGasPrice,
  solChainId,
  toDisplay,
  MAX_ORAICHAIN_DENOM,
  MAX_SOL_CONTRACT_ADDRESS
} from '@oraichain/oraidex-common';
import {
  chainInfos,
  flattenTokens,
  oraidexCommon,
  oraichainTokens as oraichainTokensCommon,
  otherChainTokens as otherChainTokenCommon
} from 'initCommon';
import { UniversalSwapHandler, UniversalSwapHelper } from '@oraichain/oraidex-universal-swap';
import { isMobile } from '@walletconnect/browser-utils';
import ArrowDownIcon from 'assets/icons/arrow.svg?react';
import ArrowDownIconLight from 'assets/icons/arrow_light.svg?react';
import TooltipIcon from 'assets/icons/icon_tooltip.svg?react';
import RefreshIcon from 'assets/icons/reload.svg?react';
import classNames from 'classnames';
import CheckBox from 'components/CheckBox';
import LoadingBox from 'components/LoadingBox';
import { SelectTokenModal } from 'components/Modals/SelectTokenModal';
import SearchInput from 'components/SearchInput';
import { displayToast, TToastType } from 'components/Toasts/Toast';
import TokenBalance from 'components/TokenBalance';
import { NomicContext } from 'context/nomic-context';
import {
  assert,
  EVM_CHAIN_ID,
  getSpecialCoingecko,
  getTransactionUrl,
  handleCheckAddress,
  handleCheckWallet,
  handleErrorTransaction,
  networks
} from 'helper';
import {
  CWAppBitcoinContractAddress,
  CWBitcoinFactoryDenom,
  DEFAULT_RELAYER_FEE,
  RELAYER_DECIMAL,
  bitcoinChainId
} from 'helper/constants';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import useLoadTokens from 'hooks/useLoadTokens';
import useOnClickOutside from 'hooks/useOnClickOutside';
import { useGetFeeConfig } from 'hooks/useTokenFee';
import useWalletReducer from 'hooks/useWalletReducer';
import Metamask from 'libs/metamask';
import isEqual from 'lodash/isEqual';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSubAmountDetails } from 'rest/api';
import { RootState } from 'store/configure';
import styles from './Balance.module.scss';
import { AppBitcoinClient } from '@oraichain/bitcoin-bridge-contracts-sdk';
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import { MsgTransfer as MsgTransferInjective } from '@injectivelabs/sdk-ts/node_modules/cosmjs-types/ibc/applications/transfer/v1/tx';
import { collectWallet, connectWithSigner, getCosmWasmClient } from 'libs/cosmjs';
import { BitcoinUnit } from 'bitcoin-units';
import Content from 'layouts/Content';
import { config } from 'libs/nomic/config';
import { OBTCContractAddress, OraiBtcSubnetChain, OraichainChain } from 'libs/nomic/models/ibc-chain';
import { generateError, getTotalUsd, getUsd, initEthereum, toSumDisplay, toTotalDisplay } from 'libs/utils';
import {
  calculatorTotalFeeBtc,
  convertKwt,
  findDefaultToToken,
  getFeeRate,
  getUtxos,
  mapUtxos,
  moveOraibToOraichain,
  useDepositFeesBitcoinV2,
  useGetWithdrawlFeesBitcoinV2
} from './helpers';
import KwtModal from './KwtModal';
import StuckOraib from './StuckOraib';
import useGetOraiBridgeBalances from './StuckOraib/useGetOraiBridgeBalances';
import TokenItem, { TokenItemProps } from './TokenItem';
import { TokenItemBtc } from './TokenItem/TokenItemBtc';
import DepositBtcModalV2 from './DepositBtcModalV2';
import { CwBitcoinContext } from 'context/cw-bitcoin-context';
import { NetworkChainId } from '@oraichain/common';
import { useWallet } from '@solana/wallet-adapter-react';
import { SOL_RELAYER_ADDRESS, Web3SolanaProgramInteraction } from 'program/web3';
import { refreshBalances } from 'pages/UniversalSwap/helpers';
import { ORAICHAIN_RELAYER_ADDRESS } from 'program/web3';
import { PublicKey } from '@solana/web3.js';
import { NATIVE_MINT } from '@solana/spl-token';
import { TonChainId } from 'context/ton-provider';
import useTonBridgeHandler from './hooks/useTonBridgeHandler';

interface BalanceProps {}

export const isMaintainBridge = false;

const Balance: React.FC<BalanceProps> = () => {
  //@ts-ignore
  const isOwallet = window.owallet?.isOwallet;

  // hook
  const [searchParams] = useSearchParams();
  const ref = useRef(null);
  const navigate = useNavigate();
  const tokenUrl = searchParams.get('token');
  const amounts = useSelector((state: RootState) => state.token.amounts);
  const feeConfig = useSelector((state: RootState) => state.token.feeConfigs);
  const nomic = useContext(NomicContext);
  const cwBitcoinContext = useContext(CwBitcoinContext);
  const [walletByNetworks] = useWalletReducer('walletsByNetwork');

  // state internal
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [isSelectNetwork, setIsSelectNetwork] = useState(false);
  const [isDepositBtcModal, setIsDepositBtcModal] = useState(false);
  const [, setTxHash] = useState('');
  const [[from, to], setTokenBridge] = useState<TokenItemType[]>([]);
  const [toNetworkChainId, setToNetworkChainId] = useState<NetworkChainId>();
  const [[otherChainTokens, oraichainTokens], setTokens] = useState<TokenItemType[][]>([[], []]);
  const [addressRecovery, setAddressRecovery] = useState('');
  const [isFastMode, setIsFastMode] = useState(true);

  const [theme] = useConfigReducer('theme');

  const [filterNetworkUI, setFilterNetworkUI] = useConfigReducer('filterNetwork');
  const [hideOtherSmallAmount, setHideOtherSmallAmount] = useConfigReducer('hideOtherSmallAmount');

  const [metamaskAddress] = useConfigReducer('metamaskAddress');
  const [oraiAddress] = useConfigReducer('address');
  const [tronAddress] = useConfigReducer('tronAddress');
  const [tonAddress] = useConfigReducer('tonAddress');
  const [solAddress] = useConfigReducer('solAddress');
  const [btcAddress] = useConfigReducer('btcAddress');

  const wallet = useWallet();

  const { handleBridgeFromCosmos, handleBridgeFromTon } = useTonBridgeHandler({
    token: from,
    fromNetwork: from?.chainId,
    toNetwork: toNetworkChainId
  });
  const depositV2Fee = useDepositFeesBitcoinV2(true);
  const withdrawV2Fee = useGetWithdrawlFeesBitcoinV2({
    enabled: true,
    bitcoinAddress: btcAddress
  });

  const getAddress = async () => {
    try {
      await nomic.generateAddress();
      const addressRecovered = await nomic.getRecoveryAddress();
      setAddressRecovery(addressRecovered);
    } catch (error) {
      console.log('🚀 ~ getAddress ~ error:', error);
    }
  };

  useEffect(() => {
    // TODO: should dynamic generate address when change destination chain.
    if (oraiAddress) {
      cwBitcoinContext.generateAddress({
        address: oraiAddress
      });
    }

    if (isOwallet) {
      getAddress();
    }
  }, [oraiAddress, isOwallet]);

  useOnClickOutside(ref, () => {
    setTokenBridge([undefined, undefined]);
  });

  const loadTokenAmounts = useLoadTokens();
  const { data: prices } = useCoinGeckoPrices();
  useGetFeeConfig();

  useEffect(() => {
    if (!tokenUrl) return setTokens([otherChainTokenCommon, oraichainTokensCommon]);
    setTokens(
      [otherChainTokens, oraichainTokens].map((childTokens) =>
        childTokens.filter((t) => t.name.includes(tokenUrl.toUpperCase()))
      )
    );
  }, [tokenUrl]);

  useEffect(() => {
    initEthereum().catch((error) => {
      console.log(error);
    });
  }, []);

  useEffect(() => {
    setTokenBridge([undefined, undefined]);
  }, [filterNetworkUI]);

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
    setTxHash(result.transactionHash);
  };

  const handleRecoveryAddress = async () => {
    try {
      const btcAddr = await window.Bitcoin.getAddress();
      if (!btcAddr) throw Error('Not found your bitcoin address!');
      // @ts-ignore-check
      const oraiBtcAddress = await window.Keplr.getKeplrAddr(OraiBtcSubnetChain.chainId);

      if (btcAddr && addressRecovery !== btcAddr && oraiBtcAddress) {
        const accountInfo = await nomic.getAccountInfo(oraiBtcAddress);
        const signDoc = {
          account_number: accountInfo?.account?.account_number,
          chain_id: OraiBtcSubnetChain.chainId,
          fee: { amount: [{ amount: '0', denom: 'uoraibtc' }], gas: '10000' },
          memo: '',
          msgs: [
            {
              type: 'nomic/MsgSetRecoveryAddress',
              value: {
                recovery_address: btcAddr
              }
            }
          ],
          sequence: accountInfo?.account?.sequence
        };
        const signature = await window.owallet.signAmino(config.chainId, oraiBtcAddress, signDoc);
        const tx = makeStdTx(signDoc, signature.signature);
        const tmClient = await Tendermint37Client.connect(config.rpcUrl);

        const result = await tmClient.broadcastTxSync({ tx: Uint8Array.from(Buffer.from(JSON.stringify(tx))) });
        await getAddress();
        //@ts-ignore
        displayToast(result.code === 0 ? TToastType.TX_SUCCESSFUL : TToastType.TX_FAILED, {
          message: result?.log
        });
      }
    } catch (error) {
      handleErrorTransaction(error);
    }
  };

  const onClickToken = useCallback(
    (token: TokenItemType) => {
      if (isEqual(from, token)) {
        setTokenBridge([undefined, undefined]);
        return;
      }
      const toToken = findDefaultToToken(token);
      setTokenBridge([token, toToken]);
    },
    [otherChainTokens, oraichainTokens, from, to]
  );

  const handleTransferBTCToOraichain = async (fromToken: TokenItemType, transferAmount: number, btcAddr: string) => {
    const isV2 = fromToken.name === 'BTC';
    const utxos = await getUtxos(btcAddr, fromToken.rpc);
    const feeRate = await getFeeRate({
      url: from.rpc
    });

    const utxosMapped = mapUtxos({
      utxos,
      address: btcAddr
    });
    const totalFee = calculatorTotalFeeBtc({
      utxos: utxosMapped.utxos,
      message: '',
      transactionFee: feeRate
    });
    const { bitcoinAddress: address } = isV2 ? cwBitcoinContext.depositAddress : nomic.depositAddress;
    if (!address) throw Error('Not found address OraiBtc');
    const amount = new BitcoinUnit(transferAmount, 'BTC').to('satoshi').getValue();
    const dataRequest = {
      memo: '',
      fee: {
        gas: '200000',
        amount: [
          {
            denom: 'btc',
            amount: `${totalFee}`
          }
        ]
      },
      address: btcAddr,
      msgs: {
        address: address,
        changeAddress: btcAddr,
        amount: amount,
        message: '',
        totalFee: totalFee,
        selectedCrypto: fromToken.chainId,
        confirmedBalance: utxosMapped.balance,
        feeRate: feeRate
      },
      confirmedBalance: utxosMapped.balance,
      utxos: utxosMapped.utxos,
      blacklistedUtxos: [],
      amount: amount,
      feeRate: feeRate
    };

    try {
      // @ts-ignore-check
      const rs = await window.Bitcoin.signAndBroadCast(fromToken.chainId, dataRequest);

      if (rs?.rawTxHex) {
        setTxHash(rs.rawTxHex);
        displayToast(TToastType.TX_SUCCESSFUL, {
          customLink: `/bitcoin-dashboard${isV2 ? '-v2' : ''}?tab=pending_deposits`
        });
        setTimeout(async () => {
          await loadTokenAmounts({ metamaskAddress, tronAddress, oraiAddress, btcAddress: btcAddr, tonAddress });
        }, 5000);
        return;
      }
      displayToast(TToastType.TX_FAILED, {
        message: 'Transaction failed'
      });
    } catch (error) {
      console.log('🚀 ~ handleTransferBTCToOraichain ~ error:', error);
      displayToast(TToastType.TX_FAILED, {
        message: JSON.stringify(error)
      });
    }
  };

  const handleTransferOraichainToBTC = async (fromToken: TokenItemType, transferAmount: number, btcAddr: string) => {
    if (fromToken.name === 'BTC') {
      try {
        if (!withdrawV2Fee?.withdrawal_fees) {
          throw Error('Withdrawal fees are not found!');
        }
        if (!depositV2Fee?.deposit_fees) {
          throw Error('Deposit fees are not found!');
        }
        const fee = isFastMode ? depositV2Fee?.deposit_fees : withdrawV2Fee?.withdrawal_fees;
        console.log(fee);
        const amountInput = BigInt(
          Decimal.fromUserInput(toAmount(transferAmount, 14).toString(), 14).atomics.toString()
        );
        const amount = Decimal.fromAtomics(amountInput.toString(), 14).toString();
        let sender = await window.Keplr.getKeplrAddr(fromToken?.chainId);
        let cwBitcoinClient = new AppBitcoinClient(window.client, sender, CWAppBitcoinContractAddress);
        const result = await cwBitcoinClient.withdrawToBitcoin(
          {
            btcAddress: btcAddr,
            fee
          },
          'auto',
          '',
          [coin(amount, CWBitcoinFactoryDenom)]
        );

        processTxResult(
          fromToken.rpc,
          // @ts-ignore-check
          result,
          '/bitcoin-dashboard-v2?tab=pending_withdraws'
        );
      } catch (ex) {
        console.log(ex);
        handleErrorTransaction(ex, {
          tokenName: from.name,
          chainName: from.chainId
        });
      }
      return;
    }
    const { bitcoinAddress: address } = nomic.depositAddress;

    if (!address) throw Error('Not found Orai BTC Address');
    // @ts-ignore-check
    const destinationAddress = await window.Keplr.getKeplrAddr(OraiBtcSubnetChain.chainId);

    const DEFAULT_TIMEOUT = 60 * 60;
    const amountInput = BigInt(Decimal.fromUserInput(toAmount(transferAmount, 6).toString(), 8).atomics.toString());
    const amount = Decimal.fromAtomics(amountInput.toString(), 8).toString();
    if (!destinationAddress) throw Error('Not found your oraibtc-subnet address!');
    try {
      const result = await window.client.execute(
        oraiAddress,
        OBTCContractAddress,
        {
          send: {
            contract: OraichainChain.source.port.split('.')[1],
            amount,
            msg: toBinary({
              local_channel_id: OraichainChain.source.channelId,
              remote_address: destinationAddress,
              remote_denom: OraichainChain.source.nBtcIbcDenom,
              timeout: Number(calculateTimeoutTimestamp(DEFAULT_TIMEOUT)),
              memo: `withdraw:${btcAddr}`
            })
          }
        },
        'auto'
      );

      processTxResult(
        fromToken.rpc,
        // @ts-ignore-check
        result,
        '/bitcoin-dashboard?tab=pending_withdraws'
      );
    } catch (ex) {
      handleErrorTransaction(ex, {
        tokenName: from.name,
        chainName: from.chainId
      });
    }
  };

  const checkTransfer = (fromChainId, toChainId) => {
    const isSoltoOraichain = fromChainId === solChainId && toChainId === 'Oraichain';
    const isOraichainToSol = fromChainId === 'Oraichain' && toChainId === solChainId;
    const isBTCtoOraichain = from.chainId === bitcoinChainId && to.chainId === 'Oraichain';
    const isOraichainToBTC = from.chainId === 'Oraichain' && to.chainId === bitcoinChainId;
    return [isSoltoOraichain, isOraichainToSol, isBTCtoOraichain, isBTCtoOraichain || isOraichainToBTC];
  };

  const checkTransferTon = async (toNetworkChainId: string) => {
    const isFromTonToCosmos = from.chainId === TonChainId && toNetworkChainId !== TonChainId;
    const isFromCosmosToTON = from.cosmosBased && toNetworkChainId === TonChainId;
    const findToNetwork = flattenTokens.find((flat) => flat.chainId === toNetworkChainId);
    const isFromCosmosToCosmos =
      from.cosmosBased && findToNetwork.cosmosBased && from.coinGeckoId === 'the-open-network';
    return { isFromTonToCosmos, isFromCosmosToTON, isFromCosmosToCosmos };
  };

  const handleTransferTon = async ({ isTonToCosmos, transferAmount, isFromCosmosToCosmos, toNetworkChainId }) => {
    if (!isFromCosmosToCosmos) {
      const tonAddress = window.Ton.account?.address;
      if (!tonAddress) throw Error('Not found your ton address!');
    }
    if (isTonToCosmos) {
      return await handleBridgeFromTon(transferAmount);
    }
    return await handleBridgeFromCosmos(transferAmount);
  };

  const handleTransferBTC = async ({ isBTCToOraichain, fromToken, transferAmount }) => {
    const btcAddr = await window.Bitcoin.getAddress();
    if (!btcAddr) throw Error('Not found your bitcoin address!');
    if (isBTCToOraichain) {
      if (fromToken.name !== 'BTC') {
        await handleRecoveryAddress();
      }
      return handleTransferBTCToOraichain(fromToken, transferAmount, btcAddr);
    }
    return handleTransferOraichainToBTC(fromToken, transferAmount, btcAddr);
  };

  const getLatestEvmAddress = async (toNetworkChainId: NetworkChainId) => {
    const isFromEvmNotTron = from.chainId !== '0x2b6653dc' && EVM_CHAIN_ID.includes(from.chainId);
    const isToNetworkEvmNotTron = toNetworkChainId !== '0x2b6653dc' && EVM_CHAIN_ID.includes(toNetworkChainId);
    // switch network for metamask, exclude TRON
    if (isFromEvmNotTron) {
      await window.Metamask.switchNetwork(from.chainId);
    }
    let latestEvmAddress = metamaskAddress;
    // need to get latest tron address if cached
    if (isFromEvmNotTron || isToNetworkEvmNotTron) {
      latestEvmAddress = await window.Metamask.getEthAddress();
    }
    return latestEvmAddress;
  };

  const handleTransferSolToOraichain = async ({
    fromToken,
    transferAmount
  }: {
    fromToken: TokenItemType;
    transferAmount: number;
  }) => {
    if (!oraiAddress) {
      throw new Error('Please connect to Oraichain wallet');
    }

    const web3Solana = new Web3SolanaProgramInteraction();
    console.log('from token address: ', fromToken.contractAddress);
    if (fromToken.contractAddress !== MAX_SOL_CONTRACT_ADDRESS) {
      const bridgeBalance =
        fromToken.contractAddress === NATIVE_MINT.toBase58()
          ? await web3Solana.getSolanaBalance(new PublicKey(SOL_RELAYER_ADDRESS))
          : await web3Solana.getTokenBalance(SOL_RELAYER_ADDRESS, fromToken.contractAddress);
      console.log('token balance to oraichain: ', bridgeBalance, fromToken.contractAddress);
      if (bridgeBalance < transferAmount) {
        throw new Error(
          `Transfer ${fromToken.denom} to Oraichain failed. The bridge balance only has ${bridgeBalance}${fromToken.denom}, wanted ${transferAmount}${fromToken.denom}`
        );
      }
    }

    const response = await web3Solana.bridgeSolToOrai(wallet, fromToken, transferAmount, oraiAddress);
    const transaction = response?.transaction;
    if (transaction) {
      displayToast(TToastType.TX_SUCCESSFUL, {
        customLink: getTransactionUrl(fromToken.chainId, transaction)
      });
    }
  };

  const handleTransferOraichainToSol = async ({
    fromToken,
    transferAmount
  }: {
    fromToken: TokenItemType;
    transferAmount: number;
  }) => {
    if (!solAddress) {
      throw new Error('Please connect to Solana wallet');
    }

    const receiverAddress = ORAICHAIN_RELAYER_ADDRESS;

    if (fromToken.denom !== MAX_ORAICHAIN_DENOM) {
      const currentBridgeBalance = await window.client.getBalance(receiverAddress, fromToken.denom);
      console.log(
        'Current bridge balance transfer to sol: ',
        toDisplay(currentBridgeBalance.amount, fromToken.decimals),
        fromToken.denom
      );
      if (toDisplay(currentBridgeBalance.amount, fromToken.decimals) < transferAmount) {
        throw new Error(
          `Transfer ${fromToken.denom} to Solana failed. The bridge balance only has ${toDisplay(
            currentBridgeBalance.amount,
            fromToken.decimals
          )}${currentBridgeBalance.denom.toUpperCase()}, wanted ${transferAmount}${currentBridgeBalance.denom.toUpperCase()}`
        );
      }
    }

    const result = await window.client.sendTokens(
      oraiAddress,
      receiverAddress,
      [
        {
          amount: toAmount(transferAmount, fromToken.decimals).toString(),
          denom: fromToken.denom
        }
      ],
      'auto',
      solAddress
    );

    if (result) {
      displayToast(TToastType.TX_SUCCESSFUL, {
        customLink: getTransactionUrl(fromToken.chainId, result.transactionHash)
      });
    }
  };

  const onClickTransfer = async (
    fromAmount: number,
    from: TokenItemType,
    to: TokenItemType,
    toNetworkChainId?: NetworkChainId
  ) => {
    try {
      await handleCheckWallet();
      assert(from && to, 'Please choose both from and to tokens');
      const initFromBalance = amounts[from.denom];
      const subAmounts = getSubAmountDetails(amounts, from);
      const subAmount = toAmount(toSumDisplay(subAmounts), from.decimals);
      const fromBalance = from && initFromBalance ? subAmount + BigInt(initFromBalance) : BigInt(0);
      const condition = fromAmount > 0 && toAmount(fromAmount, from.decimals) <= fromBalance;
      assert(condition, 'Your balance is insufficient to make this transfer');

      displayToast(TToastType.TX_BROADCASTING);
      let result: DeliverTxResponse | string | any;

      let newToToken = to;
      if (toNetworkChainId) {
        // ORAICHAIN -> EVM (BSC/ETH/TRON) ( TO: TOKEN ORAIBRIDGE)
        newToToken = flattenTokens.find(
          (flat) => flat.chainId === toNetworkChainId && flat.coinGeckoId === from.coinGeckoId
        );
        assert(newToToken, 'Cannot find newToToken token that matches from token to bridge!');
      }

      // check transfer TON <=> ORAICHAIN,Osmosis
      const { isFromTonToCosmos, isFromCosmosToTON, isFromCosmosToCosmos } = await checkTransferTon(toNetworkChainId);
      console.log({ isFromTonToCosmos, isFromCosmosToTON, isFromCosmosToCosmos });

      if (isFromCosmosToCosmos || isFromTonToCosmos || isFromCosmosToTON) {
        return await handleTransferTon({
          isTonToCosmos: isFromTonToCosmos,
          isFromCosmosToCosmos,
          toNetworkChainId,
          transferAmount: fromAmount
        });
      }

      assert(
        newToToken.coinGeckoId === from.coinGeckoId,
        `From token ${from.coinGeckoId} is different from to token ${newToToken.coinGeckoId}`
      );

      let [isSolToOraichain, isOraichainToSol, isBTCToOraichain, isBtcBridge] = checkTransfer(
        from.chainId,
        newToToken.chainId
      );

      // [BTC Native] <==> ORAICHAIN
      if (isBtcBridge) {
        return handleTransferBTC({
          isBTCToOraichain: isBTCToOraichain,
          fromToken: from,
          transferAmount: fromAmount
        });
      }

      if (isSolToOraichain || isOraichainToSol) {
        if (isOraichainToSol) {
          return handleTransferOraichainToSol({ fromToken: from, transferAmount: fromAmount });
        }

        return handleTransferSolToOraichain({
          fromToken: from,
          transferAmount: fromAmount
        });
      }

      // remaining tokens, we override from & to of onClickTransfer on index.tsx of Balance based on the user's token destination choice
      // to is Oraibridge tokens
      // or other token that have same coingeckoId that show in at least 2 chain.
      const cosmosAddress = await handleCheckAddress(from.cosmosBased ? from.chainId : 'Oraichain');
      const latestEvmAddress = await getLatestEvmAddress(toNetworkChainId);
      let amountsBalance = amounts;
      let simulateAmount = toAmount(fromAmount, from.decimals).toString();

      const { isSpecialFromCoingecko } = getSpecialCoingecko(from.coinGeckoId, newToToken.coinGeckoId);
      if (isSpecialFromCoingecko && from.chainId === 'Oraichain') {
        const tokenInfo = getTokenOnOraichain(from.coinGeckoId, oraichainTokens);
        const fromTokenInOrai = getTokenOnOraichain(tokenInfo.coinGeckoId, oraichainTokens, true);
        const [nativeAmount, cw20Amount] = await Promise.all([
          window.client.getBalance(oraiAddress, fromTokenInOrai.denom),
          window.client.queryContractSmart(tokenInfo.contractAddress, {
            balance: {
              address: oraiAddress
            }
          })
        ]);

        amountsBalance = {
          [fromTokenInOrai.denom]: nativeAmount?.amount,
          [from.denom]: cw20Amount.balance
        };
      }

      if (newToToken.chainId === 'injective-1' && newToToken.coinGeckoId === 'injective-protocol') {
        simulateAmount = toAmount(fromAmount, newToToken.decimals).toString();
      }

      let relayerFee = {
        relayerAmount: DEFAULT_RELAYER_FEE,
        relayerDecimals: RELAYER_DECIMAL
      };

      const { relayer_fees: relayerFees } = feeConfig;
      const findRelayerFee = relayerFees.find(
        (relayer) => relayer.prefix === from.prefix || relayer.prefix === newToToken.prefix
      );

      if (findRelayerFee) relayerFee.relayerAmount = findRelayerFee.amount;
      const universalSwapHandler = new UniversalSwapHandler(
        {
          sender: { cosmos: cosmosAddress, evm: latestEvmAddress, tron: tronAddress },
          originalFromToken: from,
          originalToToken: newToToken,
          fromAmount,
          relayerFee,
          userSlippage: 0,
          bridgeFee: 1,
          amounts: amountsBalance,
          simulateAmount,
          simulatePrice: '1000000'
        },
        {
          // @ts-ignore
          cosmosWallet: window.Keplr,
          evmWallet: new Metamask(window.tronWebDapp),
          swapOptions: {
            isIbcWasm: false
          }
        },
        oraidexCommon
      );

      result = await universalSwapHandler.processUniversalSwap();
      processTxResult(from.rpc, result, getTransactionUrl(from.chainId, result.transactionHash));
    } catch (ex) {
      handleErrorTransaction(ex, {
        tokenName: from.name,
        chainName: toNetworkChainId
      });
    }
  };

  const getFilterTokens = (chainId: string | number): TokenItemType[] => {
    return [...otherChainTokens, ...oraichainTokens]
      .filter((token) => {
        if (hideOtherSmallAmount && !toTotalDisplay(amounts, token)) return false;
        if (UniversalSwapHelper.isSupportedNoPoolSwapEvm(token.coinGeckoId)) return false;
        return token.bridgeTo && token.chainId === chainId;
      })
      .sort((a, b) => {
        return toTotalDisplay(amounts, b) * prices[b.coinGeckoId] - toTotalDisplay(amounts, a) * prices[a.coinGeckoId];
      });
  };

  const totalUsd = getTotalUsd(amounts, prices);

  // Move oraib2oraichain
  const [moveOraib2OraiLoading, setMoveOraib2OraiLoading] = useState(false);
  const { remainingOraib } = useGetOraiBridgeBalances(moveOraib2OraiLoading);
  const handleMoveOraib2Orai = async () => {
    try {
      setMoveOraib2OraiLoading(true);
      const result = await moveOraibToOraichain(remainingOraib);
      processTxResult(chainInfos.find((c) => c.chainId === 'oraibridge-subnet-2').rpc, result);
    } catch (error) {
      console.log('error move stuck oraib: ', error);
      displayToast(TToastType.TX_FAILED, {
        message: error.message
      });
    } finally {
      setMoveOraib2OraiLoading(false);
    }
  };

  const network = networks.find((n) => n.chainId === filterNetworkUI) ?? networks[0];

  return (
    <Content nonBackground>
      <div className={classNames(styles.wrapper, { [styles.isMaintainBridge]: isMaintainBridge })}>
        {/* Show popup that let user move stuck assets Oraibridge to Oraichain */}
        <StuckOraib remainingOraib={remainingOraib} handleMove={handleMoveOraib2Orai} loading={moveOraib2OraiLoading} />
        <div className={styles.header}>
          <div className={styles.asset}>
            <span className={styles.totalAssets}>Total Assets</span>
            <TokenBalance balance={totalUsd} className={classNames(styles.balance, styles[theme])} decimalScale={2} />
          </div>
        </div>
        <div className={classNames(styles.divider, styles[theme])} />
        <div className={styles.action}>
          <div className={styles.search}>
            <div className={classNames(styles.search_filter, styles[theme])} onClick={() => setIsSelectNetwork(true)}>
              <div className={styles.search_box}>
                {network && (
                  <div className={styles.search_flex}>
                    <div className={styles.search_logo}>
                      {theme === 'light' ? (
                        <img width={30} height={30} src={network.chainSymbolImageUrl} alt="chainSymbolImageUrl" />
                      ) : (
                        <img width={30} height={30} src={network.chainSymbolImageUrl} alt="chainSymbolImageUrl" />
                      )}
                    </div>
                    <span className={classNames(styles.search_text, styles[theme])}>{network.chainName}</span>
                  </div>
                )}
                <div>{theme === 'light' ? <ArrowDownIconLight /> : <ArrowDownIcon />}</div>
              </div>
            </div>

            <SearchInput
              placeholder="Search Token"
              onSearch={(text) => {
                if (!text) return navigate('');
                navigate(`?token=${text}`);
              }}
              theme={theme}
            />
          </div>
        </div>
        <div className={styles.balances}>
          <div className={classNames(styles.box, styles[theme])}>
            <div>
              <CheckBox label="Hide small balances" checked={hideOtherSmallAmount} onCheck={setHideOtherSmallAmount} />
            </div>
            <div
              className={styles.refresh}
              onClick={async () => {
                await refreshBalances(
                  loadingRefresh,
                  setLoadingRefresh,
                  { metamaskAddress, tronAddress, oraiAddress, btcAddress, solAddress, tonAddress },
                  loadTokenAmounts
                );
              }}
            >
              <span>Refresh balances</span>
              <RefreshIcon />
            </div>
          </div>
        </div>
        <br />
        <LoadingBox loading={loadingRefresh}>
          <div className={styles.tokens}>
            <div className={styles.tokens_form} ref={ref}>
              {getFilterTokens(filterNetworkUI).map((t: TokenItemType) => {
                // check balance cw20
                let amount = BigInt(amounts[t.denom] ?? 0);
                let usd = getUsd(amount, t, prices);
                let subAmounts: AmountDetails;
                if (t.contractAddress && t.evmDenoms) {
                  subAmounts = getSubAmountDetails(amounts, t);
                  const subAmount = toAmount(toSumDisplay(subAmounts), t.decimals);
                  amount += subAmount;
                  usd += getUsd(subAmount, t, prices);
                }
                // TODO: hardcode check bitcoinTestnet need update later
                const isOwallet =
                  walletByNetworks.cosmos &&
                  walletByNetworks.cosmos === 'owallet' &&
                  //@ts-ignore
                  window?.owallet?.isOwallet;

                const isBtcToken = t.chainId === bitcoinChainId && t?.coinGeckoId === 'bitcoin';
                const isV2 = false;
                const TokenItemELement: React.FC<TokenItemProps> = isBtcToken && isV2 ? TokenItemBtc : TokenItem;
                return (
                  <div key={t.denom}>
                    {!isOwallet && !isMobile() && isBtcToken && (
                      <div className={styles.info}>
                        <div>
                          <TooltipIcon width={20} height={20} />
                        </div>
                        <span>Feature only supported on Owallet. Please connect Cosmos with Owallet</span>
                      </div>
                    )}
                    <TokenItemELement
                      onDepositBtc={async () => {
                        setIsDepositBtcModal(true);
                      }}
                      isBtcOfOwallet={isOwallet || isMobile()}
                      isBtcToken={isBtcToken}
                      className={classNames(styles.tokens_element, styles[theme])}
                      key={t.denom}
                      amountDetail={{ amount: amount.toString(), usd }}
                      subAmounts={subAmounts}
                      active={from?.denom === t.denom}
                      token={t}
                      theme={theme}
                      onClick={() => {
                        if (t.denom !== from?.denom) {
                          onClickToken(t);
                        }
                      }}
                      onClickTransfer={async (fromAmount: number, filterNetwork?: NetworkChainId) => {
                        await onClickTransfer(fromAmount, from, to, filterNetwork);
                      }}
                      convertKwt={async (transferAmount: number, fromToken: TokenItemType) => {
                        try {
                          const result = await convertKwt(transferAmount, fromToken);
                          processTxResult(from.rpc, result, getTransactionUrl(from.chainId, result.transactionHash));
                        } catch (ex) {
                          displayToast(TToastType.TX_FAILED, {
                            message: ex.message
                          });
                        }
                      }}
                      isFastMode={isFastMode}
                      setIsFastMode={setIsFastMode}
                      setToNetworkChainId={setToNetworkChainId}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </LoadingBox>
        {tokenUrl === 'kwt' && <KwtModal />}
        <SelectTokenModal
          isOpen={isSelectNetwork}
          open={() => setIsSelectNetwork(true)}
          close={() => setIsSelectNetwork(false)}
          prices={prices}
          amounts={amounts}
          type="network"
          items={networks}
          setToken={(chainId) => {
            setFilterNetworkUI(chainId);
          }}
        />
        <DepositBtcModalV2
          prices={prices}
          isOpen={isDepositBtcModal}
          open={() => setIsDepositBtcModal(true)}
          close={() => setIsDepositBtcModal(false)}
        />
      </div>
    </Content>
  );
};

export default Balance;
