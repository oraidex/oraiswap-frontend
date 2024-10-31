import { MulticallQueryClient } from '@oraichain/common-contracts-sdk';
import { useQueryClient } from '@tanstack/react-query';
import BackIcon from 'assets/icons/ic_back.svg?react';
import DefaultIcon from 'assets/icons/tokens.svg?react';
import { network } from 'config/networks';
import useConfigReducer from 'hooks/useConfigReducer';
import useLoadTokens from 'hooks/useLoadTokens';
import useTheme from 'hooks/useTheme';
import Content from 'layouts/Content';
import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { updateLpPools } from 'reducer/token';
import { PoolInfoResponse } from 'types/pool';
import styles from './PoolDetail.module.scss';
import ChartDetailSection from './components/ChartDetailSection';
import { Earning } from './components/Earning';
import { MyPoolInfo } from './components/MyPoolInfo/MyPoolInfo';
import { OverviewPool } from './components/OverviewPool';
import TransactionHistory from './components/TransactionHistory';
import { fetchLpPoolsFromContract, useGetPoolDetail, useGetPools, useGetPriceChange } from './hooks';
import { useGetLpBalance } from './hooks/useGetLpBalance';
import { useGetPairInfo } from './hooks/useGetPairInfo';
import { oraichainTokensWithIcon } from 'config/chainInfos';
import classNames from 'classnames';
import Tabs from 'components/TabCustom';
import { isMobile } from '@walletconnect/browser-utils';
import { Button } from 'components/Button';
import AddIcon from 'assets/icons/Add.svg?react';
import { parseAssetOnlyDenom } from './helpers';
import { AddLiquidityModal } from './components/AddLiquidityModal';
import { numberWithCommas } from 'helper/format';

const PoolDetail: React.FC = () => {
  const theme = useTheme();
  const isMobileMode = isMobile();
  let { poolUrl } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [address] = useConfigReducer('address');
  const poolDetailData = useGetPoolDetail({ pairDenoms: poolUrl });
  const loadTokenAmounts = useLoadTokens();
  const setCachedLpPools = (payload: LpPoolDetails) => dispatch(updateLpPools(payload));
  const pools = useGetPools();
  const lpAddresses = pools.map((pool) => pool.liquidityAddr);
  const { refetchPairAmountInfo, refetchLpTokenInfoData } = useGetPairInfo(poolDetailData);
  const queryClient = useQueryClient();
  const [pairDenomsDeposit, setPairDenomsDeposit] = useState('');

  const { lpBalanceInfoData, refetchLpBalanceInfoData } = useGetLpBalance(poolDetailData);
  const lpTokenBalance = BigInt(lpBalanceInfoData?.balance || '0');

  const refetchAllLpPools = async () => {
    if (lpAddresses.length === 0) return;
    const lpTokenData = await fetchLpPoolsFromContract(
      lpAddresses,
      address,
      new MulticallQueryClient(window.client, network.multicall)
    );
    setCachedLpPools(lpTokenData);
  };

  const onLiquidityChange = useCallback(
    (amountLpInUsdt = 0) => {
      refetchPairAmountInfo();
      refetchLpTokenInfoData();
      refetchLpBalanceInfoData();
      refetchAllLpPools();
      loadTokenAmounts({ oraiAddress: address });

      // Update in an immutable way.
      const queryKey = ['pool-detail', poolUrl];
      queryClient.setQueryData(queryKey, (oldPoolDetail: PoolInfoResponse) => {
        const updatedTotalLiquidity = oldPoolDetail.totalLiquidity + amountLpInUsdt;
        return {
          ...oldPoolDetail,
          totalLiquidity: updatedTotalLiquidity
        };
      });
    },
    [address, pools]
  );

  const { token1, token2 } = poolDetailData;

  const pair = (poolUrl || '')
    .split('_')
    .map((e) => decodeURIComponent(e))
    .join('-');

  const params = {
    base_denom: pair.split('-')[0],
    quote_denom: pair.split('-')[1],
    tf: 1440
  };

  const { priceChange } = useGetPriceChange(params);

  const baseToken = (token1?.contractAddress || token1?.denom) === params.base_denom ? token1 : token2;
  const quoteToken = (token2?.contractAddress || token2?.denom) === params.base_denom ? token1 : token2;

  let BaseTokenIcon = DefaultIcon;
  let QuoteTokenIcon = DefaultIcon;
  const BaseTokenInOraichain = oraichainTokensWithIcon.find(
    (oraiTokens) =>
      [oraiTokens.denom, oraiTokens.contractAddress].filter(Boolean).includes(baseToken.contractAddress) ||
      [oraiTokens.denom, oraiTokens.contractAddress].filter(Boolean).includes(baseToken.denom)
  );
  const QuoteTokenInOraichain = oraichainTokensWithIcon.find(
    (oraiTokens) =>
      [oraiTokens.denom, oraiTokens.contractAddress].filter(Boolean).includes(quoteToken.contractAddress) ||
      [oraiTokens.denom, oraiTokens.contractAddress].filter(Boolean).includes(quoteToken.denom)
  );
  if (BaseTokenInOraichain)
    BaseTokenIcon = theme === 'light' ? BaseTokenInOraichain.IconLight : BaseTokenInOraichain.Icon;
  if (QuoteTokenInOraichain)
    QuoteTokenIcon = theme === 'light' ? QuoteTokenInOraichain.IconLight : QuoteTokenInOraichain.Icon;

  return (
    <Content nonBackground otherBackground>
      <div className={styles.pool_detail}>
        <div className={styles.backWrapper}>
          <div className={styles.left}>
            <div
              className={styles.back}
              onClick={() => {
                navigate(`/pools`);
              }}
            >
              <BackIcon className={styles.backIcon} />
              <div className={styles.info}>
                <div className={classNames(styles.icons, styles[theme])}>
                  {BaseTokenIcon && <BaseTokenIcon />}
                  {QuoteTokenIcon && <QuoteTokenIcon />}
                </div>
                <span>
                  {baseToken?.name?.toUpperCase()} / {quoteToken?.name?.toUpperCase()}
                </span>
                <span className={classNames(styles.tag)}>V2</span>
              </div>
            </div>
            <div className={styles.price}>
              1 {baseToken?.name} = {numberWithCommas(priceChange?.price || 0, undefined, { maximumFractionDigits: 6 })}{' '}
              {quoteToken?.name}
              {isMobileMode ? <br /> : <div className={styles.divider}>|</div>}1 {quoteToken?.name} ={' '}
              {numberWithCommas(1 / (priceChange?.price || 1), undefined, { maximumFractionDigits: 6 })}{' '}
              {baseToken?.name}
            </div>
          </div>
          <div className={styles.addPosition}>
            <Button
              disabled={!baseToken || !quoteToken}
              onClick={(event) => {
                event.stopPropagation();
                setPairDenomsDeposit(
                  `${baseToken?.contractAddress || baseToken?.denom}_${
                    quoteToken?.contractAddress || quoteToken?.denom
                  }`
                );
              }}
              type="primary-sm"
            >
              <div>
                <AddIcon />
                &nbsp;
              </div>
              Add LP
            </Button>
          </div>
        </div>
        <div className={styles.overview}>
          <OverviewPool
            poolDetailData={{
              ...poolDetailData,
              token1: BaseTokenInOraichain,
              token2: QuoteTokenInOraichain
            }}
          />
        </div>
        {/* <div className={styles.summary}>
          <div className={styles.chart}>
            <ChartDetailSection pair={pair} symbol={poolDetailData?.info?.symbols} />
          </div>
        </div> */}

        <Tabs
          tabKey="tab"
          listTabs={[
            {
              id: 'LP',
              value: 'My Liquidity',
              content: (
                <>
                  <Earning onLiquidityChange={onLiquidityChange} />
                  <MyPoolInfo myLpBalance={lpTokenBalance} onLiquidityChange={onLiquidityChange} />
                </>
              )
            },
            {
              id: 'txs',
              value: 'Transactions',
              content: <TransactionHistory baseToken={BaseTokenInOraichain} quoteToken={QuoteTokenInOraichain} />
            }
          ]}
        />
      </div>

      {pairDenomsDeposit && (
        <AddLiquidityModal
          isOpen={!!pairDenomsDeposit}
          close={() => setPairDenomsDeposit('')}
          pairDenoms={pairDenomsDeposit}
        />
      )}
    </Content>
  );
};

export default PoolDetail;
