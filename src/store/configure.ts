import { configureStore, combineReducers } from '@reduxjs/toolkit';
import tokenReducer from '../reducer/token';
import configReducer from '../reducer/config';
import pairInfosReduce from '../reducer/pairs';
import tradingReducer from '../reducer/tradingSlice';
import walletReducer from '../reducer/wallet';
import chartReducer from '../reducer/chartSlice';
import AddressBookReducer from '../reducer/addressBook';
import TemporaryConfigReducer from '../reducer/temporaryConfig';
import poolDetailV3Reducer from 'reducer/poolDetailV3';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';
import { PERSIST_CONFIG_KEY } from './constants';

const rootPersistConfig = {
  key: PERSIST_CONFIG_KEY,
  storage,
  blacklist: ['temporaryConfig', 'poolDetailV3']
};

const rootReducer = combineReducers({
  config: configReducer,
  token: tokenReducer,
  pairInfos: pairInfosReduce,
  trading: tradingReducer,
  wallet: walletReducer,
  chartSlice: chartReducer,
  addressBook: AddressBookReducer,
  temporaryConfig: TemporaryConfigReducer,
  poolDetailV3: poolDetailV3Reducer
});

const persistedReducer = persistReducer(rootPersistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
