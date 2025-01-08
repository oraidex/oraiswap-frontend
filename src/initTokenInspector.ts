import { OraichainInspector } from '@oraichain/orai-token-inspector';

export const getTokenInspectorInstance = async () => {
  if (!window.tokenInspector) {
    window.tokenInspector = await OraichainInspector.create("https://rpc.orai.io/");
  }
  return window.tokenInspector;
};
