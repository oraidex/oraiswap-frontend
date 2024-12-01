import {
  CustomChainInfo,
  TokenItemType,
  getSubAmountDetails,
  truncDecimals
} from '@oraichain/oraidex-common';
import { isMobile } from '@walletconnect/browser-utils';
import ArrowImg from 'assets/icons/arrow_new.svg';
import BackImg from 'assets/icons/back.svg';
import CheckImg from 'assets/icons/check.svg';
import NetworkImg from 'assets/icons/network.svg';
import cn from 'classnames/bind';
import SearchInput from 'components/SearchInput';
import { chainIcons, flattenTokensWithIcon } from 'config/chainInfos';
import { networks } from 'helper';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import useOnClickOutside from 'hooks/useOnClickOutside';
import { getTotalUsd, toSumDisplay } from 'libs/utils';
import { FC, useRef, useState } from 'react';
import styles from './SelectTokenModalV2.module.scss';
import { tokenMap } from 'index';

const cx = cn.bind(styles);

interface ModalProps {
  className?: string;
  close: () => void;
  isCloseBtn?: boolean;
  amounts: AmountDetails;
  prices: CoinGeckoPrices<string>;
  items?: TokenItemType[] | CustomChainInfo[] | any;
  setToken: (denom: string) => void;
  type?: 'token' | 'network';
  setSearchTokenName: (tokenName: string) => void;
  searchTokenName?: string;
  title?: string;
}

interface GetIconInterface {
  type: 'token' | 'network';
  chainId?: string;
  coinGeckoId?: string;
  isLightTheme: boolean;
}

const getIcon = ({ isLightTheme, type, chainId, coinGeckoId }: GetIconInterface) => {
  let tokenOrNetworkIcon;
  if (type === 'token') {
    tokenOrNetworkIcon = flattenTokensWithIcon.find((tokenWithIcon) => tokenWithIcon.coinGeckoId === coinGeckoId);
  } else {
    tokenOrNetworkIcon = chainIcons.find((chain) => chain.chainId === chainId);
  }
  if (isLightTheme) return <tokenOrNetworkIcon.IconLight className={cx('logo')} />;
  return <tokenOrNetworkIcon.Icon className={cx('logo')} />;
};

export const SelectTokenModalV2: FC<ModalProps> = ({
  type = 'token',
  close,
  items,
  setToken,
  prices,
  amounts,
  setSearchTokenName,
  searchTokenName,
  title = 'Token List'
}) => {
  const mobileMode = isMobile();
  const ref = useRef(null);
  const [theme] = useConfigReducer('theme');
  const [isNetwork, setIsNetwork] = useState(false);
  const [searchTextChainName, setSearchTextChainName] = useState('');
  let totalBalance = 0;
  const isLightTheme = theme === 'light';

  const networkBalance = networks.map((item) => {
    const network = item as CustomChainInfo;
    const networkIcon = getIcon({ isLightTheme, type: 'network', chainId: item.chainId });
    const key = network.chainId.toString();
    const title = network.chainName;
    const subAmounts = Object.fromEntries(
      Object.entries(amounts).filter(([denom]) => tokenMap[denom] && tokenMap[denom].chainId === network.chainId)
    );
    const totalUsd = getTotalUsd(subAmounts, prices);
    const balance = '$' + (totalUsd > 0 ? totalUsd.toFixed(2) : '0');
    totalBalance += +totalUsd;
    return {
      ...item,
      ItemIcon: networkIcon,
      balance,
      title,
      key
    };
  });

  const checkSearchTokenAndNetworkSearch = (item: TokenItemType, tokenSearch: string, searchTextChainName: string) => {
    if (tokenSearch && searchTextChainName)
      return item.name.toLowerCase().includes(searchTokenName.toLowerCase()) && item.org === searchTextChainName;
    if (tokenSearch) return item.name.toLowerCase().includes(searchTokenName.toLowerCase());
    return item.org === searchTextChainName;
  };

  const networksMap = {};
  const isSearchTokenOrNetworkSearch = searchTokenName || searchTextChainName;
  let itemsCheck = items;
  if (isSearchTokenOrNetworkSearch) {
    itemsCheck = items.filter((item: TokenItemType) =>
      checkSearchTokenAndNetworkSearch(item, searchTokenName, searchTextChainName)
    );
  }

  itemsCheck.forEach((item: TokenItemType | CustomChainInfo) => {
    let key: string, title: string, balance: string, org: string;
    let itemIcon;
    if (type === 'token') {
      const token = item as TokenItemType;
      itemIcon = getIcon({ isLightTheme, type: 'token', coinGeckoId: token.coinGeckoId });
      key = token.denom;
      title = token.name;
      org = token.org;
      let sumAmountDetails: AmountDetails = {};
      // by default, we only display the amount that matches the token denom
      sumAmountDetails[token.denom] = amounts[token.denom];
      let sumAmount: number = toSumDisplay(sumAmountDetails);
      // if there are sub-denoms, we get sub amounts & calculate sum display of both sub & main amount
      if (token.evmDenoms) {
        const subAmounts = getSubAmountDetails(amounts, token);
        sumAmountDetails = { ...sumAmountDetails, ...subAmounts };
        sumAmount = toSumDisplay(sumAmountDetails);
      }
      balance = sumAmount > 0 ? sumAmount.toFixed(truncDecimals) : '0';
    } else {
      const network = item as CustomChainInfo;
      key = network.chainId.toString();
      itemIcon = getIcon({ isLightTheme, type: 'network', chainId: item.chainId });
      title = network.chainName;
      org = network.chainName;
      const subAmounts = Object.fromEntries(
        Object.entries(amounts).filter(([denom]) => tokenMap[denom] && tokenMap[denom].chainId === network.chainId)
      );
      const totalUsd = getTotalUsd(subAmounts, prices);
      balance = '$' + (totalUsd > 0 ? totalUsd.toFixed(2) : '0');
    }
    if (networksMap[item.chainId] === undefined) networksMap[item.chainId] = [];
    networksMap[item.chainId].push({ balance, key, title, chainId: item.chainId, org, itemIcon });
  });

  let itemsReverse = [];

  for (const key in networksMap) {
    if (Object.prototype.hasOwnProperty.call(networksMap, key)) {
      const prices = networksMap[key].sort((a, b) => b.balance - a.balance);
      itemsReverse.push(prices);
    }
  }

  itemsReverse = itemsReverse.reverse().flat();

  useOnClickOutside(ref, () => {
    setSearchTokenName('');
    close();
  });

  return (
    <div className={cx(!mobileMode ? 'select-wrapper' : 'select-mobile-wrapper')}>
      <div ref={ref} className={cx('select')}>
        {!isNetwork ? (
          <div className={cx('title')}>
            <div className={cx('title-content')}>{title}</div>
            <SearchInput
              style={{ background: 'transparent' }}
              isBorder
              placeholder="Search Token"
              defaultValue={searchTokenName}
              onSearch={(tokenName) => setSearchTokenName(tokenName.toUpperCase())}
            />
          </div>
        ) : (
          <div className={cx('details')}>
            <img
              src={BackImg}
              onClick={() => {
                isNetwork && setIsNetwork(false);
              }}
            />
            <div className={cx('network')}>Select network</div>
            <div />
          </div>
        )}
        <div className={cx('label')}>
          {!isNetwork && <div className={cx('left')}>Token List</div>}
          <div
            className={cx('right')}
            onClick={() => {
              if (isNetwork) {
                setSearchTextChainName('');
              }
              setIsNetwork(!isNetwork);
            }}
          >
            <img src={NetworkImg} alt="network" />
            <div className={cx('all-network')}>
              <span className={cx(`${isNetwork ? 'detail' : ''}`)}>
                {searchTextChainName && !isNetwork ? searchTextChainName : 'All Networks'}
              </span>
              {isNetwork && <span className={cx('balance')}>${totalBalance?.toFixed(2)}</span>}
            </div>
            {!isNetwork && <img src={ArrowImg} alt="arrow" />}
          </div>
          {isNetwork && !searchTextChainName && <img src={CheckImg} alt="check" />}
        </div>
        <div className={cx('options')}>
          {isNetwork &&
            networkBalance?.map((item) => {
              return (
                <div
                  className={cx('item')}
                  key={item.key}
                  onClick={() => {
                    setSearchTextChainName(item.title);
                    setIsNetwork(false);
                  }}
                >
                  {item.ItemIcon}
                  <div className={cx('grow')}>
                    <div>{item.title}</div>
                    <div className={cx('org')}>{item.balance}</div>
                  </div>
                  <div>{searchTextChainName === item.chainName && <img src={CheckImg} alt="check" />}</div>
                </div>
              );
            })}
          {!isNetwork &&
            itemsReverse.map((item) => (
              <div
                className={cx('item')}
                key={item.key}
                onClick={() => {
                  setToken(item.key);
                  setSearchTokenName('');
                  close();
                }}
              >
                {item.itemIcon}
                <div className={cx('grow')}>
                  <div>{item.title}</div>
                  <div className={cx('org')}>{item.org}</div>
                </div>
                <div>{item.balance}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
