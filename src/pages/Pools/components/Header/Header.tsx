import { ExecuteInstruction } from '@cosmjs/cosmwasm-stargate';
import { CW20_DECIMALS, ORAI, ORAI_INFO, USDT_CONTRACT, toDecimal, toDisplay } from '@oraichain/oraidex-common';
import { Button } from 'components/Button';
import Loader from 'components/Loader';
import { TToastType, displayToast } from 'components/Toasts/Toast';
import TokenBalance from 'components/TokenBalance';
import { network } from 'config/networks';
import { handleErrorTransaction } from 'helper';
import useConfigReducer from 'hooks/useConfigReducer';
import useTheme from 'hooks/useTheme';
import CosmJs from 'libs/cosmjs';
import { useGetMyStake, useGetPools, useGetRewardInfo, useGetTotalClaimable } from 'pages/Pools/hooks';
import { FC, useEffect, useState } from 'react';
import { FILTER_DAY } from 'reducer/type';
import { PoolInfoResponse } from 'types/pool';
import styles from './Header.module.scss';

export const useGetOraiPrice = () => {
  const pools = useGetPools();
  const [oraiPrice, setOraiPrice] = useState(0);

  useEffect(() => {
    if (pools.length === 0) return;

    const oraiUsdtPool = pools.find(
      (pool) =>
        pool.firstAssetInfo === JSON.stringify(ORAI_INFO) &&
        pool.secondAssetInfo ===
          JSON.stringify({
            token: {
              contract_addr: USDT_CONTRACT
            }
          })
    );
    if (!oraiUsdtPool) return;

    const oraiPrice = toDecimal(BigInt(oraiUsdtPool.askPoolAmount), BigInt(oraiUsdtPool.offerPoolAmount));
    setOraiPrice(oraiPrice);
  }, [pools.length]);

  return oraiPrice;
};

export const Header: FC<{ dataSource: PoolInfoResponse[] }> = ({ dataSource }) => {
  const theme = useTheme();
  const [address] = useConfigReducer('address');
  const { totalStaked, totalEarned } = useGetMyStake({
    stakerAddress: address
  });
  const { totalRewardInfoData, refetchRewardInfo } = useGetRewardInfo({ stakerAddr: address });

  const [claimLoading, setClaimLoading] = useState(false);
  const totalClaimable = useGetTotalClaimable({ poolTableData: dataSource, totalRewardInfoData });

  // const isMobileMode = isMobile();
  // const oraiPrice = useGetOraiPrice();
  // const [openChart, setOpenChart] = useState(!isMobileMode);
  // const [filterDay, setFilterDay] = useState(FILTER_DAY.DAY);
  // const [liquidityDataChart, setLiquidityDataChart] = useState(0);
  // const [volumeDataChart, setVolumeDataChart] = useState(0);

  // const ORAI_INFO = {
  //   name: 'Orai Price',
  //   Icon: theme === 'light' ? OraiLightIcon : OraiIcon,
  //   suffix: -2.25,
  //   value: oraiPrice,
  //   isNegative: true,
  //   decimal: 2
  // };

  // const liquidityData = [
  //   {
  //     name: 'Total Liquidity',
  //     Icon: null,
  //     suffix: 5.25,
  //     value: liquidityDataChart, // || statisticData.totalLiquidity,
  //     isNegative: false,
  //     decimal: 2,
  //     chart: <LiquidityChart filterDay={filterDay} onUpdateCurrentItem={setLiquidityDataChart} />,
  //     openChart: openChart
  //   },
  //   {
  //     name: 'Volume',
  //     Icon: null,
  //     suffix: 3.93,
  //     value: volumeDataChart, // || statisticData.volume,
  //     isNegative: false,
  //     decimal: 2,
  //     chart: <VolumeChart filterDay={filterDay} onUpdateCurrentItem={setVolumeDataChart} />,
  //     openChart: openChart
  //   }
  // ];

  const handleClaimAllRewards = async () => {
    setClaimLoading(true);
    displayToast(TToastType.TX_BROADCASTING);
    try {
      const msgs = totalRewardInfoData.reward_infos
        .filter((rewardInfo) => rewardInfo.pending_reward !== '0' || rewardInfo.pending_withdraw?.length > 0)
        .map(
          (rewardInfo) =>
            ({
              contractAddress: network.staking,
              msg: { withdraw: { staking_token: rewardInfo.staking_token } },
              funds: null
            } as ExecuteInstruction)
        );

      const result = await CosmJs.executeMultiple({
        msgs,
        walletAddr: address,
        gasAmount: { denom: ORAI, amount: '0' }
      });

      if (result) {
        displayToast(TToastType.TX_SUCCESSFUL, {
          customLink: `${network.explorer}/txs/${result.transactionHash}`
        });
        refetchRewardInfo();
      }
    } catch (error) {
      console.log('error when claim all reward: ', error);
      handleErrorTransaction(error);
    } finally {
      setClaimLoading(false);
    }
  };

  const disabledClaimBtn = !totalClaimable || claimLoading;
  return (
    <div className={styles.header}>
      {/* <div className={styles.header_title}>
        <div className={styles.header_title_text}>
          <div>
            <ORAI_INFO.Icon />
          </div>
          <span className={styles.priceOrai}>ORAI Price</span>
          <TokenBalance
            balance={ORAI_INFO.value}
            prefix="$"
            className={styles.liq_value}
            decimalScale={ORAI_INFO.decimal || 6}
          />
        </div>
        <div className={styles.filter_day_wrapper}>
          {LIST_FILTER_DAY.map((e) => {
            return (
              <button
                key={'day-key-' + e.label}
                className={`${styles.filter_day}${' '}${e.value === filterDay ? styles.active : ''}`}
                onClick={() => setFilterDay(e.value)}
              >
                {e.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.header_liquidity}>
        {liquidityData.map((e) => (
          <div key={e.name} className={`${styles.header_liquidity_item} ${openChart ? styles.activeChart : ''}`}>
            <div className={styles.info} onClick={() => setOpenChart((open) => !open)}>
              <div className={styles.content}>
                <span>{e.name}</span>
                <div className={styles.header_liquidity_item_info}>
                  {e.Icon && (
                    <div>
                      <e.Icon />
                    </div>
                  )}
                  <TokenBalance
                    balance={e.value}
                    prefix="$"
                    className={styles.liq_value}
                    decimalScale={e.decimal || 6}
                  />
                </div>
              </div>
              <div>{openChart ? <UpIcon /> : <DownIcon />}</div>
            </div>
            <div className={`${styles.chart} ${openChart ? styles.active : ''}`}>{e.chart}</div>
          </div>
        ))}
      </div> */}
      <div className={styles.header_claimable}>
        <div className={styles.header_data}>
          <div className={styles.header_data_item}>
            <span className={styles.header_data_name}>Total Staked LP</span>
            <br />
            <TokenBalance
              balance={toDisplay(BigInt(Math.trunc(totalStaked)), CW20_DECIMALS)}
              prefix="$"
              className={styles.header_data_value}
              decimalScale={4}
            />
          </div>
          <div className={styles.header_data_item}>
            <span className={styles.header_data_name}>Total Earned</span>
            <br />
            <TokenBalance
              balance={toDisplay(BigInt(Math.trunc(totalEarned)), CW20_DECIMALS)}
              prefix="$"
              className={styles.header_data_value}
              decimalScale={4}
            />
          </div>
          <div className={styles.header_data_item}>
            <span className={styles.header_data_name}>Total Claimable Rewards</span>
            <br />
            <span className={styles.header_data_value}>
              <TokenBalance
                balance={totalClaimable}
                prefix="+$"
                className={styles.header_data_value}
                decimalScale={4}
              />
            </span>
          </div>
        </div>
        <div className={styles.header_claim_reward}>
          <div className={styles.claim_reward_bg}></div>
          <Button
            type="primary-sm"
            disabled={disabledClaimBtn}
            onClick={() => handleClaimAllRewards()}
            icon={claimLoading ? <Loader width={20} height={20} /> : null}
          >
            Claim All Rewards
          </Button>
        </div>
      </div>
    </div>
  );
};

export const LIST_FILTER_DAY = [
  {
    label: 'D',
    value: FILTER_DAY.DAY
  },
  {
    label: 'W',
    value: FILTER_DAY.WEEK
  },
  {
    label: 'M',
    value: FILTER_DAY.MONTH
  }
];
