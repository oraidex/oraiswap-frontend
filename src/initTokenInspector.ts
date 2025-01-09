import { OraichainInspector, SolanaInspector, TokenInspector } from '@oraichain/orai-token-inspector';

export const getTokenInspectorInstance = async () => {
  if (!window.tokenInspector) {
    const oraichainInspector = await OraichainInspector.create(
      'https://rpc.orai.io/',
      'https://mainnet.helius-rpc.com/?api-key=3b28a0fc-0ef6-48ef-b55c-c55ae74cb6a6'
    );
    const solanaInspector = await SolanaInspector.create(
      'https://mainnet.helius-rpc.com/?api-key=3b28a0fc-0ef6-48ef-b55c-c55ae74cb6a6'
    );

    window.tokenInspector = new TokenInspector({
      Oraichain: oraichainInspector,
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': solanaInspector
    });
  }
  return window.tokenInspector;
};
