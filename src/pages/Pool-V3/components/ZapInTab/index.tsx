import styles from './index.module.scss';
import { CoinGeckoPrices, toDisplay, TokenItemType } from '@oraichain/oraidex-common';
import { FC, useState } from 'react';
import classNames from 'classnames';
import { numberWithCommas } from 'helper/format';
import ErrorIcon from 'assets/icons/error-fill-icon.svg?react';
import OutputIcon from 'assets/icons/zapOutput-ic.svg?react';
import TooltipHover from 'components/TooltipHover';
import NumberFormat from 'react-number-format';
import SelectToken from '../SelectToken';
import ZappingText from 'components/Zapping';
import { ZapInLiquidityResponse } from '@oraichain/oraiswap-v3';
import cn from 'classnames/bind';
import LeafIcon from 'assets/icons/leaf.svg?react';

interface ZapInTabProps {
  tokenZap: TokenItemType;
  apr: number;
  zapAmount: number;
  simulating: boolean;
  zapError: string;
  zapInResponse: ZapInLiquidityResponse;
  amounts: AmountDetails;
  zapUsd: number;
  xUsd: number;
  yUsd: number;
  tokenFrom: TokenItemType;
  tokenTo: TokenItemType;
  tokenFromIcon: JSX.Element;
  tokenToIcon: JSX.Element;
  zapImpactPrice: number;
  swapFee: number;
  zapFee: number;
  totalFee: number;
  matchRate: number;
  extendedPrice: CoinGeckoPrices<string>;
  setZapAmount: (value: number) => void;
  setFocusId: (value: 'zap' | 'x' | 'y') => void;
  setTokenZap: (token: TokenItemType) => void;
}

const cx = cn.bind(styles);

const ZapInTab: FC<ZapInTabProps> = ({
  tokenZap,
  apr,
  zapAmount,
  simulating,
  zapError,
  zapInResponse,
  amounts,
  zapUsd,
  xUsd,
  yUsd,
  tokenFrom,
  tokenTo,
  tokenFromIcon,
  tokenToIcon,
  zapImpactPrice,
  swapFee,
  zapFee,
  totalFee,
  matchRate,
  extendedPrice,
  setZapAmount,
  setFocusId,
  setTokenZap,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  return (
    <>
      <div className={classNames(styles.itemInput, { [styles.disabled]: false })}>
        <div className={styles.tokenInfo}>
          {/* <div className={styles.name}> */}
          <SelectToken
            token={tokenZap}
            handleChangeToken={(token) => {
              setTokenZap(token);
              setZapAmount(0);
            }}
            otherTokenDenom={tokenZap?.denom}
            customClassButton={styles.name}
          />
          {/* </div> */}
          <div className={styles.input}>
            <NumberFormat
              onFocus={() => setFocusId('zap')}
              onBlur={() => setFocusId(null)}
              placeholder="0"
              thousandSeparator
              className={styles.amount}
              decimalScale={tokenZap?.decimals || 6}
              disabled={false}
              type="text"
              value={zapAmount}
              onChange={() => {}}
              isAllowed={(values) => {
                const { floatValue } = values;
                // allow !floatValue to let user can clear their input
                return !floatValue || (floatValue >= 0 && floatValue <= 1e14);
              }}
              onValueChange={({ floatValue }) => {
                setZapAmount(floatValue);
              }}
            />
          </div>
        </div>
        <div className={styles.balance}>
          <p className={styles.bal}>
            <span>Balance:</span>{' '}
            <span className={styles.value}>
              {numberWithCommas(toDisplay(amounts[tokenZap?.denom] || '0', tokenZap.decimals))} {tokenZap?.name}
            </span>
            <span
              className={styles.max}
              onClick={() => {
                const val = toDisplay(amounts[tokenZap?.denom] || '0', tokenZap.decimals);
                setZapAmount(val);
                setFocusId('zap');
              }}
            >
              Max
            </span>
          </p>
          <div className={styles.usd}>
            ≈ $
            {zapAmount
              ? numberWithCommas(Number(zapUsd) || 0, undefined, { maximumFractionDigits: tokenZap.decimals })
              : 0}
          </div>
        </div>
      </div>
      {simulating && (
        <div>
          <span className={styles.simulating}>
            <ZappingText text={'Finding best option to zap'} dot={5} />
          </span>
        </div>
      )}

      {zapError && (
        <div className={styles.errorZap}>
          <ErrorIcon />
          <span>{zapError}</span>
        </div>
      )}
      {!zapError && zapInResponse && !simulating && (
        <>
          <div className={styles.dividerOut}>
            <div className={styles.bar}></div>
            <div>
              <OutputIcon />
            </div>
            <div className={styles.bar}></div>
          </div>
          <div className={styles.tokenOutput}>
            <div className={styles.item}>
              <div className={styles.info}>
                <div className={styles.infoIcon}>{tokenFromIcon}</div>
                <span>{tokenFrom?.name}</span>
              </div>
              <div className={styles.value}>
                {simulating && <div className={styles.mask} />}
                <span>
                  {zapInResponse
                    ? tokenFrom &&
                      numberWithCommas(Number(zapInResponse.amountX) / 10 ** tokenFrom.decimals, undefined, {
                        maximumFractionDigits: 3
                      })
                    : 0}
                </span>
                <span className={styles.usd}>
                  ≈ $
                  {zapInResponse
                    ? numberWithCommas(Number(xUsd) || 0, undefined, {
                        maximumFractionDigits: 3
                      })
                    : 0}
                </span>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.info}>
                <div className={styles.infoIcon}>{tokenToIcon}</div>
                <span>{tokenTo?.name}</span>
              </div>
              <div className={styles.value}>
                {simulating && tokenTo && <div className={styles.mask} />}
                <span>
                  {zapInResponse
                    ? tokenTo &&
                      numberWithCommas(Number(zapInResponse.amountY) / 10 ** tokenTo.decimals, undefined, {
                        maximumFractionDigits: 3
                      })
                    : 0}
                </span>
                <span className={styles.usd}>
                  ≈ ${zapInResponse ? numberWithCommas(Number(yUsd) || 0, undefined, { maximumFractionDigits: 3 }) : 0}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.aprWrapper}>
            <p className={styles.title}>Est APR</p>
            <div className={styles.amountWrap}>
              <p className={styles.amount}>~{numberWithCommas(apr, undefined, { maximumFractionDigits: 2 })}%</p>
              <LeafIcon />
            </div>
          </div>

          <div className={styles.feeInfoWrapper}>
            <div className={styles.priceToken}>
              {tokenFrom && (
                <p className={styles.ratio}>
                  1 {tokenFrom.name} ≈ $
                  {extendedPrice?.[tokenFrom?.coinGeckoId]
                    ? numberWithCommas(extendedPrice[tokenFrom.coinGeckoId], undefined, { maximumFractionDigits: 2 })
                    : '0'}
                </p>
              )}
              <p className={styles.divide}>/</p>
              {tokenTo && (
                <p className={styles.ratio}>
                  1 {tokenTo.name} ≈ $
                  {extendedPrice?.[tokenTo?.coinGeckoId]
                    ? numberWithCommas(extendedPrice[tokenTo.coinGeckoId], undefined, { maximumFractionDigits: 2 })
                    : '0'}
                </p>
              )}
            </div>
            <div className={styles.item}>
              <div className={styles.info}>
                <span>Price Impact</span>
              </div>
              <div
                className={cx(
                  'valueImpact',
                  `${zapImpactPrice >= 10 ? 'valueImpact-high' : zapImpactPrice >= 5 ? 'valueImpact-medium' : ''}`
                )}
              >
                <span>{numberWithCommas(zapImpactPrice, undefined, { maximumFractionDigits: 2 }) ?? 0}%</span>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.info}>
                <span>Swap Fee</span>
              </div>
              <div className={styles.value}>
                <span>{numberWithCommas(swapFee, undefined, { maximumFractionDigits: 2 })} %</span>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.itemHasTooltip}>
                <TooltipHover
                  isVisible={isVisible}
                  setIsVisible={setIsVisible}
                  content={<div>Protocol fee, and it's free now!</div>}
                  position="right"
                  children={<span>Zap Fee</span>}
                />
              </div>
              <div className={styles.value}>
                <span>
                  {numberWithCommas(zapFee / 10 ** tokenZap.decimals, undefined, {
                    maximumFractionDigits: tokenZap.decimals
                  })}{' '}
                  {tokenZap.name}
                </span>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.conclusion}>
                <span>Total Fee</span>
              </div>
              <div className={styles.value}>
                <span>${numberWithCommas(totalFee, undefined, { maximumFractionDigits: 4 }) ?? 0}</span>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.conclusion}>
                <span>Match Rate</span>
              </div>
              <div className={styles.value}>
                <span>{numberWithCommas(matchRate, undefined, { maximumFractionDigits: 2 }) ?? 0} %</span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ZapInTab;
