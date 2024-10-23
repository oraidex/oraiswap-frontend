import React from 'react';
import styles from './TransactionMobile.module.scss';
import { toDisplay } from '@oraichain/oraidex-common';
import { sortAddress } from 'pages/BitcoinDashboard/utils/bitcoin';
import RenderIf from 'pages/BitcoinDashboard/components/RenderIf/RenderIf';
import { isNull } from 'pages/BitcoinDashboard/utils/validate';

export interface TransactionInfo {
  txid?: String;
  address?: String;
  amount?: number;
  value?: number;
  vout?: number;
  confirmations?: number;
}

export interface ListTransactionsMobileInterface {
  generateIcon: () => JSX.Element;
  symbols: String;
  transactions?: TransactionInfo[];
}

const TransactionMobileItem: React.FC<TransactionInfo> = ({ txid, value, address, amount, vout, confirmations }) => {
  const handleTxNavigate = (txid: String) => {
    window.open(`https://blockstream.info/tx/${txid}`, '_blank');
  };

  const handleAddressNavigate = (address: String) => {
    window.open(`https://blockstream.info/address/${address}`, '_blank');
  };

  return (
    <div className={styles.poolInfo}>
      {!isNull(txid) && (
        <div onClick={() => handleTxNavigate(txid)}>
          <div className={styles.title}>Txid</div>
          <span className={styles.value}>{sortAddress(txid || '')}</span>
        </div>
      )}
      {!isNull(address) && (
        <div onClick={() => handleAddressNavigate(address)}>
          <div className={styles.title}>Address</div>
          <span className={styles.value}>{sortAddress(address || '')}</span>
        </div>
      )}
      {!isNull(vout) && (
        <div>
          <div className={styles.title}>Vout</div>
          <span className={styles.value}>{vout}</span>
        </div>
      )}
      {(!isNull(amount) || !isNull(value)) && (
        <div>
          <div className={styles.title}>Amount</div>
          <span className={styles.value}>{toDisplay(BigInt(amount || value || 0), 8)} BTC</span>
        </div>
      )}
      {!isNull(confirmations) && (
        <div>
          <div className={styles.title}>Confirmations</div>
          <span className={styles.value}>{confirmations}</span>
        </div>
      )}
    </div>
  );
};

const TransactionsMobile: React.FC<ListTransactionsMobileInterface> = ({ generateIcon, symbols, transactions }) => {
  return (
    <div className={styles.transaction_mobiles}>
      {transactions.map((item, idx) => {
        return (
          <article className={styles.transaction_mobiles_item} key={idx}>
            <div className={styles.poolHead}>
              <div className={styles.symbols}>
                <div>{generateIcon()}</div>
                <span className={styles.symbols_name}>{symbols}</span>
              </div>
            </div>
            <TransactionMobileItem {...item} />
          </article>
        );
      })}
    </div>
  );
};

export default TransactionsMobile;
