import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { AccountData } from '@cosmjs/proto-signing';
// import { OraidexListingContractClient } from '@oraichain/oraidex-contracts-sdk';
import { toAmount, toDisplay } from '@oraichain/oraidex-common';
import PlusIcon from 'assets/icons/plus.svg?react';
import RewardIcon from 'assets/icons/reward.svg?react';
import TrashIcon from 'assets/icons/trash.svg?react';
import cn from 'classnames/bind';
import CheckBox from 'components/CheckBox';
import Input from 'components/Input';
import Loader from 'components/Loader';
import Modal from 'components/Modal';
import { TToastType, displayToast } from 'components/Toasts/Toast';
import { handleErrorTransaction } from 'helper';
import useConfigReducer from 'hooks/useConfigReducer';
import useOnClickOutside from 'hooks/useOnClickOutside';
import { network } from 'initCommon';
import { getCosmWasmClient } from 'libs/cosmjs';
import { checkRegex, validateAddressCosmos } from 'libs/utils';
import sumBy from 'lodash/sumBy';
import { FC, useRef, useState } from 'react';
import NumberFormat from 'react-number-format';
import { InitBalancesItems, RewardItems } from './ItemsComponent';
import { ModalDelete, ModalListToken } from './ModalComponent';
import styles from './NewTokenModal.module.scss';
import ImageInput from 'components/DragDropImage';
const cx = cn.bind(styles);

const TOKEN_FACTORY_CONTRACT = 'orai1wuh4g3euvs3u4vlmn3lljh363wl25t6n9fcydawtlykpw3jgp0kqg83vcc';

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
  const [tokenDecimal, setTokenDecimal] = useState(6);
  const [description, setDescription] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [tokenLogoUrl, setTokenLogoUrl] = useState('');
  const [selectedInitBalances, setSelectedInitBalances] = useState([]);

  /**
   * 
  pub description: Option<String>, // yes
    /// denom_units represents the list of DenomUnit's for a given coin
    pub denom_units: Vec<DenomUnit>, // yes
    /// base represents the base denom (should be the DenomUnit with exponent = 0).
    pub base: Option<String>, // yes -> exp 0
    /// display indicates the suggested denom that should be displayed in clients.
    pub display: Option<String>, // yes -> exp max 
    /// name defines the name of the token (eg: Cosmos Atom)
    pub name: Option<String>, // yes
    /// symbol is the token symbol usually shown on exchanges (eg: ATOM). This can
    /// be the same as the display.
    pub symbol: Option<String>, // yes
   */

  const [typeDelete, setTypeDelete] = useState('');

  const [isInitBalances, setIsInitBalances] = useState(false);
  const [initBalances, setInitBalances] = useState([
    {
      address: '',
      amount: BigInt(1e6)
    }
  ]);

  const [isAddListToken, setIsAddListToken] = useState(false);
  const [cap, setCap] = useState(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);

  const handleOutsideClick = () => {
    if (isAddListToken) setIsAddListToken(false);
    if (typeDelete) setTypeDelete('');
  };

  const ref = useRef(null);
  useOnClickOutside(ref, () => handleOutsideClick());

  const handleCreateToken = async () => {
    // TODO: 
    // if (!checkRegex(tokenName))
    //   return displayToast(TToastType.TX_FAILED, {
    //     message: 'Token name is required and must be letter (3 to 12 characters)'
    //   });
    const { client, defaultAddress: address } = await getCosmWasmClient({
      chainId: network.chainId
    });
    if (!address)
      return displayToast(TToastType.TX_FAILED, {
        message: 'Wallet address does not exist!'
      });

    if (!tokenName)
      return displayToast(TToastType.TX_FAILED, {
        message: 'Empty token symbol!'
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

      const createDenomMsg = {
        contractAddress: TOKEN_FACTORY_CONTRACT,
        msg: {
          create_denom: {
            extended_info: {
              logo: {
                url: tokenLogoUrl,
              },
              project: projectUrl,
            },
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
                  exponent: tokenDecimal,
                  aliases: []
                }
              ],
              description: description,
              display: tokenSymbol,
              name: tokenName,
              symbol: tokenSymbol,
            },
            subdenom: tokenSymbol
          }
        },
        funds: [{
          denom: "orai",
          amount: "1"
        }],
      }

      const initBalanceMsg = initBalances.map((init) => {
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
        }
      });

      msgs.push(createDenomMsg);
      msgs.push(...initBalanceMsg);

      const res = await client.executeMultiple(address.address, msgs, 'auto');

      console.log(res);

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

  const deleteSelectedItem = () => {
    // if (typeDelete === 'Init Balances') {
    const newInitBalances = initBalances.filter((_, i) => !selectedInitBalances.includes(i));
    setInitBalances(newInitBalances);
    setSelectedInitBalances([]);
    // }
  }

  const generateOverlay = () => {
    return isAddListToken || typeDelete ? <div className={cx('overlay')} /> : null;
  };

  return (
    <Modal isOpen={isOpen} close={close} open={open} isCloseBtn={true} className={cx('modal')}>
      {generateOverlay()}
      <div className={cx('container', theme)}>
        <div className={cx('container-inner')}>
          <RewardIcon />
          <div className={cx('title', theme)}>Create a new token</div>
        </div>
        <div className={cx('content')} ref={ref}>
          <div className={cx('box', theme)}>
            <div className={cx('token')}>
              <div>
                <div className={cx('row', 'pt-16')}>
                  <div className={cx('label')}>Token name</div>
                  <div className={cx('input', theme)}>
                    <div>
                      <Input
                        value={tokenName}
                        style={{
                          color: theme === 'light' && 'rgba(39, 43, 48, 1)'
                        }}
                        onChange={(e) => setTokenName(e?.target?.value)}
                        placeholder="Oraichain Token"
                      />
                    </div>
                  </div>
                </div>
                <div className={cx('row', 'pt-16')}>
                  <div className={cx('label')}>Token Symbol</div>
                  <div className={cx('input', theme)}>
                    <div>
                      <Input
                        value={tokenSymbol}
                        style={{
                          color: theme === 'light' && 'rgba(39, 43, 48, 1)'
                        }}
                        onChange={(e) => setTokenSymbol(e?.target?.value)}
                        placeholder="ORAI"
                      />
                    </div>
                  </div>
                </div>
                <div className={cx('row', 'pt-16')}>
                  <div className={cx('label')}>Token Decimals</div>
                  <div className={cx('input', theme)}>
                    <div>
                      <Input
                        type='number'
                        value={tokenDecimal}
                        style={{
                          color: theme === 'light' && 'rgba(39, 43, 48, 1)'
                        }}
                        onChange={(e) => setTokenDecimal(Number(e?.target?.value))}
                        placeholder="6"
                      />
                    </div>
                  </div>
                </div>
                <div className={cx('row', 'pt-16')}>
                  <div className={cx('label')}>Token Description</div>
                  <div className={cx('input', theme)}>
                    <div>
                      <textarea
                        value={description}
                        style={{
                          color: theme === 'light' && 'rgba(39, 43, 48, 1)'
                        }}
                        rows={3}
                        onChange={(e) => setDescription(e?.target?.value)}
                        placeholder="Orai is the best token"
                      />
                    </div>
                  </div>
                </div>
                <div className={cx('row', 'pt-16')}>
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
                </div>
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
                    <div>
                      <Input
                        value={tokenLogoUrl}
                        style={{
                          color: theme === 'light' && 'rgba(39, 43, 48, 1)'
                        }}
                        onChange={(e) => setTokenLogoUrl(e?.target?.value)}
                        placeholder="(Optional) https://orai.io"
                      />
                      {tokenLogoUrl && <img src={tokenLogoUrl} alt="Logo" width={150} height={150}/>}
                    </div>
                  </div>
                </div>
                <hr />
                <div>
                  <CheckBox
                    label="Initial Balances (Optional)"
                    checked={isInitBalances}
                    onCheck={setIsInitBalances}
                  />
                </div>
                {isInitBalances && (
                  <div>
                    {isInitBalances && (
                      <div
                        className={cx('btn-add-init', theme)}
                        onClick={() =>
                          setInitBalances([
                            ...initBalances,
                            {
                              address: '',
                              amount: BigInt(1e6)
                            }
                          ])
                        }
                      >
                        <PlusIcon />
                        <span>Add</span>
                      </div>
                    )}

                    {isInitBalances && (
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
                    )}

                    <div style={{ height: 10 }} />

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
                              decimals={tokenDecimal}
                            />
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div
          className={cx(
            'create-btn',
            (isLoading || (!tokenName)) && 'disable-btn'
          )}
          onClick={() => !isLoading && (tokenName) && handleCreateToken()}
        >
          {isLoading && <Loader width={20} height={20} />}
          {isLoading && <div style={{ width: 8 }}></div>}
          <span>Create</span>
        </div>
      </div>
    </Modal>
  );
};

export default NewTokenModal;
