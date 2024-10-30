import { toBinary } from '@cosmjs/cosmwasm-stargate';
import { LuckyWheel } from '@lucky-canvas/react';
import { ORAIX_CONTRACT, toDisplay, BigDecimal } from '@oraichain/oraidex-common';
import { isMobile } from '@walletconnect/browser-utils';
import LuckyDrawImg from 'assets/images/OraiDEX 2-YEAR-side.png';
import LuckyDrawImgMobile from 'assets/images/OraiDEX 2-YEAR.png';
import ModalCustom from 'components/ModalCustom';
import useConfigReducer from 'hooks/useConfigReducer';
import { useLoadOraichainTokens } from 'hooks/useLoadTokens';
import useWindowSize from 'hooks/useWindowSize';
import { FC, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configure';
import {
  DATA_LUCKY_DRAW,
  LUCKY_DRAW_CONTRACT,
  LUCKY_DRAW_FEE,
  MAX_SPIN_TIME_PER_SEND,
  MSG_TITLE,
  REWARD_MAP,
  REWARD_TITLE,
  SPIN_ID_KEY
} from './constants';
import styles from './index.module.scss';
import {
  getDataLogByKey,
  sendMultiple,
  useGetListSpinResult,
  useGetSpinResult,
  useLuckyDrawConfig
} from './useLuckyDraw';
import { handleErrorTransaction } from 'helper';
import OraiXLightIcon from 'assets/icons/oraix_light.svg?react';
import CongratulationLottie from 'assets/lottie/congratulation.json';
import { network } from 'config/networks';
import classNames from 'classnames';
import Loader from 'components/Loader';
import Lottie from 'lottie-react';
import InputRange from 'pages/CoHarvest/components/InputRange';
import { numberWithCommas } from 'pages/Pools/helpers';
import { Spin } from './luckyDrawClient/LuckyWheelContract.types';

const LuckyDraw: FC<{}> = () => {
  const [address] = useConfigReducer('address');
  const [isOpen, setIsOpen] = useState(false);
  const [loadingFee, setLoadingFee] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [ticketNum, setTicketNum] = useState(1);
  const [spinIdList, setSpinIdList] = useState([]);
  const myLuckyRef = useRef(null);
  const [item, setItem] = useState('');
  const [isSuccessSpin, setIsSuccessSpin] = useState(false);
  const [bestReward, setBestReward] = useState<
    | Spin
    | {
        spinId: number;
        participant: string;
        random_number: string;
        reward: string;
        spin_time: number;
        result_time: number;
      }
  >();
  const [numberOfReward, setNumberOfReward] = useState(0);
  const [totalReward, setTotalReward] = useState(0);
  const [wheelSize, setWheelSize] = useState('500px');
  const [loaded, setLoaded] = useState(false);
  const mobileMode = isMobile();
  const { isSmallMobileView, windowSize } = useWindowSize();
  const [dataSource, setDataSource] = useState<any>(DATA_LUCKY_DRAW);

  const amounts = useSelector((state: RootState) => state.token.amounts);
  const loadOraichainToken = useLoadOraichainTokens();
  const balance = amounts['oraix'];

  const { spinConfig } = useLuckyDrawConfig();
  const { fee = LUCKY_DRAW_FEE, feeDenom = ORAIX_CONTRACT, feeToken } = spinConfig || {};

  const insufficientFund = fee && Number(fee) * ticketNum > Number(balance);

  useEffect(() => {
    const { width = 500 } = windowSize || {};

    if (!width) {
      return;
    }

    setLoaded(false);
    const size = isSmallMobileView ? width - 20 : 500;

    if (size > 0) {
      setWheelSize(`${size}px`);
      setLoaded(true);
    }

    return () => setLoaded(false);
  }, [windowSize, isSmallMobileView]);

  // const { spinResult } = useGetSpinResult({ id: spinId });
  const { spinResult, isDone } = useGetListSpinResult({ spinIdList });

  useEffect(() => {
    if (spinIdList?.length && isDone && myLuckyRef?.current) {
      const fmtRes = [...(spinResult || [])].sort((a, b) => Number(b.reward) - Number(a.reward));
      const bestRes = fmtRes[0];

      const listReward = fmtRes.filter((e) => e.reward && Number(e.reward) > 0);
      const totalRew = listReward.reduce((acc, cur) => {
        acc = new BigDecimal(cur.reward).add(acc).toNumber();

        return acc;
      }, 0);

      setBestReward(bestRes);
      setNumberOfReward(listReward.length);
      setTotalReward(totalRew);

      const indexPrize = REWARD_MAP[bestRes?.reward];
      const randomItemIndex = (Math.random() * 2) >> 0;

      myLuckyRef.current.stop(indexPrize?.[randomItemIndex] ?? indexPrize?.[0]);
    }
  }, [spinResult, spinIdList, isDone]);

  const onStart = async () => {
    setIsSuccessSpin(false);
    setItem('');
    setSpinIdList([]);
    setLoadingFee(true);
    setIsSpinning(true);

    if (!myLuckyRef) return;

    try {
      const { feeDenom, feeToken, fee } = spinConfig;

      // const sendResult = await window.client.execute(
      //   address,
      //   feeDenom,
      //   {
      //     send: {
      //       contract: LUCKY_DRAW_CONTRACT,
      //       amount: fee,
      //       msg: toBinary({
      //         spin: {}
      //       })
      //     }
      //   },
      //   'auto'
      // );
      const sendResult = await sendMultiple({
        fee,
        timeToSpin: ticketNum,
        tokenAddress: feeDenom,
        senderAddress: address
      });

      myLuckyRef?.current?.play();

      const { logs = [] } = sendResult;

      const idList = [];
      logs.map((log) => {
        const { value: spinId } = getDataLogByKey(log, SPIN_ID_KEY);

        if (spinId && !isNaN(spinId)) {
          idList.push(Number(spinId));
        }
        return log;
      });

      if (idList?.length) {
        setSpinIdList(idList);
      }
    } catch (error) {
      console.log('error', error);
      handleErrorTransaction(error, {
        tokenName: 'ORAIX',
        chainName: network.chainId
      });
      setIsSpinning(false);
    } finally {
      setLoadingFee(false);
    }
  };

  const tokenValueByTicket = ticketNum * toDisplay(fee || LUCKY_DRAW_FEE);

  return (
    <>
      <div className={styles.btn} onClick={() => setIsOpen(true)}>
        <img src={mobileMode ? LuckyDrawImgMobile : LuckyDrawImg} alt="LuckyDrawImg" />
      </div>
      <ModalCustom
        title="Lucky Draw"
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setItem('');
          setIsSuccessSpin(false);

          setTicketNum(1);
          setBestReward(null);
          setTotalReward(0);
          setNumberOfReward(0);
        }}
        className={styles.contentModal}
        overlayClassName={styles.overlay}
      >
        <div className={styles.wheel}>
          <div className={styles.info}>
            <div className={styles.detail}>
              {/* <span className={styles.detail}>
                Each spin only costs <strong>{toDisplay(fee || LUCKY_DRAW_FEE)}</strong> ORAIX
              </span> */}
              <div className={styles.rangeWrapper}>
                <span className={styles.title}>Select Spin: </span>
                <InputRange
                  max={MAX_SPIN_TIME_PER_SEND}
                  min={1}
                  value={ticketNum}
                  onChange={(val) => setTicketNum(+val)}
                  className={styles.range}
                  showValue={false}
                  suffix={
                    <div className={styles.value}>
                      <span>{ticketNum} times </span>
                      <span>
                        ( = {numberWithCommas(tokenValueByTicket)} {feeToken?.name || 'ORAIX'})
                      </span>
                    </div>
                  }
                />
              </div>
            </div>
            <span>
              Balance:{' '}
              <span className={styles.balance}>
                {toDisplay(balance)} {feeToken?.name || 'ORAIX'}
              </span>
            </span>
          </div>

          {loaded && (
            <div className={styles.spin}>
              <LuckyWheel
                ref={myLuckyRef}
                width={wheelSize}
                height={wheelSize}
                blocks={dataSource.blocks}
                prizes={dataSource.prizes}
                buttons={dataSource.buttons}
                defaultStyle={dataSource.defaultStyle}
                onStart={() => {
                  // onStart
                  console.log('Spin...');
                }}
                onEnd={(prize) => {
                  console.log(prize);
                  setIsSuccessSpin(true);
                  setIsSpinning(false);
                  setItem(prize.title as string);
                  loadOraichainToken(address, [feeDenom || ORAIX_CONTRACT]);
                }}
              />
              <button
                disabled={insufficientFund || loadingFee || isSpinning}
                // disabled
                className={styles.spinMask}
                onClick={onStart}
                title={insufficientFund ? 'Insufficient Fee!' : 'Spin the wheel to win!'}
              >
                <span className={styles.spinTxt}>
                  {loadingFee && <Loader width={16} height={16} />}
                  Start
                </span>
                {/* <span className={styles.token}>
                  {toDisplay(fee)} <OraiXLightIcon />
                </span> */}
              </button>
            </div>
          )}
          <span className={classNames(styles.result, { [styles.done]: isSuccessSpin })}>
            {!isSuccessSpin ? (
              'Ready to test your luck? Spin the wheel to win!'
            ) : ticketNum >= 1 && numberOfReward > 0 ? (
              <div className={styles.multiple}>
                You've racked up <strong>{numberOfReward}</strong> wins! Keep it going!
                <br />
                <br />
                You earned{' '}
                <strong>
                  {numberWithCommas(toDisplay(String(totalReward)), undefined, { maximumFractionDigits: 6 })}
                </strong>{' '}
                $ORAI in total rewards, with your best single win at{' '}
                <strong>
                  {numberWithCommas(toDisplay(bestReward?.reward || '0'), undefined, { maximumFractionDigits: 6 })}
                </strong>{' '}
                $ORAI
              </div>
            ) : (
              <span>
                <strong>{item}: &nbsp;</strong>
                {MSG_TITLE[item]}
              </span>
            )}
          </span>
        </div>

        {isSuccessSpin && item !== REWARD_TITLE.NOTHING && (
          <div className={styles.lottie}>
            <Lottie animationData={CongratulationLottie} autoPlay={isSuccessSpin} loop={false} />
          </div>
        )}
      </ModalCustom>
    </>
  );
};

export default LuckyDraw;
