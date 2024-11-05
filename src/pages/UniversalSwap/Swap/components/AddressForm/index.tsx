import {
  CustomChainInfo,
  TokenItemType,
  flattenTokens,
  checkValidateAddressWithNetwork
} from '@oraichain/oraidex-common';
import BackIcon from 'assets/icons/back.svg?react';
import CloseIcon from 'assets/icons/close.svg?react';
import SelectTokenIcon from 'assets/icons/select_token.svg?react';
import DefaultIcon from 'assets/icons/tokens.svg?react';
import { Button } from 'components/Button';
import ToggleSwitch from 'components/ToggleSwitch';
import { networks } from 'helper';
import useTheme from 'hooks/useTheme';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addAddressBookList,
  editAddressBookList,
  removeAddressBookItem,
  selectCurrentAddressBookStep,
  selectEditedWallet,
  setCurrentAddressBookStep
} from 'reducer/addressBook';
import { AddressBookType, AddressManagementStep } from 'reducer/type';
import InputCommon from '../InputCommon';
import SelectInput from '../SelectInput';
import styles from './index.module.scss';
import { getTokenIcon } from 'pages/UniversalSwap/helpers';
import { useCopyClipboard } from 'hooks/useCopyClipboard';
import { oraichainTokensWithIcon } from 'config/chainInfos';

const AddressBookForm = ({ tokenTo }: { tokenTo: TokenItemType }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { handleReadClipboard } = useCopyClipboard();
  const currentStep = useSelector(selectCurrentAddressBookStep);
  const currentEdit = useSelector(selectEditedWallet);
  const [addressBook, setAddressBook] = useState<AddressBookType>();

  const currentToken = addressBook?.token;
  const currentNetwork = addressBook?.network;

  useEffect(() => {
    if (currentEdit && currentStep === AddressManagementStep.EDIT) {
      setAddressBook(currentEdit);
    } else if (tokenTo && currentStep === AddressManagementStep.CREATE) {
      const chain = networks.find((e) => tokenTo.chainId === e.chainId);

      setAddressBook((addressBook) => {
        return {
          ...addressBook,
          network: chain,
          token: tokenTo
        };
      });
    }
  }, [currentEdit, currentStep, tokenTo]);

  const CurrentTokenIcon = getTokenIcon(currentToken, theme);

  const allChainOfToken = flattenTokens
    .filter((tk) => addressBook?.token?.coinGeckoId === tk.coinGeckoId)
    .map((e) => e.chainId);

  const fmtListNetworks = networks.filter((n) => {
    if (!addressBook?.token) {
      return n;
    }
    return allChainOfToken.includes(n.chainId);
  });

  const renderTokenItem = useCallback(
    (token: TokenItemType) => {
      const Icon = getTokenIcon(token, theme);

      return (
        <div className={styles.label}>
          <div>{Icon ? <Icon /> : <DefaultIcon />}</div>
          <span>{token?.name}</span>
        </div>
      );
    },
    [theme]
  );

  const renderNetworkItem = useCallback((network: CustomChainInfo) => {
    return (
      <div className={styles.label}>
        <span>{network?.chainName}</span>
      </div>
    );
  }, []);

  const validAddress = !addressBook?.address
    ? {
        isValid: true
      }
    : checkValidateAddressWithNetwork(addressBook?.address, currentNetwork?.chainId || tokenTo?.chainId);

  return (
    <div className={styles.addressBookForm}>
      <div className={styles.header}>
        <div
          className={styles.back}
          onClick={() => {
            dispatch(setCurrentAddressBookStep(AddressManagementStep.SELECT));
          }}
        >
          <BackIcon
            onClick={() => {
              dispatch(setCurrentAddressBookStep(AddressManagementStep.SELECT));
            }}
          />
        </div>

        <span className={styles.title}>
          {currentStep === AddressManagementStep.EDIT ? 'Edit Address' : 'Add new Address'}
        </span>

        <div
          className={styles.close}
          onClick={() => {
            dispatch(setCurrentAddressBookStep(AddressManagementStep.INIT));
          }}
        >
          <CloseIcon
            onClick={() => {
              dispatch(setCurrentAddressBookStep(AddressManagementStep.INIT));
            }}
          />
        </div>
      </div>

      <div className={styles.form}>
        <InputCommon
          title="Wallet Address"
          suffix={
            <div
              onClick={() => {
                handleReadClipboard((text) =>
                  setAddressBook((addressBook) => {
                    return { ...addressBook, address: text?.trim() || '' };
                  })
                );
              }}
            >
              PASTE
            </div>
          }
          onChange={(value) => {
            setAddressBook((addressBook) => {
              return {
                ...addressBook,
                address: value
              };
            });
          }}
          value={addressBook?.address}
          error={!validAddress?.isValid && 'Invalid address'}
        />

        <div className={styles.selectToken}>
          <SelectInput
            title="Select token"
            warningText="Ensure that the selected token matches your entered address to avoid potential loss of funds"
            listItem={oraichainTokensWithIcon.filter(
              (e) => e.decimals === 6 && !['kawaii-islands', 'milky-token'].includes(e.coinGeckoId)
            )}
            prefix={
              CurrentTokenIcon ? (
                <div className={styles.tokenIcon}>
                  <CurrentTokenIcon />
                </div>
              ) : (
                <div className={styles.selectTokenIcon}>
                  <SelectTokenIcon />
                </div>
              )
            }
            value={currentToken}
            label={currentToken && <div>{currentToken?.name}</div>}
            onChange={(item: TokenItemType) => {
              setAddressBook((addressBook) => {
                return { ...addressBook, token: item, isUniversal: false, network: fmtListNetworks?.[0] || null };
              });
            }}
            renderItem={renderTokenItem}
          />

          <div className={styles.checkbox}>
            <ToggleSwitch
              small={true}
              id="isUniversal"
              checked={!!addressBook?.isUniversal}
              onChange={() =>
                setAddressBook((addressBook) => {
                  return {
                    ...addressBook,
                    isUniversal: !addressBook?.isUniversal,
                    token: null
                  };
                })
              }
            />
            <label htmlFor="isUniversal">Set as a Universal address</label>
          </div>
        </div>

        <span className={styles.desc}>A universal address can transfer all tokens within its network.</span>

        <SelectInput
          title="Select network"
          warningText="Ensure that the selected network matches your entered address to avoid potential loss of funds"
          listItem={fmtListNetworks}
          value={currentNetwork}
          label={currentNetwork && <div>{currentNetwork?.chainName}</div>}
          onChange={(item: CustomChainInfo) => {
            setAddressBook((addressBook) => {
              return { ...addressBook, network: item };
            });
          }}
          renderItem={renderNetworkItem}
        />

        {/* <InputCommon
          title="Memo (Required if send to KuCoin address)"
          onChange={(value) => {
            setAddressBook((addressBook) => {
              return {
                ...addressBook,
                memo: value
              };
            });
          }}
          value={addressBook?.memo}
        /> */}

        <InputCommon
          title="Wallet name"
          onChange={(value) => {
            setAddressBook((addressBook) => {
              return {
                ...addressBook,
                walletName: value
              };
            });
          }}
          value={addressBook?.walletName}
        />
      </div>
      <div className={styles.btn}>
        {currentStep === AddressManagementStep.EDIT && (
          <Button
            type="error"
            onClick={() => {
              dispatch(removeAddressBookItem(addressBook));
              dispatch(setCurrentAddressBookStep(AddressManagementStep.SELECT));
            }}
          >
            Remove address
          </Button>
        )}
        <Button
          type="primary"
          onClick={() => {
            if (currentStep === AddressManagementStep.CREATE) {
              dispatch(addAddressBookList(addressBook));
            } else if (currentStep === AddressManagementStep.EDIT) {
              dispatch(editAddressBookList(addressBook));
            }

            dispatch(setCurrentAddressBookStep(AddressManagementStep.SELECT));
          }}
          disabled={
            !addressBook?.walletName ||
            !addressBook?.address ||
            !addressBook?.network ||
            !(addressBook?.isUniversal || addressBook?.token) ||
            !validAddress.isValid
          }
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default AddressBookForm;
