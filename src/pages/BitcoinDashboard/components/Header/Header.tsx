import { toDisplay } from '@oraichain/oraidex-common';
import BitcoinIcon from 'assets/icons/bitcoin.svg?react';
import TokenBalance from 'components/TokenBalance';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import { FC, useEffect, useState } from 'react';
import { useGetBitcoinConfig, useGetCheckpointQueue, useGetTotalValueLocked } from '../../hooks';
import styles from './Header.module.scss';

// TODO: Update this method when BTC is added to pool
// CURRENT REPLACEMENT: Fetch price from other platform
export const useGetBitcoinPrice = () => {
  const [price, setPrice] = useState(0);
  const {
    data: { bitcoin }
  } = useCoinGeckoPrices();

  useEffect(() => {
    setPrice(bitcoin);
  }, [bitcoin]);

  return price;
};

export const Header: FC<{}> = ({}) => {
  const [btcAddress, setBtcAddress] = useConfigReducer('btcAddress');
  const btcPrice = useGetBitcoinPrice();
  const valueLocked = useGetTotalValueLocked();
  const bitcoinConfig = useGetBitcoinConfig();
  const checkpointQueue = useGetCheckpointQueue();

  const BITCOIN_INFO = {
    name: 'Bitcoin Price',
    Icon: BitcoinIcon,
    value: btcPrice,
    isNegative: true,
    decimal: 2
  };

  const overallData = [
    {
      name: 'Min Confirmations',
      Icon: null,
      value: bitcoinConfig?.min_confirmations || 0, // || statisticData.totalLiquidity,
      isNegative: false,
      decimal: 2
      //   openChart: false
    },
    {
      name: 'Total Reserve Value',
      Icon: null,
      value: toDisplay(BigInt(valueLocked?.value || 0), 8), // || statisticData.volume,
      isNegative: false,
      decimal: 6
      //   openChart: false
    },
    {
      name: 'Total Checkpoints',
      Icon: null,
      value: checkpointQueue?.index || 0, // || statisticData.volume,
      isNegative: false,
      decimal: 2
      //   openChart: false
    },
    {
      name: 'Confirmed Checkpoint',
      Icon: null,
      value: checkpointQueue?.confirmed_index || 0, // || statisticData.volume,
      isNegative: false,
      decimal: 2
      //   openChart: false
    }
  ];

  useEffect(() => {
    (async () => {
      try {
        const btcAddr = btcAddress ?? (await window.Bitcoin.getAddress());
        setBtcAddress(btcAddr);
      } catch (e) {}
    })();
  }, []);

  return (
    <div className={styles.header}>
      <div className={styles.header_title}>
        {/* <span className={styles.header_title_text}>POOLS</span> */}
        <div className={styles.header_title_text}>
          <div>
            <BITCOIN_INFO.Icon />
          </div>
          <span className={styles.priceOrai}>{BITCOIN_INFO.name}</span>
          <TokenBalance
            balance={BITCOIN_INFO.value}
            prefix="$"
            className={styles.overrall_value}
            decimalScale={BITCOIN_INFO.decimal || 6}
          />
        </div>
      </div>

      <div className={styles.header_overrall}>
        {overallData.map((e) => (
          <div key={e.name} className={`${styles.header_overrall_item}`}>
            <div className={styles.info}>
              <div className={styles.content}>
                <span>{e.name}</span>
                <div className={styles.header_overrall_item_info}>
                  {e.Icon && (
                    <div>
                      <e.Icon />
                    </div>
                  )}
                  <TokenBalance
                    balance={e.value}
                    prefix=""
                    className={styles.overrall_value}
                    decimalScale={e.decimal || 6}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
