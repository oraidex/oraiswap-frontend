/* eslint-disable import/no-anonymous-default-export */
import Loader from 'components/Loader';
import NotFound from 'pages/NotFound';
import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Balance from 'pages/Balance';
import PoolsV3 from 'pages/Pool-V3';
import PoolDetail from 'pages/Pools/PoolDetail';
import UniversalSwap from 'pages/UniversalSwap/index';
import CoHarvest from 'pages/CoHarvest';
import BitcoinDashboardV2 from 'pages/BitcoinDashboardV2';
import StakingPage from 'pages/Staking';
import DownloadApp from 'pages/DownloadApp';
import PoolV3Detail from 'pages/Pool-V3/components/PoolDetail';

export default () => (
  <Suspense
    fallback={
      <div
        style={{
          height: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Loader />
      </div>
    }
  >
    <Routes>
      <Route path="/" element={<UniversalSwap />} />
      <Route path="/bridge" element={<Balance />} />
      <Route path="/universalswap" element={<UniversalSwap />} />
      <Route path="/swap" element={<UniversalSwap />} />
      <Route path="/pools" element={<PoolsV3 />} />
      <Route path="/pools-v3" element={<Navigate to="/pools" replace />} />
      <Route path="/pools/v3/:poolId" element={<PoolV3Detail />} />
      <Route path="/pools/v2/:poolUrl" element={<PoolDetail />} />
      <Route path="/co-harvest" element={<CoHarvest />} />
      <Route path="/bitcoin-dashboard-v2" element={<BitcoinDashboardV2 />} />
      <Route path="/download-owallet" element={<DownloadApp />} />
      <Route path="/staking" element={<StakingPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);
