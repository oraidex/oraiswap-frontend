import {
  CW20_DECIMALS,
  getSubAmountDetails,
  parseTokenInfoRawDenom,
  toAmount,
  toDisplay,
  tokensIcon
} from '@oraichain/oraidex-common';
import DefaultIcon from 'assets/icons/tokens.svg?react';
import { isMobile } from '@walletconnect/browser-utils';
import StakeIcon from 'assets/icons/stake.svg';
import WalletIcon from 'assets/icons/wallet-v3.svg';
import cn from 'classnames/bind';
import { Table, TableHeaderProps } from 'components/Table';
import ToggleSwitch from 'components/ToggleSwitch';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import { flattenTokens, tokenMap } from 'initCommon';
import { getTotalUsd, toSumDisplay } from 'libs/utils';
import { useGetTotalLpV3 } from 'pages/Pool-V3/hooks/useGetTotalLp';
import { formatDisplayUsdt, toFixedIfNecessary } from 'pages/Pools/helpers';
import { useGetMyStake } from 'pages/Pools/hooks';
import { FC, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTotalLpv3 } from 'reducer/token';
import { RootState } from 'store/configure';
import { AssetInfoResponse } from 'types/swap';
import styles from './AssetsTab.module.scss';

const cx = cn.bind(styles);

export const AssetsTab: FC<{ networkFilter: string }> = ({ networkFilter }) => {
  const { data: prices } = useCoinGeckoPrices();

  const dispatch = useDispatch();

  const amounts = useSelector((state: RootState) => state.token.amounts);
  const [address] = useConfigReducer('address');
  const [theme] = useConfigReducer('theme');
  const totalLpv3 = useSelector((state: RootState) => state.token.totalLpv3);

  const [tokenPoolPrices] = useConfigReducer('tokenPoolPrices');
  const [hideOtherSmallAmount, setHideOtherSmallAmount] = useState(true);
  const sizePadding = isMobile() ? '12px' : '24px';

  const { totalLpV3Info } = useGetTotalLpV3(address, prices);
  const { totalStaked } = useGetMyStake({
    stakerAddress: address
  });
  let totalUsd: number = getTotalUsd(amounts, prices);
  if (networkFilter) {
    const subAmounts = Object.fromEntries(
      Object.entries(amounts).filter(([denom]) => tokenMap?.[denom]?.chainId === networkFilter)
    );
    totalUsd = getTotalUsd(subAmounts, prices);
  }

  useEffect(() => {
    dispatch(updateTotalLpv3(totalLpV3Info || 0));
  }, [totalLpV3Info]);

  let listAsset: {
    src?: any;
    label?: string;
    balance?: number | string;
  }[] = [
      {
        src: WalletIcon,
        label: 'Total balance',
        balance: formatDisplayUsdt(totalUsd)
      }
    ];

  if (!networkFilter || networkFilter === 'Oraichain') {
    listAsset = [
      ...listAsset,
      {
        src: StakeIcon,
        label: 'Total LP',
        balance: formatDisplayUsdt(toDisplay(BigInt(Math.trunc(totalStaked)), CW20_DECIMALS) + Number(totalLpv3) || 0)
      }
    ];
  }

  const checkShouldHide = (value: number) => {
    const SMALL_BALANCE = 0.5;
    const isHide = hideOtherSmallAmount && value < SMALL_BALANCE;
    return isHide;
  };

  const data = flattenTokens
    .filter((flat) => flat.chainId !== 'kawaii_6886-1' && flat.chainId !== '0x1ae6')
    .reduce((result, token) => {
      // not display because it is evm map and no bridge to option, also no smart contract and is ibc native
      if (token.bridgeTo || token.contractAddress || (token.denom && token.chainId !== 'oraibridge-subnet-2')) {
        const isValidNetwork = !networkFilter || token.chainId === networkFilter;
        if (isValidNetwork) {
          const amount = BigInt(amounts[token.denom] ?? 0);
          const isHaveSubAmounts = token.contractAddress && token.evmDenoms;
          const subAmounts = isHaveSubAmounts ? getSubAmountDetails(amounts, token) : {};
          const totalAmount = amount + toAmount(toSumDisplay(subAmounts), token.decimals);

          const tokenDenom = parseTokenInfoRawDenom(token);
          const tokenPrice = prices[token.coinGeckoId] || tokenPoolPrices?.[tokenDenom] || 0;
          const value = toDisplay(totalAmount.toString(), token.decimals) * tokenPrice;

          if (checkShouldHide(value)) return result;

          result.push({
            asset: token.name,
            chain: token.org,
            icon: token?.icon,
            iconLight: token?.iconLight,
            price: tokenPrice,
            balance: toDisplay(totalAmount.toString(), token.decimals),
            denom: token.denom,
            value,
            coeff: 0,
            coeffType: 'increase',
            coinGeckoId: token.coinGeckoId
          });
        }
      }

      return result;
    }, [])
    .sort((a, b) => b.value - a.value);

  const headers: TableHeaderProps<AssetInfoResponse> = {
    assets: {
      name: 'ASSET',
      accessor: (data) => (
        <div className={styles.assets}>
          <div className={styles.left}>
            {data?.icon ? theme === 'light' ? (
              <img style={{
                backgroundColor: data?.coinGeckoId === 'usdai' ? 'white' : 'transparent',
              }} src={data.icon} className={cx('logo')} alt="icon" />
            ) : (
              <img style={{
                backgroundColor: data?.coinGeckoId === 'usdai' ? 'white' : 'transparent',
              }} className={cx('logo')} src={data.icon} alt="icon" />
            ) : <DefaultIcon className={cx('logo')} />}
          </div>
          <div className={styles.right}>
            <div className={styles.assetName}>{data.asset}</div>
            <div className={styles.assetChain}>{data.chain}</div>
          </div>
        </div>
      ),
      width: '30%',
      align: 'left',
      padding: `0px 0px 0px ${sizePadding}`
    },
    price: {
      name: 'PRICE',
      width: '23%',
      accessor: (data) => <div className={styles.price}>${Number(data.price.toFixed(6))}</div>,
      align: 'left'
    },
    balance: {
      name: 'BALANCE',
      width: '23%',
      align: 'left',
      accessor: (data) => (
        <div className={cx('balance', `${!data.balance && 'balance-low'}`)}>
          {toFixedIfNecessary(data.balance.toString(), isMobile() ? 3 : 6)}
          {/* {numberWithCommas(toFixedIfNecessary(data.balance.toString(), isMobile() ? 3 : 6))}{' '} */}
          <span className={cx('balance-assets')}>&nbsp;{data.asset}</span>
        </div>
      )
    },
    value: {
      name: 'VALUE',
      width: '24%',
      align: 'left',
      padding: '0px 8px 0px 0px',
      accessor: (data) => {
        return (
          <div className={styles.valuesColumn}>
            <div>
              <div className={styles.value}>{formatDisplayUsdt(data.value)}</div>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className={cx('assetsTab')}>
      <div className={cx('info')}>
        {listAsset.map((e, i) => {
          return (
            <div key={i} className={cx('total-info')}>
              <div className={cx('icon')}>
                <img className={cx('wallet')} src={e.src} alt="wallet" />
              </div>
              <div className={cx('balance')}>
                <div className={cx('label')}>{e.label}</div>
                <div className={cx('value')}>{e.balance}</div>
              </div>
            </div>
          );
        })}
        <div className={cx('switch')}>
          <ToggleSwitch
            small={true}
            id="small-balances"
            checked={hideOtherSmallAmount}
            onChange={() => setHideOtherSmallAmount(!hideOtherSmallAmount)}
          />
          <label htmlFor="small-balances">Hide small balances!</label>
        </div>
      </div>
      <div className={cx('tableWrapper')}>
        <Table
          headers={headers}
          data={data}
          stylesColumn={{
            padding: '16px 0'
          }}
        />
      </div>
    </div>
  );
};
