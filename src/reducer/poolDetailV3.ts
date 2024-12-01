// TODO: init OraidexCommon
import { TokenItemType } from '@oraichain/oraidex-common';
import { Pool, PoolKey } from '@oraichain/oraidex-contracts-sdk/build/OraiswapV3.types';
import { extractAddress, LiquidityTick, Tickmap } from '@oraichain/oraiswap-v3';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { oraichainTokens } from 'index';
import SingletonOraiswapV3, { PRICE_SCALE, stringToPoolKey } from 'libs/contractSingleton';
import {
  convertPlotTicks,
  createLiquidityPlot,
  createPlaceholderLiquidityPlot,
  printBigint
} from 'pages/Pool-V3/components/PriceRangePlot/utils';
import { getHistoricalPriceDataInDay, getHistoricalPriceDataInHour } from 'rest/graphClient';

export const AvailableTimeDurations = ['7d', '1mo', '3mo', '1y'] as const;

export type TimeDuration = (typeof AvailableTimeDurations)[number];

export interface TokenPairHistoricalPrice {
  close: number;
  time: number;
}

export interface LiquidityChartData {
  price: number;
  depth: number;
}

export type ActiveLiquidityPerTickRange = {
  /** Price-correlated tick index. */
  lowerTick: number;
  upperTick: number;
  /** Net liquidity, for calculating active liquidity. */
  liquidityAmount: number;
};

export interface PoolDetailV3State {
  poolId: string; //
  poolKey: PoolKey; //
  pool: Pool;
  tokenX: TokenItemType; //
  tokenY: TokenItemType; //
  isXToY: boolean; //
  historicalRange: TimeDuration; //
  cache7Day: TokenPairHistoricalPrice[]; //
  cache1Month: TokenPairHistoricalPrice[]; //
  cache3Month: TokenPairHistoricalPrice[]; //
  cache1Year: TokenPairHistoricalPrice[]; //
  historicalChartData: TokenPairHistoricalPrice[]; //
  fullRange: boolean; //
  xRange: [number, number]; //
  yRange: [number, number]; //
  currentPrice: number; //
  fullTickMap: Tickmap;
  liquidityTicks: LiquidityTick[];
  liquidityChartData: LiquidityChartData[];
  zoom: number;
  range: [number, number];
}

const initialState: PoolDetailV3State = {
  poolId: '',
  poolKey: null,
  pool: null,
  tokenX: null,
  tokenY: null,
  isXToY: true,
  historicalRange: '7d',
  cache7Day: null,
  cache1Month: null,
  cache3Month: null,
  cache1Year: null,
  historicalChartData: null,
  fullRange: false,
  xRange: null,
  yRange: null,
  currentPrice: null,
  fullTickMap: null,
  liquidityTicks: null,
  liquidityChartData: null,
  zoom: 1.1,
  range: undefined
};

export const poolDetailV3Slice = createSlice({
  name: 'poolDetailV3',
  initialState,
  reducers: {
    setPoolId: (state, action: PayloadAction<string>) => {
      state.poolId = action.payload;
      const poolKey = stringToPoolKey(action.payload);
      state.poolKey = poolKey;
      const tokenX = oraichainTokens.find((token) => extractAddress(token) === poolKey.token_x);
      const tokenY = oraichainTokens.find((token) => extractAddress(token) === poolKey.token_y);
      state.tokenX = tokenX;
      state.tokenY = tokenY;
    },
    setYRange: (state, action: PayloadAction<[number, number]>) => {
      state.yRange = action.payload;
    },
    setXRange: (state, action: PayloadAction<[number, number]>) => {
      state.xRange = action.payload;
    },

    /*
    get depthChartData(): { price: number; depth: number }[] {
      const data = this.activeLiquidity;
      
      const [min, max] = this.yRange;
      if (min === max) return [];
      
      const depths: { price: number; depth: number }[] = [];
      
      for (let price = min; price <= max; price += (max - min) / 20) {
        if (this.multiplicationQuoteOverBase.isZero()) continue;
        
        const spotPriceToConvert = new Dec(price).quo(
          this.multiplicationQuoteOverBase
          );
          
          depths.push({
            price,
            depth: getLiqFrom(
              priceToTick(
                spotPriceToConvert.gt(maxSpotPrice)
                ? maxSpotPrice
                : spotPriceToConvert.lt(minSpotPrice)
                ? minSpotPrice
              : spotPriceToConvert
          ),
          data
        ),
      });
    }

    return depths;
  }
    */

    setLiquidityChartData: (state) => {
      if (!state.liquidityTicks || !state.poolKey || !state.tokenX || !state.tokenY || !state.yRange) return;

      const [min, max] = state.yRange;

      if (min === max) state.liquidityChartData = [];
      else {
        if (state.liquidityTicks.length === 0) {
          const depths: { price: number; depth: number }[] = [];

          for (let price = min; price <= max; price += (max - min) / 20) {
            depths.push({
              price,
              depth: 0
            });
          }
          state.liquidityChartData = depths;
          return;
        }

        const plots = createLiquidityPlot(
          state.liquidityTicks,
          state.poolKey.fee_tier.tick_spacing,
          state.isXToY,
          state.tokenX.decimals,
          state.tokenY.decimals
        );

        const fullData = plots.map((tick) => {
          return {
            price: tick.x,
            depth: tick.y
          };
        });
        const depths: { price: number; depth: number }[] = [];

        for (let price = min; price <= max; price += (max - min) / 20) {
          const liquidityItem = fullData.find(
            (item, index) => price >= item.price && price <= fullData[index + 1]?.price
          );

          let depth = liquidityItem ? liquidityItem.depth : 0;

          depths.push({
            price,
            depth
          });
        }

        state.liquidityChartData = depths;
      }
    },
    setHistoricalChartData: (state, action: PayloadAction<TokenPairHistoricalPrice[]>) => {
      let data = action.payload;
      state.historicalChartData = data;
    },
    setHistoricalRange: (state, action: PayloadAction<TimeDuration>) => {
      state.historicalRange = action.payload;
      switch (state.historicalRange) {
        case '7d':
          state.historicalChartData = state.cache7Day;
          break;
        case '1mo':
          state.historicalChartData = state.cache1Month;
          break;
        case '3mo':
          state.historicalChartData = state.cache3Month;
          break;
        case '1y':
          state.historicalChartData = state.cache1Year;
          break;
        default:
          state.historicalChartData = state.cache7Day;
      }
    },
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = action.payload;
    },
    setFullTickMap: (state, action: PayloadAction<Tickmap>) => {
      state.fullTickMap = action.payload;
    },
    setAllLiquidityTicks: (state, action: PayloadAction<LiquidityTick[]>) => {
      state.liquidityTicks = action.payload;
    },
    setToDefault: () => ({ ...initialState }),
    setIsXToY: (state, action: PayloadAction<boolean>) => {
      state.isXToY = action.payload;
      state.currentPrice = 1 / state.currentPrice;
      if (state.historicalRange) {
        state.historicalChartData = revertHistoricalChartData(state.historicalChartData);
        state.cache3Month = revertHistoricalChartData(state.cache3Month);
        state.cache7Day = revertHistoricalChartData(state.cache7Day);
        state.cache1Month = revertHistoricalChartData(state.cache1Month);
        state.cache1Year = revertHistoricalChartData(state.cache1Year);
      }
      if (state.liquidityChartData) {
        state.liquidityChartData = revertLiquidityChartData(state.liquidityChartData);
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchPool.fulfilled, (state, action) => {
      state.pool = action.payload;
      const sqrtPrice = +printBigint(BigInt(state.pool.sqrt_price), Number(PRICE_SCALE));
      const price = (sqrtPrice * sqrtPrice) / 10 ** ((state.tokenY.decimals ?? 0) - (state.tokenX.decimals ?? 0));
      state.currentPrice = price;
    });
    builder.addCase(fetchHistoricalPriceData3M.fulfilled, (state, action) => {
      if (action.payload.poolId !== state.poolId) return;
      state.cache3Month = state.isXToY ? action.payload.data : revertHistoricalChartData(action.payload.data);
      if (state.historicalRange === '3mo') {
        state.historicalChartData = state.cache3Month;
      }
    });
    builder.addCase(fetchHistoricalPriceData7D.fulfilled, (state, action) => {
      if (action.payload.poolId !== state.poolId) return;
      state.cache7Day = state.isXToY ? action.payload.data : revertHistoricalChartData(action.payload.data);
      if (state.historicalRange === '7d') {
        state.historicalChartData = state.cache7Day;
      }
    });
    builder.addCase(fetchHistoricalPriceData1M.fulfilled, (state, action) => {
      if (action.payload.poolId !== state.poolId) return;
      state.cache1Month = state.isXToY ? action.payload.data : revertHistoricalChartData(action.payload.data);
      if (state.historicalRange === '1mo') {
        state.historicalChartData = state.cache1Month;
      }
    });
    builder.addCase(fetchHistoricalPriceData1Y.fulfilled, (state, action) => {
      if (action.payload.poolId !== state.poolId) return;
      state.cache1Year = state.isXToY ? action.payload.data : revertHistoricalChartData(action.payload.data);
      if (state.historicalRange === '1y') {
        state.historicalChartData = state.cache1Year;
      }
    });
    builder.addCase(fetchTickMap.fulfilled, (state, action) => {
      state.fullTickMap = action.payload;
    });
    builder.addCase(fetchLiquidityTicks.fulfilled, (state, action) => {
      state.liquidityTicks = action.payload;
    });
  }
});

export const fetchTickMap = createAsyncThunk('poolDetailV3/fetchTickMap', async (poolKey: PoolKey) => {
  return await SingletonOraiswapV3.getFullTickmap(poolKey);
});

export const fetchLiquidityTicks = createAsyncThunk(
  'poolDetailV3/fetchLiquidityTicks',
  async ({ poolKey, tickMap }: { poolKey: PoolKey; tickMap: Tickmap }) => {
    return await SingletonOraiswapV3.getAllLiquidityTicks(poolKey, tickMap);
  }
);

export const fetchPool = createAsyncThunk('poolDetailV3/fetchPool', async (poolKey: PoolKey) => {
  return (await SingletonOraiswapV3.getPool(poolKey)).pool;
});

export const fetchActiveLiquidityData = createAsyncThunk(
  'poolDetailV3/fetchActiveLiquidityData',
  async ({
    poolKey,
    isXToY,
    xDecimal,
    yDecimal
  }: {
    poolKey: PoolKey;
    isXToY: boolean;
    xDecimal: number;
    yDecimal: number;
  }) => {
    return await convertPlotTicks({
      poolKey,
      isXToY,
      xDecimal,
      yDecimal
    });
  }
);

// separate to 4 actions for better caching and performance
export const fetchHistoricalPriceData3M = createAsyncThunk(
  'poolDetailV3/fetchHistoricalPriceData3M',
  async (poolId: string) => {
    return await getHistoricalPriceDataInDay(poolId, '3mo');
  }
);

export const fetchHistoricalPriceData7D = createAsyncThunk(
  'poolDetailV3/fetchHistoricalPriceData7D',
  async (poolId: string) => {
    return await getHistoricalPriceDataInHour(poolId, '7d');
  }
);

export const fetchHistoricalPriceData1M = createAsyncThunk(
  'poolDetailV3/fetchHistoricalPriceData1M',
  async (poolId: string) => {
    return await getHistoricalPriceDataInDay(poolId, '1mo');
  }
);

export const fetchHistoricalPriceData1Y = createAsyncThunk(
  'poolDetailV3/fetchHistoricalPriceData1Y',
  async (poolId: string) => {
    return await getHistoricalPriceDataInDay(poolId, '1y');
  }
);

const revertLiquidityChartData = (data: LiquidityChartData[]) => {
  if (!data) return [];
  return data.map((item) => {
    return {
      price: 1 / item.price,
      depth: item.depth
    };
  });
};

const revertHistoricalChartData = (data: TokenPairHistoricalPrice[]) => {
  if (!data) return [];
  return data.map((item) => {
    return {
      time: item.time,
      close: 1 / item.close
    };
  });
};

export const {
  setPoolId,
  setXRange,
  setYRange,
  setLiquidityChartData,
  setHistoricalChartData,
  setHistoricalRange,
  setZoom,
  setToDefault,
  setIsXToY
} = poolDetailV3Slice.actions;

export default poolDetailV3Slice.reducer;
