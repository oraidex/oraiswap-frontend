import { CoinIcon, CustomChainInfo } from '@oraichain/oraidex-common';
import ArrowImg from 'assets/icons/arrow_new.svg';
import CheckImg from 'assets/icons/check.svg';
import NetworkImg from 'assets/icons/network.svg';
import cn from 'classnames/bind';
import { networks } from 'helper';
import useConfigReducer from 'hooks/useConfigReducer';
import useOnClickOutside from 'hooks/useOnClickOutside';
import { useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { NetworkFilter, TYPE_TAB_HISTORY, initNetworkFilter } from '../helpers';
import styles from './TabsTxs.module.scss';
import { chainIcons } from 'config/chainInfos';
import { FROM_QUERY_KEY, TO_QUERY_KEY, TYPE_QUERY_TYPE } from '../Swap/hooks/useFillToken';

const cx = cn.bind(styles);
const ItemNetwork: React.FC<{
  theme: string;
  item: {
    IconLight?: CoinIcon;
    Icon?: CoinIcon;
    chainName: string;
  };
  icons?: React.ReactElement;
  isCheck: boolean;
  onClick: () => void;
  isAllNetwork?: string;
}> = ({ onClick, item, theme, isCheck, icons, isAllNetwork }) => {
  return (
    <div className={cx('item', `${isAllNetwork}`)} onClick={onClick}>
      {icons ? (
        icons
      ) : theme === 'light' ? (
        item.IconLight ? (
          <item.IconLight className={cx('logo')} />
        ) : (
          <item.Icon className={cx('logo')} />
        )
      ) : (
        <item.Icon className={cx('logo')} />
      )}

      <div className={cx('grow')}>
        <div>{item?.chainName}</div>
      </div>
      <div className={cx('check-icon')}>{isCheck && <img src={CheckImg} alt="check" />}</div>
    </div>
  );
};

const TabsNetwork: React.FC<{
  theme: string;
  setIsNetwork: (isNetwork: boolean) => void;
  networkFilter: string;
  setNetworkFilter: (networkFilter: NetworkFilter) => void;
}> = ({ networkFilter, setIsNetwork, setNetworkFilter, theme }) => {
  return (
    <div className={cx('network')}>
      <div className={cx('options', 'border')}>
        <ItemNetwork
          onClick={() => {
            setNetworkFilter(initNetworkFilter);
            setIsNetwork(false);
          }}
          icons={<img className={cx('logo')} src={NetworkImg} alt="network" />}
          item={{ chainName: 'All networks' }}
          theme={theme}
          isCheck={networkFilter === 'All networks'}
          isAllNetwork={'all'}
        />
      </div>
      <div className={cx('options')}>
        {networks &&
          networks.map((item: CustomChainInfo) => {
            const networkIcon = chainIcons.find((chainIcon) => chainIcon.chainId === item.chainId);
            return (
              <div key={item.chainName}>
                <ItemNetwork
                  onClick={() => {
                    setNetworkFilter({
                      label: item.chainName,
                      value: item.chainId,
                      Icon: networkIcon.Icon,
                      IconLight: networkIcon.IconLight
                    });
                    setIsNetwork(false);
                  }}
                  item={{
                    ...item,
                    Icon: networkIcon.Icon,
                    IconLight: networkIcon.IconLight
                  }}
                  theme={theme}
                  isCheck={networkFilter === item.chainName}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export const TabsTxs: React.FC<{
  networkFilter: NetworkFilter;
  setNetworkFilter: (networkFilter: NetworkFilter) => void;
}> = ({ setNetworkFilter, networkFilter }) => {
  const [isNetwork, setIsNetwork] = useState<boolean>(false);
  const [theme] = useConfigReducer('theme');
  const ref = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  let pathname = location.pathname;

  useOnClickOutside(ref, () => {
    setIsNetwork(false);
  });

  const [searchParams] = useSearchParams();
  let tab = searchParams.get(TYPE_QUERY_TYPE)?.toLowerCase();

  const getUrlString = (param?: string) => {
    const currentFromDenom = searchParams.get(FROM_QUERY_KEY);
    const currentToDenom = searchParams.get(TO_QUERY_KEY);
    const queryParams = new URLSearchParams();

    if (param) queryParams.set('type', param);

    if (currentFromDenom) queryParams.set('from', currentFromDenom);
    if (currentToDenom) queryParams.set('to', currentToDenom);

    const queryString = queryParams.toString();
    return { queryString };
  };

  if (tab && !Object.values(TYPE_TAB_HISTORY).includes(tab)) {
    const { queryString } = getUrlString();
    navigate(`${pathname}?${queryString}`);
  }

  return (
    <div className={cx('tabsTxs')} ref={ref}>
      <div className={cx('left')}>
        {Object.values(TYPE_TAB_HISTORY).map((type) => {
          return (
            <div
              key={type}
              className={cx(
                'label',
                `${tab === type ? 'active' : ''}`,
                `${!tab && type === TYPE_TAB_HISTORY.ASSETS ? 'active' : ''}`
              )}
              onClick={() => {
                const { queryString } = getUrlString(type);
                navigate(`${pathname}?${queryString}`);
              }}
            >
              {type}
            </div>
          );
        })}
      </div>
      {tab !== TYPE_TAB_HISTORY.HISTORY && (
        <div className={cx('right')}>
          <div
            className={cx('content')}
            onClick={() => {
              setIsNetwork(!isNetwork);
            }}
          >
            {networkFilter.value ? (
              theme === 'light' ? (
                <networkFilter.IconLight className={cx('logo')} />
              ) : (
                <networkFilter.Icon className={cx('logo')} />
              )
            ) : (
              <img src={NetworkImg} alt="network" />
            )}
            <div className={cx('all-network')}>
              <span className={cx(`detail`)}>{networkFilter?.label ?? 'All Networks'}</span>
            </div>
            <img src={ArrowImg} alt="arrow" />
          </div>
          {isNetwork && (
            <TabsNetwork
              networkFilter={networkFilter.label}
              theme={theme}
              setIsNetwork={setIsNetwork}
              setNetworkFilter={setNetworkFilter}
            />
          )}
        </div>
      )}
    </div>
  );
};
