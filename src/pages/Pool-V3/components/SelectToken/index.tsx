import { TokenItemType, truncDecimals } from '@oraichain/oraidex-common';
import CloseIcon from 'assets/icons/close-icon.svg?react';
import ArrowIcon from 'assets/icons/ic_arrow_down.svg?react';
import IconCopyAddress from 'assets/icons/ic_copy_address.svg?react';
import IconVerified from 'assets/icons/ic_verified.svg?react';
import SuccessIcon from 'assets/icons/toast_success.svg?react';
import NoResultDark from 'assets/images/no-result-dark.svg?react';
import NoResultLight from 'assets/images/no-result.svg?react';
import classNames from 'classnames';
import SearchInput from 'components/SearchInput';
import { formatDisplayUsdt } from 'helper/format';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import { useCopyClipboard } from 'hooks/useCopyClipboard';
import useTheme from 'hooks/useTheme';
import { oraichainTokens } from 'initCommon';
import { reduceString, toSumDisplay } from 'libs/utils';
import { extractAddress } from 'pages/Pool-V3/helpers/format';
import { getChainIcon } from 'pages/UniversalSwap/Swap/components/SelectToken/SelectToken';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { inspectToken } from 'reducer/onchainTokens';
import { getSubAmountDetails } from 'rest/api';
import { RootState } from 'store/configure';
import { getIcon } from '../../helpers/format';
import styles from './index.module.scss';

const SelectToken = ({
  token,
  handleChangeToken,
  otherTokenDenom,
  customClassButton
}: {
  token: TokenItemType;
  handleChangeToken: (token) => void;
  otherTokenDenom?: string;
  customClassButton?: string;
}) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const amounts = useSelector((state: RootState) => state.token.amounts);
  const isLightTheme = theme === 'light';
  const [textSearch, setTextSearch] = useState('');
  const { data: prices } = useCoinGeckoPrices();
  const [address] = useConfigReducer('address');
  const addedTokens = useSelector((state: RootState) => state.token.addedTokens || []);
  const { isCopied, handleCopy, copiedValue } = useCopyClipboard();

  const dispatch = useDispatch();

  useEffect(() => {
    if (listItems.length === 0 && textSearch) {
      dispatch<any>(inspectToken({ tokenId: textSearch, address, isUserAdded: true }));
    }
  }, [textSearch, address]);

  const checkedItems = oraichainTokens.filter((token) => !token.isDisabledSwap).concat(addedTokens);

  const listItems = checkedItems
    .filter(Boolean)
    .filter((item) =>
      textSearch
        ? [item.name.toLowerCase(), item.denom.toLowerCase(), item.contractAddress?.toLowerCase()].some((tokenDenom) =>
            tokenDenom?.includes(textSearch.toLowerCase())
          )
        : true
    )
    .reduce((unique, item) => {
      if (!unique.some((uniqueItem) => uniqueItem.denom === item.denom)) {
        unique.push(item);
      }
      return unique;
    }, []);

  const TokenIcon = token && getIcon(isLightTheme, token);

  return (
    <div className={styles.selectToken}>
      <div className={classNames(styles.btn, customClassButton)} onClick={() => setIsOpen(true)}>
        <span className={styles.name}>
          {TokenIcon ? (
            <>
              {TokenIcon}
              &nbsp;&nbsp;{token.name}
            </>
          ) : (
            'Select Token'
          )}
        </span>

        <div className={styles.arrow}>
          <ArrowIcon />
        </div>
      </div>

      <div className={classNames(styles.contentWrapper, { [styles.active]: isOpen })}>
        <div className={classNames(styles.overlay, { [styles.active]: isOpen })} onClick={() => setIsOpen(false)}></div>
        <div className={styles.content}>
          <div className={styles.title}>
            <h1>Select a token</h1>

            <CloseIcon onClick={() => setIsOpen(false)} />
          </div>

          <div className={styles.selectTokenSearch}>
            <SearchInput
              placeholder="Search by name or address"
              className={styles.selectTokenSearchInput}
              onSearch={(text) => {
                setTextSearch(text);
              }}
              theme={theme}
            />
          </div>

          {!isOpen ? null : (
            <div className={styles.selectTokenList}>
              {/* TODO: use allOraichainTokens after launched permissionless  */}
              {/* {allOraichainTokens */}
              {!listItems.length && (
                <div className={styles.selectTokenListNoResult}>
                  {isLightTheme ? <NoResultLight /> : <NoResultDark />}
                </div>
              )}

              {/* TODO: use allOraichainTokens after launched permissionless  */}
              {/* {allOraichainTokens */}
              {listItems
                .map((token) => {
                  const tokenIcon = getIcon(isLightTheme, token);

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
                  return Number(b.usd) - Number(a.usd);
                })
                .map(({ key, tokenIcon, networkIcon, balance, usd, ...token }) => {
                  const tokenDenom = extractAddress(token as TokenItemType);
                  return (
                    <div
                      key={key}
                      className={styles.selectTokenItem}
                      onClick={() => {
                        handleChangeToken(token as TokenItemType);
                        setIsOpen(false);
                      }}
                    >
                      <div className={styles.selectTokenItemLeft}>
                        <div>
                          <div className={styles.selectTokenItemLeftImg} key={Math.random()}>
                            {tokenIcon}
                            <div className={styles.selectTokenItemLeftImgChain}>{networkIcon}</div>
                          </div>
                        </div>
                        <div>
                          <div className={styles.selectTokenItemTokenName}>
                            {token.name} {token.isVerified && <IconVerified />}
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
                        <div className={styles.selectTokenItemTokenUsd}>{formatDisplayUsdt(usd)}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectToken;
