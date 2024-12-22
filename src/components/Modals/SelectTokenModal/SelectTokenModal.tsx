import {
  CustomChainInfo,
  TokenItemType,
  getSubAmountDetails,
  tokensIcon,
  truncDecimals
} from '@oraichain/oraidex-common';
import cn from 'classnames/bind';
import Modal from 'components/Modal';
import SearchInput from 'components/SearchInput';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import { chainInfos, tokenMap } from 'initCommon';
import { getTotalUsd, toSumDisplay } from 'libs/utils';
import { FC, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { inspectToken } from 'reducer/onchainTokens';
import { RootState } from 'store/configure';
import styles from './SelectTokenModal.module.scss';

const cx = cn.bind(styles);

interface ModalProps {
  className?: string;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  isCloseBtn?: boolean;
  amounts: AmountDetails;
  prices: CoinGeckoPrices<string>;
  items?: TokenItemType[];
  setToken: (denom: string, contract_addr?: string) => void;
  type?: 'token' | 'network';
  setSymbol?: (symbol: string) => void;
}

export const SelectTokenModal: FC<ModalProps> = ({
  type = 'token',
  isOpen,
  close,
  open,
  items,
  setToken,
  prices,
  amounts,
  setSymbol
}) => {
  const [theme] = useConfigReducer('theme');
  const [textSearch, setTextSearch] = useState('');
  const [address] = useConfigReducer('address');

  const dispatch = useDispatch();

  useEffect(() => {
    if (listItems.length === 0 && textSearch) {
      dispatch<any>(
        inspectToken({
          tokenId: textSearch,
          address
        })
      );
    }
  }, [textSearch]);

  const listItems = items.filter(
    (item) => item.decimals !== 18 && (textSearch ? item.name.toLowerCase().includes(textSearch.toLowerCase()) : true)
  );
  return (
    <Modal theme={theme} isOpen={isOpen} close={close} open={open} isCloseBtn={true}>
      <div className={cx('select', theme)}>
        <div className={cx('title', theme)}>
          <div>{type === 'token' ? 'Select a token' : 'Select a network'}</div>
        </div>

        <SearchInput
          placeholder="Find token by name or address"
          className={styles.selectTokenSearchInput}
          onSearch={(text) => {
            setTextSearch(text);
          }}
          theme={theme}
        />

        <div className={cx('options')}>
          {items
            ?.map((item: TokenItemType | CustomChainInfo) => {
              let key: string, title: string, balance: string, rawBalance: string;
              let tokenAndChainIcons;
              if (type === 'token') {
                const token = item as TokenItemType;
                key = token.denom;
                title = token.name;
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
                tokenAndChainIcons = tokensIcon.find((tokenIcon) => tokenIcon.coinGeckoId === token.coinGeckoId);
                balance = sumAmount > 0 ? sumAmount.toFixed(truncDecimals) : '0';
                rawBalance = balance;
              } else {
                const network = item as CustomChainInfo;
                key = network.chainId.toString();
                title = network.chainName;
                const subAmounts = Object.fromEntries(
                  Object.entries(amounts).filter(
                    ([denom]) => tokenMap[denom] && tokenMap[denom].chainId === network.chainId
                  )
                );
                const totalUsd = getTotalUsd(subAmounts, prices);
                tokenAndChainIcons = chainInfos.find((chainIcon) => chainIcon.chainId === network.chainId);
                rawBalance = totalUsd > 0 ? totalUsd.toFixed(2) : '0';
                balance = '$' + rawBalance;
              }
              const icon =
                tokenAndChainIcons && theme === 'light' ? (
                  <img src={tokenAndChainIcons?.chainSymbolImageUrl} className={cx('logo')} alt="" />
                ) : (
                  <img src={tokenAndChainIcons?.chainSymbolImageUrl} alt="" className={cx('logo')} />
                );

              return {
                ...item,
                key,
                title,
                balance,
                rawBalance,
                icon
              };
            })
            .sort((a, b) => Number(b.rawBalance || 0) - Number(a.rawBalance || 0))
            .map((item, idx) => {
              const { key, title, balance, icon } = item;
              return (
                <div
                  className={cx('item', theme)}
                  key={`${key}-${idx}`}
                  onClick={() => {
                    setToken(key, type === 'token' && (item as TokenItemType).contractAddress);
                    if (setSymbol) {
                      setSymbol(title);
                    }
                    close();
                  }}
                >
                  {icon}
                  <div className={cx('grow')}>
                    <div>{title}</div>
                  </div>
                  <div>{balance}</div>
                </div>
              );
            })}
        </div>
      </div>
    </Modal>
  );
};
