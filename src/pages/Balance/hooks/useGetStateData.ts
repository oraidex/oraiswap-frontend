import { TonbridgeBridgeClient } from '@oraichain/tonbridge-contracts-sdk';
import { network } from 'config/networks';
import useConfigReducer from 'hooks/useConfigReducer';
import { useEffect, useState } from 'react';

const useGetStateData = () => {
  const [oraiAddress] = useConfigReducer('address');
  const [balances, setBalances] = useState([]);

  const getChanelStateData = async () => {
    const tonBridgeClient = new TonbridgeBridgeClient(window.client, oraiAddress, network.CW_TON_BRIDGE);

    const config = await tonBridgeClient.channelStateData();
    if (config) {
      const { balances } = config;
      setBalances(balances);
    }
  };

  useEffect(() => {
    getChanelStateData();
  }, []);

  return { balances, getChanelStateData };
};

export default useGetStateData;
