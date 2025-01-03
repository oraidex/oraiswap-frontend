import {
  IBC_WASM_CONTRACT,
  WEBSOCKET_RECONNECT_ATTEMPTS,
  WEBSOCKET_RECONNECT_INTERVAL
} from '@oraichain/oraidex-common';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { isMobile } from '@walletconnect/browser-utils';
import { TToastType, displayToast } from 'components/Toasts/Toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { ThemeProvider } from 'context/theme-context';
import { TonNetwork } from 'context/ton-provider';
import { getListAddressCosmos, getWalletByNetworkFromStorage, interfaceRequestTron, retry } from 'helper';
import useConfigReducer from 'hooks/useConfigReducer';
import useWalletReducer from 'hooks/useWalletReducer';
import SingletonOraiswapV3 from 'libs/contractSingleton';
import { getCosmWasmClient } from 'libs/cosmjs';
import Keplr from 'libs/keplr';
import Metamask from 'libs/metamask';
import { buildUnsubscribeMessage, buildWebsocketSendMessage, processWsResponseMsg } from 'libs/utils';
import { useLoadWalletsTon } from 'pages/Balance/hooks/useLoadWalletsTon';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useWebSocket from 'react-use-websocket';
import { setAddressBookList } from 'reducer/addressBook';
import { persistor, RootState } from 'store/configure';
import { ADDRESS_BOOK_KEY_BACKUP, PERSIST_VER } from 'store/constants';
import './index.scss';
import { initializeOraidexCommon, network } from 'initCommon';
import useLoadTokens from 'hooks/useLoadTokens';
import { useTronEventListener } from 'hooks/useTronLink';
import Menu from './Menu';

import routes from 'routes';
import { NoticeBanner } from './NoticeBanner';
import Sidebar from './Sidebar';

const App = () => {
  const [address, setOraiAddress] = useConfigReducer('address');
  const [tronAddress, setTronAddress] = useConfigReducer('tronAddress');
  const [tonAddress] = useConfigReducer('tonAddress');
  const [metamaskAddress, setMetamaskAddress] = useConfigReducer('metamaskAddress');
  const [btcAddress, setBtcAddress] = useConfigReducer('btcAddress');
  const [solAddress, setSolAddress] = useConfigReducer('solAddress');
  const [, setStatusChangeAccount] = useConfigReducer('statusChangeAccount');
  const loadTokenAmounts = useLoadTokens();
  const [tonConnectUI] = useTonConnectUI();
  const [persistVersion, setPersistVersion] = useConfigReducer('persistVersion');
  const [theme] = useConfigReducer('theme');
  const [walletByNetworks] = useWalletReducer('walletsByNetwork');
  const [, setCosmosAddress] = useConfigReducer('cosmosAddress');
  const mobileMode = isMobile();
  const { tron, evm } = walletByNetworks;
  const ethOwallet = window.eth_owallet;
  const allOraichainTokens = useSelector((state: RootState) => state.token.allOraichainTokens || []);
  const dispatch = useDispatch();
  const solanaWallet = useWallet();

  useTronEventListener();

  // init TON
  useEffect(() => {
    window.Ton = tonConnectUI;
  }, [tonConnectUI]);

  useLoadWalletsTon({
    tonNetwork: TonNetwork.Mainnet
  });

  useEffect(() => {
    initializeOraidexCommon(dispatch, allOraichainTokens);
  }, [allOraichainTokens]);

  useEffect(() => {
    (async () => {
      if (address) {
        const oraiAddr = await window.Keplr.getKeplrAddr();
        if (oraiAddr && oraiAddr !== address) {
          setOraiAddress(oraiAddr);
        }
      }
    })();

    return () => {};
  }, []);

  // TODO: polyfill evm, tron, need refactor
  useEffect(() => {
    if (tron) {
      window.tronWebDapp = tron === 'owallet' ? window.tronWeb_owallet : window.tronWeb;
      window.tronLinkDapp = tron === 'owallet' ? window.tronLink_owallet : window.tronLink;
      window.Metamask = new Metamask(window.tronWebDapp);
    }
    if (evm === 'owallet' && ethOwallet) {
      window.ethereumDapp = ethOwallet;
    }
  }, [walletByNetworks, window.tronWeb, window.tronLink, ethOwallet]);

  useEffect(() => {
    const loadSingleton = async () => {
      if (address) {
        try {
          const { client } = await getCosmWasmClient({ chainId: network.chainId });
          SingletonOraiswapV3.load(client, address);
        } catch (error) {
          console.error('Error loading OraiswapV3 singleton:', error);
        }
      }
    };

    loadSingleton();
  }, [address]);

  useEffect(() => {
    const win = window as any;
    if (typeof win.Featurebase !== 'function') {
      win.Featurebase = function () {
        (win.Featurebase.q = win.Featurebase.q || []).push(arguments);
      };
    }
    win.Featurebase('initialize_feedback_widget', {
      organization: 'defi',
      theme: 'light',
      placement: 'right'
    });
  }, [theme]);

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

    try {
      const restoredAddressBookJSON = localStorage.getItem(ADDRESS_BOOK_KEY_BACKUP);
      const restoredAddressBook = JSON.parse(restoredAddressBookJSON);

      dispatch(setAddressBookList(restoredAddressBook));
    } catch (error) {
      console.log('error', error);
    }
  }, []);

  useEffect(() => {
    // just auto connect keplr in mobile mode
    mobileMode && keplrHandler();
  }, [mobileMode]);

  useEffect(() => {
    loadTokenAmounts({
      oraiAddress: address
    });
  }, [address]);

  useEffect(() => {
    loadTokenAmounts({
      metamaskAddress
    });
  }, [metamaskAddress]);

  useEffect(() => {
    loadTokenAmounts({
      tronAddress
    });
  }, [tronAddress]);

  useEffect(() => {
    loadTokenAmounts({
      btcAddress
    });
  }, [btcAddress]);

  useEffect(() => {
    loadTokenAmounts({
      solAddress
    });
  }, [solAddress]);

  useEffect(() => {
    loadTokenAmounts({
      tonAddress
    });
  }, [tonAddress]);

  useEffect(() => {
    window.addEventListener('keplr_keystorechange', keplrHandler);
    return () => {
      window.removeEventListener('keplr_keystorechange', keplrHandler);
    };
  }, []);

  const polyfillForMobileMode = () => {
    if (mobileMode) {
      window.tronWebDapp = window.tronWeb;
      window.tronLinkDapp = window.tronLink;
      window.ethereumDapp = window.ethereum;
      window.Keplr = new Keplr('owallet');
      window.Metamask = new Metamask(window.tronWebDapp);
    }
  };

  const handleAddressCosmos = async () => {
    let oraiAddress;
    if (walletByNetworks.cosmos || mobileMode) {
      oraiAddress = await window.Keplr.getKeplrAddr();
      if (oraiAddress) {
        const { listAddressCosmos } = await getListAddressCosmos(oraiAddress, walletByNetworks.cosmos);
        setCosmosAddress(listAddressCosmos);
        setOraiAddress(oraiAddress);
      }
    }
    return oraiAddress;
  };

  const handleAddressEvmOwallet = async () => {
    let metamaskAddress;
    if (walletByNetworks.evm === 'owallet' || mobileMode) {
      if (window.ethereumDapp) {
        if (mobileMode) await window.Metamask.switchNetwork(Networks.bsc);
        metamaskAddress = await window.Metamask.getEthAddress();
        setMetamaskAddress(metamaskAddress);
      }
    }
    return metamaskAddress;
  };

  const handleAddressBtcOwallet = async () => {
    let btcAddress;
    if (walletByNetworks.bitcoin === 'owallet' || mobileMode) {
      if (window.Bitcoin) {
        btcAddress = await window.Bitcoin.getAddress();
        if (btcAddress) setBtcAddress(btcAddress);
      }
    }
    return btcAddress;
  };

  const handleAddressSolOwallet = async () => {
    let solAddress;
    if (walletByNetworks.solana === 'owallet' || mobileMode) {
      if (window.owalletSolana) {
        const provider = window?.owalletSolana;
        solanaWallet.select('OWallet' as any);
        await retry(
          async () => {
            try {
              await solanaWallet.connect();
            } catch (err) {
              console.log('err', err);
            }
            const { publicKey } = await provider.connect();
            if (publicKey) {
              solAddress = publicKey.toBase58();
              setSolAddress(solAddress);
            } else {
              throw new Error('Cannot connect to Solana wallet');
            }
          },
          3,
          1000
        );
      }
    }
    return solAddress;
  };

  useEffect(() => {
    const provider = window?.solana;
    if (provider) {
      provider?.on('accountChanged', (publicKeySol: any) => {
        const wallet = getWalletByNetworkFromStorage();
        if (wallet.solana === 'phantom') {
          if (publicKeySol) {
            const solAddress = publicKeySol.toBase58();
            setSolAddress(solAddress);
            loadTokenAmounts({ solAddress });
          } else {
            // Attempt to reconnect to Phantom or Owallet
            provider.connect().catch((error: any) => {
              console.error({ errorSolAccountChanged: error });
            });
          }
        }
      });
    }

    return () => {};
  }, []);

  const handleAddressTronOwallet = async () => {
    let tronAddress;

    if (walletByNetworks.tron === 'owallet' || mobileMode) {
      if (window.tronWebDapp && window.tronLinkDapp) {
        const res: interfaceRequestTron = await window.tronLinkDapp.request({
          method: 'tron_requestAccounts'
        });
        tronAddress = res?.base58;
        if (tronAddress) setTronAddress(tronAddress);
      }
    }
    return tronAddress;
  };

  // TODO: owallet not support TON. need to update in next time
  const keplrHandler = async () => {
    try {
      console.log('first', 309);
      polyfillForMobileMode();
      const oraiAddress = await handleAddressCosmos();
      const metamaskAddress = await handleAddressEvmOwallet();
      const btcAddress = await handleAddressBtcOwallet();
      const tronAddress = await handleAddressTronOwallet();
      const solAddress = await handleAddressSolOwallet();

      loadTokenAmounts({
        oraiAddress,
        metamaskAddress,
        tronAddress,
        btcAddress,
        solAddress,
        tonAddress
      });
    } catch (error) {
      console.log('Error: ', error.message);
      setStatusChangeAccount(false);
      displayToast(TToastType.TX_INFO, {
        message: `There is an unexpected error with Cosmos wallet. Please try again!`
      });
    }
  };

  const [openBanner, setOpenBanner] = useState(false);

  return (
    <ThemeProvider>
      <div className={`app ${theme}`}>
        {/* <button data-featurebase-feedback>Open Widget</button> */}
        <Menu />
        <NoticeBanner openBanner={openBanner} setOpenBanner={setOpenBanner} />
        {/* {(!bannerTime || Date.now() > bannerTime + 86_400_000) && <FutureCompetition />} */}
        <div className="main">
          <Sidebar />
          <div className={openBanner ? `bannerWithContent appRight` : 'appRight'}>{routes()}</div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;
