import { CoinIcon, TokenItemType, CustomChainInfo, truncDecimals, toDisplay } from '@oraichain/oraidex-common';
import { TokenInfo } from 'types/token';
import styles from './SelectToken.module.scss';
import SearchInput from 'components/SearchInput';
import cn from 'classnames/bind';
import { chainIcons, flattenTokensWithIcon } from 'config/chainInfos';
import { ReactComponent as OraiIcon } from 'assets/icons/oraichain.svg';
import { ReactComponent as IconoirCancel } from 'assets/icons/iconoir_cancel.svg';
import { getUsd, toSumDisplay } from 'libs/utils';
import { getSubAmountDetails } from 'rest/api';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import { formatDisplayUsdt } from 'pages/Pools/helpers';
import React from 'react';
import { Themes } from 'context/theme-context';

const cx = cn.bind(styles);
interface InputSwapProps {
  isSelectToken: boolean;
  setIsSelectToken?: React.Dispatch<React.SetStateAction<boolean>>;
  items?: TokenItemType[] | CustomChainInfo[] | any;
  amounts: AmountDetails;
  prices: CoinGeckoPrices<string>;
  handleChangeToken?: (token: TokenItemType) => void;
  theme: Themes;
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
  theme
}: InputSwapProps) {
  const [textChain, setTextChain] = React.useState('');
  const [textSearch, setTextSearch] = React.useState('');
  return (
    <>
      <div className={cx('selectTokenWrap', isSelectToken ? 'active' : '')}>
        <div className={styles.selectToken}>
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
              theme={'light'}
            />
          </div>
          <div className={styles.selectTokenNetwork}>
            <div className={styles.selectTokenNetworkTitle}>Network</div>
            <div className={styles.selectTokenNetworkList}>
              <div
                className={cx('selectTokenNetworkItem', textChain === '' ? 'active' : '')}
                onClick={() => setTextChain('')}
              >
                All
              </div>
              {chainIcons
                .filter((chain) => !['kawaii_6886-1', 'bitcoin'].includes(chain.chainId))
                .map((e, i) => {
                  return (
                    i < 5 && (
                      <div
                        key={i}
                        className={cx('selectTokenNetworkItem', textChain === e.chainId ? 'active' : '')}
                        onClick={() => setTextChain(e.chainId)}
                      >
                        {<e.Icon width={18} height={18} />}
                      </div>
                    )
                  );
                })}
              <div className={styles.selectTokenNetworkItem}>5+</div>
            </div>
          </div>
          <div className={styles.selectTokenAll}>
            <div className={styles.selectTokenTitle}>Select token</div>
            <div className={styles.selectTokenList}>
              {items
                .filter((item) => (textChain ? item.chainId === textChain : item))
                .filter((item) => (textSearch ? [textSearch.toLowerCase()].includes(item.org.toLowerCase()) : item))
                .map((token) => {
                  const tokenIcon = getIcon({
                    isLightTheme: theme === 'light',
                    type: 'token',
                    coinGeckoId: token.coinGeckoId,
                    width: 30,
                    height: 30
                  });

                  const networkIcon = getIcon({
                    isLightTheme: theme === 'light',
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
                  // const usd = getUsd(BigInt(sumAmount), token, prices);
                  const balance = sumAmount > 0 ? sumAmount.toFixed(truncDecimals) : '0';
                  const usd =
                    sumAmount > 0 && token && prices[token.coinGeckoId] ? sumAmount * prices[token.coinGeckoId] : '0';
                  return (
                    <div key={key} className={styles.selectTokenItem} onClick={() => handleChangeToken(token)}>
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
      </div>
    </>
  );
}