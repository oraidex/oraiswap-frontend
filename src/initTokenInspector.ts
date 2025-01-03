import { Inspector } from '@oraichain/orai-token-inspector';

console.time('load-inspector');

export const getTokenInspectorInstance = async () => {
  if (!window.tokenInspector) {
    window.tokenInspector = await Inspector.create({
      oraiRpcUrl: 'https://indexer.orai.io',
      bscRpcUrl: 'https://bsc-dataseed.binance.org',
      ethRpcUrl: 'https://eth.llamarpc.com',
      tronRpcUrl: 'https://api.trongrid.io/',
      solanaRpcUrl: 'https://mainnet.helius-rpc.com/?api-key=3b28a0fc-0ef6-48ef-b55c-c55ae74cb6a6'
    });
  }
  return window.tokenInspector;
};
