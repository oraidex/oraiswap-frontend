import { checkValidateAddressWithNetwork } from '@oraichain/oraidex-common';
import { isMobile } from '@walletconnect/browser-utils';
import { tokenMap } from 'config/bridgeTokens';
import { getAddressTransfer, networks } from 'helper';
import useConfigReducer from 'hooks/useConfigReducer';
import useWalletReducer from 'hooks/useWalletReducer';
import { genCurrentChain, generateNewSymbolV2, getFromToToken } from 'pages/UniversalSwap/helpers';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCurrentToChain,
  selectCurrentToken,
  setCurrentFromToken,
  setCurrentToChain,
  setCurrentToken,
  setCurrentToToken
} from 'reducer/tradingSlice';
import useFilteredTokens from './useFilteredTokens';

const useHandleEffectTokenChange = ({ fromTokenDenomSwap, toTokenDenomSwap }) => {
  const dispatch = useDispatch();
  const currentPair = useSelector(selectCurrentToken);
  const currentToChain = useSelector(selectCurrentToChain);
  const [searchTokenName] = useState('');
  const [walletByNetworks] = useWalletReducer('walletsByNetwork');

  const [metamaskAddress] = useConfigReducer('metamaskAddress');
  const [tronAddress] = useConfigReducer('tronAddress');
  const [tonAddress] = useConfigReducer('tonAddress');
  const [oraiAddress] = useConfigReducer('address');

  const [addressTransfer, setAddressTransfer] = useState('');
  const [initAddressTransfer, setInitAddressTransfer] = useState('');

  // get token on oraichain to simulate swap amount.
  const originalFromToken = tokenMap[fromTokenDenomSwap];
  const originalToToken = tokenMap[toTokenDenomSwap];

  const { fromToken, toToken } = getFromToToken(
    originalFromToken,
    originalToToken,
    fromTokenDenomSwap,
    toTokenDenomSwap
  );

  const { filteredToTokens, filteredFromTokens } = useFilteredTokens(
    originalFromToken,
    originalToToken,
    searchTokenName,
    fromTokenDenomSwap,
    toTokenDenomSwap
  );

  useEffect(() => {
    (async () => {
      if (!isMobile()) {
        if (!walletByNetworks.evm && !walletByNetworks.cosmos && !walletByNetworks.tron && !walletByNetworks.cosmos) {
          return setAddressTransfer('');
        }

        if (originalToToken.cosmosBased && !walletByNetworks.cosmos) {
          return setAddressTransfer('');
        }

        if (!originalToToken.cosmosBased && originalToToken.chainId === '0x2b6653dc' && !walletByNetworks.tron) {
          return setAddressTransfer('');
        }

        if (!originalToToken.cosmosBased && !walletByNetworks.evm) {
          return setAddressTransfer('');
        }
      }

      if (originalToToken.chainId) {
        const findNetwork = networks.find((net) => net.chainId === originalToToken.chainId);
        const address = await getAddressTransfer(findNetwork, walletByNetworks);

        setAddressTransfer(address);
        setInitAddressTransfer(address);
      }
    })();
  }, [
    originalToToken,
    oraiAddress,
    metamaskAddress,
    tronAddress,
    tonAddress,
    walletByNetworks.evm,
    walletByNetworks.cosmos,
    walletByNetworks.tron,
    walletByNetworks.ton,
    window?.ethereumDapp,
    window?.tronWebDapp,
    window?.Ton
  ]);

  useEffect(() => {
    const newTVPair = generateNewSymbolV2(fromToken, toToken, currentPair);

    if (newTVPair) dispatch(setCurrentToken(newTVPair));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken, toToken]);

  useEffect(() => {
    const newCurrentToChain = genCurrentChain({ toToken: originalToToken, currentToChain });

    if (toToken && originalToToken) {
      dispatch(setCurrentToChain(newCurrentToChain));
      dispatch(setCurrentToToken(originalToToken));
    }
  }, [originalToToken, toToken]);

  useEffect(() => {
    if (fromToken && originalFromToken) {
      dispatch(setCurrentFromToken(originalFromToken));
    }
  }, [originalFromToken, fromToken]);

  const isConnectedWallet =
    walletByNetworks.cosmos || walletByNetworks.bitcoin || walletByNetworks.evm || walletByNetworks.tron || window.Ton;

  let validAddress = {
    isValid: true
  };

  if (isConnectedWallet) validAddress = checkValidateAddressWithNetwork(addressTransfer, originalToToken?.chainId);

  return {
    originalFromToken,
    originalToToken,
    filteredToTokens,
    filteredFromTokens,
    searchTokenName,
    fromToken,
    toToken,

    addressInfo: {
      addressTransfer,
      initAddressTransfer,
      setAddressTransfer,
      setInitAddressTransfer
    },
    validAddress,
    isConnectedWallet
  };
};

export default useHandleEffectTokenChange;
