import { CW_TON_BRIDGE, TonChainId } from 'context/ton-provider';
import { tonNetworkMainnet } from 'initCommon';
import { BigDecimal, TokenItemType } from '@oraichain/oraidex-common';
import { TonbridgeBridgeClient } from '@oraichain/tonbridge-contracts-sdk';
import useConfigReducer from 'hooks/useConfigReducer';
import { useEffect, useState } from 'react';

const useGetFee = ({
  token,
  fromNetwork,
  toNetwork
}: {
  token: TokenItemType;
  fromNetwork: string;
  toNetwork: string;
}) => {
  const [oraiAddress] = useConfigReducer('address');
  const [bridgeFee, setBridgeFee] = useState(0);
  const [tokenFee, setTokenFee] = useState(0);
  const [walletsTon] = useConfigReducer('walletsTon');

  useEffect(() => {
    (async () => {
      try {
        if (![fromNetwork, toNetwork].includes(TonChainId)) {
          return setTokenFee(0);
        }

        if (token && fromNetwork && toNetwork) {
          const tokenInTon = tonNetworkMainnet.currencies.find((tk) => tk.coinGeckoId === token.coinGeckoId);
          if (!tokenInTon) {
            return;
          }
          const walletTon = walletsTon[tokenInTon.coinMinimalDenom];

          if (!walletTon) {
            return;
          }

          const tonBridgeClient = new TonbridgeBridgeClient(window.client, oraiAddress, CW_TON_BRIDGE);

          const tokenFeeConfig = await tonBridgeClient.tokenFee({
            remoteTokenDenom: walletTon
          });

          if (tokenFeeConfig) {
            const { nominator, denominator } = tokenFeeConfig;
            const fee = new BigDecimal(nominator).div(denominator).toNumber();

            setTokenFee(fee);
          }
        }
      } catch (error) {
        if (error.message.toString().includes('type: tonbridge_bridge::state::Ratio; key:')) {
          setTokenFee(0);
        } else {
          console.log(error);
        }
      }
    })();
  }, [token, oraiAddress, walletsTon, fromNetwork, toNetwork]);

  useEffect(() => {
    (async () => {
      if (![fromNetwork, toNetwork].includes(TonChainId)) {
        return setBridgeFee(0);
      }

      if (token && fromNetwork && toNetwork) {
        const tokenInTon = tonNetworkMainnet.currencies.find((tk) => tk.coinGeckoId === token.coinGeckoId);
        if (!tokenInTon) {
          return;
        }

        const walletTon = walletsTon[tokenInTon.coinMinimalDenom];
        if (!walletTon) {
          return;
        }

        const tonBridgeClient = new TonbridgeBridgeClient(window.client, oraiAddress, CW_TON_BRIDGE);

        const config = await tonBridgeClient.pairMapping({
          key: walletTon
        });
        const pairMapping = config.pair_mapping;

        setBridgeFee(parseInt(pairMapping.relayer_fee) / 10 ** pairMapping.remote_decimals);
      }
    })();
  }, [token, oraiAddress, walletsTon, fromNetwork, toNetwork]);

  return {
    bridgeFee,
    tokenFee
  };
};

export default useGetFee;
