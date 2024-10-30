import { TokenItemType, parseTokenInfoRawDenom, toDisplay } from '@oraichain/oraidex-common';
import { isMobile } from '@walletconnect/browser-utils';
import { ReactComponent as LinkIcon } from 'assets/icons/link.svg';
import { ReactComponent as DefaultIcon } from 'assets/icons/tokens.svg';
import { ReactComponent as NoDataDark } from 'assets/images/nodata-bid-dark.svg';
import { ReactComponent as NoData } from 'assets/images/nodata-bid.svg';
import LoadingBox from 'components/LoadingBox';
import { network } from 'config/networks';
import { getTransactionUrl } from 'helper';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import { reduceString } from 'libs/utils';
import { formatDateV2, formatTime } from 'pages/CoHarvest/helpers';
import { useTransactionHistory } from 'pages/Pool-V3/hooks/useTransactionHistory';
import { formatDisplayUsdt, numberWithCommas } from 'pages/Pools/helpers';
import styles from './index.module.scss';

const TransactionHistory = ({
  baseToken,
  quoteToken,
  poolKey
}: {
  baseToken: TokenItemType;
  quoteToken: TokenItemType;
  poolKey: string;
}) => {
  const [theme] = useConfigReducer('theme');
  const mobileMode = isMobile();
  const { data: prices } = useCoinGeckoPrices();

  let [BaseTokenIcon, QuoteTokenIcon] = [DefaultIcon, DefaultIcon];

  const baseDenom = baseToken && parseTokenInfoRawDenom(baseToken);
  const quoteDenom = quoteToken && parseTokenInfoRawDenom(quoteToken);

  const { txHistories, isFetched } = useTransactionHistory(poolKey);

  if (!isFetched) {
    return (
      <LoadingBox loading={true} className={styles.loadingDivWrapper}>
        <div className={styles.loadingDiv}></div>
      </LoadingBox>
    );
  }

  return (
    <LoadingBox loading={false} className={styles.loadingDivWrapper}>
      <div className={styles.txHistory}>
        <div className={styles.title}>Last 20 transactions</div>

        {txHistories?.length > 0 ? (
          mobileMode ? (
            <div className={styles.listData}>
              {txHistories
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((item, index) => {
                  const offerToken = item.offerDenom === baseDenom ? baseToken : quoteToken;
                  const returnToken = item.askDenom === quoteDenom ? quoteToken : baseToken;

                  if (offerToken)
                    BaseTokenIcon = theme === 'light' ? offerToken.IconLight || offerToken.Icon : offerToken.Icon;
                  if (returnToken)
                    QuoteTokenIcon = theme === 'light' ? returnToken.IconLight || returnToken.Icon : returnToken.Icon;

                  const returnUSD = item.volumeUSD;
                  const feeUSD = item.commissionAmount;

                  return (
                    <div className={styles.item} key={index}>
                      <div className={styles.info}>
                        <div className={styles.top}>
                          <div className={styles.hashWrapper}>
                            <div className={styles.titleItem}>TxHash</div>
                            <div className={styles.hash}>
                              <span className={styles.txhash}>{reduceString(item.txhash || '', 4, 4)}</span>
                              <a
                                href={getTransactionUrl(network.chainId, item.txhash || '')}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <LinkIcon />
                              </a>
                            </div>
                          </div>
                          {/* <div className={styles.addressWrapper}>
                            <div className={styles.titleItem}>Address</div>
                            <div className={styles.address}>
                              <span className={styles.txt}>
                                {!item.sender ? '-' : reduceString(item.sender || '', 5, 5)}
                              </span>
                              {!item.sender ? null : (
                                <a href={getAccountUrl(item.sender || '')} target="_blank" rel="noopener noreferrer">
                                  <LinkIcon />
                                </a>
                              )}
                            </div>
                          </div> */}
                          <div className={styles.time}>
                            <div>
                              <span>{formatDateV2(new Date(item.timestamp))}</span>
                              <span>{formatTime(new Date(item.timestamp))}</span>
                            </div>
                          </div>
                        </div>
                        {/* <div className={styles.time}>
                          <div>
                            <span>{formatDateV2(item.timestamp * 1000)}</span>
                            <span>{formatTime(item.timestamp * 1000)}</span>
                          </div>
                        </div> */}
                      </div>

                      <div className={styles.divider}></div>

                      <div className={styles.payReceive}>
                        <div className={`${styles.pay}`}>
                          <div className={styles.titleItem}>Pay amount</div>
                          <div className={styles.amount}>
                            <div>
                              <BaseTokenIcon />
                            </div>
                            <span>
                              {numberWithCommas(toDisplay(item.offerAmount), undefined, { maximumFractionDigits: 6 })}
                            </span>
                            <span className={styles.symbol}>{offerToken.name}</span>
                          </div>
                        </div>

                        <div className={`${styles.receive}`}>
                          <div className={styles.titleItem}>Receive amount</div>
                          <div className={styles.amount}>
                            <div>
                              <QuoteTokenIcon />
                            </div>
                            <span>
                              {numberWithCommas(toDisplay(item.returnAmount), undefined, { maximumFractionDigits: 6 })}
                            </span>
                            <span className={styles.symbol}>{returnToken.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.valueFee}>
                        <div className={styles.value}>
                          <div className={styles.titleItem}>Value</div>
                          <div className={styles.amount}>{formatDisplayUsdt(returnUSD)}</div>
                        </div>

                        <div className={styles.fee}>
                          <div className={styles.titleItem}>Fee</div>
                          <div className={styles.amount}>{formatDisplayUsdt(feeUSD)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>Tx Hash</th>
                    <th>Time</th>
                    <th className={styles.alignRight}>Pay Amount</th>
                    <th className={styles.alignRight}>Receive Amount</th>
                    <th className={styles.alignRight}>Value</th>
                    <th className={styles.alignRight}>Fee</th>
                    {/* <th>ADDRESS</th> */}
                  </tr>
                </thead>
                <tbody>
                  {txHistories
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((item, index) => {
                      const offerToken = item.offerDenom === baseDenom ? baseToken : quoteToken;
                      const returnToken = item.askDenom === quoteDenom ? quoteToken : baseToken;

                      if (offerToken)
                        BaseTokenIcon = theme === 'light' ? offerToken.IconLight || offerToken.Icon : offerToken.Icon;
                      if (returnToken)
                        QuoteTokenIcon =
                          theme === 'light' ? returnToken.IconLight || returnToken.Icon : returnToken.Icon;

                      const returnUSD = item.volumeUSD;
                      const feeUSD = item.commissionAmount;

                      return (
                        <tr className={styles.item} key={index}>
                          <td className={styles.hash}>
                            <span className={styles.txhash}>{reduceString(item.txhash || '', 4, 4)}</span>
                            <a
                              href={getTransactionUrl(network.chainId, item.txhash || '')}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <LinkIcon />
                            </a>
                          </td>
                          <td className={styles.time}>
                            <div>
                              <span>{formatDateV2(new Date(item.timestamp))}</span>
                              <span>{formatTime(new Date(item.timestamp))}</span>
                            </div>
                          </td>
                          <td className={`${styles.pay}`}>
                            <div className={styles.amount}>
                              <div>
                                <BaseTokenIcon />
                              </div>
                              <span>
                                {numberWithCommas(toDisplay(item.offerAmount), undefined, { maximumFractionDigits: 6 })}
                              </span>
                              <span className={styles.symbol}>{offerToken.name}</span>
                            </div>
                          </td>
                          <td className={`${styles.receive}`}>
                            <div className={styles.amount}>
                              <div>
                                <QuoteTokenIcon />
                              </div>
                              <span>
                                {numberWithCommas(toDisplay(item.returnAmount), undefined, {
                                  maximumFractionDigits: 6
                                })}
                              </span>
                              <span className={styles.symbol}>{returnToken.name}</span>
                            </div>
                          </td>
                          <td className={styles.value}>
                            <div className={styles.amount}>{formatDisplayUsdt(returnUSD)}</div>
                          </td>
                          <td className={styles.fee}>
                            <div className={styles.amount}>{formatDisplayUsdt(feeUSD)}</div>
                          </td>
                          {/* <td className={styles.address}>
                            <span className={styles.txt}>
                              {!item.sender ? '-' : reduceString(item.sender || '', 5, 5)}
                            </span>
                            {!item.sender ? null : (
                              <a href={getAccountUrl(item.sender || '')} target="_blank" rel="noopener noreferrer">
                                <LinkIcon />
                              </a>
                            )}
                          </td> */}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className={styles.nodata}>
            {theme === 'light' ? <NoData /> : <NoDataDark />}
            {/* <span>No data!</span> */}
          </div>
        )}
      </div>
    </LoadingBox>
  );
};

export default TransactionHistory;
