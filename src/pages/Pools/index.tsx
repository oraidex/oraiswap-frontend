import { CW20_DECIMALS, OraiIcon, TokenItemType, toDisplay } from '@oraichain/oraidex-common';
import { isMobile } from '@walletconnect/browser-utils';
import useConfigReducer from 'hooks/useConfigReducer';
import useTheme from 'hooks/useTheme';
import isEqual from 'lodash/isEqual';
import React, { useState } from 'react';
import { PoolInfoResponse } from 'types/pool';
import NewTokenModal from './NewTokenModal/NewTokenModal';
import { Filter } from './components/Filter';
import { Header } from './components/Header';
import { ListPools } from './components/ListPool';
import { ListPoolsMobile } from './components/ListPoolMobile';
import { getSymbolPools, parseAssetOnlyDenom, reverseSymbolArr } from './helpers';
import {
  useFetchCacheRewardAssetForAllPools,
  useFetchLpPoolsV3,
  useGetMyStake,
  useGetPools,
  useGetPoolsWithClaimableAmount,
  useGetRewardInfo
} from './hooks';
import styles from './index.module.scss';
import { oraichainTokensWithIcon } from 'initCommon';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configure';

export type PoolTableData = PoolInfoResponse & {
  reward: string[];
  myStakedLP: number;
  earned: number;
  claimable: number;
  baseToken: TokenItemType;
  quoteToken: TokenItemType;
};

const Pools: React.FC<{}> = () => {
  const [isOpenNewTokenModal, setIsOpenNewTokenModal] = useState(false);
  const [filteredPools, setFilteredPools] = useState<PoolInfoResponse[]>([]);

  const [address] = useConfigReducer('address');
  const theme = useTheme();
  const mobileMode = isMobile();

  const pools = useGetPools();
  const lpAddresses = pools.map((pool) => pool.liquidityAddr);
  useFetchCacheRewardAssetForAllPools(lpAddresses);
  useFetchLpPoolsV3(lpAddresses);
  const allOraichainTokens = useSelector((state: RootState) => state.token.allOraichainTokens);

  const { myStakes } = useGetMyStake({
    stakerAddress: address
  });
  const { totalRewardInfoData } = useGetRewardInfo({
    stakerAddr: address
  });

  const listClaimableData = useGetPoolsWithClaimableAmount({
    poolTableData: filteredPools,
    totalRewardInfoData
  });

  const [cachedReward] = useConfigReducer('rewardPools');

  const poolTableData: PoolTableData[] = filteredPools
    .map((pool) => {
      const { liquidityAddr: stakingToken, totalSupply, totalLiquidity, firstAssetInfo, secondAssetInfo } = pool;
      let poolReward = {
        reward: []
      };
      if (cachedReward && cachedReward.length > 0) {
        poolReward = cachedReward.find((item) => item.liquidity_token === stakingToken);
      }

      // calculate my stake in usdt, we calculate by bond_amount from contract and totalLiquidity from backend.
      const myStakedLP = stakingToken
        ? totalRewardInfoData?.reward_infos.find((item) => isEqual(item.staking_token, stakingToken))?.bond_amount ||
          '0'
        : 0;
      const lpPrice = Number(totalSupply) ? totalLiquidity / Number(totalSupply) : 0;
      const myStakeLPInUsdt = +myStakedLP * lpPrice;

      const earned = stakingToken
        ? myStakes.find((item) => item.stakingAssetDenom === stakingToken)?.earnAmountInUsdt || 0
        : 0;

      const [baseDenom, quoteDenom] = [
        parseAssetOnlyDenom(JSON.parse(firstAssetInfo)),
        parseAssetOnlyDenom(JSON.parse(secondAssetInfo))
      ];
      const [baseToken, quoteToken] = [baseDenom, quoteDenom].map((denom) =>
        allOraichainTokens.find((token) => token.denom === denom || token.contractAddress === denom)
      );
      const symbols = getSymbolPools(baseDenom, quoteDenom, pool.symbols);
      // calc claimable of each pool
      const claimableAmount = listClaimableData.find((e) => isEqual(e.liquidityAddr, stakingToken));

      return {
        ...pool,
        reward: poolReward?.reward ?? [],
        myStakedLP: toDisplay(BigInt(Math.trunc(myStakeLPInUsdt)), CW20_DECIMALS),
        earned: toDisplay(BigInt(Math.trunc(earned)), CW20_DECIMALS),
        baseToken,
        quoteToken,
        symbols,
        claimable: claimableAmount?.amountEachPool || 0
      };
    })
    .sort((poolA, poolB) => {
      return poolB.totalLiquidity - poolA.totalLiquidity;
    });

  const generateIcon = (baseToken: TokenItemType, quoteToken: TokenItemType): JSX.Element => {
    let [BaseTokenIcon, QuoteTokenIcon] = [OraiIcon, OraiIcon];

    if (baseToken) BaseTokenIcon = theme === 'light' ? baseToken.iconLight : baseToken.icon;
    if (quoteToken) QuoteTokenIcon = theme === 'light' ? quoteToken.iconLight : quoteToken.icon;

    // TODO: hardcode reverse logo for ORAI/INJ,USDC/ORAIX, need to update later
    const isReverseLogo = reverseSymbolArr.some(
      (item) => item[0].coinGeckoId === baseToken?.coinGeckoId && item[1].coinGeckoId === quoteToken?.coinGeckoId
    );
    if (isReverseLogo) {
      return (
        <div className={styles.symbols}>
          <img width={32} height={32} src={QuoteTokenIcon} className={styles.symbols_logo_left} alt="" />
          <img width={32} height={32} src={BaseTokenIcon} className={styles.symbols_logo_right} alt="" />
        </div>
      );
    }

    return (
      <div className={styles.symbols}>
        <img width={32} height={32} src={BaseTokenIcon} className={styles.symbols_logo_left} alt="" />
        <img width={32} height={32} src={QuoteTokenIcon} className={styles.symbols_logo_right} alt="" />
      </div>
    );
  };

  return (
    // <Content nonBackground otherBackground>
    <div className={styles.pools}>
      <Header dataSource={pools} />
      <div>
        <Filter setFilteredPools={setFilteredPools} pools={pools} setIsOpenNewTokenModal={setIsOpenNewTokenModal} />
        {mobileMode ? (
          <ListPoolsMobile poolTableData={poolTableData} generateIcon={generateIcon} />
        ) : (
          <ListPools poolTableData={poolTableData} generateIcon={generateIcon} />
        )}
      </div>

      {/* <NewPoolModal
          isOpen={isOpenNewPoolModal}
          open={() => setIsOpenNewPoolModal(true)}
          close={() => setIsOpenNewPoolModal(false)}
        /> */}
      <NewTokenModal
        isOpen={isOpenNewTokenModal}
        open={() => setIsOpenNewTokenModal(true)}
        close={() => setIsOpenNewTokenModal(false)}
      />
    </div>
    // </Content>
  );
};

export default Pools;
