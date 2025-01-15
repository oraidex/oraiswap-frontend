/* eslint-disable import/no-anonymous-default-export */
import Loader from 'components/Loader';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import loadingGif from 'assets/gif/loading-page.gif';
const Balance = lazy(() => import('pages/Balance'));
const PoolsV3 = lazy(() => import('pages/Pool-V3'));
const PoolDetail = lazy(() => import('pages/Pools/PoolDetail'));
const UniversalSwap = lazy(() => import('pages/UniversalSwap/index'));
const CoHarvest = lazy(() => import('pages/CoHarvest'));
const BitcoinDashboardV2 = lazy(() => import('pages/BitcoinDashboardV2'));
const StakingPage = lazy(() => import('pages/Staking'));
const DownloadApp = lazy(() => import('pages/DownloadApp'));
const PoolV3Detail = lazy(() => import('pages/Pool-V3/components/PoolDetail'));
const NotFound = lazy(() => import('pages/NotFound'));

export default () => (
  <Suspense
    fallback={
      <div
        id="loader-fallback"
        style={{
          height: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'black',
          zIndex: 9999
        }}
      >
        <img src={loadingGif} width={110} height={110} alt="" />
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
