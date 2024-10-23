import { ParentSize } from '@visx/responsive';
import { scaleLinear } from '@visx/scale';
import {
  AnimatedAxis,
  AnimatedGrid,
  Annotation,
  AnnotationCircleSubject,
  AnnotationConnector,
  AnnotationLineSubject,
  BarSeries,
  buildChartTheme,
  XYChart
} from '@visx/xychart';
import { FC } from 'react';
import { theme } from '../HistoricalPriceChart';
import styles from './index.module.scss';
import { max, min } from 'lodash';

export type DepthData = {
  price: number;
  depth: number;
};

export const ConcentratedLiquidityDepthChart: FC<{
  min?: number;
  max?: number;
  yRange: [number, number];
  xRange: [number, number];
  data: DepthData[];
  annotationDatum?: DepthData;
  onMoveMax?: (value: number) => void;
  onMoveMin?: (value: number) => void;
  onSubmitMax?: (value: number) => void;
  onSubmitMin?: (value: number) => void;
  offset?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  horizontal?: boolean;
  fullRange?: boolean;
  rangeAnnotation?: DepthData[];
}> = ({
  data,
  min,
  max,
  yRange,
  xRange,
  annotationDatum,
  rangeAnnotation = [],
  onMoveMin,
  onMoveMax,
  onSubmitMin,
  onSubmitMax,
  offset,
  horizontal = true,
  fullRange = false
}) => {
  const xMax = xRange[1];
  const showMinDragHandler = min !== undefined && Boolean(onMoveMin) && Boolean(onSubmitMin);
  const showMaxDragHandler = max !== undefined && Boolean(onMoveMax) && Boolean(onSubmitMax);

  const { top = 0, right = 0, bottom = 0, left = 0 } = offset || {};

  // these callbacks only invoke the onMove/onSubmit callbacks if the bounds are correct
  const onMoveMinBoundary = (value: number) => {
    if (onMoveMin && max && value < max) {
      onMoveMin(value);
    }
  };
  const onMoveMaxBoundary = (value: number) => {
    if (onMoveMax && min && value > min) {
      onMoveMax(value);
    }
  };

  return (
    <ParentSize className={styles.parentSize}>
      {({ height, width }) => {
        // const maxHeight = 290;
        // const customHeight = Math.min(height, maxHeight);

        const yScale = scaleLinear({
          range: [top, height * 1.134 - bottom],
          domain: yRange.slice().reverse(),
          zero: false
        });
        // console.log('height', height);

        return (
          <XYChart
            captureEvents={false}
            margin={{ top: fullRange ? top - 8.5 : top, right, bottom, left }}
            height={height * 1.134}
            width={width}
            xScale={{
              type: 'linear',
              domain: xRange
            }}
            yScale={{
              type: 'linear',
              domain: yRange,
              zero: false
            }}
            theme={buildChartTheme({
              backgroundColor: 'transparent',
              colors: ['white'],
              gridColor: theme.colors.osmoverse['600'],
              gridColorDark: theme.colors.osmoverse['300'],
              svgLabelSmall: {
                fill: theme.colors.osmoverse['300'],
                fontSize: 12,
                fontWeight: 500
              },
              svgLabelBig: {
                fill: theme.colors.osmoverse['300'],
                fontSize: 12,
                fontWeight: 500
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
            horizontal={horizontal}
          >
            {/* <AnimatedAxis orientation="right" numTicks={7} strokeWidth={0} />
            <AnimatedGrid columns={false} numTicks={7} /> */}
            <AnimatedGrid columns={false} rows={false} numTicks={7} />
            <BarSeries
              dataKey="depth"
              data={data}
              xAccessor={(d: DepthData) => d?.depth}
              yAccessor={(d: DepthData) => d?.price}
              colorAccessor={() => theme.colors.barFill}
            />
            {annotationDatum && (
              <Annotation
                dataKey="depth"
                xAccessor={(d: DepthData) => d.depth}
                yAccessor={(d: DepthData) => d.price}
                datum={annotationDatum}
              >
                <AnnotationConnector />
                <AnnotationCircleSubject
                  stroke={'#A6BE93'}
                  // @ts-ignore
                  strokeWidth={4}
                  radius={2}
                />
                <AnnotationLineSubject
                  orientation="horizontal"
                  stroke={'#A6BE93'}
                  strokeWidth={2.2}
                />
              </Annotation>
            )}
            {Boolean(rangeAnnotation.length) &&
              rangeAnnotation.map((datum, i) => (
                <Annotation
                  key={`concentrate-${i}`}
                  dataKey="depth"
                  xAccessor={(d) => d.depth}
                  yAccessor={(d) => d.price}
                  datum={datum}
                >
                  <AnnotationConnector />
                  <AnnotationLineSubject
                    orientation="horizontal"
                    stroke={theme.colors.wosmongton['200']}
                    strokeWidth={2}
                    strokeDasharray={4}
                  />
                </Annotation>
              ))}
            {showMaxDragHandler && (
              <DragContainer
                key={'max:' + yRange.join('_')}
                defaultValue={fullRange ? yRange[1] * 0.95 : max}
                length={xMax}
                scale={yScale}
                stroke={'#FFF27A'}
                onMove={onMoveMaxBoundary}
                onSubmit={onSubmitMax}
              />
            )}
            {showMinDragHandler && (
              <DragContainer
                key={'min:' + yRange.join('_')}
                defaultValue={fullRange ? yRange[0] * 1.05 : min}
                length={xMax}
                scale={yScale}
                stroke={'#0ECB81'}
                onMove={onMoveMinBoundary}
                onSubmit={onSubmitMin}
              />
            )}
            <style>{`
                .visx-bar {
                  stroke: ${theme.colors.barFill};
                  stroke-width: 3px;
                }
              `}</style>
          </XYChart>
        );
      }}
    </ParentSize>
  );
};

const DragContainer: FC<{
  defaultValue?: number;
  length?: number;
  scale: any;
  onMove?: (value: number) => void;
  onSubmit?: (value: number) => void;
  stroke: string;
}> = (props) => (
  <Annotation
    dataKey="depth"
    xAccessor={(d: any) => d?.depth}
    yAccessor={(d: any) => d?.tick}
    datum={{ tick: props.defaultValue, depth: props.length }}
    canEditSubject
    canEditLabel={false}
    onDragMove={({ event, ...nextPos }) => {
      event.preventDefault()
      event.stopPropagation()
      if (props.onMove) {
        const val = props.scale.invert(nextPos.y);
        props.onMove(+Math.max(0, val));
      }
    }}
    onDragEnd={({ event, ...nextPos }) => {
      event.preventDefault()
      event.stopPropagation()
      if (props.onSubmit) {
        const val = props.scale.invert(nextPos.y);
        props.onSubmit(+Math.max(0, val));
      }
    }}
    editable
  >
    <AnnotationLineSubject orientation="horizontal" stroke={props.stroke} strokeWidth={2} />
    <AnnotationCircleSubject
      stroke={props.stroke}
      // @ts-ignore
      strokeWidth={8}
      radius={2}
    />
  </Annotation>
);
