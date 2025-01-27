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
import useConfigReducer from 'hooks/useConfigReducer';
import { toSumDisplay } from 'libs/utils';
import { FC, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { inspectToken } from 'reducer/onchainTokens';
import { RootState } from 'store/configure';
import styles from './SelectTokenModal.module.scss';
import IconVerified from 'assets/icons/ic_verified.svg?react';
import { DEFAULT_TOKEN_ICON_URL } from 'helper/constants';

const cx = cn.bind(styles);

interface ModalProps {
  className?: string;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  isCloseBtn?: boolean;
  items?: TokenItemType[];
  setToken: (denom: string, contract_addr?: string) => void;
  setSymbol?: (symbol: string) => void;
}

export const SelectTokenModal: FC<ModalProps> = ({ isOpen, close, open, items, setToken, setSymbol }) => {
  const [theme] = useConfigReducer('theme');
  const [address] = useConfigReducer('address');
  const [textSearch, setTextSearch] = useState('');
  const dispatch = useDispatch();
  const amounts = useSelector((state: RootState) => state.token.amounts);

  useEffect(() => {
    if (listItems.length === 0 && textSearch) {
      dispatch<any>(
        inspectToken({
          tokenId: textSearch,
          address,
          isUserAdded: true
        })
      );
    }
  }, [textSearch]);

  const listItems = items
    .filter((i) => !i.isDisabledSwap)
    .filter((item) =>
      textSearch
        ? item.name.toLowerCase().includes(textSearch.toLowerCase()) ||
          item.denom.toLowerCase() === textSearch.toLowerCase()
        : true
    );

  return (
    <Modal theme={theme} isOpen={isOpen} close={close} open={open} isCloseBtn={true}>
      <div className={cx('select', theme)}>
        <div className={cx('title', theme)}>
          <div>Select a token</div>
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
          {listItems?.map((item: TokenItemType | CustomChainInfo) => {
            let key: string, title: string, balance: string;

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

            balance = sumAmount > 0 ? sumAmount.toFixed(truncDecimals) : '0';

            const tokenIconUrl = (theme === 'light' ? token.iconLight : token.icon) || DEFAULT_TOKEN_ICON_URL;
            const icon = <img style={{ borderRadius: '100%' }} src={tokenIconUrl} alt="icon" width={30} height={30} />;

            return (
              <div
                className={cx('item', theme)}
                key={key}
                onClick={() => {
                  setToken(key);
                  if (setSymbol) {
                    setSymbol(title);
                  }
                  close();
                }}
              >
                {icon}
                <div className={cx('grow')}>
                  <div>
                    {title || 'UNKNOWN'} {token.isVerified && <IconVerified />}
                  </div>
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
