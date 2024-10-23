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
  colors: {
    white: {
      full: '#FFFFFF',
      high: 'rgba(255, 255, 255, 0.95)',
      emphasis: 'rgba(255, 255, 255, 0.87)',
      mid: 'rgba(255, 255, 255, 0.6)',
      disabled: 'rgba(255, 255, 255, 0.38)',
      faint: 'rgba(255, 255, 255, 0.12)'
    },
    wosmongton: {
      100: '#D3D1FF',
      200: '#AEE67F',
      300: '#AEE67F',
      400: '#6A67EA',
      500: '#FFF27A',
      700: '#462ADF',
      800: '#361FB2',
      900: '#2D1B8F'
    },
    ion: {
      100: '#DCF9FF',
      300: '#87DDF8',
      400: '#64C5EE',
      500: '#2994D0',
      700: '#1469AF'
    },
    bullish: {
      100: '#EBFFFB',
      300: '#95EEDE',
      400: '#6BDEC9',
      500: '#29D0B2',
      600: '#00A399'
    },
    osmoverse: {
      100: '#E4E1FB',
      200: '#CEC8F3',
      300: '#373F31',
      400: '#958FC0',
      500: '#736CA3',
      600: '#979995',
      700: '#3C356D',
      800: '#282750',
      810: '#241E4B',
      825: '#232047',
      850: '#201B43',
      860: '#19183A',
      900: '#140F34',
      1000: '#090524'
    },
    'osmoverse-alpha': {
      700: 'rgba(107, 98, 173, 0.47)',
      800: '#3E386A',
      850: 'rgba(60, 53, 109, 0.29)'
    },
    ammelia: {
      300: '#E196DB',
      400: '#D779CF',
      500: '#CC54C2',
      600: '#CA2EBD',
      900: '#87087C'
    },
    rust: {
      200: '#F8C2B0',
      300: '#F5A68C',
      400: '#F99575',
      500: '#FA825D',
      600: '#E06640',
      700: '#C6451C',
      800: '#B03A20'
    },
    wireframes: {
      darkGrey: '#282828',
      grey: '#818181',
      lightGrey: '#B7B7B7'
    },
    error: '#EF3456',
    missionError: '#EF3456',
    superfluid: '#8A86FF',
    supercharged: '#64C5EE',
    transparent: 'transparent',
    black: 'black',
    inherit: 'inherit',
    barFill: '#373F31',
    chartGradientPrimary: 'rgba(174, 230, 127, 0.3)',
    chartGradientSecondary: 'rgba(174, 230, 127, 0)',
    yourBalanceActionButton: '#2A2553'
  },
  fontSize: {
    xxs: '0.5rem',
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.25rem',
    xl: '1.5rem',
    '2xl': '2.25rem',
    '3xl': '3rem',
    '4xl': '3.75rem',
    '5xl': '6rem',
    h1: ['6rem', { lineHeight: '7rem', letterSpacing: '-1.5px' }],
    h2: ['3.75rem', { lineHeight: '4.5rem', letterSpacing: '-0.5px' }],
    h3: ['3rem', { lineHeight: '3.5rem', letterSpacing: '0' }],
    h4: ['2.25rem', { lineHeight: '2.25rem', letterSpacing: '0' }],
    h5: ['1.5rem', { lineHeight: '2rem', letterSpacing: '0.18px' }],
    h6: ['1.25rem', { lineHeight: '1.5rem', letterSpacing: '0.15px' }],
    subtitle1: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.15px' }],
    subtitle2: ['0.875rem', { lineHeight: '1.5rem', letterSpacing: '0.1px' }],
    body1: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.5px' }],
    body2: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.25px' }],
    button: ['0.875rem', { lineHeight: '1rem', letterSpacing: '0' }],
    caption: ['0.75rem', { lineHeight: '0.875rem', letterSpacing: '0.4px' }],
    overline: ['0.625rem', { lineHeight: '1rem', letterSpacing: '2.5px' }]
  },
  fontFamily: {
    h1: ['Poppins', 'ui-sans-serif', 'system-ui'],
    h2: ['Poppins', 'ui-sans-serif', 'system-ui'],
    h3: ['Poppins', 'ui-sans-serif', 'system-ui'],
    h4: ['Poppins', 'ui-sans-serif', 'system-ui'],
    h5: ['Poppins', 'ui-sans-serif', 'system-ui'],
    h6: ['Poppins', 'ui-sans-serif', 'system-ui'],
    subtitle1: ['Inter', 'ui-sans-serif', 'system-ui'],
    subtitle2: ['Inter', 'ui-sans-serif', 'system-ui'],
    body1: ['Inter', 'ui-sans-serif', 'system-ui'],
    body2: ['Inter', 'ui-sans-serif', 'system-ui'],
    button: ['Inter', 'ui-sans-serif', 'system-ui'],
    caption: ['Inter', 'ui-sans-serif', 'system-ui'],
    overline: ['Poppins', 'ui-sans-serif', 'system-ui']
  },
  fontWeight: {
    // ...defaultTheme.fontWeight,
    h1: 600,
    h2: 600,
    h3: 600,
    h4: 600,
    h5: 600,
    h6: 600,
    subtitle1: 600,
    subtitle2: 400,
    body1: 500,
    body2: 500,
    button: 600,
    caption: 400,
    overline: 400
  },
  backgroundImage: {
    none: 'none',
    'home-bg-pattern': "url('/images/osmosis-home-bg-pattern.svg')",
    'loading-bar':
      'linear-gradient(to left,rgba(251, 251, 251, 0.1),rgba(251, 251, 251, 0.2),rgba(251, 251, 251, 0.3),rgba(251, 251, 251, 0.2),rgba(251, 251, 251, 0.1))',
    superfluid: 'linear-gradient(270deg, #64C5EE 0%, #EE64E8 100%);',
    supercharged: 'linear-gradient(270deg, #64C5EE 0%, #EE64E8 100%);',
    'gradient-alert': 'linear-gradient(134deg, #12705F 0%, #233078 46.87%, #0D7389 100%);',
    'superfluid-20': 'linear-gradient(90deg, rgba(138, 134, 255, 0.2) 0.04%, rgba(225, 60, 189, 0.2) 99.5%)',
    'gradient-neutral': 'linear-gradient(96.42deg, #462ADF -0.59%, #8A86FF 100%);',
    'gradient-positive': 'linear-gradient(96.28deg, #899EFF 0%, #28F6AF 99.28%);',
    'gradient-negative': 'linear-gradient(96.42deg, #B03A20 -0.59%, #FA825D 100%);',
    'gradient-supercharged': 'linear-gradient(270deg, #64C5EE 0%, #EE64E8 100%);',
    'gradient-hero-card': 'linear-gradient(to bottom,rgba(0, 0, 0, 0),rgba(0, 0, 0, 0.8));',
    'gradient-dummy-notifications': 'linear-gradient(0deg, #282750 0%, rgba(40, 39, 80, 0.00) 100%)',
    'gradient-token-details-shadow': 'linear-gradient(0deg, #090524 6.87%, rgba(20, 15, 52, 0) 100%);',
    'gradient-scrollable-allocation-list': 'linear-gradient(0deg, #201B43 20%, rgba(20, 15, 52, 0) 100%);',
    'gradient-scrollable-allocation-list-reverse': 'linear-gradient(180deg, #201B43 10%, rgba(20, 15, 52, 0) 30%);',
    'gradient-earnpage-position-bg': 'linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0), #462ADF 100%)',
    'gradient-earnpage-tvl-depositcap': 'linear-gradient(to right, #462ADF, #8A86FF)'
  },
  screens: {
    '3xl': { max: '1792px' },
    // => @media (max-width: 1792px) { ... }

    '2xl': { max: '1536px' },
    // => @media (max-width: 1536px) { ... }

    '1.5xl': { max: '1408px' },
    // => @media (max-width: 1408px) { ... }

    xl: { max: '1280px' },
    // => @media (max-width: 1280px) { ... }

    '1.5lg': { max: '1152px' },
    // => @media (max-width: 1152px) { ... }

    lg: { max: '1024px' },
    // => @media (max-width: 1024px) { ... }

    '1.5md': { max: '896px' },
    // => @media (max-width: 896px) { ... }

    md: { max: '768px' },
    // => @media (max-width: 768px) { ... }

    sm: { max: '640px' },
    // => @media (max-width: 640px) { ... }

    '1.5xs': { max: '512px' },
    // => @media (max-width: 512px) { ... }

    xs: { max: '420px' }
  },
  extend: {
    height: {
      navbar: '72px',
      'navbar-mobile': '65px',
      content: 'calc(100vh - 72px)',
      'content-mobile': 'calc(100vh - 58px)'
    },
    flex: {
      'basis-50': '0 1 50%'
    },
    gridTemplateColumns: {
      tokenpage: 'minmax(0, 1fr), minmax(0, 430px)',
      tokenStats: 'repeat(auto-fill, minmax(150px, 1fr))',
      earnpage: 'minmax(0, 1fr), minmax(0, 332px)',
      earnpositions: 'minmax(0, 1fr), 1px, minmax(0, 284px)'
    },
    width: {
      25: '6.25rem',
      loader: {
        1: '3.75rem',
        2: '4rem',
        3: '4.25rem',
        4: '4.5rem',
        5: '4.75rem',
        6: '5rem'
      }
    },
    spacing: {
      navbar: '72px',
      'navbar-mobile': '65px',
      sidebar: '14.58rem',
      'mobile-header': '6rem',
      'rewards-w': '108px',
      0.25: '1px',
      4.5: '18px',
      10.5: '2.625rem',
      13: '3.25rem'
    },
    maxWidth: {
      container: '70rem',
      clipboard: '32.5rem',
      modal: '42rem',
      35: '35%'
    },
    maxHeight: {
      terms: '28rem'
    },
    minWidth: {
      10: '2.5rem',
      'rewards-container': '332px',
      'multi-radio': '290px',
      'dropdown-with-label': '200px',
      'strategy-buttons': '186px'
    },
    keyframes: {
      loading: {
        '0%': { transform: 'translateX(-150%)' },
        '100%': { transform: 'translateX(200%)' }
      },
      flash: {
        '0%': { color: 'inherit' },
        '50%': { color: '#29D0B2' },
        '100%': { opacity: 'inherit' }
      }
    },
    animation: {
      loading: 'loading 1s ease-in-out infinite',
      'spin-slow': 'spin 1.5s ease-in-out infinite',
      flash: 'flash 1s ease-in-out infinite'
    },
    boxShadow: {
      separator: '0px -1px 0px 0px rgba(255, 255, 255, 0.12)',
      md: '0px 6px 8px rgba(9, 5, 36, 0.2)',
      'volatility-preset': '0px 0px 12px 2px #8C8AF9'
    },
    borderRadius: {
      none: '0',
      lginset: '0.438rem', // 1px smaller than rounded-lg
      xlinset: '0.688rem', // 1px smaller than rounded-xl
      '2xlinset': '0.938rem', // 1 px smaller than rounded-2xl
      '3x4pxlinset': '1.25rem', // 4px smaller than rounded-3xl
      '4x4pxlinset': '1.5rem', // 4px smaller than 4xl
      '4xl': '1.75rem',
      '5xl': '2rem'
    },
    transitionTimingFunction: {
      bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      inOutBack: 'cubic-bezier(0.7, -0.4, 0.4, 1.4)',
      outBack: 'cubic-bezier(0.46, 0.47, 0.4, 1.4)',
      inBack: 'cubic-bezier(0.7, -0.4, 0.52, 0.51)'
    },
    transitionProperty: {
      height: 'height',
      width: 'width',
      borderRadius: 'border-radius'
    },
    letterSpacing: {
      wide: '.009375em',
      wider: '.025em'
    }
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
    extendLeft = 0
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
              colors: ['#A6BE93'],
              gridColor: '#232521',
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
                  from={theme.colors.chartGradientPrimary}
                  to={theme.colors.chartGradientSecondary}
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
                stroke={theme.colors.wosmongton['200']}
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
                stroke={'#0ECB81'}
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
                stroke={'#FFF27A'}
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
                stroke: theme.colors.osmoverse['300']
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
