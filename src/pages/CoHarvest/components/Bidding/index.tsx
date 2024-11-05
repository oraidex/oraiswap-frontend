import { toBinary } from '@cosmjs/cosmwasm-stargate';
import { BigDecimal, ORAIX_CONTRACT, oraichainTokens, toAmount, toDisplay, tokenMap } from '@oraichain/oraidex-common';
import { OraiswapRouterQueryClient } from '@oraichain/oraidex-contracts-sdk';
import TooltipIcon from 'assets/icons/icon_tooltip.svg?react';
import OraiXIcon from 'assets/icons/oraix.svg?react';
import OraiXLightIcon from 'assets/icons/oraix_light.svg?react';
import UsdcIcon from 'assets/icons/usd_coin.svg?react';
import { Button } from 'components/Button';
import Loader from 'components/Loader';
import { TToastType, displayToast } from 'components/Toasts/Toast';
import { network } from 'config/networks';
import { getTransactionUrl, handleErrorTransaction } from 'helper';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import { useDebounce } from 'hooks/useDebounce';
import { useLoadOraichainTokens } from 'hooks/useLoadTokens';
import { getUsd } from 'libs/utils';
import { INIT_AMOUNT_SIMULATE, TIMER } from 'pages/CoHarvest/constants';
import {
  useGetAllBidPoolInRound,
  useGetBidding,
  useGetHistoryBid,
  useGetPotentialReturn
} from 'pages/CoHarvest/hooks/useGetBidRound';
import { formatDisplayUsdt, numberWithCommas } from 'pages/Pools/helpers';
import { useSimulate } from 'pages/UniversalSwap/Swap/hooks';
import { memo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configure';
import InputBalance from '../InputBalance';
import InputRange from '../InputRange';
import styles from './index.module.scss';

export type BiddingProps = {
  openExplainModal: () => void;
  isEnd: boolean;
  round: number;
  isStarted: boolean;
  isCurrentRound: boolean;
  backToCurrentRound: () => void;
};

const Bidding = ({ openExplainModal, isEnd, round, isStarted, isCurrentRound, backToCurrentRound }: BiddingProps) => {
  const [range, setRange] = useState(1);
  const [amount, setAmount] = useState();
  const amounts = useSelector((state: RootState) => state.token.amounts);
  const { data: prices } = useCoinGeckoPrices();
  const loadOraichainToken = useLoadOraichainTokens();
  const balance = amounts['oraix'];
  const ORAIX_TOKEN_INFO = oraichainTokens.find((e) => e.coinGeckoId === 'oraidex');
  const USDC_TOKEN_INFO = oraichainTokens.find((e) => e.coinGeckoId === 'usd-coin');

  const originalFromToken = tokenMap['oraix'];
  const originalToToken = tokenMap['usdc'];
  const routerClient = new OraiswapRouterQueryClient(window.client, network.router);

  const amountUsd = getUsd(toAmount(amount), ORAIX_TOKEN_INFO, prices);
  const [address] = useConfigReducer('address');
  const rangeDebounce = useDebounce(range, TIMER.HAFT_MILLISECOND);
  const [loading, setLoading] = useState(false);
  const [theme] = useConfigReducer('theme');

  const { refetchAllBidPoolRound } = useGetAllBidPoolInRound(round);
  const { refetchHistoryBidPool } = useGetHistoryBid(round);
  const { refetchBiddingInfo } = useGetBidding(round);
  const { simulateData: averageRatio } = useSimulate(
    'simulate-average-data-co-harvest',
    ORAIX_TOKEN_INFO,
    USDC_TOKEN_INFO,
    originalFromToken,
    originalToToken,
    routerClient,
    INIT_AMOUNT_SIMULATE
  );

  const { potentialReturn, refetchPotentialReturn } = useGetPotentialReturn({
    bidAmount: toAmount(amount).toString(),
    exchangeRate: new BigDecimal(averageRatio?.displayAmount || 0).div(INIT_AMOUNT_SIMULATE).toString(),
    round: round,
    slot: range
  });

  useEffect(() => {
    refetchPotentialReturn();
  }, [rangeDebounce]);

  const estimateReceive = potentialReturn?.receive || '0';
  const estimateResidueBid = potentialReturn?.residue_bid || '0';

  const returnAmountUsd = getUsd(estimateReceive, USDC_TOKEN_INFO, prices);
  const residueBidAmountUsd = getUsd(estimateResidueBid, ORAIX_TOKEN_INFO, prices);

  const potentialReturnUSD = new BigDecimal(returnAmountUsd).add(residueBidAmountUsd).toNumber();

  const insufficientFund = amount && amount > toDisplay(balance);

  const coingeckoOraixPrice = prices[ORAIX_TOKEN_INFO.coinGeckoId] || '0';

  if (!isCurrentRound) {
    return (
      <div className={`${styles.bidding} ${styles.inPast}`}>
        <div className={styles.title}>
          <span>ROUND #{round}</span>
        </div>

        <div className={styles.contentPast}>
          <span>This round has ended. Please proceed to the current round to place your bid.</span>
          <Button type="primary" onClick={() => backToCurrentRound()}>
            Go to Current round
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bidding}>
      <div className={styles.title}>
        <span>ROUND #{round}</span>
        <div className={styles.priceOraix}>
          <div>{theme === 'light' ? <OraiXLightIcon /> : <OraiXIcon />}</div>
          <span className={styles.price}>{formatDisplayUsdt(coingeckoOraixPrice)}</span>
        </div>
      </div>
      <div className={styles.content}>
        <InputBalance balance={balance} amount={amount} onChangeAmount={setAmount} />
        <div className={styles.interest}>
          <div className={styles.interestTitle}>
            Select Pool <span className={styles.note}>(Bonus)</span>
          </div>
          <InputRange className={styles.range} value={range} onChange={(value) => setRange(+value)} />
          <div className={styles.explain}>
            Selecting this pool also means you will get a {range}% bonus on your rewards if your bid wins.
          </div>
        </div>
      </div>
      <div className={styles.info}>
        <div className={styles.bidValue}>
          <span>Bid value</span>
          <div className={styles.usd}>{formatDisplayUsdt(amountUsd)}</div>
        </div>

        <div className={styles.return}>
          <div className={styles.total}>
            <span>Potential return</span>
            <div className={styles.usdReturn}>{formatDisplayUsdt(potentialReturnUSD)}</div>
          </div>

          <div className={styles.divider}></div>
          <div className={styles.value}>
            <div className={styles.balance}>
              <div>Rewards with Bonus</div>
              <div className={styles.priceValue}>
                <UsdcIcon />
                <span>{numberWithCommas(toDisplay(estimateReceive))} USDC</span>
              </div>
            </div>
            <div className={styles.balance}>
              <div>Refund</div>
              <div className={styles.priceValue}>
                {theme === 'light' ? <OraiXLightIcon /> : <OraiXIcon />}
                <span>{numberWithCommas(toDisplay(estimateResidueBid))} ORAIX</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.calcExplain}>
          <div>
            <TooltipIcon onClick={openExplainModal} width={20} height={20} />
          </div>
          <span onClick={openExplainModal}>How are my returns calculated?</span>
        </div>
      </div>
      <div className={styles.button}>
        <Button
          type="primary"
          onClick={async () => {
            setLoading(true);
            try {
              const result = await window.client.execute(
                address,
                ORAIX_CONTRACT,
                {
                  send: {
                    contract: network.bid_pool,
                    amount: toAmount(amount).toString(),
                    msg: toBinary({
                      submit_bid: {
                        premium_slot: range,
                        round
                      }
                    })
                  }
                },
                'auto'
              );
              if (result?.transactionHash) {
                displayToast(TToastType.TX_SUCCESSFUL, {
                  customLink: getTransactionUrl(network.chainId, result.transactionHash)
                });
                refetchAllBidPoolRound();
                refetchHistoryBidPool();
                refetchBiddingInfo();
                loadOraichainToken(address, [ORAIX_TOKEN_INFO.contractAddress]);
                // setAmount(undefined);
                // setRange(1);
              }
            } catch (error) {
              console.log({ error });
              handleErrorTransaction(error, {
                tokenName: 'ORAIX',
                chainName: network.chainId
              });
            } finally {
              setLoading(false);
            }
          }}
          icon={null}
          disabled={!isStarted || isEnd || loading || !amount || insufficientFund} // || !Number(estimateReceive)
        >
          {loading && <Loader width={22} height={22} />}&nbsp;
          {insufficientFund ? 'Insufficient Funds' : 'Place a bid'}
        </Button>
      </div>
    </div>
  );
};

export default memo(Bidding);
