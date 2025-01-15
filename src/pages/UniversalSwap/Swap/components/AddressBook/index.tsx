import { TokenItemType } from '@oraichain/oraidex-common';
import CloseIcon from 'assets/icons/close.svg?react';
import EditIcon from 'assets/icons/edit_icon.svg?react';
import SelectTokenIcon from 'assets/icons/select_token.svg?react';
import EmptyImg from 'assets/images/img_empty.svg?react';
import TooltipIcon from 'assets/icons/icon_tooltip.svg?react';
import { Button } from 'components/Button';
import useOnClickOutside from 'hooks/useOnClickOutside';
import styles from './index.module.scss';
import useTheme from 'hooks/useTheme';
import { getTokenIcon } from 'pages/UniversalSwap/helpers';
import { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectAddressBookList,
  selectCurrentAddressBookStep,
  setCurrentAddressBookStep,
  setEditedWallet
} from 'reducer/addressBook';
import { AddressManagementStep } from 'reducer/type';
import AddressBookForm from '../AddressForm';

const AddressBook = ({ tokenTo, onSelected }: { tokenTo: TokenItemType; onSelected: (addr: string) => void }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const currentAddressManagementStep = useSelector(selectCurrentAddressBookStep);
  const listAddresses = useSelector(selectAddressBookList);
  const ref = useRef();

  useOnClickOutside(ref, () => {
    dispatch(setCurrentAddressBookStep(AddressManagementStep.INIT));
  });

  const addressesWithCurrentNetwork = listAddresses?.filter(
    (a) => a.network.chainId === tokenTo?.chainId && (a.isUniversal || a.token?.coinGeckoId === tokenTo?.coinGeckoId)
  );
  const otherAddressNetwork = listAddresses?.filter(
    (a) => a.network.chainName !== tokenTo?.chainId || (!a.isUniversal && a.token?.coinGeckoId !== tokenTo?.coinGeckoId)
  );

  return (
    <div>
      {/* {currentAddressManagementStep !== AddressManagementStep.INIT && (
        <div
          className={styles.overlay}
          onClick={() =>
            currentAddressManagementStep === AddressManagementStep.SELECT &&
            dispatch(setCurrentAddressBookStep(AddressManagementStep.INIT))
          }
        ></div>
      )} */}
      <div
        className={`${styles.addressBook} ${
          currentAddressManagementStep !== AddressManagementStep.INIT ? styles.active : ''
        }`}
        // ref={ref}
      >
        {[AddressManagementStep.CREATE, AddressManagementStep.EDIT].includes(currentAddressManagementStep) ? (
          <AddressBookForm tokenTo={tokenTo} />
        ) : (
          <div className={styles.management}>
            <div className={styles.header}>
              <div className={styles.title}>Select an Address</div>{' '}
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

            {listAddresses?.length > 0 ? (
              <div className={styles.list}>
                {addressesWithCurrentNetwork?.length > 0 && (
                  <div className={`${styles.warningBox} ${styles[theme]}`}>
                    <div>
                      <TooltipIcon width={20} height={20} />
                    </div>
                    <span>
                      Ensure that the token and network of the selected address match your entered token to avoid
                      potential loss of funds
                    </span>
                  </div>
                )}

                {addressesWithCurrentNetwork?.map((item, key) => {
                  const IconToken = getTokenIcon(item.token, theme);

                  return (
                    <div className={styles.item} key={key}>
                      <div
                        className={styles.content}
                        onClick={() => {
                          item?.address && onSelected(item?.address);
                          dispatch(setCurrentAddressBookStep(AddressManagementStep.INIT));
                        }}
                      >
                        {IconToken ? (
                          <div className={styles.tokenIcon}>
                            <img src={IconToken} width={30} height={30} />
                          </div>
                        ) : (
                          <div className={styles.selectTokenIcon}>
                            <SelectTokenIcon />
                          </div>
                        )}

                        <div className={styles.info}>
                          <div className={styles.name}>{item.walletName}</div>
                          <div className={styles.address}>{item.address}</div>
                          <div className={styles.extraInfo}>
                            <span className={styles.chain}>{item.network?.chainName}</span>
                            {item.memo && <span className={styles.memo}>Memo: {item.memo}</span>}
                          </div>
                        </div>
                      </div>

                      <div
                        className={styles.edit}
                        onClick={() => {
                          dispatch(setEditedWallet(item));
                          dispatch(setCurrentAddressBookStep(AddressManagementStep.EDIT));
                        }}
                      >
                        <EditIcon
                          onClick={() => {
                            dispatch(setEditedWallet(item));
                            dispatch(setCurrentAddressBookStep(AddressManagementStep.EDIT));
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                {addressesWithCurrentNetwork?.length > 0 && otherAddressNetwork?.length > 0 && (
                  <div className={styles.divider}></div>
                )}

                {otherAddressNetwork?.length > 0 && (
                  <span className={styles.warning}>Sending assets to the addresses below may not be credited</span>
                )}

                {otherAddressNetwork?.map((item, key) => {
                  const IconToken = getTokenIcon(item.token, theme);

                  return (
                    <div key={`otherAddressNetwork-${key}`} className={`${styles.item} ${styles.inactive}`}>
                      <div className={styles.content}>
                        {IconToken ? (
                          <div className={styles.tokenIcon}>
                            <img src={IconToken} width={30} height={30} />
                          </div>
                        ) : (
                          <div className={styles.selectTokenIcon}>
                            <SelectTokenIcon />
                          </div>
                        )}

                        <div className={styles.info}>
                          <div className={styles.name}>{item.walletName}</div>
                          <div className={styles.address}>{item.address}</div>
                          <div className={styles.extraInfo}>
                            <span className={styles.chain}>{item.network?.chainName}</span>
                            {item.memo && <span className={styles.memo}>Memo: {item.memo}</span>}
                          </div>
                        </div>
                      </div>

                      <div
                        className={styles.edit}
                        onClick={() => {
                          dispatch(setEditedWallet(item));
                          dispatch(setCurrentAddressBookStep(AddressManagementStep.EDIT));
                        }}
                      >
                        <EditIcon
                          onClick={() => {
                            dispatch(setEditedWallet(item));
                            dispatch(setCurrentAddressBookStep(AddressManagementStep.EDIT));
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.noData}>
                <EmptyImg />
                <span className={styles.titleNodata}>No results found</span>
                <span>Save addresses for convenient transfers.</span>
              </div>
            )}

            <div className={styles.btn}>
              <Button
                type="primary"
                onClick={() => {
                  dispatch(setCurrentAddressBookStep(AddressManagementStep.CREATE));
                }}
              >
                Add new address
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressBook;
