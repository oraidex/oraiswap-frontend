import cn from 'classnames/bind';
import Modal from 'components/Modal';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import { getTotalUsd, toSumDisplay } from 'libs/utils';
import { FC, useEffect, useState } from 'react';
import styles from './SelectTokenModal.module.scss';
import useConfigReducer from 'hooks/useConfigReducer';
import {
  CustomChainInfo,
  TokenItemType,
  chainIcons,
  getSubAmountDetails,
  tokensIcon,
  truncDecimals
} from '@oraichain/oraidex-common';
import { chainInfosWithIcon, oraichainTokensWithIcon, tokenMap } from 'initCommon';
import { getIcon } from 'helper';
import SearchInput from 'components/SearchInput';
import useOnchainTokensReducer from 'hooks/useOnchainTokens';
import { useDispatch } from 'react-redux';
import { inspectToken } from 'reducer/onchainTokens';

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

  const onchainTokens = useOnchainTokensReducer('tokens');
  const dispatch = useDispatch();

  useEffect(() => {
    if (listItems.length === 0 && textSearch) {
      dispatch<any>(inspectToken({
        tokenId: textSearch,
        address
      }));
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
          {[...listItems, ...onchainTokens]?.map((item: TokenItemType | CustomChainInfo) => {
            let key: string, title: string, balance: string;
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
              tokenAndChainIcons = chainInfosWithIcon.find((chainIcon) => chainIcon.chainId === network.chainId);
              balance = '$' + (totalUsd > 0 ? totalUsd.toFixed(2) : '0');
            }
            const icon = getIcon({
              isLightTheme: theme === 'light',
              type: 'token',
              chainId: tokenAndChainIcons?.chainId,
              coinGeckoId: tokenAndChainIcons?.coinGeckoId,
              width: 30,
              height: 30
            });

            return (
              <div
                className={cx('item', theme)}
                key={key}
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
