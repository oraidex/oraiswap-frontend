import { coin, makeStdTx } from '@cosmjs/amino';
import { toBinary } from '@cosmjs/cosmwasm-stargate';
import { Decimal } from '@cosmjs/math';
import { DeliverTxResponse, isDeliverTxFailure } from '@cosmjs/stargate';
import { Tendermint37Client } from '@cosmjs/tendermint-rpc';
import { AppBitcoinClient } from '@oraichain/bitcoin-bridge-contracts-sdk';
import { NetworkChainId } from '@oraichain/common';
import {
  calculateTimeoutTimestamp,
  CONVERTER_CONTRACT,
  generateError,
  getTokenOnOraichain,
  MIXED_ROUTER,
  ORAI,
  ORAI_SOL_CONTRACT_ADDRESS,
  parseAssetInfo,
  parseTokenInfoRawDenom,
  solChainId,
  toAmount,
  toDisplay,
  TokenItemType
} from '@oraichain/oraidex-common';
import { UniversalSwapHandler, UniversalSwapHelper } from '@oraichain/oraidex-universal-swap';
import { NATIVE_MINT } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { isMobile } from '@walletconnect/browser-utils';
import ArrowDownIcon from 'assets/icons/arrow.svg?react';
import ArrowDownIconLight from 'assets/icons/arrow_light.svg?react';
import TooltipIcon from 'assets/icons/icon_tooltip.svg?react';
import RefreshIcon from 'assets/icons/reload.svg?react';
import { BitcoinUnit } from 'bitcoin-units';
import classNames from 'classnames';
import CheckBox from 'components/CheckBox';
import { SelectTokenModal } from 'components/Modals/SelectTokenModal';
import { displayToast, TToastType } from 'components/Toasts/Toast';
import TokenBalance from 'components/TokenBalance';
import { CwBitcoinContext } from 'context/cw-bitcoin-context';
import { NomicContext } from 'context/nomic-context';
import { TonChainId } from 'context/ton-provider';
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
  bitcoinChainId,
  CWAppBitcoinContractAddress,
  CWBitcoinFactoryDenom,
  DEFAULT_RELAYER_FEE,
  RELAYER_DECIMAL,
  CONVERTER_MIDDLEWARE,
  USDC_SOL_DENOM
} from 'helper/constants';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import useLoadTokens from 'hooks/useLoadTokens';
import useOnClickOutside from 'hooks/useOnClickOutside';
import { useGetFeeConfig } from 'hooks/useTokenFee';
import useWalletReducer from 'hooks/useWalletReducer';
import {
  chainInfos,
  flattenTokens,
  oraichainTokens as oraichainTokensCommon,
  oraidexCommon,
  otherChainTokens as otherChainTokenCommon
} from 'initCommon';
import Content from 'layouts/Content';
import Metamask from 'libs/metamask';
import { config } from 'libs/nomic/config';
import { OBTCContractAddress, OraiBtcSubnetChain, OraichainChain } from 'libs/nomic/models/ibc-chain';
import { getTotalUsd, getUsd, initEthereum, toSumDisplay, toTotalDisplay } from 'libs/utils';
import isEqual from 'lodash/isEqual';
import { refreshBalances } from 'pages/UniversalSwap/helpers';
import {
  ORAICHAIN_RELAYER_ADDRESS_AGENTS,
  ORAICHAIN_RELAYER_ADDRESS_DEFAI_MEME,
  SOL_RELAYER_ADDRESS_AGENTS,
  SOL_RELAYER_ADDRESS_DEFAI_MEME,
  Web3SolanaProgramInteraction,
  getStatusMemeBridge
} from 'program/web3';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSubAmountDetails } from 'rest/api';
import { RootState } from 'store/configure';
import styles from './Balance.module.scss';
import DepositBtcModalV2 from './DepositBtcModalV2';
import {
  calculatorTotalFeeBtc,
  findDefaultToToken,
  getFeeRate,
  getUtxos,
  mapUtxos,
  moveOraibToOraichain,
  useDepositFeesBitcoinV2,
  useGetWithdrawlFeesBitcoinV2
} from './helpers';
import useTonBridgeHandler from './hooks/useTonBridgeHandler';
import KwtModal from './KwtModal';
import SearchInput from './SearchInput';
import StuckOraib from './StuckOraib';
import useGetOraiBridgeBalances from './StuckOraib/useGetOraiBridgeBalances';
import TokenItem, { TokenItemProps } from './TokenItem';
import { TokenItemBtc } from './TokenItem/TokenItemBtc';
// import { SolanaNetworkConfig } from '@oraichain/orai-token-inspector';
import { CHAIN } from '@oraichain/orai-token-inspector';
import loadingGif from 'assets/gif/loading-page.gif';
import CloseIcon from 'assets/icons/close-icon.svg?react';
import OraiDarkIcon from 'assets/icons/oraichain.svg?react';
import { FallbackEmptyData } from 'components/FallbackEmptyData';
import { getTokenInspectorInstance } from 'initTokenInspector';
import { onChainTokenToTokenItem } from 'reducer/onchainTokens';
import { addToOraichainTokens, addToOtherChainTokens } from 'reducer/token';
import { parsePoolKey } from '@oraichain/oraiswap-v3';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { toUtf8 } from '@cosmjs/encoding';

interface BalanceProps { }
export const isMaintainBridge = false;

const Balance: React.FC<BalanceProps> = () => {
  //@ts-ignore
  const isOwallet = window.owallet?.isOwallet;

  // hook
  const [searchParams] = useSearchParams();
  const ref = useRef(null);
  const navigate = useNavigate();
  const searchTokenAddress = searchParams.get('token');
  const amounts = useSelector((state: RootState) => state.token.amounts);
  const feeConfig = useSelector((state: RootState) => state.token.feeConfigs);
  const nomic = useContext(NomicContext);
  const cwBitcoinContext = useContext(CwBitcoinContext);
  const [walletByNetworks] = useWalletReducer('walletsByNetwork');
  const dispatch = useDispatch();

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
  const [loadingInspector, setLoadingInspector] = useState(false);
  const [toToken, setToToken] = useState<TokenItemType>();
  const [toTokens, setToTokens] = useState<any>();
  const [filterNetworkUI, setFilterNetworkUI] = useConfigReducer('filterNetwork');
  const [hideOtherSmallAmount, setHideOtherSmallAmount] = useConfigReducer('hideOtherSmallAmount');
  const [tokenPoolPrices] = useConfigReducer('tokenPoolPrices');

  const {
    metamaskAddress,
    address: oraiAddress,
    tronAddress,
    tonAddress,
    solAddress,
    btcAddress,
    theme
  } = useSelector((state: RootState) => state.config);
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

  useEffect(() => {
    if (!toTokens || !toNetworkChainId) return;
    const toToken = toTokens?.[toNetworkChainId];
    if (toToken) {
      setToToken(onChainTokenToTokenItem(toToken));
      setTokenBridge([from, onChainTokenToTokenItem(toToken)]);
    }
  }, [toTokens, toNetworkChainId, filterNetworkUI]);

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
    (async () => {
      try {
        if (!searchTokenAddress) return setTokens([otherChainTokenCommon, oraichainTokensCommon]);

        const foundTokens = [otherChainTokenCommon, oraichainTokensCommon].map((childTokens) =>
          childTokens.filter((t) =>
            [t.name.toUpperCase(), t.contractAddress?.toUpperCase(), t.denom?.toUpperCase()].includes(
              searchTokenAddress.toUpperCase()
            )
          )
        );

        if (foundTokens.every((t) => t.length === 0)) {
          setLoadingInspector(true);
          // find token from inspector
          const tokenInspector = await getTokenInspectorInstance();
          const res = await tokenInspector.inspectTokenBridgeAtChain(searchTokenAddress, filterNetworkUI as CHAIN);
          const inspectedToken = res.fromToken;
          const toTokens = res.toTokens;
          if (toTokens) setToTokens(toTokens);
          if (inspectedToken.chainId === 'Oraichain') {
            setTokens([[], [onChainTokenToTokenItem(inspectedToken)]]);
            dispatch(addToOraichainTokens([inspectedToken]));
          } else {
            setTokens([[onChainTokenToTokenItem(inspectedToken)], []]);
            dispatch(addToOtherChainTokens([inspectedToken]));
          }
        } else {
          setTokens(foundTokens);
          setToTokens(null);
        }
      } catch (error) {
        console.error('Error inspect token with id: ', searchTokenAddress, error);
        setTokens([[], []]);
      } finally {
        setLoadingInspector(false);
        await loadTokenAmounts({ metamaskAddress, tronAddress, oraiAddress, btcAddress, solAddress, tonAddress });
      }
    })();
  }, [searchTokenAddress, filterNetworkUI]);

  useEffect(() => {
    initEthereum().catch((error) => {
      console.log(error);
    });
  }, []);

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

      let toToken = toTokens?.[toNetworkChainId];
      if (!toToken) {
        toToken = findDefaultToToken(token);
      }
      setTokenBridge([token, toToken]);
    },
    [otherChainTokens, oraichainTokens, from, to]
  );

  const handleTransferBTCToOraichain = async (fromToken: TokenItemType, transferAmount: number, btcAddr: string) => {
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
    const { bitcoinAddress: address } = cwBitcoinContext?.depositAddress || { bitcoinAddress: '' };
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
          customLink: `/bitcoin-dashboard-v2?tab=pending_deposits`
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
    try {
      if (!withdrawV2Fee?.withdrawal_fees) throw Error('Withdrawal fees are not found!');
      if (!depositV2Fee?.deposit_fees) throw Error('Deposit fees are not found!');

      const fee = isFastMode ? depositV2Fee?.deposit_fees : withdrawV2Fee?.withdrawal_fees;
      const amountInput = BigInt(Decimal.fromUserInput(toAmount(transferAmount, 14).toString(), 14).atomics.toString());
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
    toToken,
    transferAmount
  }: {
    fromToken: TokenItemType;
    toToken: TokenItemType;
    transferAmount: number;
  }) => {
    if (!oraiAddress) {
      throw new Error('Please connect to Oraichain wallet');
    }

    const isMemeBridge = getStatusMemeBridge(fromToken);
    let oraichainRelayer = ORAICHAIN_RELAYER_ADDRESS_AGENTS;
    let solRelayer = SOL_RELAYER_ADDRESS_AGENTS;
    if (isMemeBridge) {
      oraichainRelayer = ORAICHAIN_RELAYER_ADDRESS_DEFAI_MEME;
      solRelayer = SOL_RELAYER_ADDRESS_DEFAI_MEME;
    }

    const web3Solana = new Web3SolanaProgramInteraction();
    console.log('from token address: ', fromToken.contractAddress);
    const isListCheckBalanceSolToOraichain = [ORAI_SOL_CONTRACT_ADDRESS];
    if (isListCheckBalanceSolToOraichain.includes(fromToken.contractAddress)) {
      // TODO: need check if support new token in solana
      const currentBridgeBalance = await window.client.getBalance(oraichainRelayer, toToken.denom);
      console.log(
        'Current bridge balance  oraichain: ',
        toDisplay(currentBridgeBalance.amount, toToken.decimals),
        toToken.denom
      );
      if (toDisplay(currentBridgeBalance.amount, toToken.decimals) < transferAmount) {
        const message = `Transfer ${toToken.denom} to Oraichain failed. The bridge balance only has ${toDisplay(
          currentBridgeBalance.amount,
          toToken.decimals
        )}${currentBridgeBalance.denom.toUpperCase()}, wanted ${transferAmount}${currentBridgeBalance.denom.toUpperCase()}`;
        displayToast(TToastType.TX_FAILED, {
          message
        });
        throw new Error(message);
      }
    }

    if (fromToken.coinGeckoId === 'usd-coin') {
      const { balance } = await UniversalSwapHelper.getBalanceIBCOraichain(toToken, window.client, CONVERTER_CONTRACT);

      if (balance < transferAmount) {
        throw generateError(
          `The converter contract does not have enough balance to process this bridge transaction. Wanted ${transferAmount}, have ${balance}`
        );
      }
    }

    const response = await web3Solana.bridgeSolToOrai(wallet, fromToken, transferAmount, oraiAddress, solRelayer);
    const transaction = response?.transaction;
    if (transaction) {
      displayToast(TToastType.TX_SUCCESSFUL, {
        customLink: getTransactionUrl(fromToken.chainId, transaction)
      });
    }
  };

  const handleTransferOraichainToSol = async ({
    fromToken,
    toToken,
    transferAmount
  }: {
    fromToken: TokenItemType;
    toToken: TokenItemType;
    transferAmount: number;
  }) => {
    if (!solAddress) {
      throw new Error('Please connect to Solana wallet');
    }
    const isMemeBridge = getStatusMemeBridge(fromToken);
    let receiverAddress = ORAICHAIN_RELAYER_ADDRESS_AGENTS;
    let solRelayer = SOL_RELAYER_ADDRESS_AGENTS;
    if (isMemeBridge) {
      receiverAddress = ORAICHAIN_RELAYER_ADDRESS_DEFAI_MEME;
      solRelayer = SOL_RELAYER_ADDRESS_DEFAI_MEME;
    }

    const listNotCheckBalanceOraichainToSol = [ORAI, "cw20:orai1065qe48g7aemju045aeyprflytemx7kecxkf5m7u5h5mphd0qlcs47pclp:scORAI"];

    if (!fromToken.contractAddress && transferAmount < 0.01) {
      return displayToast(TToastType.TX_FAILED, {
        message: 'minimum bridge of solana native token is 0.01!'
      });
    }

    const toTokenIsSolanaNative = !toToken?.contractAddress;
    if (!toTokenIsSolanaNative && !listNotCheckBalanceOraichainToSol.includes(fromToken.denom)) {
      const web3Solana = new Web3SolanaProgramInteraction();
      const bridgeBalance =
        fromToken.contractAddress === NATIVE_MINT.toBase58()
          ? await web3Solana.getSolanaBalance(new PublicKey(solRelayer))
          : await web3Solana.getTokenBalance(solRelayer, toToken.contractAddress);
      console.log('token balance to solana: ', bridgeBalance, toToken.contractAddress);
      if (bridgeBalance < transferAmount) {
        const message = `Transfer ${fromToken.name} to Solana failed. The bridge balance only has ${bridgeBalance}${fromToken.name}, wanted ${transferAmount}${fromToken.name}`;
        displayToast(TToastType.TX_FAILED, {
          message
        });
        throw new Error(message);
      }
    }
    const tokenMintPubkey = toToken.contractAddress!;
    const converterMiddleware = CONVERTER_MIDDLEWARE?.[tokenMintPubkey];
    const instructions = [];
    let amount = [
      {
        amount: toAmount(transferAmount, fromToken.decimals).toString(),
        denom: fromToken.denom
      }
    ];

    // case USDC cw20
    if (converterMiddleware) {
      const { balance } = await UniversalSwapHelper.getBalanceIBCOraichain(
        {
          ...fromToken,
          denom: USDC_SOL_DENOM,
          contractAddress: undefined
        },
        window.client,
        CONVERTER_CONTRACT
      );

      if (balance < transferAmount) {
        throw generateError(
          `The converter contract does not have enough balance to process this bridge transaction. Wanted ${transferAmount}, have ${balance}`
        );
      }

      const parsedFrom = parseAssetInfo(converterMiddleware.from.info);
      const parsedTo = parseAssetInfo(converterMiddleware.to.info);
      instructions.push({
        typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
        value: MsgExecuteContract.fromPartial({
          sender: oraiAddress,
          contract: parsedTo,
          msg: toUtf8(
            JSON.stringify({
              send: {
                contract: CONVERTER_CONTRACT,
                amount: toAmount(transferAmount, converterMiddleware.to.decimals).toString(),
                msg: toBinary({
                  convert_reverse: {
                    from: converterMiddleware.from.info
                  }
                })
              }
            })
          )
        })
      });

      amount = [
        {
          amount: toAmount(transferAmount, converterMiddleware.from.decimals).toString(),
          denom: parsedFrom
        }
      ];
    }

    // case only scORAI cw20
    if (fromToken.contractAddress && !converterMiddleware) {
      instructions.push({
        typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
        value: MsgExecuteContract.fromPartial({
          sender: oraiAddress,
          contract: fromToken.contractAddress,
          msg: toUtf8(
            JSON.stringify({
              transfer: {
                recipient: receiverAddress,
                amount: toAmount(transferAmount, fromToken.decimals).toString(),
              }
            })
          )
        })
      });
    } else {
      instructions.push({
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: oraiAddress,
          toAddress: receiverAddress,
          amount
        }
      });
    }


    try {
      const result = await window.client.signAndBroadcast(oraiAddress, instructions, 'auto', solAddress);
      if (result) {
        displayToast(TToastType.TX_SUCCESSFUL, {
          customLink: getTransactionUrl(fromToken.chainId, result.transactionHash)
        });
      }
    } catch (err) {
      displayToast(TToastType.TX_FAILED, {
        message: err.message
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

      if (toNetworkChainId && (!toToken || toToken?.chainId !== toNetworkChainId)) {
        newToToken = [...otherChainTokenCommon, ...oraichainTokensCommon].find((flat) => {
          return flat.chainId === toNetworkChainId && flat.coinGeckoId === from.coinGeckoId;
        });

        assert(newToToken, 'Cannot find newToToken token that matches from token to bridge!');
      }

      // add check to token here because current permissionless tokens are not have coingeckoId
      if (!toToken) {
        assert(
          newToToken.coinGeckoId === from.coinGeckoId,
          `From token ${from.coinGeckoId} is different from to token ${newToToken.coinGeckoId}`
        );
      }

      // check transfer TON <=> ORAICHAIN,Osmosis
      const { isFromTonToCosmos, isFromCosmosToTON, isFromCosmosToCosmos } = await checkTransferTon(toNetworkChainId);
      if (isFromCosmosToCosmos || isFromTonToCosmos || isFromCosmosToTON) {
        return await handleTransferTon({
          isTonToCosmos: isFromTonToCosmos,
          isFromCosmosToCosmos,
          toNetworkChainId,
          transferAmount: fromAmount
        });
      }

      const [isSolToOraichain, isOraichainToSol, isBTCToOraichain, isBtcBridge] = checkTransfer(
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
          return handleTransferOraichainToSol({ fromToken: from, toToken: newToToken, transferAmount: fromAmount });
        }

        return handleTransferSolToOraichain({
          fromToken: from,
          toToken: newToToken,
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

  const listTokens = useMemo(() => {
    return getFilterTokens(filterNetworkUI);
  }, [filterNetworkUI, otherChainTokens, oraichainTokens]);

  const totalUsd = getTotalUsd(amounts, prices, tokenPoolPrices);

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

  const inputRef = useRef<HTMLInputElement>(null);
  const handleReset = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
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
                <div className={styles.search_flex}>
                  <div className={styles.search_logo}>
                    {network ? (
                      <img width={30} height={30} src={network.chainSymbolImageUrl} alt="chainSymbolImageUrl" />
                    ) : (
                      <OraiDarkIcon width={50} height={50} />
                    )}
                  </div>
                  <span className={classNames(styles.search_text, styles[theme])}>
                    {network?.chainName || 'Oraichain'}
                  </span>
                </div>
                <div>{theme === 'light' ? <ArrowDownIconLight /> : <ArrowDownIcon />}</div>
              </div>
            </div>

            <SearchInput
              placeholder={searchTokenAddress || 'Search Token'}
              onSearch={(text) => {
                if (!text) navigate('');
                else navigate(`?token=${text}`);
              }}
              ref={inputRef}
              theme={theme}
            />
            <div
              className={styles.closeIcon}
              title="Clear input"
              onClick={() => {
                if (searchTokenAddress) {
                  handleReset();
                  navigate('');
                }
              }}
            >
              <CloseIcon width={20} height={20} />
            </div>
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
                if (listTokens.length === 0) return;
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
        {loadingRefresh || loadingInspector ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center'
            }}
            className={styles.loading}
          >
            <img src={loadingGif} width={50} height={50} alt="" />
          </div>
        ) : (
          <div className={styles.tokens}>
            <div className={styles.tokens_form} ref={ref}>
              {listTokens.length > 0 ? (
                listTokens.map((t: TokenItemType) => {
                  // check balance cw20
                  let amount = BigInt(amounts[t.denom] ?? 0);

                  const tokenPrice = prices[t.coinGeckoId] ?? tokenPoolPrices[parseTokenInfoRawDenom(t)] ?? 0;
                  let usd = getUsd(amount, t, prices, tokenPrice);
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
                  const TokenItemELement: React.FC<TokenItemProps> = TokenItem;
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
                        toToken={toToken}
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
                        isFastMode={isFastMode}
                        setIsFastMode={setIsFastMode}
                        setToNetworkChainId={setToNetworkChainId}
                      />
                    </div>
                  );
                })
              ) : (
                <FallbackEmptyData />
              )}
            </div>
          </div>
        )}
        {searchTokenAddress === 'kwt' && <KwtModal />}
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
