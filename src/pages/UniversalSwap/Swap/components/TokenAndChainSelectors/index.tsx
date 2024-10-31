import React, { useRef } from 'react';
import SelectToken from '../SelectToken/SelectToken';
import SelectChain from '../SelectChain/SelectChain';
import useOnClickOutside from 'hooks/useOnClickOutside';

const TokenAndChainSelectors = ({
  setIsSelectTokenTo,
  setIsSelectTokenFrom,
  setIsSelectChainTo,
  setIsSelectChainFrom,
  amounts,
  prices,
  handleChangeToken,
  filteredToTokens,
  filteredFromTokens,
  theme,
  selectChainTo,
  selectChainFrom,
  isSelectTokenTo,
  isSelectTokenFrom,
  isSelectChainTo,
  isSelectChainFrom,
  setSelectChainTo,
  setSelectChainFrom,
  setTokenDenomFromChain,
  originalFromToken,
  unSupportSimulateToken,
  supportedChain = ['Oraichain']
}) => {
  const ref = useRef(null);
  useOnClickOutside(ref, () => {
    setIsSelectTokenFrom(false);
    setIsSelectTokenTo(false);
    setIsSelectChainFrom(false);
    setIsSelectChainTo(false);
  });

  return (
    <div ref={ref}>
      <SelectToken
        setIsSelectToken={setIsSelectTokenTo}
        amounts={amounts}
        prices={prices}
        handleChangeToken={(token) => handleChangeToken(token, 'to')}
        items={filteredToTokens}
        theme={theme}
        selectChain={selectChainTo}
        isSelectToken={isSelectTokenTo}
      />
      <SelectToken
        setIsSelectToken={setIsSelectTokenFrom}
        amounts={amounts}
        prices={prices}
        theme={theme}
        selectChain={selectChainFrom}
        items={filteredFromTokens}
        handleChangeToken={(token) => handleChangeToken(token, 'from')}
        isSelectToken={isSelectTokenFrom}
      />
      <SelectChain
        filterChainId={supportedChain}
        setIsSelectToken={setIsSelectChainTo}
        amounts={amounts}
        theme={theme}
        selectChain={selectChainTo}
        setSelectChain={(chain) => {
          setSelectChainTo(chain);
          setTokenDenomFromChain(chain, 'to');
        }}
        prices={prices}
        isSelectToken={isSelectChainTo}
      />
      <SelectChain
        setIsSelectToken={setIsSelectChainFrom}
        amounts={amounts}
        theme={theme}
        prices={prices}
        selectChain={selectChainFrom}
        setSelectChain={(chain) => {
          setSelectChainFrom(chain);
          setTokenDenomFromChain(chain, 'from');
        }}
        isSelectToken={isSelectChainFrom}
      />
    </div>
  );
};

export default TokenAndChainSelectors;
