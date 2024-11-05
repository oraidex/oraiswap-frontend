import { CoinPretty, Dec, DecUtils, IntPretty, PricePretty, RatePretty } from '@keplr-wallet/unit';
import { curveNatural } from '@visx/curve';
import { LinearGradient } from '@visx/gradient';
import { ParentSize } from '@visx/responsive';
import {
  AnimatedAreaSeries,
  AnimatedAxis,
  AnimatedGrid,
  AnimatedLineSeries,
  Annotation,
  AnnotationConnector,
  AnnotationLineSubject,
  buildChartTheme,
  Margin,
  Tooltip,
  XYChart
} from '@visx/xychart';
import dayjs from 'dayjs';
import { isNumber } from 'lodash';
import { FC, memo } from 'react';
import styles from './index.module.scss';
import { isMobile } from '@walletconnect/browser-utils';
import cn from 'classnames/bind';
import { format, formatDefaultLocale } from '@visx/vendor/d3-format';

export const theme = {
  dark: {

  },
  light: {

  }
};

const yAxisFormatter = (value) => {
  if (value < 1) {
    return format('.6~f')(value); // For values less than 1, use two decimals without SI-prefix
  } else {
    return format('~s')(value); // For values >= 1, use SI-prefix with two decimals
  }
};

const HistoricalPriceChart: FC<{
  data: { close: number; time: number }[];
  margin?: Partial<Margin>;
  annotations: Dec[];
  domain: [number, number];
  onPointerHover?: (price: number) => void;
  onPointerOut?: () => void;
  showGradient?: boolean;
  /**
   * Renders a more compact graph with less information on the screen
   */
  minimal?: boolean;
  /**
   * specifies the tick count of the horizontal asset
   */
  xNumTicks?: number;
  /**
   * Enable tooltip rendering
   */
  showTooltip?: boolean;
  fiatSymbol?: string;
  extendLeft: number;
  theme?: 'light' | 'dark';
}> = memo(
  ({
    data,
    annotations,
    domain,
    onPointerHover,
    onPointerOut,
    showGradient = true,
    minimal = false,
    xNumTicks = 3,
    showTooltip = false,
    fiatSymbol,
    extendLeft = 0,
    theme = 'dark'
  }) => (
    <ParentSize className={styles.parentSize}>
      {({ height, width }) => {
        return (
          <XYChart
            margin={
              minimal
                ? { top: 0, right: 0, bottom: 24, left: 0 }
                : { top: 0, right: 0, bottom: 24, left: 20 + extendLeft }
            }
            height={height}
            width={width}
            xScale={{
              type: 'time',
              paddingInner: 0.6
            }}
            yScale={{
              type: 'linear',
              domain,
              zero: false
            }}
            onPointerOut={onPointerOut}
            onPointerMove={(tooltipData) => {
              const datum = tooltipData.datum as any;
              const close = datum.close;

              if (close && onPointerHover) {
                onPointerHover(close);
              }
            }}
            theme={buildChartTheme({
              backgroundColor: 'transparent',
              colors: [theme === 'dark' ? '#A6BE93' : '#5EA402'],
              gridColor: theme === 'dark' ? '#232521' : 'white',
              gridColorDark: '#232521',
              svgLabelSmall: {
                fill: '#979995',
                fontSize: 9,
                fontWeight: 400
              },
              svgLabelBig: {
                fontSize: 9,
                fontWeight: 400
              },
              tickLength: 1,
              xAxisLineStyles: {
                strokeWidth: 0
              },
              xTickLineStyles: {
                strokeWidth: 0
              },
              yAxisLineStyles: {
                strokeWidth: 0
              }
            })}
          >
            <AnimatedAxis orientation="bottom" numTicks={xNumTicks} hideTicks={minimal} hideZero={minimal} />
            {!minimal && <AnimatedAxis orientation="left" numTicks={7} strokeWidth={0} tickFormat={yAxisFormatter} />}
            {!minimal && <AnimatedGrid columns={false} numTicks={7} />}

            {showGradient ? (
              <>
                <AnimatedAreaSeries
                  dataKey="close"
                  data={data}
                  xAccessor={(d: { time: number; close: number }) => d?.time}
                  yAccessor={(d: { time: number; close: number }) => d?.close}
                  fillOpacity={0.4}
                  curve={curveNatural}
                  fill="url(#gradient)"
                />
                <LinearGradient
                  id="gradient"
                  // from={theme.colors.chartGradientPrimary}
                  // to={theme.colors.chartGradientSecondary}
                  from={theme === 'dark' ? 'rgba(174, 230, 127, 0.4)' : 'white'}
                  to={theme === 'dark' ? 'rgba(174, 230, 127, 0)' : 'white'}
                  rotate={-8}
                  fromOffset="13.08%"
                  fromOpacity={1}
                  toOpacity={0}
                  toOffset="85.36%"
                />
              </>
            ) : (
              <AnimatedLineSeries
                key={data.length}
                dataKey="close"
                data={data}
                curve={curveNatural}
                xAccessor={(d: { time: number; close: number }) => d?.time}
                yAccessor={(d: { time: number; close: number }) => d?.close}
                stroke={'black'}
              />
            )}

            <Annotation
              key={`historical-1`}
              dataKey="depth"
              xAccessor={(d: { close: number; time: number }) => d.time}
              yAccessor={(d: { close: number; time: number }) => d.close}
              datum={{ close: Number(annotations[0].toString()), time: 0 }}
            >
              <AnnotationConnector />
              <AnnotationLineSubject
                orientation="horizontal"
                stroke={theme === 'dark' ? '#0ECB81' : '#03A66D'}
                strokeWidth={2}
                // strokeDasharray={4}
              />
            </Annotation>
            <Annotation
              key={`historical-2`}
              dataKey="depth"
              xAccessor={(d: { close: number; time: number }) => d.time}
              yAccessor={(d: { close: number; time: number }) => d.close}
              datum={{ close: Number(annotations[1].toString()), time: 0 }}
            >
              <AnnotationConnector />
              <AnnotationLineSubject
                orientation="horizontal"
                stroke={theme === 'dark' ? '#FFF27A' : '#C68E00'}
                strokeWidth={2}
                // strokeDasharray={4}
              />
            </Annotation>

            <Tooltip
              detectBounds
              showDatumGlyph
              horizontalCrosshairStyle={{
                strokeWidth: 2,
                strokeDasharray: '5 5',
                opacity: 0.17,
                stroke: 'yellow'
              }}
              verticalCrosshairStyle={{
                strokeWidth: 1,
                strokeDasharray: '5 5',
                opacity: 0.3,
                stroke: '#cccccc'
              }}
              showVerticalCrosshair={true}
              renderTooltip={({ tooltipData }: any) => {
                const close = tooltipData?.nearestDatum?.datum?.close;
                const time = tooltipData?.nearestDatum?.datum?.time;

                if (time && close) {
                  const date = dayjs(time).format('MMM DD, hh:mma');
                  const minimumDecimals = 2;
                  const maxDecimals = Math.max(getDecimalCount(close), minimumDecimals);

                  const closeDec = new Dec(close);

                  const formatOpts = getPriceExtendedFormatOptions(closeDec);

                  return (
                    <div className={styles.toolTipWrapper}>
                      <h6>
                        {fiatSymbol}
                        {formatPretty(closeDec, {
                          maxDecimals,
                          ...formatOpts
                        }) || ''}
                      </h6>

                      <p>{date}</p>
                    </div>
                    // <div></div>
                  );
                }

                return <div></div>;
              }}
            />
          </XYChart>
        );
      }}
    </ParentSize>
  )
);

type CustomFormatOpts = {
  maxDecimals: number;
  scientificMagnitudeThreshold: number;
  disabledTrimZeros?: boolean;
};

export type FormatOptions = Partial<Intl.NumberFormatOptions & CustomFormatOpts>;

export function getDecimalCount(val: string | number) {
  if (!isNumber(val)) return 0;
  const valAsNumber = Number(val);

  if (valAsNumber.toString() === valAsNumber.toExponential()) {
    return Math.abs(Number(valAsNumber.toString().split('e')[1] || 0));
  }
  if (valAsNumber > Number.MAX_SAFE_INTEGER) {
    console.warn('getDecimalCount: value is too large to get count.');
    return 0;
  }

  if (Math.floor(valAsNumber) === valAsNumber) return 0;
  return valAsNumber.toString().split('.')[1].length || 0;
}

export function getPriceExtendedFormatOptions(value: Dec): FormatOptions {
  /**
   * We need to know how long the integer part of the number is in order to calculate then how many decimal places.
   */
  const integerPartLength = value.truncate().toString().length ?? 0;

  const maximumSignificantDigits = value.lt(new Dec(100)) ? 4 : integerPartLength + 2;

  const minimumDecimals = 2;

  const maxDecimals = Math.max(getDecimalCount(parseFloat(value.toString())), minimumDecimals);

  return {
    maxDecimals,
    notation: 'standard',
    maximumSignificantDigits,
    minimumSignificantDigits: maximumSignificantDigits,
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
    disabledTrimZeros: true
  };
}

type FormatOptionsWithDefaults = Partial<Intl.NumberFormatOptions> & CustomFormatOpts;

const DEFAULT: CustomFormatOpts = {
  maxDecimals: 2,
  scientificMagnitudeThreshold: 14
};

export function formatPretty(
  prettyValue: PricePretty | CoinPretty | RatePretty | Dec | { toDec(): Dec },
  opts: FormatOptions = {}
) {
  const optsWithDefaults: FormatOptionsWithDefaults = {
    ...{ ...DEFAULT },
    ...opts
  };

  if (Math.abs(getNumberMagnitude(prettyValue.toString())) >= optsWithDefaults.scientificMagnitudeThreshold) {
    return toScientificNotation(prettyValue.toString(), optsWithDefaults.maxDecimals);
  }

  if (prettyValue instanceof PricePretty) {
    return priceFormatter(prettyValue, optsWithDefaults);
  } else if (prettyValue instanceof CoinPretty) {
    return coinFormatter(prettyValue, optsWithDefaults);
  } else if (prettyValue instanceof RatePretty) {
    return rateFormatter(prettyValue, optsWithDefaults);
  } else if (prettyValue instanceof Dec || 'toDec' in prettyValue) {
    return decFormatter(prettyValue instanceof Dec ? prettyValue : prettyValue.toDec(), optsWithDefaults);
  } else {
    throw new Error('Unknown pretty value');
  }
}

function decFormatter(dec: Dec, opts: FormatOptionsWithDefaults = DEFAULT): string {
  const options: Intl.NumberFormatOptions = {
    maximumSignificantDigits: 2,
    notation: 'compact',
    compactDisplay: 'short',
    ...opts
  };
  const numStr = new IntPretty(dec).maxDecimals(opts.maxDecimals).locale(false).toString();
  let num = Number(numStr);
  num = isNaN(num) ? 0 : num;

  if (hasIntlFormatOptions(opts)) {
    const formatter = new Intl.NumberFormat('en-US', options);

    if (opts.disabledTrimZeros) {
      return formatter.format(num);
    }

    return trimZerosFromEnd(formatter.format(num));
  } else {
    if (opts.disabledTrimZeros) {
      return new IntPretty(dec).maxDecimals(opts.maxDecimals).locale(false).shrink(true).toString();
    }

    return trimZerosFromEnd(new IntPretty(dec).maxDecimals(opts.maxDecimals).locale(false).shrink(true).toString());
  }
}

export function trimZerosFromEnd(str: string) {
  const decimalPointIndex = str.indexOf('.');

  if (decimalPointIndex === -1) {
    // No decimal point in this string, so return original
    return str;
  }

  // Return if all chars after decimal point are 0
  const charsAfterDecimal = str.substring(decimalPointIndex + 1);
  if (!charsAfterDecimal.split('').some((char) => char !== '0')) {
    return str;
  }

  let i = str.length - 1;
  while (i > decimalPointIndex && str.charAt(i) === '0') {
    i--;
  }

  // If we have only . left from the trimming, remove it as well
  if (str.charAt(i) === '.') {
    i--;
  }

  return str.substring(0, i + 1);
}

export function toScientificNotation(val: string | number, maxDecimals?: number) {
  if (!isNumber(val)) return '0';
  const numberAsExponential = Number(val).toExponential(maxDecimals);
  const magnitude = getNumberMagnitude(val);
  return magnitude === 0 ? numberAsExponential.split('e')[0] : `${numberAsExponential.split('e')[0]}*10^${magnitude}`;
}

export function getNumberMagnitude(val: string | number) {
  if (!isNumber(val)) return 0;
  return Number(Number(val).toExponential().split('e')[1]);
}

function priceFormatter(price: PricePretty, opts: FormatOptionsWithDefaults = DEFAULT): string {
  const options: Intl.NumberFormatOptions = {
    maximumSignificantDigits: 2,
    notation: 'compact',
    compactDisplay: 'short',
    style: 'currency',
    currency: price.fiatCurrency.currency,
    ...opts
  };
  let num = Number(new IntPretty(price).maxDecimals(opts.maxDecimals).locale(false).toString());
  num = isNaN(num) ? 0 : num;
  const formatter = new Intl.NumberFormat(price.fiatCurrency.locale, options);
  return formatter.format(num);
}

/** Formats a coin as compact by default. i.e. 7.53 ATOM or 265 OSMO. Validate handled by `CoinPretty`. */
function coinFormatter(coin: CoinPretty, opts: FormatOptionsWithDefaults = DEFAULT): string {
  const { ...formatOpts } = opts || {};
  const options: Intl.NumberFormatOptions = {
    maximumSignificantDigits: 3,
    notation: 'compact',
    compactDisplay: 'short',
    style: 'decimal',
    ...formatOpts
  };

  if (hasIntlFormatOptions(opts)) {
    let num = Number(new IntPretty(coin).maxDecimals(opts.maxDecimals).locale(false).toString());
    num = isNaN(num) ? 0 : num;
    const formatter = new Intl.NumberFormat('en-US', options);
    return [formatter.format(num), coin.currency.coinDenom.toUpperCase()].join(' ');
  } else {
    if (coin.toDec().isZero()) return coin.trim(true).shrink(true).toString();
    try {
      const baseAmount = new Dec(coin.toCoin().amount);
      let balanceMaxDecimals = opts.maxDecimals;
      while (baseAmount.lt(DecUtils.getTenExponentN(coin.currency.coinDecimals - balanceMaxDecimals)))
        balanceMaxDecimals += opts.maxDecimals;

      return coin.maxDecimals(balanceMaxDecimals).trim(true).shrink(true).toString();
    } catch (e) {
      return coin.maxDecimals(opts.maxDecimals).trim(true).shrink(true).toString();
    }
  }
}

/** Formats a rate as compact by default. i.e. 33%. Validate handled by `RatePretty`. */
function rateFormatter(rate: RatePretty, opts: FormatOptionsWithDefaults = DEFAULT): string {
  const options: Intl.NumberFormatOptions = {
    maximumSignificantDigits: 3,
    notation: 'compact',
    compactDisplay: 'short',
    style: 'decimal',
    ...opts
  };
  let num = Number(new RatePretty(rate).maxDecimals(opts.maxDecimals).locale(false).symbol('').toString());
  num = isNaN(num) ? 0 : num;
  const formatter = new Intl.NumberFormat('en-US', options);
  return `${formatter.format(num)}${rate.options.symbol}`;
}

function hasIntlFormatOptions(opts: FormatOptions) {
  const copy = { ...opts };
  if ('maxDecimals' in copy) delete copy.maxDecimals;
  if ('scientificMagnitudeThreshold' in copy) delete copy.scientificMagnitudeThreshold;
  return Object.keys(copy).length > 0;
}

export default HistoricalPriceChart;
