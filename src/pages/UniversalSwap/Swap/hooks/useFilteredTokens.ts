import { SwapDirection } from '@oraichain/oraidex-universal-swap';
import { useEffect, useState } from 'react';
import { TokenItemType, BTC_CONTRACT } from '@oraichain/oraidex-common';
import { filterNonPoolEvmTokens } from 'pages/UniversalSwap/helpers';

const useFilteredTokens = (
  originalFromToken: TokenItemType,
  originalToToken: TokenItemType,
  searchTokenName: string,
  fromTokenDenomSwap: string,
  toTokenDenomSwap: string
) => {
  const [filteredToTokens, setFilteredToTokens] = useState<TokenItemType[]>([]);
  const [filteredFromTokens, setFilteredFromTokens] = useState<TokenItemType[]>([]);

  useEffect(() => {

    // should use function of UniversalSwapHelper
    const filteredToTokens = filterNonPoolEvmTokens(
      originalFromToken.chainId,
      originalFromToken.coinGeckoId,
      originalFromToken.denom,
      searchTokenName,
      SwapDirection.To,
      // swapFromTokens,
      // swapToTokens
    );
    setFilteredToTokens(filteredToTokens.filter((fi) => fi?.contractAddress !== BTC_CONTRACT));

    // should use function of UniversalSwapHelper
    const filteredFromTokens = filterNonPoolEvmTokens(
      originalToToken.chainId,
      originalToToken.coinGeckoId,
      originalToToken.denom,
      searchTokenName,
      SwapDirection.From,
      // swapFromTokens,
      // swapToTokens
    );
    setFilteredFromTokens(filteredFromTokens.filter((fi) => fi?.contractAddress !== BTC_CONTRACT));
  }, [originalFromToken, originalToToken, searchTokenName, toTokenDenomSwap, fromTokenDenomSwap]);

  return { filteredToTokens, filteredFromTokens };
};

export default useFilteredTokens;
