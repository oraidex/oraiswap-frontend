import { OraichainInspector, SolanaInspector, TokenInspector } from '@oraichain/orai-token-inspector';

const COMMON = 'https://oraicommon-staging.oraidex.io';

export const getTokenInspectorInstance = async () => {
  if (!window.tokenInspector) {
    const [ibcRes, assetsRes] = await Promise.all([
      fetch(`${COMMON}/api/v1/chain-registry/ibc`),
      fetch(`${COMMON}/api/v1/chain-registry/assets`)
    ]);
    const [ibc, assets] = await Promise.all([ibcRes.json(), assetsRes.json()]);

    const oraichainInspector = await OraichainInspector.create(
      'https://rpc.orai.io/',
      'https://mainnet.helius-rpc.com/?api-key=3b28a0fc-0ef6-48ef-b55c-c55ae74cb6a6',
      COMMON,
      ibc as any,
      assets as any
    );
    const solanaInspector = await SolanaInspector.create(
      'https://mainnet.helius-rpc.com/?api-key=3b28a0fc-0ef6-48ef-b55c-c55ae74cb6a6'
    );

    window.tokenInspector = TokenInspector.create({
      Oraichain: oraichainInspector,
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': solanaInspector
    });
  }
  return window.tokenInspector;
};
