import { CW20_DECIMALS, toDisplay } from '@oraichain/oraidex-common';
import { extractAddress, poolKeyToString } from '@oraichain/oraiswap-v3';
import { isMobile } from '@walletconnect/browser-utils';
import CustomIcon from 'assets/icons/custom.svg?react';
import FullRangeIcon from 'assets/icons/passive.svg?react';
import NarrowIcon from 'assets/icons/active.svg?react';
import RefreshIcon from 'assets/icons/refresh-ccw.svg?react';
import WideIcon from 'assets/icons/balanced.svg?react';
import ZoomInIcon from 'assets/icons/zoom-in.svg?react';
import ZoomOutIcon from 'assets/icons/zoom-out.svg?react';
import classNames from 'classnames';
import { Button } from 'components/Button';
import Loader from 'components/Loader';
import { displayToast, TToastType } from 'components/Toasts/Toast';
import { getIcon, getTransactionUrl } from 'helper';
import { numberWithCommas } from 'helper/format';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import { useLoadOraichainTokens } from 'hooks/useLoadTokens';
import useTheme from 'hooks/useTheme';
import useAddLiquidityNew, { OptionType } from 'pages/Pool-V3/hooks/useCreatePositionForm';
import { useGetFeeDailyData } from 'pages/Pool-V3/hooks/useGetFeeDailyData';
import { useGetPoolList } from 'pages/Pool-V3/hooks/useGetPoolList';
import { FC, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from 'store/configure';
import HistoricalChartDataWrapper from '../HistoricalChartDataWrapper';
import LiquidityChartWrapper from '../LiquidityChartWrapper';
import ManuallyAddLiquidity from '../ManuallyAddLiquidity';
import PriceDetail from '../PriceDetail';
import ZapInTab from '../ZapInTab';
import styles from './index.module.scss';
import LoadingBox from 'components/LoadingBox';

interface CreatePositionFormProps {
  poolId: string;
  slippage: number;
  showModal: boolean;
  onCloseModal: () => void;
}

const CreatePositionForm: FC<CreatePositionFormProps> = ({ poolId, slippage, showModal, onCloseModal }) => {
  const theme = useTheme();
  const amounts = useSelector((state: RootState) => state.token.amounts);
  const { data: prices } = useCoinGeckoPrices();
  const { poolPrice: extendPrices } = useGetPoolList(prices);

  const [walletAddress] = useConfigReducer('address');

  const loadOraichainToken = useLoadOraichainTokens();
  const navigate = useNavigate();
  const { feeDailyData } = useGetFeeDailyData();

  const [toggleZap, setToggleZap] = useState(false);

  const {
    poolKey,
    pool,
    tokenX,
    tokenY,
    historicalRange,
    historicalChartData,
    fullRange,
    xRange,
    yRange,
    currentPrice,
    liquidityChartData,
    hoverPrice,
    minPrice,
    maxPrice,
    lowerTick,
    higherTick,
    isXToY,
    optionType,
    amountX,
    amountY,
    isXBlocked,
    isYBlocked,
    liquidity,
    loading,
    apr,
    tokenZap,
    zapAmount,
    zapInResponse,
    zapImpactPrice,
    matchRate,
    zapFee,
    totalFee,
    swapFee,
    zapError,
    simulating,
    zapXUsd,
    zapYUsd,
    zapUsd,
    zapApr,
    cache3Month,
    cache7Day,
    setIsFullRange,
    setApr,
    setIsSuperNarrow,
    setZapApr,
    setTokenZap,
    setZapAmount,
    handleZapIn,
    addLiquidity,
    setAmountX,
    setAmountY,
    setFocusId,
    setOptionType,
    setMinPrice,
    setMaxPrice,
    setHoverPrice,
    changeHistoricalRange,
    zoomIn,
    zoomOut,
    resetRange,
    swapBaseToX,
    swapBaseToY,
    setLoading,
    handleOptionCustom,
    handleOptionWide,
    handleOptionNarrow,
    handleOptionFullRange
  } = useAddLiquidityNew(poolId, slippage, extendPrices, feeDailyData, toggleZap);

  const isLightTheme = theme === 'light';

  const renderTokenObj = (coinGeckoId, size: number = 30) => {
    return {
      isLightTheme,
      type: 'token' as any,
      coinGeckoId,
      width: size,
      height: size
    };
  };

  const TokenFromIcon = tokenX && getIcon(renderTokenObj(tokenX.coinGeckoId));
  const TokenToIcon = tokenY && getIcon(renderTokenObj(tokenY.coinGeckoId));

  const fromUsd = extendPrices?.[tokenX?.coinGeckoId]
    ? (extendPrices[tokenX.coinGeckoId] * Number(amountX || 0)).toFixed(6)
    : '0';
  const toUsd = extendPrices?.[tokenY?.coinGeckoId]
    ? (extendPrices[tokenY.coinGeckoId] * Number(amountY || 0)).toFixed(6)
    : '0';

  const getButtonMessage = () => {
    if (!walletAddress) {
      return 'Connect wallet';
    }

    if (!toggleZap) {
      const isInsufficientTo =
        amountY && Number(amountY) > toDisplay(amounts[tokenY?.denom], tokenY?.decimals || CW20_DECIMALS);
      const isInsufficientFrom =
        amountX && Number(amountX) > toDisplay(amounts[tokenX?.denom], tokenX?.decimals || CW20_DECIMALS);

      if (!tokenX || !tokenY) {
        return 'Select tokens';
      }

      if (tokenX?.denom === tokenY?.denom) {
        return 'Select different tokens';
      }

      if (isInsufficientFrom) {
        return `Insufficient ${tokenX.name.toUpperCase()}`;
      }

      if (isInsufficientTo) {
        return `Insufficient ${tokenY.name.toUpperCase()}`;
      }

      if ((!isXBlocked && (!amountX || +amountX === 0)) || (!isYBlocked && (!amountY || +amountY === 0))) {
        return 'Liquidity must be greater than 0';
      }
      return 'Create new position';
    } else {
      const isInsufficientZap =
        zapAmount && Number(zapAmount) > toDisplay(amounts[tokenZap.denom], tokenZap.decimals || CW20_DECIMALS);

      if (!tokenZap) {
        return 'Select token';
      }

      if (!zapAmount || +zapAmount === 0) {
        return 'Zap amount must be greater than 0';
      }

      if (simulating) {
        return 'Simulating';
      }

      if (isInsufficientZap) {
        return `Insufficient ${tokenZap.name.toUpperCase()}`;
      }

      return 'Zap in';
    }
  };

  // console.log({minPrice, maxPrice})

  return (
    <div className={styles.createPositionForm}>
      <div className={styles.infoTab}>
        <div className={styles.header}>
          <div className={styles.currentInfo}>
            <p className={styles.title}>Current pool price</p>
            {tokenX && tokenY && currentPrice && (
              <p className={styles.content}>
                {numberWithCommas(currentPrice, undefined, { maximumFractionDigits: currentPrice >= 0.01 ? 2 : 9 })}{' '}
                {isXToY ? `${tokenY.name} per ${tokenX.name}` : `${tokenX.name} per ${tokenY.name}`}
              </p>
            )}
          </div>
          {tokenX && tokenY && (
            <div className={styles.switchTokenWrapper}>
              <span onClick={swapBaseToX} className={classNames({ [styles.chosen]: isXToY })}>
                {tokenX.name}
              </span>
              <span onClick={swapBaseToY} className={classNames({ [styles.chosen]: !isXToY })}>
                {tokenY.name}
              </span>
            </div>
          )}
        </div>

        {/* <div className={styles.alert}>
          <div>
            <WarningIcon />
          </div>
          <span>
            Your position will not earn fees or be used in trades until the market price moves into your range.
          </span>
        </div> */}

        <div className={styles.actionWrapper}>
          <p className={styles.title}>Select Volatility Strategy</p>
          {historicalChartData && (
            <div className={styles.strategyBtnList}>
              <div
                onClick={() => {
                  if (!cache3Month) return;
                  setOptionType(OptionType.WIDE);
                  handleOptionWide();
                }}
                className={classNames(styles.btn, { [styles.chosen]: optionType === OptionType.WIDE })}
              >
                <WideIcon />
                <br />
                <span>Wide</span>
              </div>
              <div
                onClick={() => {
                  if (!cache7Day) return;
                  setOptionType(OptionType.NARROW);
                  handleOptionNarrow();
                }}
                className={classNames(styles.btn, { [styles.chosen]: optionType === OptionType.NARROW })}
              >
                <NarrowIcon />
                <br />
                <span>Narrow</span>
              </div>
              <div
                onClick={() => {
                  setOptionType(OptionType.FULL_RANGE);
                  handleOptionFullRange();
                }}
                className={classNames(styles.btn, { [styles.chosen]: optionType === OptionType.FULL_RANGE })}
              >
                <FullRangeIcon />
                <br />
                <span>Full range</span>
              </div>
              <div
                onClick={() => {
                  if (!cache7Day) return;
                  setOptionType(OptionType.CUSTOM);
                  handleOptionCustom();
                }}
                className={classNames(styles.btn, { [styles.chosen]: optionType === OptionType.CUSTOM })}
              >
                <CustomIcon />
                <br />
                <span>Custom</span>
              </div>
            </div>
          )}
          <div className={styles.explain}>
            <p>{optionType}</p>
          </div>
        </div>

        <div className={styles.wrapChart}>
          <div className={styles.chartOptions}>
            <div className={styles.time}>
              <button
                className={classNames({ [styles.chosen]: historicalRange === '7d' })}
                onClick={() => changeHistoricalRange('7d')}
              >
                1W
              </button>
              <button
                className={classNames({ [styles.chosen]: historicalRange === '1mo' })}
                onClick={() => changeHistoricalRange('1mo')}
              >
                1M
              </button>
              <button
                className={classNames({ [styles.chosen]: historicalRange === '3mo' })}
                onClick={() => changeHistoricalRange('3mo')}
              >
                3M
              </button>
              <button
                className={classNames({ [styles.chosen]: historicalRange === '1y' })}
                onClick={() => changeHistoricalRange('1y')}
              >
                1Y
              </button>
            </div>

            <div className={styles.actions}>
              <RefreshIcon widths={60} onClick={resetRange} />
              <ZoomOutIcon widths={60} onClick={zoomOut} />
              <ZoomInIcon widths={60} onClick={zoomIn} />
            </div>
          </div>

          <div className={styles.chartContent}>
            <LoadingBox loading={!(historicalChartData && liquidityChartData)}>
              <>
                {xRange && yRange && (
                  <HistoricalChartDataWrapper
                    hoverPrice={hoverPrice}
                    tokenX={tokenX}
                    tokenY={tokenY}
                    historicalChartData={historicalChartData}
                    fullRange={fullRange}
                    yRange={yRange}
                    addRange={minPrice === 0 || maxPrice === 0 ? [yRange[0], yRange[1]] : [minPrice, maxPrice]}
                    currentPrice={currentPrice}
                    isXToY={isXToY}
                    setHoverPrice={setHoverPrice}
                    setHistoricalRange={changeHistoricalRange}
                  />
                )}

                {xRange && yRange && (
                  <LiquidityChartWrapper
                    setOptionType={setOptionType}
                    minPrice={minPrice === 0 || maxPrice === 0 ? yRange[0] : minPrice}
                    maxPrice={minPrice === 0 || maxPrice === 0 ? yRange[1] : maxPrice}
                    yRange={yRange}
                    xRange={xRange}
                    liquidityChartData={liquidityChartData}
                    currentPrice={currentPrice}
                    fullRange={fullRange}
                    setMaxPrice={(value: number) => {
                      setMaxPrice(value);
                      if (optionType === OptionType.FULL_RANGE) {
                        setIsFullRange(false);
                        setIsSuperNarrow(false);
                      }
                    }}
                    setMinPrice={(value: number) => {
                      setMinPrice(value);
                      if (optionType === OptionType.FULL_RANGE) {
                        setIsFullRange(false);
                        setIsSuperNarrow(false);
                      }
                    }}
                    zoomIn={zoomIn}
                    zoomOut={zoomOut}
                    resetRange={resetRange}
                  />
                )}
              </>
            </LoadingBox>
          </div>
        </div>

        {currentPrice && tokenX && tokenY && (
          <PriceDetail
            leftInput={isXToY ? minPrice : maxPrice}
            rightInput={isXToY ? maxPrice : minPrice}
            currentPrice={currentPrice}
            tokenX={tokenX}
            tokenY={tokenY}
            isXToY={isXToY}
          />
        )}
      </div>

      {!isMobile() && <div className={styles.line}></div>}

      <div className={styles.depositTab}>
        <div className={styles.depositInput}>
          <div className={styles.menuWrapper}>
            <button
              className={classNames(styles.btnOption, { [styles.activeBtn]: !toggleZap })}
              onClick={() => setToggleZap(false)}
            >
              Manual Deposit
            </button>
            <button
              className={classNames(styles.btnOption, { [styles.activeBtn]: toggleZap })}
              onClick={() => setToggleZap(true)}
            >
              Zap In
              <span>NEW</span>
            </button>
          </div>

          {toggleZap ? (
            <div className={styles.zapWrapper}>
              <ZapInTab
                apr={zapApr}
                amounts={amounts} //
                matchRate={matchRate} //
                setFocusId={setFocusId} //
                setTokenZap={setTokenZap} //
                setZapAmount={setZapAmount} //
                simulating={simulating} //
                swapFee={swapFee} //
                tokenFrom={tokenX}
                tokenFromIcon={TokenFromIcon}
                tokenTo={tokenY}
                tokenToIcon={TokenToIcon}
                tokenZap={tokenZap}
                zapAmount={zapAmount} //
                totalFee={totalFee}
                xUsd={Number(zapXUsd)}
                yUsd={Number(zapYUsd)}
                zapError={zapError}
                zapFee={zapFee}
                zapImpactPrice={zapImpactPrice}
                zapInResponse={zapInResponse}
                zapUsd={Number(zapUsd)}
                extendedPrice={extendPrices}
              />
            </div>
          ) : (
            <div className={styles.manuallyWrapper}>
              {tokenX && tokenY && (
                <ManuallyAddLiquidity
                  apr={apr} //
                  TokenFromIcon={TokenFromIcon} //
                  TokenToIcon={TokenToIcon} //
                  amountFrom={amountX} //
                  amountTo={amountY} //
                  amounts={amounts} //
                  fromUsd={fromUsd} //
                  toUsd={toUsd} //
                  isFromBlocked={isXBlocked} //
                  isToBlocked={isYBlocked} //
                  setAmountFrom={setAmountX} //
                  setAmountTo={setAmountY} //
                  setFocusId={setFocusId} //
                  tokenFrom={tokenX} //
                  tokenTo={tokenY} //
                />
              )}
            </div>
          )}
        </div>

        <div className={styles.submit}>
          {(() => {
            const btnText = getButtonMessage();
            return (
              <Button
                type="primary"
                disabled={
                  loading ||
                  !walletAddress ||
                  !(btnText === 'Zap in' || btnText === 'Create new position') ||
                  !!zapError
                }
                onClick={async () => {
                  if (toggleZap) {
                    setLoading(true);
                    await handleZapIn(
                      walletAddress,
                      (tx: string) => {
                        displayToast(TToastType.TX_SUCCESSFUL, {
                          customLink: getTransactionUrl('Oraichain', tx)
                        });
                        // handleSuccessAdd();
                        loadOraichainToken(
                          walletAddress,
                          [tokenX.contractAddress, tokenY.contractAddress].filter(Boolean)
                        );
                        onCloseModal();
                        setZapApr(0);
                        navigate(`/pools/v3/${encodeURIComponent(poolKeyToString(poolKey))}`);
                      },
                      (e) => {
                        console.log({ errorZap: e });
                        displayToast(TToastType.TX_FAILED, {
                          message: 'Add liquidity failed!'
                        });
                      }
                    );
                    setLoading(false);
                    return;
                  }

                  await addLiquidity({
                    data: {
                      poolKeyData: poolKey,
                      lowerTick: lowerTick,
                      upperTick: higherTick,
                      liquidityDelta: liquidity,
                      spotSqrtPrice: BigInt(pool?.sqrt_price),
                      slippageTolerance: BigInt(slippage),
                      tokenXAmount:
                        poolKey.token_x === extractAddress(tokenX)
                          ? BigInt(Math.round(Number(amountX) * 10 ** (tokenX.decimals || 6)))
                          : BigInt(Math.round(Number(amountY) * 10 ** (tokenY.decimals || 6))),
                      tokenYAmount:
                        poolKey.token_y === extractAddress(tokenX)
                          ? BigInt(Math.round(Number(amountX) * 10 ** (tokenX.decimals || 6)))
                          : BigInt(Math.round(Number(amountY) * 10 ** (tokenY.decimals || 6))),
                      initPool: false
                    },
                    walletAddress,
                    callBackSuccess: (tx: string) => {
                      displayToast(TToastType.TX_SUCCESSFUL, {
                        customLink: getTransactionUrl('Oraichain', tx)
                      });
                      // handleSuccessAdd();
                      loadOraichainToken(
                        walletAddress,
                        [tokenX.contractAddress, tokenY.contractAddress].filter(Boolean)
                      );
                      onCloseModal();
                      setApr(0);
                      navigate(`/pools/v3/${encodeURIComponent(poolKeyToString(poolKey))}`);
                    },
                    callBackFailed: (e) => {
                      console.log({ errorZap: e });
                      displayToast(TToastType.TX_FAILED, {
                        message: 'Add liquidity failed!'
                      });
                    }
                  });
                }}
              >
                {loading && <Loader width={22} height={22} />}&nbsp;&nbsp;
                {btnText}
              </Button>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default CreatePositionForm;
