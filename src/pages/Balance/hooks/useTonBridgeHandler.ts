import { ExecuteInstruction, toBinary } from '@cosmjs/cosmwasm-stargate';
import { fromBech32 } from '@cosmjs/encoding';
import { coin, Coin, coins, GasPrice } from '@cosmjs/stargate';
import {
  BigDecimal,
  calculateTimeoutTimestamp,
  CosmosChainId,
  cosmosChains,
  CW20_DECIMALS,
  getCosmosGasPrice,
  getEncodedExecuteContractMsgs,
  handleSentFunds,
  IBC_WASM_CONTRACT,
  OSMOSIS_ROUTER_CONTRACT,
  toAmount,
  toDisplay,
  TokenItemType
} from '@oraichain/oraidex-common';
import { buildUniversalSwapMemo, SwapAndAction, UniversalSwapHelper } from '@oraichain/oraidex-universal-swap';
import { BridgeAdapter, JettonMinter, JettonWallet } from '@oraichain/ton-bridge-contracts';
import { TonbridgeBridgeClient } from '@oraichain/tonbridge-contracts-sdk';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { Address, beginCell, Cell, toNano } from '@ton/core';
import { TonClient } from '@ton/ton';
import { Base64 } from '@tonconnect/protocol';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { displayToast, TToastType } from 'components/Toasts/Toast';
import {
  AlloyedPool,
  chainInfos,
  oraichainTokensWithIcon,
  OsmosisAlloyedPools,
  OsmosisTokenDenom,
  OsmosisTokenList,
  TON_ZERO_ADDRESS,
  tonNetworkTokens
} from 'config/chainInfos';
import { network } from 'config/networks';
import { TON_SCAN, TonChainId, TonInteractionContract, TonNetwork } from 'context/ton-provider';
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import { getTransactionUrl, handleErrorTransaction } from 'helper';
import { numberWithCommas } from 'helper/format';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import useLoadTokens from 'hooks/useLoadTokens';
import { getCosmWasmClient } from 'libs/cosmjs';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configure';
import useGetFee from './useGetFee';
import useGetStateData from './useGetStateData';

const FWD_AMOUNT = toNano(0.15);
const TON_MESSAGE_VALID_UNTIL = 100000;
const BRIDGE_TON_TO_ORAI_MINIMUM_GAS = toNano(1);
const EXTERNAL_MESSAGE_FEE = toNano(0.01);
const MINIMUM_BRIDGE_PER_USD = 1; // 10; // TODO: update for product is 10

export {
  BRIDGE_TON_TO_ORAI_MINIMUM_GAS,
  EXTERNAL_MESSAGE_FEE,
  FWD_AMOUNT,
  MINIMUM_BRIDGE_PER_USD,
  TON_MESSAGE_VALID_UNTIL
};

const useTonBridgeHandler = ({
  token,
  fromNetwork,
  toNetwork
}: {
  token: TokenItemType;
  fromNetwork: string;
  toNetwork: string;
}) => {
  const [tonAddress, setTonAddress] = useConfigReducer('tonAddress');
  const [oraiAddress, setOraiAddress] = useConfigReducer('address');
  const [walletsTon] = useConfigReducer('walletsTon');
  const amounts = useSelector((state: RootState) => state.token.amounts);

  const { balances: sentBalance, getChanelStateData } = useGetStateData();
  const loadTokenAmounts = useLoadTokens();

  const [tonConnectUI] = useTonConnectUI();
  const { data: prices } = useCoinGeckoPrices();
  const [tokenInfo, setTokenInfo] = useState({
    jettonWalletAddress: null
  });
  const [deductNativeAmount, setDeductNativeAmount] = useState(0n);

  const { bridgeFee, tokenFee } = useGetFee({
    token,
    fromNetwork,
    toNetwork
  });

  useEffect(() => {
    if (token?.chainId === TonChainId && token?.contractAddress === TON_ZERO_ADDRESS) {
      setDeductNativeAmount(BRIDGE_TON_TO_ORAI_MINIMUM_GAS);
      return;
    }
    setDeductNativeAmount(0n);
  }, [token]);

  // @dev: this function will changed based on token minter address (which is USDT, USDC, bla bla bla)
  useEffect(() => {
    try {
      (async () => {
        if (token?.chainId !== TonChainId) return;

        // get the decentralized RPC endpoint
        const endpoint = await getHttpEndpoint();
        const client = new TonClient({
          endpoint
        });
        if (token?.contractAddress === TON_ZERO_ADDRESS) {
          setDeductNativeAmount(BRIDGE_TON_TO_ORAI_MINIMUM_GAS);
          setTokenInfo({
            jettonWalletAddress: ''
          });
          return;
        }

        const jettonMinter = JettonMinter.createFromAddress(Address.parse(token.contractAddress));
        const jettonMinterContract = client.open(jettonMinter);
        const jettonWalletAddress = await jettonMinterContract.getWalletAddress(Address.parse(tonAddress));

        setTokenInfo({
          jettonWalletAddress
        });
        setDeductNativeAmount(0n);
      })();
    } catch (error) {
      console.log('error :>>', error);
    }
  }, [token]); // toNetwork, tonAddress

  const handleCheckBalanceBridgeOfTonNetwork = async (token: TokenItemType) => {
    try {
      // get the decentralized RPC endpoint
      const endpoint = await getHttpEndpoint();
      const client = new TonClient({
        endpoint
      });
      const bridgeAdapter = TonInteractionContract[TonNetwork.Mainnet].bridgeAdapter;

      if (token.contractAddress === TON_ZERO_ADDRESS) {
        const balance = await client.getBalance(Address.parse(bridgeAdapter));

        return {
          balance: balance
        };
      }

      const jettonWallet = JettonWallet.createFromAddress(Address.parse(walletsTon[token.denom]));
      const jettonWalletContract = client.open(jettonWallet);
      const balance = await jettonWalletContract.getBalance();
      console.log({ bridgeAdapter, jettonWallet, balance });
      return {
        balance: balance.amount
      };
    } catch (error) {
      console.log('error :>> handleCheckBalanceBridgeOfTonNetwork', error);
    }
  };

  const handleCheckBalanceBridgeOfOraichain = async (token: TokenItemType) => {
    try {
      if (token) {
        if (!token.contractAddress) {
          const data = await window.client.getBalance(network.CW_TON_BRIDGE, token.denom);
          return {
            balance: data.amount
          };
        }

        const tx = await window.client.queryContractSmart(token.contractAddress, {
          balance: { address: network.CW_TON_BRIDGE }
        });

        return {
          balance: tx?.balance || 0
        };
      }
    } catch (error) {
      console.log('error :>> handleCheckBalanceBridgeOfOraichain', error);
    }
  };

  const handleCheckBalanceBridgeOfOsmosis = async (token: TokenItemType, fromChainId: string) => {
    try {
      if (token) {
        if (!token.contractAddress) {
          const findCosmosChain = chainInfos.find((chain) => chain.chainId === fromChainId);
          const { client } = await getCosmWasmClient(
            { chainId: fromChainId, rpc: findCosmosChain.rpc },
            {
              gasPrice: GasPrice.fromString(
                `${getCosmosGasPrice(findCosmosChain.feeCurrencies[0].gasPriceStep)}${
                  findCosmosChain.feeCurrencies[0].coinMinimalDenom
                }`
              )
            }
          );
          const data = await client.getBalance(network.CW_TON_BRIDGE, token.denom);
          return {
            balance: data.amount
          };
        }
      }
    } catch (error) {
      console.log('error :>> handleCheckBalanceBridgeOfOsmosis', error);
    }
  };

  const checkBalanceBridgeByNetwork = async (networkFrom: string, token: TokenItemType) => {
    const handler = {
      ['Oraichain']: handleCheckBalanceBridgeOfTonNetwork,
      [TonChainId]: handleCheckBalanceBridgeOfOraichain,
      ['osmosis-1']: handleCheckBalanceBridgeOfOsmosis
    };

    const { balance } = handler[networkFrom] ? await handler[networkFrom](token) : { balance: 0 };

    return toDisplay(balance || 0, token.decimals || token.decimals || CW20_DECIMALS);
  };

  const validatePrice = (token: TokenItemType, amount: number) => {
    let totalFee =
      Number.parseFloat(
        numberWithCommas(bridgeFee || 0, undefined, {
          maximumFractionDigits: CW20_DECIMALS
        })
      ) +
      Number.parseFloat(
        numberWithCommas(new BigDecimal(tokenFee).mul(amount || 0).toNumber(), undefined, { maximumFractionDigits: 6 })
      );

    if (amount < totalFee) {
      throw Error(`Minimum bridge is ${totalFee} ${token['coinDenom'] || token.name}`);
    }
  };

  const buildOsorSwapMsg = (
    { user_swap, min_asset, timeout_timestamp, post_swap_action, affiliates }: SwapAndAction,
    isInitial: boolean,
    fromAddress?: string,
    funds?: Coin[]
  ) => {
    const msg = {
      msg: {
        swap_and_action: {
          user_swap,
          min_asset,
          timeout_timestamp,
          post_swap_action,
          affiliates
        }
      }
    };

    if (isInitial) {
      if (!fromAddress) {
        throw new Error('Missing fromAddress');
      }
      return {
        msgActionSwap: {
          sender: fromAddress,
          contractAddress: OSMOSIS_ROUTER_CONTRACT,
          funds,
          ...msg
        }
      };
    }

    return {
      msgActionSwap: {
        wasm: {
          contract: OSMOSIS_ROUTER_CONTRACT,
          ...msg
        }
      }
    };
  };

  const handleBridgeFromTon = async (amount: number | string) => {
    try {
      if (!oraiAddress) throw 'Please connect OWallet or Kelpr!';

      if (!tonAddress) throw 'Please connect Ton Wallet';

      if (!token || !amount) throw 'Not valid!';

      if (toDisplay(amounts?.[token.denom] || '0', token['coinDecimals'] || token.decimals) < Number(amount))
        throw 'Insufficient funds';

      validatePrice(token, Number(amount));

      // setLoading(true);

      const tokenInOrai = oraichainTokensWithIcon.find((tk) => tk.coinGeckoId === token.coinGeckoId);
      const balanceMax = await checkBalanceBridgeByNetwork(TonChainId, tokenInOrai);

      if (!tokenInOrai?.mintBurn && Number(balanceMax) < Number(amount)) {
        // setLoading(false);
        throw `The bridge contract does not have enough balance to process this bridge transaction. Wanted ${amount} ${
          token['coinDenom'] || token.name
        }, have ${balanceMax} ${token['coinDenom'] || token.name}`;
      }

      const bridgeAdapterAddress = Address.parse(TonInteractionContract[TonNetwork.Mainnet].bridgeAdapter);
      const fmtAmount = new BigDecimal(10).pow(token.decimals || token['coinDecimals']).mul(amount);
      const isNativeTon: boolean = token.contractAddress === TON_ZERO_ADDRESS;
      const toAddress: string = isNativeTon
        ? bridgeAdapterAddress.toString()
        : tokenInfo.jettonWalletAddress?.toString();
      console.log('THIS IS TO ADDRESS:', { toAddress }, { walletsTon });
      const oraiAddressBech32 = fromBech32(oraiAddress).data;
      const gasAmount = isNativeTon
        ? fmtAmount.add(BRIDGE_TON_TO_ORAI_MINIMUM_GAS).toString()
        : BRIDGE_TON_TO_ORAI_MINIMUM_GAS.toString();
      const timeout = BigInt(Math.floor(new Date().getTime() / 1000) + 3600);

      let memo = beginCell().endCell();

      if (toNetwork === 'osmosis-1') {
        const osmosisAddress = await window.Keplr.getKeplrAddr(toNetwork);
        let osmosisReceiver = osmosisAddress;
        if (!osmosisAddress) throw 'Please connect OWallet or Kelpr!';

        let osorRouterMemo = '';
        let hasAlloyedPool = canConvertToAlloyedToken(token.coinGeckoId);
        if (hasAlloyedPool) {
          osmosisReceiver = OSMOSIS_ROUTER_CONTRACT;
          let { msgActionSwap } = buildOsorSwapMsg(
            {
              user_swap: {
                swap_exact_asset_in: {
                  swap_venue_name: 'osmosis-poolmanager',
                  operations: [
                    {
                      pool: hasAlloyedPool.poolId,
                      denom_in: hasAlloyedPool.sourceToken,
                      denom_out: hasAlloyedPool.alloyedToken
                    }
                  ]
                }
              },
              min_asset: {
                native: {
                  denom: hasAlloyedPool.alloyedToken,
                  amount: '0'
                }
              }, //  consider add minimum receive (Currently, alloy pool is swap 1-1, so no't need to add min_asset
              timeout_timestamp: Number(calculateTimeoutTimestamp(3600)),
              post_swap_action: {
                transfer: {
                  to_address: osmosisAddress
                }
              },
              affiliates: []
            },
            false
          );
          osorRouterMemo = JSON.stringify(msgActionSwap);
        }

        const buildMemoSwap = buildUniversalSwapMemo(
          {
            minimumReceive: '0',
            recoveryAddr: oraiAddress
          },
          undefined,
          undefined,
          undefined,
          {
            sourceChannel: 'channel-13',
            sourcePort: 'transfer',
            receiver: osmosisReceiver,
            memo: osorRouterMemo,
            recoverAddress: oraiAddress
          },
          undefined
        );
        memo = beginCell().storeStringRefTail(buildMemoSwap).endCell();
      }

      console.log('contractAddress:', token.contractAddress);
      const getNativeBridgePayload = () =>
        BridgeAdapter.buildBridgeTonBody(
          {
            amount: BigInt(fmtAmount.toString()),
            memo,
            remoteReceiver: oraiAddress,
            timeout
          },
          oraiAddressBech32,
          {
            queryId: 0,
            value: toNano(0) // don't care this
          }
        ).toBoc();

      const getOtherBridgeTokenPayload = () =>
        JettonWallet.buildSendTransferPacket(
          Address.parse(tonAddress),
          {
            fwdAmount: FWD_AMOUNT,
            jettonAmount: BigInt(fmtAmount.toString()),
            jettonMaster: Address.parse(token.contractAddress),
            remoteReceiver: oraiAddress,
            timeout,
            memo,
            toAddress: bridgeAdapterAddress
          },
          0
        ).toBoc();

      const boc = isNativeTon ? getNativeBridgePayload() : getOtherBridgeTokenPayload();

      const tx = await tonConnectUI.sendTransaction({
        validUntil: TON_MESSAGE_VALID_UNTIL,
        messages: [
          {
            address: toAddress, // dia chi token
            amount: gasAmount, // gas
            payload: Base64.encode(boc)
          }
        ]
      });

      const txHash = Cell.fromBoc(Buffer.from(tx.boc, 'base64'))[0].hash().toString('hex');

      if (txHash) {
        displayToast(TToastType.TX_SUCCESSFUL, {
          customLink: `${TON_SCAN}/transaction/${txHash}`
        });

        loadTokenAmounts({ oraiAddress, tonAddress });
        getChanelStateData();
      }
    } catch (error) {
      console.log('error Bridge from TON :>>', error);

      handleErrorTransaction(error, {
        tokenName: token['coindDenom'],
        chainName: toNetwork
      });
    }
  };

  const handleBridgeFromCosmos = async (amount: number | string) => {
    try {
      if (!oraiAddress) throw 'Please connect OWallet or Kelpr!';

      if (!tonAddress) throw 'Please connect Ton Wallet';

      if (!token || !amount) throw 'Not valid!';

      // setLoading(true);
      const isFromOsmosisToOraichain = fromNetwork === 'osmosis-1' && toNetwork === 'Oraichain';
      const isFromOraichainToOsmosis = fromNetwork === 'Oraichain' && toNetwork === 'osmosis-1';
      const isFromOsmosisToTon = fromNetwork === 'osmosis-1' && toNetwork === TonChainId;

      // Osmosis <-> Oraichain
      // Oraichain <-> Osmosis
      // Osmosis -> Ton
      if (isFromOsmosisToOraichain || isFromOraichainToOsmosis || isFromOsmosisToTon) {
        if (isFromOsmosisToTon) {
          validatePrice(token, Number(amount));
        }
        const timeout = Math.floor(new Date().getTime() / 1000) + 3600;
        const fromChainId = fromNetwork as CosmosChainId;
        const toChainId = isFromOsmosisToTon ? ('Oraichain' as CosmosChainId) : (toNetwork as CosmosChainId);

        let [fromAddress, toAddress] = await Promise.all([
          window.Keplr.getKeplrAddr(fromChainId),
          window.Keplr.getKeplrAddr(toChainId)
        ]);

        if (!fromAddress || !toAddress) throw 'Please connect OWallet or Kelpr!';

        let memo = '';
        if (isFromOsmosisToTon) {
          toAddress = IBC_WASM_CONTRACT;

          const memoUniversal = buildUniversalSwapMemo(
            { minimumReceive: '0', recoveryAddr: oraiAddress },
            undefined,
            undefined,
            {
              contractAddress: network.CW_TON_BRIDGE,
              msg: toBinary({
                bridge_to_ton: {
                  to: tonAddress,
                  denom: tonNetworkTokens.find((tk) => tk.coinGeckoId === token.coinGeckoId).contractAddress,
                  timeout,
                  recovery_addr: oraiAddress
                }
              })
            },
            undefined,
            undefined
          );

          memo = JSON.stringify({
            wasm: {
              contract: IBC_WASM_CONTRACT,
              msg: {
                ibc_hooks_receive: {
                  func: 'universal_swap',
                  orai_receiver: oraiAddress,
                  args: memoUniversal
                }
              }
            }
          });
        }
        if (isFromOraichainToOsmosis) {
          let hasAlloyedPool = canConvertToAlloyedToken(token.coinGeckoId);
          if (hasAlloyedPool) {
            let { msgActionSwap } = buildOsorSwapMsg(
              {
                user_swap: {
                  swap_exact_asset_in: {
                    swap_venue_name: 'osmosis-poolmanager',
                    operations: [
                      {
                        pool: hasAlloyedPool.poolId,
                        denom_in: hasAlloyedPool.sourceToken,
                        denom_out: hasAlloyedPool.alloyedToken
                      }
                    ]
                  }
                },
                min_asset: {
                  native: {
                    denom: hasAlloyedPool.alloyedToken,
                    amount: '0'
                  }
                }, //  consider add minimum receive (Currently, alloy pool is swap 1-1, so no't need to add min_asset
                timeout_timestamp: Number(calculateTimeoutTimestamp(3600)),
                post_swap_action: {
                  transfer: {
                    to_address: toAddress
                  }
                },
                affiliates: []
              },
              false
            );
            memo = JSON.stringify(msgActionSwap);
            toAddress = OSMOSIS_ROUTER_CONTRACT;
          }
        }

        const ibcInfo = UniversalSwapHelper.getIbcInfo(fromChainId, toChainId);
        let executeMsg;
        if (fromNetwork === 'osmosis-1' && token.denom === OsmosisTokenDenom.allTon) {
          let hasAlloyedPool = canConvertToAlloyedToken(token.coinGeckoId);
          if (!hasAlloyedPool) throw new Error('AlloyPool does not exist!');
          // need convert from alloyed  first
          let { msgActionSwap } = buildOsorSwapMsg(
            {
              user_swap: {
                swap_exact_asset_in: {
                  swap_venue_name: 'osmosis-poolmanager',
                  operations: [
                    {
                      pool: hasAlloyedPool.poolId,
                      denom_in: hasAlloyedPool.alloyedToken,
                      denom_out: hasAlloyedPool.sourceToken
                    }
                  ]
                }
              },
              min_asset: {
                native: {
                  denom: hasAlloyedPool.sourceToken,
                  amount: '0'
                }
              }, //  consider add minimum receive (Currently, alloy pool is swap 1-1, so no't need to add min_asset
              timeout_timestamp: Number(calculateTimeoutTimestamp(3600)),
              post_swap_action: {
                ibc_transfer: {
                  ibc_info: {
                    source_channel: ibcInfo.channel,
                    receiver: toAddress,
                    memo,
                    recover_address: fromAddress
                  }
                }
              },
              affiliates: []
            },
            true,
            fromAddress,
            coins(toAmount(amount, token.decimals).toString(), token.denom)
          );

          executeMsg = getEncodedExecuteContractMsgs(fromAddress, [msgActionSwap as ExecuteInstruction]);
        } else
          executeMsg = [
            {
              typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
              value: MsgTransfer.fromPartial({
                sourcePort: ibcInfo.source,
                sourceChannel: ibcInfo.channel,
                token: coin(toAmount(amount, token.decimals).toString(), token.denom),
                sender: fromAddress,
                receiver: toAddress,
                memo,
                timeoutTimestamp: calculateTimeoutTimestamp(ibcInfo.timeout)
              })
            }
          ];

        const findCosmosChain = cosmosChains.find((chain) => chain.chainId === fromNetwork);

        const { client } = await getCosmWasmClient(
          { chainId: fromChainId, rpc: findCosmosChain.rpc },
          {
            gasPrice: GasPrice.fromString(
              `${getCosmosGasPrice(findCosmosChain.feeCurrencies[0].gasPriceStep)}${
                findCosmosChain.feeCurrencies[0].coinMinimalDenom
              }`
            )
          }
        );
        const tx = await client.signAndBroadcast(fromAddress, executeMsg, 'auto');

        if (tx?.transactionHash) {
          displayToast(TToastType.TX_SUCCESSFUL, {
            customLink: getTransactionUrl(fromNetwork as any, tx.transactionHash)
          });
          loadTokenAmounts({ oraiAddress, tonAddress });
        }
        return;
      }
      validatePrice(token, Number(amount));

      const tokenInTon = tonNetworkTokens.find((tk) => tk.coinGeckoId === token.coinGeckoId);
      const bridgeJettonWallet = walletsTon[tokenInTon.denom];
      if (!bridgeJettonWallet) throw 'Bridge wallet not found!';

      const balanceMax = (sentBalance || []).find((b) => b.native.denom === bridgeJettonWallet)?.native.amount;

      const displayBalance = toDisplay(balanceMax, tokenInTon?.decimals || CW20_DECIMALS);

      if (displayBalance < Number(amount) && token.contractAddress !== null) {
        // setLoading(false);
        throw `The bridge contract does not have enough balance to process this bridge transaction. Wanted ${amount} ${token.name}, have ${displayBalance} ${token.name}`;
      }

      const tonBridgeClient = new TonbridgeBridgeClient(window.client, oraiAddress, network.CW_TON_BRIDGE);

      let tx;

      const timeout = Math.floor(new Date().getTime() / 1000) + 3600;

      const msg = {
        // crcSrc: ARG_BRIDGE_TO_TON.CRC_SRC,
        denom: bridgeJettonWallet,
        timeout,
        to: tonAddress
      };

      const funds = handleSentFunds({
        denom: token.denom,
        amount: toAmount(amount, token.decimals || token['coinDecimals']).toString()
      });

      // native token
      if (!token.contractAddress) {
        tx = await tonBridgeClient.bridgeToTon(msg, 'auto', null, funds);
      }
      // cw20 token
      else {
        tx = await window.client.execute(
          oraiAddress,
          token.contractAddress,
          {
            send: {
              contract: network.CW_TON_BRIDGE,
              amount: toAmount(amount, token.decimals || token['coinDecimals']).toString(),
              msg: toBinary({
                denom: msg.denom,
                timeout,
                to: msg.to
              })
            }
          },
          'auto'
        );
      }

      if (tx?.transactionHash) {
        displayToast(TToastType.TX_SUCCESSFUL, {
          customLink: getTransactionUrl(fromNetwork as any, tx.transactionHash)
        });
        loadTokenAmounts({ oraiAddress, tonAddress });
      }
    } catch (error) {
      console.log('error Bridge from Oraichain :>>', error);
      handleErrorTransaction(error, {
        tokenName: token.name || token['coinDenom'],
        chainName: toNetwork
      });
    }
  };

  return {
    handleBridgeFromCosmos,
    handleBridgeFromTon
  };
};

export default useTonBridgeHandler;

export const canConvertToAlloyedToken = (coinGeckoId: string): AlloyedPool | undefined => {
  const hasAlloyed = OsmosisTokenList.find(
    (token) => token.coinGeckoId == coinGeckoId && token.denom === OsmosisTokenDenom.allTon
  );
  return hasAlloyed ? OsmosisAlloyedPools.find((pool) => pool.alloyedToken == hasAlloyed.denom) : undefined;
};
