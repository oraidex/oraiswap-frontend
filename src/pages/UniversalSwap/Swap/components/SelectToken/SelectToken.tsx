import { CustomChainInfo, MAX_ORAICHAIN_DENOM, TokenItemType, truncDecimals } from '@oraichain/oraidex-common';
import IconVerified from 'assets/icons/ic_verified.svg?react';
import IconoirCancel from 'assets/icons/iconoir_cancel.svg?react';
import NoResultDark from 'assets/images/no-result-dark.svg?react';
import NoResultLight from 'assets/images/no-result.svg?react';
import SearchInput from 'components/SearchInput';
import { Themes } from 'context/theme-context';
import { DEFAULT_TOKEN_ICON_URL } from 'helper/constants';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import { chainInfos, oraichainTokens } from 'initCommon';
import { reduceString, toSumDisplay } from 'libs/utils';
import { formatDisplayUsdt } from 'pages/Pools/helpers';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { inspectToken } from 'reducer/onchainTokens';
import { getSubAmountDetails } from 'rest/api';
import { RootState } from 'store/configure';
import styles from './SelectToken.module.scss';
import { useCopyClipboard } from 'hooks/useCopyClipboard';
import IconCopyAddress from 'assets/icons/ic_copy_address.svg?react';
import SuccessIcon from 'assets/icons/toast_success.svg?react';
import { extractAddress } from 'pages/Pool-V3/helpers/format';

interface InputSwapProps {
  isSelectToken: boolean;
  setIsSelectToken?: React.Dispatch<React.SetStateAction<boolean>>;
  items?: TokenItemType[] | CustomChainInfo[] | any;
  amounts: AmountDetails;
  prices: CoinGeckoPrices<string>;
  handleChangeToken?: (token: TokenItemType) => void;
  theme: Themes;
  selectChain: string;
}

interface GetIconInterface {
  chainId?: string;
  isLightTheme: boolean;
  width?: number;
  height?: number;
  onchainToken?: TokenItemType;
}

const getChainIcon = ({ isLightTheme, chainId, width, height }: GetIconInterface) => {
  const chainInfo = chainInfos.find((chain) => chain.chainId === chainId);
  return isLightTheme ? (
    <img src={chainInfo?.chainSymbolImageUrl} alt="icon" width={width} height={height} />
  ) : (
    <img src={chainInfo?.chainSymbolImageUrl} alt="icon" width={width} height={height} />
  );
};

export default function SelectToken({
  setIsSelectToken,
  isSelectToken,
  items,
  amounts,
  prices,
  handleChangeToken,
  theme,
  selectChain
}: InputSwapProps) {
  const [textChain, setTextChain] = useState('');
  const [textSearch, setTextSearch] = useState('');
  const isLightTheme = theme === 'light';
  const [tokenRank = {}] = useConfigReducer('tokenRank');
  const [address] = useConfigReducer('address');
  const addedTokens = useSelector((state: RootState) => state.token.addedTokens || []);
  const dispatch = useDispatch();

  useEffect(() => {
    if (selectChain && selectChain !== textChain) setTextChain(selectChain);
  }, [selectChain]);

  const { isCopied, handleCopy, copiedValue } = useCopyClipboard();

  useEffect(() => {
    if (listItems.length === 0 && textSearch && textChain && selectChain === 'Oraichain') {
      dispatch<any>(inspectToken({ tokenId: textSearch, address, isUserAdded: true }));
    }
  }, [textSearch, address]);

  const checkedItems =
    selectChain === 'Oraichain' ? oraichainTokens.filter((token) => !token.isDisabledSwap).concat(addedTokens) : items;

  const listItems = checkedItems
    .filter(Boolean)
    .filter(
      (item) =>
        (textChain ? item.chainId === textChain : true) &&
        (textSearch
          ? [item.name.toLowerCase(), item.denom.toLowerCase(), item.contractAddress?.toLowerCase()].some(
              (tokenDenom) => tokenDenom?.includes(textSearch.toLowerCase())
            )
          : true)
    )
    .reduce((unique, item) => {
      if (!unique.some((uniqueItem) => uniqueItem.denom === item.denom)) {
        unique.push(item);
      }
      return unique;
    }, []);

  const RACKS_ORAICHAIN_DENOM =
    'factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/D7yP4ycfsRWUGYionGpi64sLF2ddZ2JXxuRAti2M7uck';
  // const prioritizeToken = RACKS_ORAICHAIN_DENOM;
  const prioritizeToken = [MAX_ORAICHAIN_DENOM, RACKS_ORAICHAIN_DENOM];

  return (
    <div className={`${styles.selectToken} ${isSelectToken ? styles.active : ''}`}>
      <div className={styles.selectTokenHeader}>
        <div />
        <div className={styles.selectTokenHeaderTitle}>Select a token</div>
        <div className={styles.selectTokenHeaderClose} onClick={() => setIsSelectToken(false)}>
          <IconoirCancel />
        </div>
      </div>
      <div className={styles.selectTokenSearch}>
        <SearchInput
          placeholder="Find token by name or address"
          className={styles.selectTokenSearchInput}
          onSearch={(text) => {
            setTextSearch(text);
          }}
          theme={theme}
        />
      </div>
      <div className={styles.selectTokenAll}>
        <div className={styles.selectTokenTitle}>Select token</div>
        <div className={styles.selectTokenList}>
          {/* TODO: check filter here */}
          {!listItems.length && (
            <div className={styles.selectTokenListNoResult}>{isLightTheme ? <NoResultLight /> : <NoResultDark />}</div>
          )}
          {/* TODO: check filter here */}
          {listItems
            .map((token) => {
              const tokenIconUrl = (isLightTheme ? token.iconLight : token.icon) || DEFAULT_TOKEN_ICON_URL;
              const tokenIcon = (
                <img style={{ borderRadius: '100%' }} src={tokenIconUrl} alt="icon" width={30} height={30} />
              );

              const networkIcon = getChainIcon({
                isLightTheme,
                chainId: token.chainId,
                width: 16,
                height: 16
              });
              const key = token.denom;
              let sumAmountDetails: AmountDetails = {};
              // by default, we only display the amount that matches the token denom
              sumAmountDetails[token.denom] = amounts?.[token.denom];
              let sumAmount: number = toSumDisplay(sumAmountDetails);
              // if there are sub-denoms, we get sub amounts & calculate sum display of both sub & main amount
              if (token.evmDenoms) {
                const subAmounts = getSubAmountDetails(amounts, token);
                sumAmountDetails = { ...sumAmountDetails, ...subAmounts };
                sumAmount = toSumDisplay(sumAmountDetails);
              }
              const balance = sumAmount > 0 ? sumAmount.toFixed(truncDecimals) : '0';
              const usd =
                sumAmount > 0 && token && prices[token.coinGeckoId] ? sumAmount * prices[token.coinGeckoId] : '0';

              return {
                ...token,
                tokenIcon,
                networkIcon,
                key,
                balance,
                usd
              };
            })
            .sort((a, b) => {
              const balanceDelta = Number(b.usd) - Number(a.usd);
              if (prioritizeToken.includes(a.denom) && !prioritizeToken.includes(b.denom)) {
                return -1; // Push max elements to the top
              }
              if (!prioritizeToken.includes(a.denom) && prioritizeToken.includes(b.denom)) {
                return 1; // Keep non-'a' elements below 'a'
              }

              if (!balanceDelta) {
                return (tokenRank[b.coinGeckoId] || 0) - (tokenRank[a.coinGeckoId] || 0);
              }
              return balanceDelta;
            })
            .map(({ key, tokenIcon, networkIcon, balance, usd, ...token }) => {
              const tokenDenom = extractAddress(token as TokenItemType);
              return (
                <div
                  key={key}
                  className={styles.selectTokenItem}
                  onClick={() => {
                    handleChangeToken(token as TokenItemType);
                  }}
                >
                  <div className={styles.selectTokenItemLeft}>
                    <div>
                      <div className={styles.selectTokenItemLeftImg}>
                        {tokenIcon}
                        <div className={styles.selectTokenItemLeftImgChain}>{networkIcon}</div>
                      </div>
                    </div>
                    <div>
                      <div className={styles.selectTokenItemTokenName}>
                        {token.name || 'UNKNOWN'}
                        <span>{token.isVerified && <IconVerified />}</span>
                      </div>
                      <div className={styles.selectTokenItemTokenOrg}>
                        <span className={styles.denom}>
                          {tokenDenom?.length < 13 ? tokenDenom : reduceString(tokenDenom, 7, 6)}
                        </span>
                        <div className={styles.copyBtn}>
                          {isCopied && copiedValue === tokenDenom ? (
                            <SuccessIcon width={20} height={20} />
                          ) : (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(tokenDenom);
                              }}
                            >
                              <IconCopyAddress />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.selectTokenItemRight}>
                    <div className={styles.selectTokenItemTokenBalance}>{balance} </div>
                    <div className={styles.selectTokenItemTokenUsd}>{token.coinGeckoId && formatDisplayUsdt(usd)}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
