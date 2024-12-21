import { TokenItemType, truncDecimals } from '@oraichain/oraidex-common';
import CloseIcon from 'assets/icons/close-icon.svg?react';
import ArrowIcon from 'assets/icons/ic_arrow_down.svg?react';
import NoResultDark from 'assets/images/no-result-dark.svg?react';
import NoResultLight from 'assets/images/no-result.svg?react';
import classNames from 'classnames';
import SearchInput from 'components/SearchInput';
import { getIcon } from 'helper';
import { formatDisplayUsdt } from 'helper/format';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useTheme from 'hooks/useTheme';
import { toSumDisplay } from 'libs/utils';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSubAmountDetails } from 'rest/api';
import { RootState } from 'store/configure';
import styles from './index.module.scss';
import { oraichainTokens, oraichainTokensWithIcon } from 'initCommon';
import { inspectToken } from 'reducer/onchainTokens';
import useConfigReducer from 'hooks/useConfigReducer';
import IconVerified from 'assets/icons/ic_verified.svg?react';

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
  const [textSearch, setTextSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const amounts = useSelector((state: RootState) => state.token.amounts);
  const { data: prices } = useCoinGeckoPrices();
  const [address] = useConfigReducer('address');
  const isLightTheme = theme === 'light';

  const dispatch = useDispatch();
  const allOraichainTokens = useSelector((state: RootState) => state.token.allOraichainTokens);

  // useEffect(() => {
  //   if (listItems.length === 0 && textSearch) {
  //     dispatch<any>(
  //       inspectToken({
  //         tokenId: textSearch,
  //         address
  //       })
  //     );
  //   }
  // }, [textSearch]);

  const listItems = oraichainTokensWithIcon.filter(
    (item) =>
      item.decimals !== 18 &&
      (otherTokenDenom ? item.denom !== otherTokenDenom : true) &&
      (textSearch ? item.name.toLowerCase().includes(textSearch.toLowerCase()) : true)
  );

  const TokenIcon =
    token &&
    getIcon({
      isLightTheme,
      type: 'token',
      coinGeckoId: token.coinGeckoId,
      width: 30,
      height: 30
    });

  return (
    <div className={styles.selectToken}>
      <div className={classNames(styles.btn, customClassButton)} onClick={() => setIsOpen(true)}>
        <span className={styles.name}>
          {TokenIcon ? (
            <>
              {TokenIcon}
              &nbsp;{token.name}
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
              {!oraichainTokens.length && (
                <div className={styles.selectTokenListNoResult}>
                  {isLightTheme ? <NoResultLight /> : <NoResultDark />}
                </div>
              )}

              {/* TODO: use allOraichainTokens after launched permissionless  */}
              {/* {allOraichainTokens */}
              {oraichainTokens
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
                  return Number(b.usd) - Number(a.usd);
                })
                .map(({ key, tokenIcon, networkIcon, balance, usd, ...token }) => {
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
                            {/* <div className={styles.selectTokenItemLeftImgChain}>{networkIcon}</div> */}
                          </div>
                        </div>
                        <div>
                          <div className={styles.selectTokenItemTokenName}>
                            {token.name} {token.isVerified && <IconVerified />}
                          </div>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectToken;
