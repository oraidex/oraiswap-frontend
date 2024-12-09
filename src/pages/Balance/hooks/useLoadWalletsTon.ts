import { JettonMinter } from '@oraichain/ton-bridge-contracts';
import { Address } from '@ton/ton';
import { TON_ZERO_ADDRESS } from 'config/chainInfos';
import { TonInteractionContract, TonNetwork } from 'context/ton-provider';
import useConfigReducer from 'hooks/useConfigReducer';
import { useEffect } from 'react';
import { getTonClient, retryOrbs } from './../../../helper/index';
import { tonNetworkMainnet } from '@oraichain/oraidex-common';
// dev: use to load wallet jetton address of bridge adapter
export const useLoadWalletsTon = ({ tonNetwork = TonNetwork.Mainnet }: { tonNetwork?: TonNetwork }) => {
  const [, handleSetWalletsTonCache] = useConfigReducer('walletsTon');

  const loadWalletsTon = async () => {
    let tokenOnTons = tonNetworkMainnet.currencies || [];

    let walletsTon = {};
    for (const tokenOnTon of tokenOnTons) {
      if (tokenOnTon.contractAddress == TON_ZERO_ADDRESS) {
        walletsTon = {
          ...walletsTon,
          [tokenOnTon.coinMinimalDenom]: TON_ZERO_ADDRESS
        };
        continue;
      }

      await retryOrbs(async () => {
        const client = await getTonClient();

        const jettonMinter = JettonMinter.createFromAddress(Address.parse(tokenOnTon.contractAddress));
        const jettonMinterContract = client.open(jettonMinter);
        const jettonWalletAddress = await jettonMinterContract.getWalletAddress(
          Address.parse(TonInteractionContract[tonNetwork].bridgeAdapter)
        );
        walletsTon = {
          ...walletsTon,
          [tokenOnTon.coinMinimalDenom]: jettonWalletAddress.toString()
        };
      });
    }
    handleSetWalletsTonCache(walletsTon);
  };

  useEffect(() => {
    loadWalletsTon();
  }, [tonNetwork]);

  return {
    loadWalletsTon
  };
};
