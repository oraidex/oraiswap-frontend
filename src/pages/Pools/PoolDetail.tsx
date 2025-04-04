import { MulticallQueryClient } from '@oraichain/common-contracts-sdk';
import { BTC_CONTRACT, fetchRetry, OraiIcon, toDisplay } from '@oraichain/oraidex-common';
import { useQueryClient } from '@tanstack/react-query';
import { isMobile } from '@walletconnect/browser-utils';
import AddIcon from 'assets/icons/Add.svg?react';
import BackIcon from 'assets/icons/ic_back.svg?react';
import classNames from 'classnames';
import { Button } from 'components/Button';
import Tabs from 'components/TabCustom';
import { formatNumberKMB, numberWithCommas } from 'helper/format';
import useConfigReducer from 'hooks/useConfigReducer';
import useLoadTokens from 'hooks/useLoadTokens';
import useTheme from 'hooks/useTheme';
import { network } from 'initCommon';
import Content from 'layouts/Content';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { updateLpPools } from 'reducer/token';
import { RootState } from 'store/configure';
import { PoolInfoResponse } from 'types/pool';
import styles from './PoolDetail.module.scss';
import { AddLiquidityModal } from './components/AddLiquidityModal';
import { Earning } from './components/Earning';
import { MyPoolInfo } from './components/MyPoolInfo/MyPoolInfo';
import { OverviewPool } from './components/OverviewPool';
import TransactionHistory from './components/TransactionHistory';
import { fetchLpPoolsFromContract, useGetPoolDetail, useGetPools } from './hooks';
import { useGetLpBalance } from './hooks/useGetLpBalance';
import { useGetPairInfo } from './hooks/useGetPairInfo';

const PoolDetail: React.FC = () => {
  const theme = useTheme();
  const isMobileMode = isMobile();
  let { poolUrl } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [address] = useConfigReducer('address');

  const poolDetailData = useGetPoolDetail({ pairDenoms: poolUrl }); // ok

  const loadTokenAmounts = useLoadTokens(); // ok

  const setCachedLpPools = (payload: LpPoolDetails) => dispatch(updateLpPools(payload)); // ok

  const pools = useGetPools();

  const { refetchPairAmountInfo, refetchLpTokenInfoData, pairAmountInfoData } = useGetPairInfo(poolDetailData);

  const { lpBalanceInfoData, refetchLpBalanceInfoData } = useGetLpBalance(poolDetailData);

  const lpAddresses = pools.map((pool) => pool.liquidityAddr);
  const queryClient = useQueryClient();
  const [pairDenomsDeposit, setPairDenomsDeposit] = useState('');
  const [ratioOraiBtc, setRatioOraiBtc] = useState(0);
  const lpTokenBalance = BigInt(lpBalanceInfoData?.balance || '0');

  const allOraichainTokens = useSelector((state: RootState) => state.token.allOraichainTokens || []);

  useEffect(() => {
    refetchAllLpPools();
  }, [lpAddresses]);

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

  const baseToken = (token1?.contractAddress || token1?.denom) === params.base_denom ? token1 : token2;
  const quoteToken = (token2?.contractAddress || token2?.denom) === params.base_denom ? token1 : token2;

  let BaseTokenIcon = OraiIcon;
  let QuoteTokenIcon = OraiIcon;
  const BaseTokenInOraichain = allOraichainTokens.find(
    (oraiTokens) =>
      [oraiTokens.denom, oraiTokens.contractAddress].filter(Boolean).includes(baseToken.contractAddress) ||
      [oraiTokens.denom, oraiTokens.contractAddress].filter(Boolean).includes(baseToken.denom)
  );
  const QuoteTokenInOraichain = allOraichainTokens.find(
    (oraiTokens) =>
      [oraiTokens.denom, oraiTokens.contractAddress].filter(Boolean).includes(quoteToken.contractAddress) ||
      [oraiTokens.denom, oraiTokens.contractAddress].filter(Boolean).includes(quoteToken.denom)
  );
  if (BaseTokenInOraichain)
    BaseTokenIcon = theme === 'light' ? BaseTokenInOraichain.iconLight : BaseTokenInOraichain.icon;
  if (QuoteTokenInOraichain)
    QuoteTokenIcon = theme === 'light' ? QuoteTokenInOraichain.iconLight : QuoteTokenInOraichain.icon;

  const isInactive = baseToken?.name === 'BTC (Legacy)' || quoteToken?.name === 'BTC (Legacy)';

  const listBTCAddresses = [
    BTC_CONTRACT,
    'factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/obtc'
  ];
  useEffect(() => {
    if (!poolDetailData) return;
    const { token2 } = poolDetailData;
    if (!token2) return;
    async function getOraiBtcAllocation() {
      const res = await fetchRetry(
        'https://lcd.orai.io/cosmos/bank/v1beta1/balances/orai1fv5kwdv4z0gvp75ht378x8cg2j7prlywa0g35qmctez9q8u4xryspn6lrd'
      );
      return await res.json();
    }

    if (listBTCAddresses.includes(token2.denom) || listBTCAddresses.includes(token2.contractAddress)) {
      getOraiBtcAllocation().then((data) => {
        const balances = data.balances;
        const oraiBalance = balances.find((item) => item.denom === 'orai');
        const btcBalance = balances.find(
          (item) => item.denom === 'factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/obtc'
        );
        const oraiBalanceDisplay = formatNumberKMB(toDisplay(oraiBalance?.amount || '0'), false);
        const btcBalanceDisplay = formatNumberKMB(toDisplay(btcBalance?.amount || '0', 14), false);
        setRatioOraiBtc(Number(oraiBalanceDisplay) / Number(btcBalanceDisplay));
      });
    }
  }, [poolDetailData]);

  return (
    <Content nonBackground otherBackground>
      <div className={styles.pool_detail}>
        <div className={styles.backWrapper}>
          <div className={styles.left}>
            <div
              className={styles.back}
              onClick={() => {
                navigate(-1);
              }}
            >
              <BackIcon className={styles.backIcon} />
              <div className={styles.info}>
                <div className={classNames(styles.icons, styles[theme])}>
                  <img style={{ borderRadius: '100%' }} src={BaseTokenIcon} alt="icon" width={30} height={30} />
                  <img style={{ borderRadius: '100%' }} src={QuoteTokenIcon} alt="icon" width={30} height={30} />
                </div>
                <span>
                  {baseToken?.name?.toUpperCase()} /{' '}
                  {quoteToken?.name === 'BTC (Legacy)' ? 'BTC' : quoteToken?.name?.toUpperCase()}
                </span>
                <span className={classNames(styles.tag)}>V2</span>
              </div>
            </div>

            <div className={styles.price}>
              {/* TODO: remove after pool close */}
              {ratioOraiBtc
                ? `1 ${baseToken?.name} = ${numberWithCommas(1 / (ratioOraiBtc || 1), undefined, {
                    maximumFractionDigits: 6
                  })}`
                : `1 ${baseToken?.name} = ${numberWithCommas(
                    toDisplay(pairAmountInfoData?.token2Amount, token2?.decimals, 0) /
                      toDisplay(pairAmountInfoData?.token1Amount, token1?.decimals, 0) || 0,
                    undefined,
                    {
                      maximumFractionDigits: 6
                    }
                  )}`}
              {/* TODO: remove after pool close */} {quoteToken?.name === 'BTC (Legacy)' ? 'BTC' : quoteToken?.name}
              {isMobileMode ? <br /> : <div className={styles.divider}>|</div>}1{' '}
              {quoteToken?.name === 'BTC (Legacy)' ? 'BTC' : quoteToken?.name} ={' '}
              {ratioOraiBtc
                ? `${numberWithCommas(ratioOraiBtc || 0, undefined, { maximumFractionDigits: 6 })} ${baseToken?.name}`
                : `${numberWithCommas(
                    toDisplay(pairAmountInfoData?.token1Amount, token1?.decimals, 0) /
                      toDisplay(pairAmountInfoData?.token2Amount, token2?.decimals, 0) || 0,
                    undefined,
                    { maximumFractionDigits: 6 }
                  )} ${baseToken?.name}`}
            </div>
          </div>
          <div className={styles.addPosition}>
            <Button
              disabled={!baseToken || !quoteToken || isInactive}
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
              ...poolDetailData
            }}
          />
        </div>

        <Tabs
          tabKey="tab"
          listTabs={[
            {
              id: 'LP',
              value: 'My Liquidity',
              content: (
                <>
                  <Earning onLiquidityChange={onLiquidityChange} />
                  <MyPoolInfo
                    myLpBalance={lpTokenBalance}
                    onLiquidityChange={onLiquidityChange}
                    isInactive={isInactive}
                  />
                </>
              )
            },
            {
              id: 'txs',
              value: 'Transactions',
              content: <TransactionHistory baseToken={baseToken} quoteToken={quoteToken} />
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
