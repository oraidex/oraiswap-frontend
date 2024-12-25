import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { AccountData } from '@cosmjs/proto-signing';
import { sha256 } from '@injectivelabs/sdk-ts';
import PlusIcon from 'assets/icons/plus.svg?react';
import cn from 'classnames/bind';
import Input from 'components/Input';
import Loader from 'components/Loader';
import Modal from 'components/Modal';
import { TToastType, displayToast } from 'components/Toasts/Toast';
import { getTransactionUrl, handleErrorTransaction } from 'helper';
import useConfigReducer from 'hooks/useConfigReducer';
import useOnClickOutside from 'hooks/useOnClickOutside';
import { network } from 'initCommon';
import { getCosmWasmClient } from 'libs/cosmjs';
import { validateAddressCosmos } from 'libs/utils';
import { FC, useRef, useState } from 'react';
import { InitBalancesItems } from './ItemsComponent';
import styles from './NewTokenModal.module.scss';
import ArrowDownIcon from 'assets/icons/arrow.svg?react';
import NumberFormat from 'react-number-format';
import { inspectToken } from 'reducer/onchainTokens';
import { useDispatch } from 'react-redux';
const cx = cn.bind(styles);

const TOKEN_FACTORY_CONTRACT = 'orai1ytjgzxvtsq3ukhzmt39cp85j27zzqf5y706y9qrffrnpn3vd3uds957ydu';
const DEFAULT_COSMOS_DECIMALS = 6;

interface ModalProps {
  className?: string;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  isCloseBtn?: boolean;
}

const NewTokenModal: FC<ModalProps> = ({ isOpen, close, open }) => {
  const [theme] = useConfigReducer('theme');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [tokenLogoUrl, setTokenLogoUrl] = useState('');
  const [selectedInitBalances, setSelectedInitBalances] = useState([]);
  const [oraiAddress] = useConfigReducer('address');
  const [typeDelete, setTypeDelete] = useState('');
  const [isInitBalances, setIsInitBalances] = useState(false);
  const [initBalances, setInitBalances] = useState([
    {
      address: '',
      amount: BigInt(10 ** DEFAULT_COSMOS_DECIMALS)
    }
  ]);

  const dispatch = useDispatch();
  const [isAddListToken, setIsAddListToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOutsideClick = () => {
    if (isAddListToken) setIsAddListToken(false);
    if (typeDelete) setTypeDelete('');
  };

  const ref = useRef(null);
  useOnClickOutside(ref, () => handleOutsideClick());

  const handleCreateToken = async () => {
    const { client, defaultAddress: address } = await getCosmWasmClient({
      chainId: network.chainId
    });
    if (!oraiAddress)
      return displayToast(TToastType.TX_FAILED, {
        message: 'Wallet address does not exist!'
      });

    if (!tokenName.trim())
      return displayToast(TToastType.TX_FAILED, {
        message: 'Empty token name!'
      });

    if (!tokenSymbol || tokenSymbol.trim().length < 3 || tokenSymbol.trim().length > 12)
      return displayToast(TToastType.TX_FAILED, {
        message: 'Invalid ticker length. It should be between 3 and 12 characters!'
      });

    if (isInitBalances) {
      initBalances.every((inBa) => {
        if (!inBa.address || !validateAddressCosmos(inBa.address, 'orai')) {
          return displayToast(TToastType.TX_FAILED, {
            message: 'Wrong address init balances format!'
          });
        }
      });
    }

    await signFrontierListToken(client, address);
  };

  const signFrontierListToken = async (client: SigningCosmWasmClient, address: AccountData) => {
    try {
      setIsLoading(true);
      const msgs = [];

      const uint8Array = new TextEncoder().encode(tokenLogoUrl);
      const hash = Buffer.from(sha256(uint8Array)).toString('hex');

      const symbol = tokenSymbol.trim();
      const createDenomMsg = {
        contractAddress: TOKEN_FACTORY_CONTRACT,
        msg: {
          create_denom: {
            metadata: {
              base: `factory/${TOKEN_FACTORY_CONTRACT}/${tokenSymbol}`,
              denom_units: [
                {
                  denom: `factory/${TOKEN_FACTORY_CONTRACT}/${tokenSymbol}`,
                  exponent: 0,
                  aliases: []
                },
                {
                  denom: tokenSymbol,
                  exponent: DEFAULT_COSMOS_DECIMALS,
                  aliases: []
                }
              ],
              description: description,
              display: symbol,
              name: tokenName.trim(),
              symbol: symbol,
              uri: tokenLogoUrl,
              uri_hash: hash
            },
            subdenom: tokenSymbol
          }
        },
        funds: [
          {
            denom: 'orai',
            amount: '1'
          }
        ]
      };

      const initBalanceMsg = isInitBalances
        ? initBalances.map((init) => {
            console.log(init.amount.toString());
            return {
              contractAddress: TOKEN_FACTORY_CONTRACT,
              msg: {
                mint_tokens: {
                  amount: init.amount.toString(),
                  denom: `factory/${TOKEN_FACTORY_CONTRACT}/${tokenSymbol}`,
                  mint_to_address: init.address
                }
              },
              funds: []
            };
          })
        : [];

      msgs.push(createDenomMsg);

      if (initBalances.length > 0) {
        msgs.push(...initBalanceMsg);
      }
      const res = await client.executeMultiple(address.address, msgs, 'auto');

      if (res.transactionHash) {
        dispatch<any>(
          inspectToken({
            tokenId: `factory/${TOKEN_FACTORY_CONTRACT}/${tokenSymbol}`,
            address: oraiAddress,
            isUserAdded: true
          })
        );
        displayToast(TToastType.TX_SUCCESSFUL, {
          customLink: getTransactionUrl('Oraichain', res.transactionHash)
        });
        close();
      }
    } catch (error) {
      console.log('error listing token: ', error);
      handleErrorTransaction(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnCheck = (selected, setState, state) => {
    if (selected.length === state.length) {
      setState([]);
    } else {
      let arr = [];
      for (let i = 0; i < state.length; i++) {
        arr.push(i);
      }
      setState(arr);
    }
  };

  const deleteSelectedItem = (arr) => {
    const newInitBalances = initBalances.filter((_, i) => !arr.includes(i));
    setInitBalances(newInitBalances);
    setSelectedInitBalances([]);
  };

  return (
    <Modal isOpen={isOpen} close={close} open={open} isCloseBtn={true} className={cx('modal', 'overlay')}>
      <div className={cx('container', theme)}>
        <div className={cx('container-inner')}>
          <div className={cx('title', theme)}>Create a new Token</div>
        </div>
        <div className={cx('content')} ref={ref}>
          <div className={cx('box', theme)}>
            <div className={cx('token')}>
              <div>
                <div className={cx('row')}>
                  <div className={cx('label')}>
                    Token name <span>*</span>
                  </div>
                  <div className={cx('input', theme)}>
                    <Input
                      value={tokenName}
                      style={{
                        color: theme === 'light' && 'rgba(39, 43, 48, 1)'
                      }}
                      className={cx('input-inner')}
                      onChange={(e) => setTokenName(e?.target?.value)}
                      placeholder="Oraichain Token"
                    />
                  </div>
                </div>
                <div className={cx('row', 'pt-16')}>
                  <div className={cx('label')}>
                    Ticker <span>*</span>
                  </div>
                  <div className={cx('input', theme)}>
                    <Input
                      value={tokenSymbol}
                      style={{
                        color: theme === 'light' && 'rgba(39, 43, 48, 1)'
                      }}
                      className={cx('input-inner')}
                      onChange={(e) => setTokenSymbol(e?.target?.value)}
                      placeholder="ORAI"
                    />
                  </div>
                </div>
                <div className={cx('row', 'pt-16')}>
                  <div className={cx('label')}>
                    Token Decimals <span>*</span>
                  </div>
                  <div className={cx('input', theme)}>
                    <NumberFormat
                      className={cx('amount')}
                      value={DEFAULT_COSMOS_DECIMALS}
                      decimalScale={6}
                      disabled={true}
                    />
                  </div>
                </div>
                <div className={cx('row', 'pt-16')}>
                  <div className={cx('label')}>Token Description</div>
                  <div className={cx('description', theme)}>
                    <textarea
                      value={description}
                      style={{
                        color: theme === 'light' && 'rgba(39, 43, 48, 1)'
                      }}
                      className={cx('input-inner')}
                      rows={3}
                      onChange={(e) => setDescription(e?.target?.value)}
                      placeholder="Describe new token"
                    />
                  </div>
                </div>
                {/* <div className={cx('row', 'pt-16')}>
                  <div className={cx('label')}>Project Url</div>
                  <div className={cx('input', theme)}>
                    <div>
                      <Input
                        value={projectUrl}
                        style={{
                          color: theme === 'light' && 'rgba(39, 43, 48, 1)'
                        }}
                        onChange={(e) => setProjectUrl(e?.target?.value)}
                        placeholder="(Optional) https://orai.io"
                      />
                    </div>
                  </div>
                </div> */}
                {/* <div className={cx('row', 'pt-16')}>
                  <div className={cx('label')}>Token Image</div>
                  <div className={cx('input', theme)}>
                    <div>
                      <ImageInput />
                    </div>
                  </div>
                </div> */}
                <div className={cx('row', 'pt-16')}>
                  <div className={cx('label')}>Token Logo Url</div>
                  <div className={cx('input', theme)}>
                    <div className={cx('input-image')}>
                      <Input
                        value={tokenLogoUrl}
                        style={{
                          color: theme === 'light' && 'rgba(39, 43, 48, 1)'
                        }}
                        className={cx('input-inner')}
                        onChange={(e) => setTokenLogoUrl(e?.target?.value)}
                        placeholder="https://orai.io"
                      />
                      {tokenLogoUrl && <img src={tokenLogoUrl} alt="Logo" width={50} height={50} />}
                    </div>
                  </div>
                </div>
                <div className={cx('row', 'pt-16')}>
                  <div className={cx('init-balance', theme)} onClick={() => setIsInitBalances(!isInitBalances)}>
                    <span>Init Balances</span>
                    <div
                      style={{
                        transform: isInitBalances ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.5s'
                      }}
                    >
                      <ArrowDownIcon />
                    </div>
                  </div>
                </div>
                {isInitBalances && (
                  <div>
                    {/* {isInitBalances && (
                      <div className={cx('header-init')}>
                        <CheckBox
                          label={`Select All(${selectedInitBalances.length})`}
                          checked={initBalances.length && selectedInitBalances.length === initBalances.length}
                          onCheck={() => handleOnCheck(selectedInitBalances, setSelectedInitBalances, initBalances)}
                        />
                        <div
                          className={cx('trash')}
                          onClick={() => selectedInitBalances.length && deleteSelectedItem()}
                        >
                          <TrashIcon />
                        </div>
                      </div>
                    )} */}

                    {isInitBalances &&
                      initBalances.map((item, ind) => {
                        return (
                          <div key={ind}>
                            <InitBalancesItems
                              item={item}
                              ind={ind}
                              selectedInitBalances={selectedInitBalances}
                              setSelectedInitBalances={setSelectedInitBalances}
                              setInitBalances={setInitBalances}
                              initBalances={initBalances}
                              theme={theme}
                              decimals={DEFAULT_COSMOS_DECIMALS}
                              deleteSelectedItem={deleteSelectedItem}
                            />
                          </div>
                        );
                      })}

                    {isInitBalances && (
                      <div
                        className={cx('btn-add-init', theme)}
                        onClick={() =>
                          setInitBalances([
                            ...initBalances,
                            {
                              address: '',
                              amount: BigInt(10 ** DEFAULT_COSMOS_DECIMALS)
                            }
                          ])
                        }
                      >
                        <PlusIcon />
                        <span>Add</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              disabled={isLoading || !tokenName || !tokenSymbol || !oraiAddress}
              className={cx('create-btn', (isLoading || !tokenName || !tokenSymbol || !oraiAddress) && 'disable-btn')}
              onClick={() => !isLoading && tokenName && handleCreateToken()}
            >
              {isLoading && <Loader width={20} height={20} />}
              {isLoading && <div style={{ width: 8 }}></div>}

              <span>{!oraiAddress ? 'Please connect wallet' : 'Create'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default NewTokenModal;
