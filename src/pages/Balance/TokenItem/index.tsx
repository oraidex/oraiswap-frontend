import { TokenItemType } from '@oraichain/oraidex-common';
import classNames from 'classnames';
import TokenBalance from 'components/TokenBalance';
import TransferConvertToken from '../TransferConvertToken';
import styles from './index.module.scss';

export interface TokenItemProps {
  token: TokenItemType;
  amountDetail?: { amount: string; usd: number };
  name?: string;
  onClickTransfer: any;
  active: Boolean;
  className?: string;
  onClick?: Function;
  onBlur?: Function;
  subAmounts?: AmountDetails;
  theme?: string;
  onDepositBtc?: Function;
  isBtcOfOwallet?: boolean;
  isBtcToken?: boolean;
  isFastMode?: boolean;
  setIsFastMode?: Function;
  setToNetworkChainId: Function;
  toToken?: TokenItemType;
}

const TokenItem: React.FC<TokenItemProps> = ({
  token,
  amountDetail,
  active,
  className,
  onClick,
  onClickTransfer,
  subAmounts,
  theme,
  isBtcOfOwallet,
  isBtcToken,
  isFastMode,
  setIsFastMode,
  setToNetworkChainId,
  toToken
}) => {
  const isActive = isBtcToken ? isBtcOfOwallet && active : active;
  return (
    <div
      className={classNames(styles.tokenWrapper, styles[theme], { [styles.active]: isActive }, className)}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <div className={styles.balanceAmountInfo}>
        <div className={styles.token}>
          {theme === 'light' ? (
            <img style={{ borderRadius: '100%', backgroundColor: token?.coinGeckoId === 'usdai' ? 'white' : 'transparent', }} width={44} height={44} src={token?.iconLight} alt="icon-light" />
          ) : (
            <img style={{ borderRadius: '100%', backgroundColor: token?.coinGeckoId === 'usdai' ? 'white' : 'transparent', }} width={44} height={44} src={token?.icon} alt="icon-light" />
          )}
          <div className={styles.tokenInfo}>
            <div className={classNames(styles.tokenName, styles[theme])}>{token.name}</div>
          </div>
        </div>
        <div className={styles.tokenBalance}>
          <div className={styles.row}>
            <TokenBalance
              balance={{
                amount: amountDetail.amount ?? '0',
                denom: '',
                decimals: token.decimals
              }}
              className={classNames(styles.tokenAmount, styles[theme])}
              decimalScale={Math.min(6, token.decimals)}
            />
          </div>
          <TokenBalance balance={amountDetail.usd} className={styles.subLabel} decimalScale={2} />
        </div>
      </div>
      <div>
        {isActive && (
          <TransferConvertToken
            token={token}
            subAmounts={subAmounts}
            amountDetail={amountDetail}
            onClickTransfer={onClickTransfer}
            isFastMode={isFastMode}
            setIsFastMode={setIsFastMode}
            setToNetwork={setToNetworkChainId}
            toToken={toToken}
          />
        )}
      </div>
    </div>
  );
};

export default TokenItem;
