import { initOraiCommon, initOraiCommonNetwork } from '@oraichain/oraidex-common';
// import { initApp } from 'index';

(async () => {
  const [token, networks] = await Promise.all([initOraiCommon(), initOraiCommonNetwork()]);
  console.log('first1111233', { token, networks });

  if (token.oraiCommon && networks.oraiCommon) {
    await import('./index');
    // initApp();
  }
})();
