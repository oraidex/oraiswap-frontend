import { HttpClient, Tendermint37Client, WebsocketClient } from '@cosmjs/tendermint-rpc';

import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import * as Sentry from '@sentry/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContext, ToastProvider } from 'components/Toasts/context';
import { network } from 'config/networks';
import { getWalletByNetworkCosmosFromStorage } from 'helper';
import { getCosmWasmClient } from 'libs/cosmjs';
import mixpanel from 'mixpanel-browser';
import 'polyfill';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { Bounce, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from 'store/configure';
import './index.scss';
import App from './layouts/App';
import ScrollToTop from './layouts/ScrollToTop';
import { OraidexCommon } from '@oraichain/oraidex-common';

// const client = new Client({
//   url: 'http://10.10.20.72:3000/',
//   exchanges: [cacheExchange, fetchExchange]
// });

const queryClient = new QueryClient();

if (import.meta.env.VITE_APP_SENTRY_ENVIRONMENT === 'production') {
  Sentry.init({
    environment: import.meta.env.VITE_APP_SENTRY_ENVIRONMENT,
    dsn: 'https://763cf7889ff3440d86c7c1fbc72c8780@o1323226.ingest.sentry.io/6580749',
    denyUrls: [
      /extensions\//i,
      /extension/i,
      /vendor/i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i
    ],
    ignoreErrors: [
      'Request rejected',
      'Failed to fetch',
      'Load failed',
      'User rejected the request',
      'Network Error',
      'Object captured as promise rejection',
      "Failed to execute 'insertBefore' on 'Node'"
    ],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1
  });

  // init mixpanel track event
  mixpanel.init(import.meta.env.VITE_APP_MIX_PANEL_ENVIRONMENT);
}

// init queryClient
const useHttp = network.rpc.startsWith('http://') || network.rpc.startsWith('https://');
const rpcClient = useHttp ? new HttpClient(network.rpc) : new WebsocketClient(network.rpc);
// @ts-ignore
window.client = new CosmWasmClient(new Tendermint37Client(rpcClient));

const initApp = async () => {
  const root = createRoot(document.getElementById('oraiswap'));
  root.render(
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ToastProvider>
          <Router>
            <ScrollToTop />
            <QueryClientProvider client={queryClient}>
              <App />
            </QueryClientProvider>
          </Router>
          <ToastContext.Consumer>
            {(value) => <ToastContainer transition={Bounce} toastClassName={value.theme} />}
          </ToastContext.Consumer>
        </ToastProvider>
      </PersistGate>
    </Provider>
  );

  // init cosmwasm client when user connected cosmos wallet
  const walletType = getWalletByNetworkCosmosFromStorage();
  if (walletType) {
    const cosmWasmClient = await getCosmWasmClient({ chainId: network.chainId });
    if (cosmWasmClient?.client) window.client = cosmWasmClient.client;
  }
};
export const oraidexCommon = await OraidexCommon.load();
export const { oraichainTokens, tokenMap, cosmosTokens, evmTokens, cw20TokenMap, flattenTokens } = oraidexCommon;
initApp();
