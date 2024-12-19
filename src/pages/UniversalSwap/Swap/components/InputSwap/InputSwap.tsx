import { TokenItemType } from '@oraichain/oraidex-common';
import ArrowImg from 'assets/icons/arrow_new.svg';
import cn from 'classnames/bind';
import TokenBalance from 'components/TokenBalance';
import NumberFormat from 'react-number-format';
import { TokenInfo } from 'types/token';
import styles from './InputSwap.module.scss';
import { Themes } from 'context/theme-context';
import { isNegative, numberWithCommas } from 'pages/Pools/helpers';
import { AMOUNT_BALANCE_ENTRIES_UNIVERSAL_SWAP } from 'helper/constants';
import { chainInfos, flattenTokens } from 'initCommon';

const cx = cn.bind(styles);

interface InputSwapProps {
  setIsSelectToken: (value: boolean) => void;
  setIsSelectChain: (value: boolean) => void;
  token: TokenItemType;
  amount: number;
  tokenFee: number;
  onChangeAmount?: (amount: number | undefined) => void;
  balance: string | bigint;
  disable?: boolean;
  originalToken?: TokenInfo;
  setCoe?: React.Dispatch<React.SetStateAction<number>>;
  coe?: number;
  usdPrice: string;
  type?: string;
  selectChain: string;
  onChangePercentAmount?: (coff: number) => void;
  theme: Themes;
  loadingSimulate?: boolean;
  impactWarning?: number;
}

export default function InputSwap({
  setIsSelectToken,
  setIsSelectChain,
  token,
  amount,
  onChangeAmount,
  tokenFee,
  balance,
  disable,
  originalToken,
  setCoe,
  usdPrice,
  type,
  selectChain,
  onChangePercentAmount,
  theme,
  coe,
  loadingSimulate,
  impactWarning
}: InputSwapProps) {
  let chainInfo = chainInfos.find((chain) => chain.chainId === selectChain);
  const isLightMode = theme === 'light';

  return (
    <>
      <div className={cx('input-swap-balance', type === 'from' && 'is-enable-coeff')}>
        <div className={cx('select-chain')}>
          <div className={cx('left')} onClick={() => setIsSelectChain(true)}>
            <div className={cx('icon')}>
              {theme === 'light' ? (
                <img className={cx('logo')} src={chainInfo?.chainSymbolImageUrl} alt="chain-logo" />
              ) : (
                <img className={cx('logo')} src={chainInfo?.chainSymbolImageUrl} alt="chain-logo" />
              )}
            </div>
            <div className={cx('section')}>
              <div className={cx('name')}>{chainInfo?.chainName}</div>
            </div>
            <img src={ArrowImg} alt="arrow" />
          </div>
        </div>
        <div className={cx('show-balance')}>
          <div className={cx('bal')}>
            <span className={cx('prefix')}>Balance:&nbsp;</span>
            <TokenBalance
              balance={{
                amount: balance,
                decimals: originalToken?.decimals,
                denom: originalToken?.symbol || token?.name || ''
              }}
              decimalScale={6}
            />
          </div>
          {type === 'from' && (
            <div className={cx('coeff')}>
              {AMOUNT_BALANCE_ENTRIES_UNIVERSAL_SWAP.map(([coeff, text]) => (
                <button
                  key={coeff}
                  className={cx('percent', { activePercent: coe === coeff })}
                  onClick={(event) => {
                    event.stopPropagation();
                    onChangePercentAmount(coeff);
                    setCoe(coeff);
                  }}
                >
                  {text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={cx('input-swap-box')}>
        <div className={cx('box-select')} onClick={() => setIsSelectToken(true)}>
          <div className={cx('left')}>
            <div className={cx('icon')}>
              {isLightMode ? (
                <img src={token.icon} alt="icon" width={30} height={30} />
              ) : (
                <img className={cx('logo')} src={token.icon} alt="icon" width={30} height={30} />
              )}
            </div>

            <div className={cx('section')}>
              <div className={cx('name')}>{token?.name}</div>
            </div>
            <img src={ArrowImg} alt="arrow" />
          </div>
        </div>
        <div className={cx('box-input')}>
          <div className={styles.input}>
            {loadingSimulate && <div className={styles.mask} />}
            <NumberFormat
              placeholder="0"
              thousandSeparator
              className={cx('amount')}
              decimalScale={6}
              style={{
                opacity: loadingSimulate ? '0.4' : '1'
              }}
              disabled={loadingSimulate || disable}
              type="text"
              value={amount}
              onChange={() => {
                setCoe(0);
              }}
              isAllowed={(values) => {
                const { floatValue } = values;
                // allow !floatValue to let user can clear their input
                return !floatValue || (floatValue >= 0 && floatValue <= 1e14);
              }}
              onValueChange={({ floatValue }) => {
                onChangeAmount?.(floatValue);
              }}
            />
          </div>
          <div className={cx('usd')}>
            <span>
              ≈ ${amount ? numberWithCommas(Number(usdPrice) || 0, undefined, { maximumFractionDigits: 3 }) : 0}
            </span>
            {!!impactWarning && !isNegative(impactWarning) && (
              <span
                className={cx(
                  'impact',
                  `${impactWarning > 10 ? 'impact-ten' : impactWarning > 5 ? 'impact-five' : ''}`
                )}
              >
                (-{numberWithCommas(impactWarning, undefined, { minimumFractionDigits: 1 })}%)
              </span>
            )}
          </div>
        </div>
      </div>
      {/* {!!tokenFee && (
        <div className={cx('input-swap-fee')}>
          <div>Fee: {tokenFee}%</div>
        </div>
      )} */}
    </>
  );
}
