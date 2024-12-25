import { checkValidateAddressWithNetwork } from '@oraichain/oraidex-common';
import { isMobile } from '@walletconnect/browser-utils';
import { getAddressTransfer, networks } from 'helper';
import useConfigReducer from 'hooks/useConfigReducer';
import useWalletReducer from 'hooks/useWalletReducer';
import { genCurrentChain, getFromToToken } from 'pages/UniversalSwap/helpers';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCurrentToChain,
  selectCurrentToken,
  setCurrentFromToken,
  setCurrentToChain,
  setCurrentToToken
} from 'reducer/tradingSlice';
import useFilteredTokens from './useFilteredTokens';
import { cosmosChains, tokenMap } from 'initCommon';
import useOnchainTokensReducer from 'hooks/useOnchainTokens';
import { RootState } from 'store/configure';

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

  const onchainTokens = useOnchainTokensReducer('tokens');
  const allOraichainTokens = useSelector((state: RootState) => state.token.allOraichainTokens || []);

  // get token on oraichain to simulate swap amount.
  const originalFromToken =
    allOraichainTokens?.find((token) => token.denom === fromTokenDenomSwap) || tokenMap[fromTokenDenomSwap];
  const originalToToken =
    allOraichainTokens?.find((token) => token.denom === toTokenDenomSwap) || tokenMap[toTokenDenomSwap];

  const { fromToken, toToken } = getFromToToken(
    originalFromToken,
    originalToToken,
    fromTokenDenomSwap,
    toTokenDenomSwap,
    onchainTokens
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
        const isNetworkSupported =
          walletByNetworks.evm || walletByNetworks.cosmos || walletByNetworks.tron || walletByNetworks.ton;

        if (!isNetworkSupported) {
          return setAddressTransfer('');
        }

        const isCosmosBased = originalToToken.cosmosBased;
        const chainId = originalToToken.chainId;

        if (
          (isCosmosBased && !walletByNetworks.cosmos) ||
          (!isCosmosBased &&
            ((chainId === '0x2b6653dc' && !walletByNetworks.tron) ||
              (chainId === 'ton' && !walletByNetworks.ton) ||
              (['0x01', '0x38'].includes(chainId) && !walletByNetworks.evm)))
        ) {
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
    originalToToken?.chainId,
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
    window?.Ton?.account
  ]);

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

  if (isConnectedWallet)
    validAddress = checkValidateAddressWithNetwork(addressTransfer, originalToToken?.chainId, cosmosChains);

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
