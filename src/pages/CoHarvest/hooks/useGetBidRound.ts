import { fromBinary, toBinary } from '@cosmjs/cosmwasm-stargate';
import { MulticallQueryClient } from '@oraichain/common-contracts-sdk';
// TODO: init OraidexCommon
import { BigDecimal, oraichainTokens, toDisplay } from '@oraichain/oraidex-common';
import { CoharvestBidPoolQueryClient } from '@oraichain/oraidex-contracts-sdk';
import { useQuery } from '@tanstack/react-query';
import { network } from 'config/networks';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import { getUsd } from 'libs/utils';
import { useEffect, useState } from 'react';
import { fetchRoundBid } from 'rest/api';
import { BidStatus, TIMER } from '../constants';
import { Bid, BiddingInfo, BiddingInfoResponse } from '@oraichain/oraidex-contracts-sdk/build/CoharvestBidPool.types';

export const getDateNowToSecond = () => {
  return Math.floor(Date.now() / TIMER.MILLISECOND);
};

export const useGetRound = () => {
  const [round, setRound] = useState(0);

  const queryRoundBid = async () => {
    try {
      const currentRound = await fetchRoundBid();

      const prevRound = Number(currentRound) - 1;
      const coHavestBidPool = new CoharvestBidPoolQueryClient(window.client, network.bid_pool);
      const currentBid = await coHavestBidPool.biddingInfo({
        round: +currentRound
      });

      const now = Date.now();

      if (
        !(prevRound >= 0 && currentBid?.bid_info?.round && now < currentBid?.bid_info?.start_time * TIMER.MILLISECOND)
      ) {
        setRound(currentRound as number);
        return;
      }

      const prevBid = await coHavestBidPool.biddingInfo({
        round: prevRound
      });

      if (prevBid?.bid_info?.end_time * TIMER.MILLISECOND >= now) {
        setRound(prevRound);
        return;
      }
      setRound(currentRound as number);
    } catch (error) {
      console.log('error queryRoundBid >>', error);
    }
  };

  useEffect(() => {
    queryRoundBid();
  }, []);

  return round;
};

export const useGetBidding = (round: number) => {
  const getBiddingInfo = async () => {
    const coHavestBidPool = new CoharvestBidPoolQueryClient(window.client, network.bid_pool);
    const data = await coHavestBidPool.biddingInfo({
      round
    });
    return data;
  };

  const {
    data: biddingInfo,
    isLoading,
    refetch: refetchBiddingInfo
  } = useQuery(['bidding-info', round], () => getBiddingInfo(), {
    refetchOnWindowFocus: false,
    placeholderData: {
      bid_info: {
        round: 0,
        start_time: getDateNowToSecond(),
        end_time: getDateNowToSecond(),
        total_bid_amount: '0',
        total_bid_matched: '0'
      },
      distribution_info: {
        total_distribution: '0',
        exchange_rate: '0',
        is_released: false,
        actual_distributed: '0',
        num_bids_distributed: 0
      }
    },
    enabled: !!round
  });

  return { biddingInfo, isLoading, refetchBiddingInfo };
};

export const useGetBiddingFilter = (round: number) => {
  const getBiddingInfo = async () => {
    const coHavestBidPool = new CoharvestBidPoolQueryClient(window.client, network.bid_pool);
    const data = await coHavestBidPool.biddingInfo({
      round
    });

    return data;
  };

  const {
    data: biddingInfo,
    isLoading,
    refetch: refetchBiddingInfo
  } = useQuery(['bidding-info-filter', round], () => getBiddingInfo(), {
    refetchOnWindowFocus: false,
    placeholderData: {
      bid_info: {
        round: 0,
        start_time: getDateNowToSecond(),
        end_time: getDateNowToSecond(),
        total_bid_amount: '0',
        total_bid_matched: '0'
      },
      distribution_info: {
        total_distribution: '0',
        exchange_rate: '0',
        is_released: false,
        actual_distributed: '0',
        num_bids_distributed: 0
      }
    },
    enabled: !!round
  });

  return { biddingInfo, isLoading, refetchBiddingInfo };
};

export const useGetListBiddingRoundInfo = (round: number) => {
  const roundArr = [...new Array(round).keys()].map((item) => item + 1);

  const getListHistoryRound = async () => {
    const multicall = new MulticallQueryClient(window.client, network.multicall);

    const calls = roundArr.map((round) => {
      return {
        address: network.bid_pool,
        data: toBinary({
          bidding_info: {
            round
          }
        })
      };
    });

    const chunks = [];
    const MAX_CHUNK_SIZE = 30;

    for (let i = 0; i < roundArr.length; i += MAX_CHUNK_SIZE) {
      chunks.push(calls.slice(i, i + MAX_CHUNK_SIZE));
    }

    const result = (await Promise.all(chunks.map((chunk) => multicall.tryAggregate({ queries: chunk })))) as any;
    const res = result.flatMap((item) => item.return_data.map((data) => data));

    return roundArr.map((round, ind) => {
      if (!res[ind]?.success) {
        return {
          bid_info: {
            round,
            start_time: getDateNowToSecond(),
            end_time: getDateNowToSecond(),
            total_bid_amount: '0',
            total_bid_matched: '0'
          },
          distribution_info: {
            total_distribution: '0',
            exchange_rate: '0',
            is_released: false,
            actual_distributed: '0',
            num_bids_distributed: 0
          }
        };
      }
      const response: BiddingInfoResponse = fromBinary(res[ind].data);
      return response;
    });
  };

  const {
    data: listBiddingRoundInfo,
    isLoading,
    refetch: refetchListBiddingRoundInfo
  } = useQuery(['ListBiddingRoundInfo-history', round], () => getListHistoryRound(), {
    refetchOnWindowFocus: false,
    placeholderData: roundArr.map((round) => {
      return {
        bid_info: {
          round,
          start_time: getDateNowToSecond(),
          end_time: getDateNowToSecond(),
          total_bid_amount: '0',
          total_bid_matched: '0'
        },
        distribution_info: {
          total_distribution: '0',
          exchange_rate: '0',
          is_released: false,
          actual_distributed: '0',
          num_bids_distributed: 0
        }
      };
    }),
    enabled: !!round
  });

  console.log({
    listBiddingRoundInfo
  });

  return { listBiddingRoundInfo, isLoading, refetchListBiddingRoundInfo };
};

export const useGetAllBidPoolInRound = (round: number) => {
  const getAllBidPoolRound = async () => {
    const coHarvestBidPool = new CoharvestBidPoolQueryClient(window.client, network.bid_pool);
    const data = await coHarvestBidPool.allBidPoolInRound({
      round
    });
    return data;
  };

  const {
    data: allBidPoolRound,
    isFetching,
    refetch: refetchAllBidPoolRound
  } = useQuery(['all-bid-pool-round', round], () => getAllBidPoolRound(), {
    refetchOnWindowFocus: false,
    placeholderData: [],
    enabled: !!round
  });

  const sortedBidPoolRound = [...(allBidPoolRound || [])];

  sortedBidPoolRound?.sort((a, b) => toDisplay(b.total_bid_amount) - toDisplay(a.total_bid_amount));

  const maxTotalAmount = sortedBidPoolRound[0]?.total_bid_amount;

  const formattedBidPoolRound = allBidPoolRound.map((bid) => {
    const percentage = (toDisplay(bid.total_bid_amount) / toDisplay(maxTotalAmount)) * 100;

    return {
      ...bid,
      percentage
    };
  });

  return { allBidPoolRound: formattedBidPoolRound, isLoading: isFetching, refetchAllBidPoolRound };
};

export const useGetPotentialReturn = (props: {
  bidAmount: string;
  exchangeRate: string;
  round: number;
  slot: number;
}) => {
  const { bidAmount, exchangeRate, round, slot } = props;
  const getPotentialReturn = async () => {
    const coHarvestBidPool = new CoharvestBidPoolQueryClient(window.client, network.bid_pool);
    const data = await coHarvestBidPool.estimateAmountReceive({
      bidAmount,
      exchangeRate,
      round,
      slot
    });

    return data;
  };

  const {
    data: potentialReturn,
    isLoading,
    refetch: refetchPotentialReturn
  } = useQuery(['potential-return-info-bid', bidAmount, round], () => getPotentialReturn(), {
    refetchOnWindowFocus: false,
    placeholderData: {
      receive: '0',
      residue_bid: '0'
    },
    enabled: !!bidAmount && !!round
  });

  return { potentialReturn, isLoading, refetchPotentialReturn };
};

export const useGetBidHistoryWithPotentialReturn = (props: {
  exchangeRate: string;
  listBidHistories: Bid[];
  biddingInfo: BiddingInfoResponse;
  prices: CoinGeckoPrices<string>;
}) => {
  const { listBidHistories, exchangeRate, biddingInfo, prices } = props;
  const ORAIX_TOKEN_INFO = oraichainTokens.find((e) => e.coinGeckoId === 'oraidex');
  const USDC_TOKEN_INFO = oraichainTokens.find((e) => e.coinGeckoId === 'usd-coin');
  const now = Date.now();

  const getListPotentialReturn = async () => {
    const multicall = new MulticallQueryClient(window.client, network.multicall);
    const res = await multicall.aggregate({
      queries: listBidHistories.map((bid) => ({
        address: network.bid_pool,
        data: toBinary({
          estimate_amount_receive: {
            bid_amount: bid.amount,
            exchange_rate: exchangeRate,
            round: bid.round,
            slot: bid.premium_slot
          }
        })
      }))
    });

    return listBidHistories.map((bid, ind) => {
      if (!res.return_data[ind].success) {
        return {
          ...bid,
          potentialReturnUSD: '0',
          amountUSD: '0',
          estimate_receive: '0',
          estimate_residue_bid: '0',
          status: BidStatus.BIDDING
        };
      }

      const response = fromBinary(res.return_data[ind].data);

      // get status
      const isRunningRound =
        !bid.is_distributed || // case: chưa chia reward
        now <= biddingInfo.bid_info.end_time * TIMER.MILLISECOND; // case: time now < time end

      const estimateReceive = isRunningRound ? response?.receive || '0' : bid.amount_received || '0';
      const estimateResidueBid = isRunningRound ? response?.residue_bid || '0' : bid.residue_bid || '0';
      const pricesToken = isRunningRound
        ? prices
        : { oraidex: Number(biddingInfo.distribution_info.exchange_rate), 'usd-coin': prices['usd-coin'] };

      const returnAmountUsd = getUsd(estimateReceive, USDC_TOKEN_INFO, pricesToken);
      const residueBidAmountUsd = getUsd(estimateResidueBid, ORAIX_TOKEN_INFO, pricesToken);

      const potentialReturnUSD = new BigDecimal(returnAmountUsd).add(residueBidAmountUsd).toNumber();

      const amountUSD = getUsd(bid.amount || '0', ORAIX_TOKEN_INFO, pricesToken);

      let status = BidStatus.BIDDING;
      let percent = 0;
      if (isRunningRound) {
        status = BidStatus.BIDDING;
      } else if (estimateReceive === '0') {
        status = BidStatus.DRAW;
      } else {
        status = BidStatus.WIN;
        percent = new BigDecimal(new BigDecimal(bid.amount || '0').sub(estimateResidueBid))
          .div(bid.amount)
          .mul(100)
          .toNumber();
      }

      return {
        ...bid,
        potentialReturnUSD,
        estimateReceive,
        estimateResidueBid,
        status,
        percent,
        amountUSD
      };
    });
  };

  const {
    data: listPotentialReturn,
    isFetching,
    refetch: refetchPotentialReturn
  } = useQuery(
    ['all-potential-return', listBidHistories, biddingInfo?.bid_info.end_time, biddingInfo?.bid_info.round],
    () => getListPotentialReturn(),
    {
      refetchOnWindowFocus: false,
      placeholderData: [],
      enabled: !!listBidHistories?.length && !!biddingInfo?.bid_info.end_time && !!biddingInfo?.bid_info.round
    }
  );

  return { listPotentialReturn, isLoading: isFetching, refetchPotentialReturn };
};

export const useGetHistoryBid = (round: number) => {
  const [address] = useConfigReducer('address');
  const getHistoryBidPool = async () => {
    const coHarvestBidPool = new CoharvestBidPoolQueryClient(window.client, network.bid_pool);
    const data = await coHarvestBidPool.bidsByUser({
      round,
      user: address
    });
    return data;
  };

  const {
    data: historyBidPool,
    isLoading,
    refetch: refetchHistoryBidPool
  } = useQuery(['history-bid-pool', round, address], () => getHistoryBidPool(), {
    refetchOnWindowFocus: false,
    placeholderData: [],
    enabled: !!round && !!address
  });

  return { historyBidPool, isLoading, refetchHistoryBidPool };
};

export const useGetAllBids = (
  round: number,
  biddingInfo: BiddingInfoResponse,
  prices: CoinGeckoPrices<string>,
  exchangeRate: string
) => {
  const ORAIX_TOKEN_INFO = oraichainTokens.find((e) => e.coinGeckoId === 'oraidex');
  const now = Date.now();

  const getHistoryBidPool = async () => {
    const coHarvestBidPool = new CoharvestBidPoolQueryClient(window.client, network.bid_pool);
    const data = await coHarvestBidPool.allBidInRound({
      round,
      // limit: 1000,
      startAfter: null
    });

    const multicall = new MulticallQueryClient(window.client, network.multicall);

    const res = await multicall.aggregate({
      queries: data.map((bidId) => ({
        address: network.bid_pool,
        data: toBinary({
          bid: {
            idx: bidId
          }
        })
      }))
    });

    return data.map((bid, ind) => {
      if (!res.return_data[ind].success) {
        return {
          ...bid
        };
      }
      const response = fromBinary(res.return_data[ind].data);

      // get status
      const isRunningRound = !response.is_distributed || now <= biddingInfo.bid_info.end_time * TIMER.MILLISECOND;

      const pricesToken = isRunningRound ? prices : { oraidex: Number(biddingInfo.distribution_info.exchange_rate) };

      const amountUSD = getUsd(response.amount || '0', ORAIX_TOKEN_INFO, pricesToken);

      return { ...response, amountUSD };
    });
  };

  const {
    data: historyAllBidPool,
    isFetching,
    refetch: refetchAllHistoryBidPool
  } = useQuery(['history-bid-pool-all', round], () => getHistoryBidPool(), {
    refetchOnWindowFocus: false,
    placeholderData: [],
    enabled: !!round && !!biddingInfo?.bid_info.round
  });

  return { historyAllBidPool, isLoading: isFetching, refetchAllHistoryBidPool };
};
