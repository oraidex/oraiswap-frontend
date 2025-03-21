import { FACTORY_V2_CONTRACT, parseTokenInfoRawDenom, toDisplay, TokenItemType } from '@oraichain/oraidex-common';
import { Asset, AssetInfo } from '@oraichain/oraidex-contracts-sdk';
import { useQuery } from '@tanstack/react-query';
import IcBack from 'assets/icons/ic_back.svg?react';
import cn from 'classnames/bind';
import Loader from 'components/Loader';
import Modal from 'components/Modal';
import { displayToast, TToastType } from 'components/Toasts/Toast';
import TokenBalance from 'components/TokenBalance';
import { getTransactionUrl } from 'helper';
import { useCoinGeckoPrices } from 'hooks/useCoingecko';
import useConfigReducer from 'hooks/useConfigReducer';
import useTheme from 'hooks/useTheme';
import { network, oraichainTokens } from 'initCommon';
import { getCosmWasmClient } from 'libs/cosmjs';
import { extractAddress } from 'pages/Pool-V3/helpers/format';
import { FC, useEffect, useState } from 'react';
import NumberFormat from 'react-number-format';
import { useSelector } from 'react-redux';
import { fetchTokenInfo } from 'rest/api';
import { RootState } from 'store/configure';
import { SelectTokenModal } from '../components/SelectTokenModal';
import styles from './NewPoolModal.module.scss';

const cx = cn.bind(styles);
interface ModalProps {
  className?: string;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  isCloseBtn?: boolean;
}

const NewPoolModal: FC<ModalProps> = ({ isOpen, close, open }) => {
  const { data: prices } = useCoinGeckoPrices();
  const [step, setStep] = useState(1);
  const [isSelectingToken, setIsSelectingToken] = useState<'token1' | 'token2' | null>(null);
  const [token1, setToken1] = useState<string | null>(null);
  const [token2, setToken2] = useState<string | null>(null);
  const { allOraichainTokens = [], addedTokens = [] } = useSelector((state: RootState) => state.token);
  const [listToken1Option, setListToken1Option] = useState<TokenItemType[]>([
    ...oraichainTokens,
    ...(addedTokens || [])
  ]);
  const [listToken2Option, setListToken2Option] = useState<TokenItemType[]>([
    ...oraichainTokens,
    ...(addedTokens || [])
  ]);
  const [amountToken1, setAmountToken1] = useState(0);
  const [amountToken2, setAmountToken2] = useState(0);
  const [loading, setLoading] = useState(false);
  const amounts = useSelector((state: RootState) => state.token.amounts);
  const theme = useTheme();
  const [walletAddress] = useConfigReducer('address');
  const [tokenPoolPrices] = useConfigReducer('tokenPoolPrices');

  const tokenObj1 = (allOraichainTokens || []).find((token) => token?.denom === token1);
  const tokenObj2 = (allOraichainTokens || []).find((token) => token?.denom === token2);

  const { data: token1InfoData } = useQuery(['token-info', token1], () => fetchTokenInfo(tokenObj1!), {
    enabled: !!tokenObj1
  });
  const { data: token2InfoData } = useQuery(['token-info', token2], () => fetchTokenInfo(tokenObj2!), {
    enabled: !!tokenObj2
  });

  const token1Balance = BigInt(amounts[tokenObj1?.denom] ?? '0');
  const token2Balance = BigInt(amounts[tokenObj2?.denom] ?? '0');

  useEffect(() => {
    setListToken1Option([...oraichainTokens, ...(addedTokens || [])]);
    setListToken2Option([...oraichainTokens, ...(addedTokens || [])]);
  }, [oraichainTokens.length, (addedTokens || []).length]);

  // TODO: ICON CREATE POOL V2
  const Token1Icon = tokenObj1?.icon;
  const Token2Icon = tokenObj2?.icon;

  const getBalanceValue = (tokenSymbol: string | undefined, amount: number | string) => {
    if (!tokenSymbol) return 0;
    const coingeckoId = oraichainTokens.find((token) => token.name === tokenSymbol)?.coinGeckoId;
    const pricePer = prices[coingeckoId!] ?? 0;

    return pricePer * +amount;
  };

  const handleCreatePool = async () => {
    setLoading(true);
    try {
      const { client, defaultAddress: address } = await getCosmWasmClient({
        chainId: network.chainId
      });
      const msgs = [];

      const funds: { denom: string; amount: string }[] = [];

      const assetInfos: AssetInfo[] = [];
      const assets: Asset[] = [];

      let [tokenKey1, tokenKey2] = [tokenObj1, tokenObj2];
      let [amount1, amount2] = [amountToken1, amountToken2];
      if (extractAddress(tokenObj1) > extractAddress(tokenObj2)) {
        [tokenKey1, tokenKey2] = [tokenObj2, tokenObj1];
        [amount1, amount2] = [amountToken2, amountToken1];
      }

      if (tokenKey1.contractAddress) {
        msgs.push({
          contractAddress: tokenKey1.contractAddress,
          msg: {
            increase_allowance: {
              amount: (amount1 * 10 ** token1InfoData?.decimals).toString(),
              expires: undefined,
              spender: FACTORY_V2_CONTRACT
            }
          }
        });
        assetInfos.push({
          token: {
            contract_addr: tokenKey1.contractAddress
          }
        });
        assets.push({
          info: {
            token: {
              contract_addr: tokenKey1.contractAddress
            }
          },
          amount: (amount1 * 10 ** token1InfoData?.decimals).toString()
        });
      } else {
        funds.push({
          denom: tokenKey1.denom,
          amount: (amount1 * 10 ** token1InfoData?.decimals).toString()
        });
        assetInfos.push({
          native_token: {
            denom: tokenKey1.denom
          }
        });
        assets.push({
          info: {
            native_token: {
              denom: tokenKey1.denom
            }
          },
          amount: (amount1 * 10 ** token1InfoData?.decimals).toString()
        });
      }

      if (tokenKey2.contractAddress) {
        msgs.push({
          contractAddress: tokenKey2.contractAddress,
          msg: {
            increase_allowance: {
              amount: (amount2 * 10 ** token2InfoData?.decimals).toString(),
              expires: undefined,
              spender: FACTORY_V2_CONTRACT
            }
          }
        });
        assetInfos.push({
          token: {
            contract_addr: tokenKey2.contractAddress
          }
        });
        assets.push({
          info: {
            token: {
              contract_addr: tokenKey2.contractAddress
            }
          },
          amount: (amount2 * 10 ** token2InfoData?.decimals).toString()
        });
      } else {
        funds.push({
          denom: tokenKey2.denom,
          amount: (amount2 * 10 ** token2InfoData?.decimals).toString()
        });
        assetInfos.push({
          native_token: {
            denom: tokenKey2.denom
          }
        });
        assets.push({
          info: {
            native_token: {
              denom: tokenKey2.denom
            }
          },
          amount: (amount2 * 10 ** token2InfoData?.decimals).toString()
        });
      }

      const createPairMsg = {
        contractAddress: FACTORY_V2_CONTRACT,
        msg: {
          create_pair: {
            asset_infos: assetInfos,
            operator: undefined,
            pair_admin: undefined,
            provide_liquidity: {
              assets,
              receiver: undefined
            }
          }
        },
        funds
      };

      console.log({
        msgs
      });

      msgs.push(createPairMsg);

      const result = await client.executeMultiple(address.address, msgs, 'auto');

      // @ts-ignore
      displayToast(TToastType.TX_SUCCESSFUL, {
        customLink: getTransactionUrl('Oraichain', result.transactionHash),
        message: 'Please wait a minute to see your newly created pool V2.'
      });
    } catch (error) {
      console.error(error);
      displayToast(TToastType.TX_FAILED, {
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const token1Price = tokenObj1
    ? prices[tokenObj1?.coinGeckoId] ?? tokenPoolPrices[parseTokenInfoRawDenom(tokenObj1)] ?? 0
    : 0;
  const token2Price = tokenObj2
    ? prices[tokenObj2?.coinGeckoId] ?? tokenPoolPrices[parseTokenInfoRawDenom(tokenObj2)] ?? 0
    : 0;

  console.log({ amountToken1 });

  const step1Component = (
    <>
      <div className={cx('supply', theme)}>
        <div className={cx('input', theme)}>
          <div className={cx('token', theme)}>
            <div className={cx('token-info', theme)} onClick={() => setIsSelectingToken('token1')}>
              {!!token1 ? (
                (() => {
                  return (
                    <>
                      {Token1Icon && (
                        <img style={{ borderRadius: '100%' }} src={Token1Icon} className={cx('logo', theme)} alt="" />
                      )}
                      <div className={cx('title', theme)}>
                        <div>{token1InfoData?.symbol ?? ''}</div>
                      </div>
                      <div className={cx('arrow-down', theme)} />
                    </>
                  );
                })()
              ) : (
                <>
                  <span className={cx('title', theme)}>Select assets</span>
                  <div className={cx('arrow-down', theme)} />
                </>
              )}
            </div>
            <div className={cx('itemInput', { [styles.disabled]: false })}>
              <div className={cx('tokenInfo')}>
                <div className={cx('input', theme)}>
                  <NumberFormat
                    placeholder="0"
                    thousandSeparator
                    className={cx('amount')}
                    decimalScale={6}
                    disabled={!token1InfoData}
                    type="text"
                    value={amountToken1 ? amountToken1 : ''}
                    onChange={() => {}}
                    isAllowed={(values) => {
                      const { floatValue } = values;
                      // allow !floatValue to let user can clear their input
                      return !floatValue || (floatValue >= 0 && floatValue <= 1e14);
                    }}
                    onValueChange={({ floatValue }) => {
                      setAmountToken1(floatValue ?? 0);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={cx('balance')}>
          <TokenBalance
            balance={{
              amount: token1Balance,
              decimals: token1InfoData?.decimals,
              denom: token1InfoData?.symbol
            }}
            prefix="Balance: "
            decimalScale={6}
          />
          <div className={cx('amountUsd')}>
            <div
              className={cx('btn')}
              onClick={() => setAmountToken1(toDisplay(token1Balance / BigInt(2), token1InfoData?.decimals))}
            >
              HALF
            </div>
            <div
              className={cx('btn')}
              onClick={() => setAmountToken1(toDisplay(token1Balance, token1InfoData?.decimals))}
            >
              MAX
            </div>
            <TokenBalance
              balance={amountToken1 * token1Price}
              style={{ flexGrow: 1, textAlign: 'right' }}
              decimalScale={2}
            />
          </div>
        </div>
      </div>

      <div className={cx('supply', theme)}>
        <div className={cx('input', theme)}>
          <div className={cx('token', theme)}>
            <div className={cx('token-info', theme)} onClick={() => setIsSelectingToken('token2')}>
              {!!token2 ? (
                (() => {
                  return (
                    <>
                      {Token2Icon && (
                        <img style={{ borderRadius: '100%' }} src={Token2Icon} className={cx('logo', theme)} alt="" />
                      )}
                      <div className={cx('title', theme)}>
                        <div>{token2InfoData?.symbol ?? ''}</div>
                      </div>
                      <div className={cx('arrow-down', theme)} />
                    </>
                  );
                })()
              ) : (
                <>
                  <span className={cx('title', theme)}>Select assets</span>
                  <div className={cx('arrow-down', theme)} />
                </>
              )}
            </div>
            <div className={cx('itemInput', { [styles.disabled]: false })}>
              <div className={cx('tokenInfo')}>
                <div className={cx('input', theme)}>
                  <NumberFormat
                    placeholder="0"
                    thousandSeparator
                    className={cx('amount')}
                    decimalScale={6}
                    disabled={!token2InfoData}
                    type="text"
                    value={amountToken2 ? amountToken2 : ''}
                    onChange={() => {}}
                    isAllowed={(values) => {
                      const { floatValue } = values;
                      // allow !floatValue to let user can clear their input
                      return !floatValue || (floatValue >= 0 && floatValue <= 1e14);
                    }}
                    onValueChange={({ floatValue }) => {
                      setAmountToken2(floatValue ?? 0);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={cx('balance')}>
          <TokenBalance
            balance={{
              amount: token2Balance,
              decimals: token2InfoData?.decimals,
              denom: token2InfoData?.symbol
            }}
            prefix="Balance: "
            decimalScale={6}
          />
          <div className={cx('amountUsd')}>
            <div
              className={cx('btn')}
              onClick={() => setAmountToken2(toDisplay(token2Balance / BigInt(2), token2InfoData?.decimals))}
            >
              HALF
            </div>
            <div
              className={cx('btn')}
              onClick={() => setAmountToken2(toDisplay(token2Balance, token2InfoData?.decimals))}
            >
              MAX
            </div>
            <TokenBalance
              balance={amountToken2 * token2Price}
              style={{ flexGrow: 1, textAlign: 'right' }}
              decimalScale={2}
            />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          className={cx('swap-btn')}
          onClick={() => {
            setStep(2);
          }}
          disabled={loading || !walletAddress || !amountToken1 || !amountToken2 || !token1InfoData || !token2InfoData}
        >
          Next
        </button>
      </div>
    </>
  );

  const step2Component = (
    <>
      <div className={cx('stat', theme)}>
        <div className={cx('stats_info', theme)}>
          <div className={cx('stats_info_wrapper', theme)}>
            <div className={cx('stats_info_row', theme)}>
              <div>
                {Token1Icon && (
                  <img
                    style={{ borderRadius: '100%' }}
                    src={Token1Icon}
                    className={cx('stats_info_lg', theme)}
                    alt=""
                  />
                )}
              </div>
              <div>
                <span className={cx('stats_info_value_amount', theme)}>{amountToken1} </span>
                <span className={cx('stats_info_name', theme)}>{token1InfoData?.symbol}</span>
                <div>
                  <TokenBalance
                    balance={amountToken1 * token1Price}
                    // balance={getBalanceValue(token1InfoData?.symbol ?? '', +amountToken1)}
                    className={cx('stats_info_value_usd', theme)}
                    decimalScale={2}
                  />
                </div>
              </div>
            </div>
            <div className={cx('percent-each', theme)}>50%</div>
          </div>

          <div className={cx('stats_info_wrapper', theme)}>
            <div className={cx('stats_info_row', theme)}>
              {Token2Icon && (
                <img style={{ borderRadius: '100%' }} src={Token2Icon} className={cx('stats_info_lg', theme)} alt="" />
              )}
              <div>
                <span className={cx('stats_info_value_amount', theme)}>{amountToken2} </span>
                <span className={cx('stats_info_name', theme)}>{token2InfoData?.symbol}</span>
                <div>
                  <TokenBalance
                    balance={amountToken2 * token2Price}
                    // balance={getBalanceValue(token2InfoData?.symbol ?? '', +amountToken2)}
                    className={cx('stats_info_value_usd', theme)}
                    decimalScale={2}
                  />
                </div>
              </div>
            </div>
            <div className={cx('percent-each', theme)}>50%</div>
          </div>
        </div>
      </div>
      <div className={cx('supply', theme)}>
        <div className={cx('input', theme)}>
          <div className={cx('token', theme)}>
            <span className={cx('title', theme)}>Swap Fee</span>
          </div>
          <div className={cx('amount', theme)}>
            <NumberFormat
              placeholder="0"
              thousandSeparator
              decimalScale={6}
              type="text"
              value={0.3}
              disabled={true}
              // value={supplyToken2 ? supplyToken2 : ''}
              // onValueChange={({ floatValue }) => {
              //   setSupplyToken2(floatValue);
              // }}
            />
            <span>%</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button disabled={loading} className={cx('swap-btn')} onClick={handleCreatePool}>
          {loading && <Loader width={22} height={22} />}&nbsp;&nbsp; Create
        </button>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      open={open}
      isCloseBtn={true}
      className={cx('modal', theme === 'dark' ? 'dark' : 'light')}
    >
      <div className={cx('container', theme)}>
        <div className={cx('header')}>
          {step === 2 && (
            <div className={cx('back-btn')} onClick={() => setStep(1)}>
              <IcBack />
            </div>
          )}

          <div className={cx('title', theme)}>Create new pool V2</div>
        </div>

        <div className={cx('steps')}>
          <div className={cx('text')}>
            <div className={cx(`point`, theme)}>{step === 1 ? 'Add Liquidity' : 'Confirmation'}</div>
          </div>
          <div className={cx('progress')}>
            <div>
              <span className={cx('currentStep')}>{step}</span>
              <span>/2</span>
            </div>
          </div>
        </div>
        {(() => {
          if (step === 1) return step1Component;
          if (step === 2) return step2Component;
        })()}
      </div>

      {isSelectingToken === 'token1' && (
        <SelectTokenModal
          isOpen={isSelectingToken === 'token1'}
          open={() => setIsSelectingToken('token1')}
          close={() => setIsSelectingToken(null)}
          setToken={(token1: string) => {
            setToken1(token1);
            setListToken2Option(listToken2Option.filter((t) => t.denom !== token1));
          }}
          items={listToken1Option}
        />
      )}
      {isSelectingToken === 'token2' && (
        <SelectTokenModal
          isOpen={isSelectingToken === 'token2'}
          open={() => setIsSelectingToken('token2')}
          close={() => setIsSelectingToken(null)}
          setToken={(token2: string) => {
            setToken2(token2);
            setListToken1Option(listToken1Option.filter((t) => t.denom !== token2));
          }}
          items={listToken2Option}
        />
      )}
    </Modal>
  );
};

export default NewPoolModal;
