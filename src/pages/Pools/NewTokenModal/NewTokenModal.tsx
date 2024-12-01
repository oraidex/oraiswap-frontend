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
import { network } from 'index';
import { getCosmWasmClient } from 'libs/cosmjs';
import { checkRegex, validateAddressCosmos } from 'libs/utils';
import sumBy from 'lodash/sumBy';
import { FC, useRef, useState } from 'react';
import NumberFormat from 'react-number-format';
import { InitBalancesItems, RewardItems } from './ItemsComponent';
import { ModalDelete, ModalListToken } from './ModalComponent';
import styles from './NewTokenModal.module.scss';
const cx = cn.bind(styles);

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
  const [pairAssetType, setPairAssetType] = useState(false); // 0.token - 1.native_token
  const [pairAssetAddress, setPairAssetAddress] = useState(''); // address / denom pair asset
  const [targetedAssetType, setTargetedAssetType] = useState(false); // 0.token - 1.native_token
  const [targetedAssetInfo, setTargetedAssetInfo] = useState(''); // address / denom pair asset
  const [isMinter, setIsMinter] = useState(false);
  const [isMintNewToken, setIsMintNewToken] = useState(true);
  const [minter, setMinter] = useState('');

  const [name, setName] = useState('');
  const [marketing, setMarketing] = useState({
    description: null,
    logo: null,
    marketing: null,
    project: null
  });

  const [selectedReward, setSelectedReward] = useState([]);
  const [selectedInitBalances, setSelectedInitBalances] = useState([]);

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
  const [tokensNew, setTokensNew] = useState([]);
  const [rewardTokens, setRewardTokens] = useState([
    {
      name: 'orai',
      denom: 'orai',
      value: BigInt(1e6),
      contract_addr: ''
    }
  ]);

  const allRewardSelect = rewardTokens.map((item) => item['denom']);
  const handleOutsideClick = () => {
    if (isAddListToken) setIsAddListToken(false);
    if (typeDelete) setTypeDelete('');
  };

  const ref = useRef(null);
  useOnClickOutside(ref, () => handleOutsideClick());

  const handleCreateToken = async () => {
    if (isMintNewToken && !checkRegex(tokenName))
      return displayToast(TToastType.TX_FAILED, {
        message: 'Token name is required and must be letter (3 to 12 characters)'
      });
    const { client, defaultAddress: address } = await getCosmWasmClient({
      chainId: network.chainId
    });
    if (!address)
      return displayToast(TToastType.TX_FAILED, {
        message: 'Wallet address does not exist!'
      });

    if (isMintNewToken && !tokenName)
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

    if (isMinter && !minter)
      return displayToast(TToastType.TX_FAILED, {
        message: 'Wrong minter format!'
      });

    if (minter && !validateAddressCosmos(minter, 'orai'))
      return displayToast(TToastType.TX_FAILED, {
        message: 'Invalid Address Minter!'
      });

    if (isMinter && isInitBalances && cap) {
      const amountAllInit = sumBy(initBalances, 'amount');
      if (amountAllInit > cap) {
        return displayToast(TToastType.TX_FAILED, {
          message: 'Cap need bigger init balances!'
        });
      }
    }
    await signFrontierListToken(client, address);
  };

  const signFrontierListToken = async (client: SigningCosmWasmClient, address: AccountData) => {
    try {
      setIsLoading(true);
      // const liquidityPoolRewardAssets = rewardTokens.map((isReward) => {
      //   return {
      //     amount: isReward?.value.toString(),
      //     info: getInfoLiquidityPool(isReward)
      //   };
      // });
      // const oraidexListing = new OraidexListingContractClient(client, address.address, network.oraidex_listing);
      // // TODO: add more options for users like name, marketing, additional token rewards
      // const mint = isMinter
      //   ? {
      //       minter,
      //       cap: !!cap ? cap.toString() : null
      //     }
      //   : undefined;

      // const initialBalances = isInitBalances
      //   ? initBalances.map((e) => ({ ...e, amount: e?.amount.toString() }))
      //   : undefined;

      // const pairAssetInfo = getInfoLiquidityPool({
      //   contract_addr: !pairAssetType && pairAssetAddress,
      //   denom: pairAssetType && pairAssetAddress
      // });

      // console.log('targeted asset info: ', targetedAssetInfo);

      // let msg = generateMsgFrontierAddToken({
      //   marketing,
      //   symbol: tokenName,
      //   liquidityPoolRewardAssets,
      //   name,
      //   initialBalances,
      //   mint,
      //   pairAssetInfo,
      //   targetedAssetInfo: targetedAssetInfo
      //     ? getInfoLiquidityPool({
      //         contract_addr: !targetedAssetType && targetedAssetInfo,
      //         denom: targetedAssetType && targetedAssetInfo
      //       })
      //     : undefined
      // });
      // // if users use their existing tokens to list, then we allow them to
      // console.log('msg: ', msg);

      // const result = await oraidexListing.listToken(msg);
      // if (result) {
      //   const wasmAttributes = result.logs?.[0]?.events.filter((e) => e.type === 'wasm').flatMap((e) => e.attributes);
      //   const cw20Address = wasmAttributes?.find((w) => w.key === 'cw20_address')?.value;
      //   const lpAddress = wasmAttributes?.find((w) => w.key === 'liquidity_token_address')?.value;
      //   const pairAddress = wasmAttributes?.find((w) => w.key === '"pair_contract_address"')?.value;
      //   displayToast(
      //     TToastType.TX_SUCCESSFUL,
      //     cw20Address
      //       ? {
      //           customLink: `${network.explorer}/txs/${result.transactionHash}`,
      //           linkCw20Token: `${network.explorer}/smart-contract/${cw20Address}`,
      //           cw20Address: `${cw20Address}`
      //         }
      //       : {
      //           customLink: `${network.explorer}/txs/${result.transactionHash}`,
      //           linkLpAddress: `${network.explorer}/smart-contract/${lpAddress}`,
      //           linkPairAddress: `${network.explorer}/smart-contract/${pairAddress}`
      //         },
      //     {
      //       autoClose: 100000000
      //     }
      //   );
      //   close();
      // }
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

  const generateOverlay = () => {
    return isAddListToken || typeDelete ? <div className={cx('overlay')} /> : null;
  };

  return (
    <Modal isOpen={isOpen} close={close} open={open} isCloseBtn={true} className={cx('modal')}>
      {generateOverlay()}
      <div className={cx('container', theme)}>
        <div className={cx('container-inner')}>
          <RewardIcon />
          <div className={cx('title', theme)}>List a new token</div>
        </div>
        <div className={cx('content')} ref={ref}>
          <div className={cx('box', theme)}>
            <div className={cx('token')}>
              <div className={cx('row', 'pt-16')}>
                <div className={cx('label')}>Listing option</div>
                <div>
                  <CheckBox
                    radioBox
                    label="Create new CW20"
                    checked={isMintNewToken}
                    onCheck={() => {
                      console.log('set is mint token true');
                      setIsMintNewToken(true);
                    }}
                  />
                </div>
                <div>
                  <CheckBox
                    radioBox
                    label="Use existing"
                    checked={!isMintNewToken}
                    onCheck={() => {
                      console.log('set is mint token false');
                      setIsMintNewToken(false);
                    }}
                  />
                </div>
              </div>
              {!isMintNewToken && (
                <div>
                  <div className={cx('row', 'pt-16')}>
                    <div className={cx('label')}>Base token</div>
                    <div>
                      <CheckBox
                        radioBox
                        label="Token"
                        checked={!targetedAssetType}
                        onCheck={() => {
                          setTargetedAssetType(false);
                          setTargetedAssetInfo('');
                        }}
                      />
                    </div>
                    <div>
                      <CheckBox
                        radioBox
                        label="Native Token"
                        checked={targetedAssetType}
                        onCheck={() => {
                          setTargetedAssetType(true);
                          setTargetedAssetInfo('');
                        }}
                      />
                    </div>
                  </div>
                  <div className={cx('row', 'pt-16')}>
                    <div className={cx('label')}>{!targetedAssetType ? 'Contract Address' : 'Denom'}</div>
                    <Input
                      className={cx('input', theme)}
                      value={targetedAssetInfo}
                      style={{
                        color: theme === 'light' && 'rgba(39, 43, 48, 1)'
                      }}
                      onChange={(e) => setTargetedAssetInfo(e?.target?.value)}
                      placeholder={!targetedAssetType ? 'oraixxxxxxxx.....xxxxxxx' : 'orai'}
                    />
                  </div>
                </div>
              )}
              {isMintNewToken && (
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
                          placeholder="ORAICHAIN"
                        />
                      </div>
                    </div>
                  </div>
                  <div className={cx('option')}>
                    <CheckBox label="Minter (Optional)" checked={isMinter} onCheck={setIsMinter} />
                  </div>
                  {isMinter && (
                    <div>
                      <div className={cx('row', 'pt-16')}>
                        <div className={cx('label')}>Minter</div>
                        <Input
                          className={cx('input', theme)}
                          value={minter}
                          style={{
                            color: theme === 'light' && 'rgba(39, 43, 48, 1)'
                          }}
                          onChange={(e) => setMinter(e?.target?.value)}
                          placeholder="MINTER"
                        />
                      </div>
                      <div className={cx('row', 'pt-16')}>
                        <div className={cx('label')}>Cap (Optional)</div>
                        <NumberFormat
                          placeholder="0"
                          className={cx('input', theme)}
                          style={{
                            color: theme === 'light' ? 'rgba(126, 92, 197, 1)' : 'rgb(255, 222, 91)'
                          }}
                          thousandSeparator
                          decimalScale={6}
                          type="text"
                          value={toDisplay(cap)}
                          onValueChange={({ floatValue }) => {
                            setCap(toAmount(floatValue));
                          }}
                        />
                      </div>
                    </div>
                  )}
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
                            onClick={() => selectedInitBalances.length && setTypeDelete('Init Balances')}
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
                              />
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
              <div className={cx('row', 'pt-16')}>
                <div className={cx('label')}>Quote token</div>
                <div>
                  <CheckBox
                    radioBox
                    label="Token"
                    checked={!pairAssetType}
                    onCheck={() => {
                      setPairAssetType(false);
                      setPairAssetAddress('');
                    }}
                  />
                </div>
                <div>
                  <CheckBox
                    radioBox
                    label="Native Token"
                    checked={pairAssetType}
                    onCheck={() => {
                      setPairAssetType(true);
                      setPairAssetAddress('');
                    }}
                  />
                </div>
              </div>
              <div className={cx('row', 'pt-16')}>
                <div className={cx('label')}>{!pairAssetType ? 'Contract Address' : 'Denom'}</div>
                <Input
                  className={cx('input', theme)}
                  value={pairAssetAddress}
                  style={{
                    color: theme === 'light' && 'rgba(39, 43, 48, 1)'
                  }}
                  onChange={(e) => setPairAssetAddress(e?.target?.value)}
                  placeholder={!pairAssetType ? 'oraixxxxxxxx.....xxxxxxx' : 'orai'}
                />
              </div>
            </div>
          </div>
          <div className={cx('box', theme)}>
            <div className={cx('add-reward-btn')} onClick={() => setIsAddListToken(true)}>
              <PlusIcon />
              <span>Add a new pool reward token</span>
            </div>
            <div className={cx('rewards')}>
              <div className={cx('rewards-list')}>
                <CheckBox
                  label={`Select All(${selectedReward.length})`}
                  checked={rewardTokens.length && selectedReward.length === rewardTokens.length}
                  onCheck={() => handleOnCheck(selectedReward, setSelectedReward, rewardTokens)}
                />
                <div className={cx('trash')} onClick={() => selectedReward.length && setTypeDelete('Reward')}>
                  <TrashIcon />
                </div>
              </div>
              <div style={{ height: 24 }} />
              {rewardTokens?.map((item, index) => {
                return (
                  <div key={index}>
                    <RewardItems
                      rewardTokens={rewardTokens}
                      selectedReward={selectedReward}
                      setRewardTokens={setRewardTokens}
                      setSelectedReward={setSelectedReward}
                      ind={index}
                      item={item}
                      theme={theme}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {isAddListToken ? (
            <ModalListToken
              tokensNew={tokensNew}
              setTokensNew={setTokensNew}
              setRewardTokens={setRewardTokens}
              rewardTokens={rewardTokens}
              allRewardSelect={allRewardSelect}
              theme={theme}
              setIsAddListToken={setIsAddListToken}
            />
          ) : null}
          {typeDelete ? (
            <ModalDelete
              rewardTokens={rewardTokens}
              typeDelete={typeDelete}
              setTypeDelete={setTypeDelete}
              selectedReward={selectedReward}
              setSelectedReward={setSelectedReward}
              setRewardTokens={setRewardTokens}
              initBalances={initBalances}
              setInitBalances={setInitBalances}
              selectedInitBalances={selectedInitBalances}
              setSelectedInitBalances={setSelectedInitBalances}
              theme={theme}
            />
          ) : null}
        </div>
        <div
          className={cx(
            'create-btn',
            (isLoading || (!tokenName && !targetedAssetInfo) || !rewardTokens.length) && 'disable-btn'
          )}
          onClick={() => !isLoading && (tokenName || targetedAssetInfo) && rewardTokens.length && handleCreateToken()}
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
