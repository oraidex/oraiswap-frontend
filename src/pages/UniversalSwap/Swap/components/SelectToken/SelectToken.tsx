import { CustomChainInfo, TokenItemType, truncDecimals, HMSTR_ORAICHAIN_DENOM } from '@oraichain/oraidex-common';
import IconoirCancel from 'assets/icons/iconoir_cancel.svg?react';
import NoResultDark from 'assets/images/no-result-dark.svg?react';
import NoResultLight from 'assets/images/no-result.svg?react';
import cn from 'classnames/bind';
import SearchInput from 'components/SearchInput';
import { chainIcons, flattenTokensWithIcon } from 'config/chainInfos';
import styles from './SelectToken.module.scss';
import { Themes } from 'context/theme-context';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import { toSumDisplay } from 'libs/utils';
import { formatDisplayUsdt } from 'pages/Pools/helpers';
import React, { useEffect, useState } from 'react';
import { getSubAmountDetails } from 'rest/api';
import useConfigReducer from 'hooks/useConfigReducer';

const cx = cn.bind(styles);
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
  type: 'token' | 'network';
  chainId?: string;
  coinGeckoId?: string;
  isLightTheme: boolean;
  width?: number;
  height?: number;
}

const getIcon = ({ isLightTheme, type, chainId, coinGeckoId, width, height }: GetIconInterface) => {
  if (type === 'token') {
    const tokenIcon = flattenTokensWithIcon.find((tokenWithIcon) => tokenWithIcon.coinGeckoId === coinGeckoId);
    return isLightTheme ? (
      <tokenIcon.IconLight className={cx('logo')} width={width} height={height} />
    ) : (
      <tokenIcon.Icon className={cx('logo')} width={width} height={height} />
    );
  } else {
    const networkIcon = chainIcons.find((chain) => chain.chainId === chainId);
    return isLightTheme ? (
      <networkIcon.IconLight className={cx('logo')} width={width} height={height} />
    ) : (
      <networkIcon.Icon className={cx('logo')} width={width} height={height} />
    );
  }
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

  useEffect(() => {
    if (selectChain && selectChain !== textChain) setTextChain(selectChain);
  }, [selectChain]);

  const listItems = items.filter(
    (item) =>
      (textChain ? item.chainId === textChain : true) &&
      (textSearch ? item.name.toLowerCase().includes(textSearch.toLowerCase()) : true)
  );

  return (
    <>
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
            {!listItems.length && (
              <div className={styles.selectTokenListNoResult}>
                {isLightTheme ? <NoResultLight /> : <NoResultDark />}
              </div>
            )}

            {listItems
              .map((token) => {
                const tokenIcon = getIcon({
                  isLightTheme,
                  type: 'token',
                  coinGeckoId: token.coinGeckoId,
                  width: 30,
                  height: 30
                });

                const networkIcon = getIcon({
                  isLightTheme,
                  type: 'network',
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

                if (!balanceDelta) {
                  if (a.denom === HMSTR_ORAICHAIN_DENOM && b.denom !== HMSTR_ORAICHAIN_DENOM) {
                    return -1; // Push PepePoolKey elements to the top
                  }
                  if (a.denom !== HMSTR_ORAICHAIN_DENOM && b.denom === HMSTR_ORAICHAIN_DENOM) {
                    return 1; // Keep non-'a' elements below 'a'
                  }

                  return (tokenRank[b.coinGeckoId] || 0) - (tokenRank[a.coinGeckoId] || 0);
                }
                return balanceDelta;
              })
              .map(({ key, tokenIcon, networkIcon, balance, usd, ...token }) => {
                return (
                  <div
                    key={key}
                    className={styles.selectTokenItem}
                    onClick={() => handleChangeToken(token as TokenItemType)}
                  >
                    <div className={styles.selectTokenItemLeft}>
                      <div>
                        <div className={styles.selectTokenItemLeftImg}>
                          {tokenIcon}
                          <div className={styles.selectTokenItemLeftImgChain}>{networkIcon}</div>
                        </div>
                      </div>
                      <div>
                        <div className={styles.selectTokenItemTokenName}>{token.name}</div>
                        <div className={styles.selectTokenItemTokenOrg}>{token.org}</div>
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
        </div>
      </div>
    </>
  );
}
