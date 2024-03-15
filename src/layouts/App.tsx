import {
  IBC_WASM_CONTRACT,
  WEBSOCKET_RECONNECT_ATTEMPTS,
  WEBSOCKET_RECONNECT_INTERVAL
} from '@oraichain/oraidex-common';
import { isMobile } from '@walletconnect/browser-utils';
import { TToastType, displayToast } from 'components/Toasts/Toast';
import { network } from 'config/networks';
import { ThemeProvider } from 'context/theme-context';
import { getListAddressCosmos, getNetworkGasPrice, interfaceRequestTron } from 'helper';
import { leapWalletType } from 'helper/constants';
import useConfigReducer from 'hooks/useConfigReducer';
import useLoadTokens from 'hooks/useLoadTokens';
import useWalletReducer from 'hooks/useWalletReducer';
import Keplr from 'libs/keplr';
import Metamask from 'libs/metamask';
import { buildUnsubscribeMessage, buildWebsocketSendMessage, processWsResponseMsg } from 'libs/utils';
import { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import routes from 'routes';
import { persistor } from 'store/configure';
import { PERSIST_VER } from 'store/constants';
import Instruct from './Instruct';
import Menu from './Menu';
import './index.scss';
import { NoticeBanner } from './NoticeBanner';
import Sidebar from './Sidebar';

const App = () => {
  const [address, setOraiAddress] = useConfigReducer('address');
  const [, setTronAddress] = useConfigReducer('tronAddress');
  const [, setMetamaskAddress] = useConfigReducer('metamaskAddress');
  const [walletTypeStore] = useConfigReducer('walletTypeStore');
  const [, setStatusChangeAccount] = useConfigReducer('statusChangeAccount');
  const loadTokenAmounts = useLoadTokens();
  const [persistVersion, setPersistVersion] = useConfigReducer('persistVersion');
  const [theme] = useConfigReducer('theme');
  const [walletByNetworks] = useWalletReducer('walletsByNetwork');
  const [, setCosmosAddress] = useConfigReducer('cosmosAddress');
  const mobileMode = isMobile();
  const ethOwallet = window.eth_owallet;
  // useTronEventListener();

  // TODO: polyfill evm, tron, need refactor
  useEffect(() => {
    if (walletByNetworks.tron === 'owallet') {
      window.tronWebDapp = window.tronWeb_owallet;
      window.tronLinkDapp = window.tronLink_owallet;
      window.Metamask = new Metamask(window.tronWebDapp);
    }
    if (walletByNetworks.evm === 'owallet' && ethOwallet) {
      window.ethereumDapp = ethOwallet;
    }
  }, [walletByNetworks, ethOwallet]);

  //Public API that will echo messages sent to it back to the client
  const { sendJsonMessage, lastJsonMessage } = useWebSocket(
    `wss://${new URL(network.rpc).host}/websocket`, // only get rpc.orai.io
    {
      onOpen: () => {
        console.log('opened websocket, subscribing...');
        // subscribe to IBC Wasm case
        sendJsonMessage(
          buildWebsocketSendMessage(
            `wasm._contract_address = '${IBC_WASM_CONTRACT}' AND wasm.action = 'receive_native' AND wasm.receiver = '${address}'`
          ),
          true
        );
        // sendJsonMessage(buildWebsocketSendMessage(`coin_received.receiver = '${address}'`), true);
        // subscribe to MsgSend and MsgTransfer event case
        // sendJsonMessage(buildWebsocketSendMessage(`coin_spent.spender = '${address}'`, 2), true);
        // subscribe to cw20 contract transfer & send case
        // sendJsonMessage(buildWebsocketSendMessage(`wasm.to = '${address}'`, 3), true);
        // sendJsonMessage(buildWebsocketSendMessage(`wasm.from = '${address}'`, 4), true);
      },
      onClose: () => {
        console.log('unsubscribe all clients');
        sendJsonMessage(buildUnsubscribeMessage());
      },
      onReconnectStop(numAttempts) {
        // if cannot reconnect then we unsubscribe all
        if (numAttempts === WEBSOCKET_RECONNECT_ATTEMPTS) {
          console.log('reconnection reaches above limit. Unsubscribe to all!');
          sendJsonMessage(buildUnsubscribeMessage());
        }
      },
      shouldReconnect: (closeEvent) => true,
      reconnectAttempts: WEBSOCKET_RECONNECT_ATTEMPTS,
      reconnectInterval: WEBSOCKET_RECONNECT_INTERVAL
    }
  );

  // this is used for debugging only
  useEffect(() => {
    const tokenDisplay = processWsResponseMsg(lastJsonMessage);
    if (tokenDisplay) {
      displayToast(TToastType.TX_INFO, {
        message: `You have received ${tokenDisplay}`
      });
      // no metamaskAddress, only reload cosmos
      loadTokenAmounts({ oraiAddress: address });
    }
  }, [lastJsonMessage]);

  // clear persist storage when update version
  useEffect(() => {
    const isClearPersistStorage = persistVersion === undefined || persistVersion !== PERSIST_VER;
    const clearPersistStorage = () => {
      persistor.pause();
      persistor.flush().then(() => {
        return persistor.purge();
      });
      setPersistVersion(PERSIST_VER);
    };

    if (isClearPersistStorage) clearPersistStorage();

    // if (window.keplr && !isMobile()) {
    //   keplrGasPriceCheck();
    // }
  }, []);

  useEffect(() => {
    // just auto connect keplr in mobile mode
    mobileMode && keplrHandler();
  }, [mobileMode]);

  useEffect(() => {
    (async () => {
      if (![leapWalletType, 'eip191'].includes(walletTypeStore) || isMobile()) {
        window.addEventListener('keplr_keystorechange', keplrHandler);
      }
    })();
    return () => {
      window.removeEventListener('keplr_keystorechange', keplrHandler);
    };
  }, [walletTypeStore]);

  const keplrGasPriceCheck = async () => {
    try {
      const gasPrice = await getNetworkGasPrice(network.chainId);
      if (!gasPrice) {
        displayToast(TToastType.TX_INFO, {
          message: `In order to update new fee settings, you need to remove Oraichain network and refresh OraiDEX to re-add the network.`,
          customLink: 'https://www.youtube.com/watch?v=QMqCVUfxDAk'
        });
      }
    } catch (error) {
      console.log('Error keplrGasPriceCheck: ', error);
    }
  };

  const keplrHandler = async () => {
    try {
      let metamaskAddress, oraiAddress, tronAddress;

      if (mobileMode) {
        window.tronWebDapp = window.tronWeb;
        window.tronLinkDapp = window.tronLink;
        window.ethereumDapp = window.ethereum;
        window.Keplr = new Keplr('owallet');
        window.Metamask = new Metamask(window.tronWebDapp);
      }

      if (walletByNetworks.cosmos || mobileMode) {
        oraiAddress = await window.Keplr.getKeplrAddr();
        if (oraiAddress) {
          const { listAddressCosmos } = await getListAddressCosmos(oraiAddress);
          setCosmosAddress(listAddressCosmos);
          setOraiAddress(oraiAddress);
        }
      }

      if (walletByNetworks.evm === 'owallet' || mobileMode) {
        if (mobileMode) await window.Metamask.switchNetwork(Networks.bsc);
        metamaskAddress = await window.Metamask.getEthAddress();
        if (metamaskAddress) setMetamaskAddress(metamaskAddress);
      }

      if (walletByNetworks.tron === 'owallet' || mobileMode) {
        const res: interfaceRequestTron = await window.tronLinkDapp.request({
          method: 'tron_requestAccounts'
        });
        tronAddress = res?.base58;
        if (tronAddress) setTronAddress(tronAddress);
      }

      loadTokenAmounts({
        oraiAddress,
        metamaskAddress,
        tronAddress
      });
    } catch (error) {
      console.log('Error: ', error.message);
      setStatusChangeAccount(false);
      displayToast(TToastType.TX_INFO, {
        message: `There is an unexpected error with Cosmos wallet. Please try again!`
      });
    }
  };

  const [openBanner, setOpenBanner] = useState(true);

  return (
    <ThemeProvider>
      <div className={`app ${theme}`}>
        <Menu />
        <NoticeBanner openBanner={openBanner} setOpenBanner={setOpenBanner} />
        <div className="main">
          <Sidebar />
          <div className={openBanner ? `bannerWithContent appRight` : 'appRight'}>{routes()}</div>
        </div>
        {!isMobile() && <Instruct />}
      </div>
    </ThemeProvider>
  );
};

export default App;
