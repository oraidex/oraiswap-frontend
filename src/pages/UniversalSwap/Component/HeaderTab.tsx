import { isMobile } from '@walletconnect/browser-utils';
import cn from 'classnames/bind';
import { minimize } from 'helper';
import useTheme from 'hooks/useTheme';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentSwapFilterTime, selectCurrentSwapTabChart, setFilterTimeSwap } from 'reducer/chartSlice';
import { selectCurrentFromToken, selectCurrentToChain, selectCurrentToToken } from 'reducer/tradingSlice';
import { FILTER_TIME_CHART, TAB_CHART_SWAP } from 'reducer/type';
import { ChartTokenType } from '../hooks/useChartUsdPrice';
import styles from './HeaderTab.module.scss';
import { flattenTokens } from 'initCommon';
import { getTokenIsStableCoin } from '../helpers';

const cx = cn.bind(styles);

export type HeaderTabPropsType = {
  hideChart: boolean;
  setHideChart: (isHideChart: boolean) => void;
  toTokenDenom: string;
  priceUsd: number;
  priceChange?: {
    price_change: number;
    price: number;
    isError?: boolean;
  };
  percentChangeUsd: string | number;

  chartTokenType: ChartTokenType;
  setChartTokenType: React.Dispatch<React.SetStateAction<ChartTokenType>>;
  showTokenInfo?: boolean;
};

export const HeaderTab: React.FC<HeaderTabPropsType> = ({
  setHideChart,
  hideChart,
  priceUsd,
  // priceChange,
  percentChangeUsd,
  chartTokenType,
  setChartTokenType,
  showTokenInfo = true
}) => {
  const filterTime = useSelector(selectCurrentSwapFilterTime);
  const tab = useSelector(selectCurrentSwapTabChart);
  const dispatch = useDispatch();
  const mobileMode = isMobile();

  return (
    <div className={cx('headerTab')}>
      <HeaderTop
        showHideChart={!mobileMode}
        hideChart={hideChart}
        onClickAction={() => setHideChart(!hideChart)}
        priceUsd={priceUsd}
        // priceChange={priceChange}
        percentChangeUsd={percentChangeUsd}
        chartTokenType={chartTokenType}
        showTokenInfo={showTokenInfo}
      />

      <div className={cx('headerBottom')}>
        {!mobileMode && (
          <UsdPrice priceUsd={priceUsd} percentChangeUsd={percentChangeUsd} chartTokenType={chartTokenType} />
        )}

        {tab === TAB_CHART_SWAP.TOKEN && !hideChart && (
          <div className={cx('filter_wrapper')}>
            <div className={cx('filter_day_wrapper')}>
              {LIST_FILTER_TIME.map((e) => {
                return (
                  <button
                    key={'time-key-chart' + e.label}
                    className={cx(`filter_day`, e.value === filterTime ? 'active' : '')}
                    onClick={() => {
                      dispatch(setFilterTimeSwap(e.value));
                    }}
                  >
                    {e.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const UsdPrice = ({
  percentChangeUsd,
  priceUsd,
  chartTokenType
}: Pick<HeaderTabPropsType, 'percentChangeUsd' | 'priceUsd' | 'chartTokenType'>) => {
  const isIncrementUsd = percentChangeUsd && Number(percentChangeUsd) > 0;
  const headerTabSimple = () => {
    return (
      <div>
        <span>
          ${priceUsd < 10 ** -6 && priceUsd > 0 ? minimize(priceUsd.toFixed(12)) : minimize(priceUsd.toString())}
        </span>
        <span
          className={cx('percent', isIncrementUsd ? 'increment' : 'decrement', {
            hidePercent: chartTokenType === ChartTokenType.Volume
          })}
        >
          {(isIncrementUsd ? '+' : '') + Number(percentChangeUsd).toFixed(2)}%
        </span>
      </div>
    );
  };

  return <div className={cx('priceUsd')}>{headerTabSimple()}</div>;
};

export const HeaderTop = ({
  showHideChart = true,
  hideChart,
  onClickAction,
  priceUsd,
  percentChangeUsd,
  chartTokenType,
  showTokenInfo = true
}: Pick<HeaderTabPropsType, 'percentChangeUsd' | 'priceUsd' | 'chartTokenType'> & {
  showHideChart?: boolean;
  hideChart?: boolean;
  onClickAction: () => void;
  showTokenInfo?: boolean;
}) => {
  const theme = useTheme();
  const tab = useSelector(selectCurrentSwapTabChart);
  const currentFromToken = useSelector(selectCurrentFromToken);
  const currentToChain = useSelector(selectCurrentToChain);
  const currentToToken = useSelector(selectCurrentToToken);
  const mobileMode = isMobile();
  let [ToTokenIcon, FromTokenIcon] = [null, null];

  const generateIconTokenByTheme = (token) => {
    return theme === 'light' ? (
      <img style={{ borderRadius: '100%' }} src={token.iconLight} width={30} height={30} alt="token" />
    ) : (
      <img style={{ borderRadius: '100%' }} src={token.icon} alt="token" width={30} height={30} />
    );
  };

  const toTokenDenomIsStable = getTokenIsStableCoin(currentToToken);
  const currentToken = toTokenDenomIsStable ? currentFromToken : currentToToken;
  if (currentToToken) {
    ToTokenIcon = generateIconTokenByTheme(currentToken);
  }
  if (currentFromToken) {
    const tokenIcon = flattenTokens.find(
      (tokenWithIcon) =>
        tokenWithIcon.contractAddress === currentFromToken.contractAddress ||
        tokenWithIcon.denom === currentFromToken.denom
    );
    if (tokenIcon) FromTokenIcon = generateIconTokenByTheme(tokenIcon);
  }

  return (
    <div className={cx('headerTop')}>
      <div className={cx('tokenWrapper')}>
        {showTokenInfo && (
          <div>
            {tab === TAB_CHART_SWAP.TOKEN
              ? currentToChain && (
                  <div className={cx('tokenInfo')}>
                    {ToTokenIcon}
                    <span>{currentToken?.name || currentToken?.denom}</span>
                    <span className={cx('tokenName')}>{currentToken?.org}</span>
                  </div>
                )
              : currentFromToken && (
                  <div className={cx('tokenInfo')}>
                    <div className={cx('icons')}>
                      <div className={cx('formIcon')}>{FromTokenIcon}</div>
                      <div className={cx('toIcon')}>{ToTokenIcon}</div>
                    </div>
                    <span>
                      {currentFromToken?.name || currentFromToken?.denom}/
                      {currentToToken?.name || currentToToken?.denom}
                    </span>
                  </div>
                )}
          </div>
        )}
        {mobileMode && (
          <UsdPrice priceUsd={priceUsd} percentChangeUsd={percentChangeUsd} chartTokenType={chartTokenType} />
        )}
      </div>
    </div>
  );
};

export const LIST_FILTER_TIME = [
  {
    label: '24H',
    value: FILTER_TIME_CHART['DAY']
  },
  {
    label: '7D',
    value: FILTER_TIME_CHART['7DAY']
  },
  {
    label: 'M',
    value: FILTER_TIME_CHART['MONTH']
  },
  {
    label: '3M',
    value: FILTER_TIME_CHART['3MONTH']
  }
];
