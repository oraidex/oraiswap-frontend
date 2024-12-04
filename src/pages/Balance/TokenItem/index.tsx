import classNames from 'classnames';
import styles from './index.module.scss';
import TokenBalance from 'components/TokenBalance';
import TransferConvertToken from '../TransferConvertToken';
import { OraiIcon, TokenItemType, tokensIcon } from '@oraichain/oraidex-common';
import DefaultIcon from 'assets/icons/tokens.svg?react';
import { flattenTokens, flattenTokensWithIcon, tokensWithIcon } from 'initCommon';

export interface TokenItemProps {
  token: TokenItemType;
  amountDetail?: { amount: string; usd: number };
  name?: string;
  onClickTransfer: any;
  active: Boolean;
  className?: string;
  onClick?: Function;
  onBlur?: Function;
  convertKwt?: any;
  subAmounts?: AmountDetails;
  theme?: string;
  onDepositBtc?: Function;
  isBtcOfOwallet?: boolean;
  isBtcToken?: boolean;
  isFastMode?: boolean;
  setIsFastMode?: Function;
}

const TokenItem: React.FC<TokenItemProps> = ({
  token,
  amountDetail,
  active,
  className,
  onClick,
  onClickTransfer,
  convertKwt,
  subAmounts,
  theme,
  isBtcOfOwallet,
  isBtcToken,
  isFastMode,
  setIsFastMode
}) => {
  // TODO: chain tokensIcon to tokensWithIcon
  let tokenIcon = flattenTokens.find((tok) => tok.coinGeckoId === token.coinGeckoId);
  if (!tokenIcon) {
    tokenIcon = {
      coinGeckoId: token.coinGeckoId,
      icon: OraiIcon,
      iconLight: OraiIcon
    };
  }
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
            <img width={44} height={44} src={tokenIcon?.iconLight} alt="icon-light" />
          ) : (
            <img width={44} height={44} src={tokenIcon?.icon} alt="icon-light" />
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
            convertKwt={convertKwt}
            isFastMode={isFastMode}
            setIsFastMode={setIsFastMode}
          />
        )}
      </div>
    </div>
  );
};

export default TokenItem;
