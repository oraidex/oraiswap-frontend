import React, { useContext, useEffect } from 'react';
import { Header } from './components/Header';
import Content from 'layouts/Content';
import styles from './index.module.scss';
import Checkpoint from './components/Checkpoint/Checkpoint';
import { PendingDeposits } from './components/PendingDeposits';
import { Tabs, KeysFilter } from './components/Tabs/Tabs';
import { useSearchParams } from 'react-router-dom';
import { PendingWithdraws } from './components/PendingWithdraws';
import ConvertBitcoinV2 from './components/ConvertBitcoinV2';
import { NomicContext } from 'context/nomic-context';
import { CwBitcoinContext } from 'context/cw-bitcoin-context';
import useConfigReducer from 'hooks/useConfigReducer';

const BitcoinDashboard: React.FC<{}> = () => {
  const [oraiAddress] = useConfigReducer('address');
  const [searchParams, _] = useSearchParams();
  const tab = searchParams.get('tab');
  const nomic = useContext(NomicContext);
  const cwBitcoinContext = useContext(CwBitcoinContext);
  //@ts-ignore
  const isOwallet = window.owallet?.isOwallet;

  const getAddress = async () => {
    try {
      await nomic.generateAddress();
    } catch (error) {
      console.log('🚀 ~ getAddress ~ error:', error);
    }
  };
  const renderTabs = () => {
    switch (tab) {
      case KeysFilter.pending_deposits:
        return <PendingDeposits />;
      case KeysFilter.checkpoint:
        return <Checkpoint />;
      case KeysFilter.pending_withdraws:
        return <PendingWithdraws />;
      case KeysFilter.convert_bitcoin_v2:
        return <ConvertBitcoinV2 />;
    }
  };

  useEffect(() => {
    // TODO: should dynamic generate address when change destination chain.
    if (oraiAddress) {
      cwBitcoinContext.generateAddress({
        address: oraiAddress
      });
    }
  }, [isOwallet, oraiAddress]);
  useEffect(() => {
    if (isOwallet) {
      getAddress();
    }
  }, [oraiAddress, isOwallet]);

  return (
    <Content nonBackground otherBackground>
      <div className={styles.container}>
        <Header />
        <Tabs />
        {renderTabs()}
      </div>
    </Content>
  );
};

export default BitcoinDashboard;
