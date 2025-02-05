import LinkIcon from 'assets/icons/link.svg?react';
import FailedIcon from 'assets/icons/ic_failed_trans.svg?react';
import InfoIcon from 'assets/icons/ic_info_trans.svg?react';
import SuccessIcon from 'assets/icons/ic_status_done.svg?react';
import CloseIcon from 'assets/icons/ic_close_toast.svg?react';
import Loader from 'components/Loader';
import { reduceString } from 'libs/utils';
import { toast, ToastOptions } from 'react-toastify';
import styles from './Toast.module.scss';
import { FunctionComponent } from 'react';
import { EVENT_CONFIG_THEME } from 'config/eventConfig';
import { initialState } from 'reducer/temporaryConfig';

const defaultOptions: ToastOptions = {
  position: 'top-right',
  theme: 'dark',
  toastId: undefined,
  autoClose: 7000,
  hideProgressBar: true,
  closeOnClick: false,
  pauseOnHover: true,
  draggable: false,
  progress: undefined,
  pauseOnFocusLoss: false,
  closeButton: <CloseIcon />
};

const defaultExtraData = { message: '', customLink: '' };
const configTheme = EVENT_CONFIG_THEME['dark'][initialState.event];

export enum TToastType {
  TX_BROADCASTING,
  TX_SUCCESSFUL,
  TX_FAILED,
  TX_INFO,
  KEPLR_FAILED,
  METAMASK_FAILED,
  TRONLINK_FAILED,
  WALLET_FAILED
}

interface IToastExtra {
  message: string;
  customLink: string;
  textLink: string;
  toastId?: string;
  linkCw20Token?: string;
  cw20Address?: string;
  linkLpAddress?: string;
  linkPairAddress?: string;
}

export type DisplayToastFn = ((
  type: TToastType.TX_INFO,
  extraData?: Partial<Pick<IToastExtra, 'message'>>,
  options?: Partial<ToastOptions>
) => void) &
  ((type: TToastType.TX_BROADCASTING, options?: Partial<ToastOptions>) => void) &
  ((
    type: TToastType.TX_SUCCESSFUL,
    extraData?: Partial<
      Pick<IToastExtra, 'customLink' | 'linkCw20Token' | 'cw20Address' | 'linkLpAddress' | 'linkPairAddress'>
    >,
    options?: Partial<ToastOptions>
  ) => void) &
  ((
    type: TToastType.TX_FAILED,
    extraData?: Partial<Pick<IToastExtra, 'message'>>,
    options?: Partial<ToastOptions>
  ) => void) &
  ((
    type: TToastType.KEPLR_FAILED,
    extraData?: Partial<Pick<IToastExtra, 'message'>>,
    options?: Partial<ToastOptions>
  ) => void) &
  ((
    type: TToastType.METAMASK_FAILED,
    extraData?: Partial<Pick<IToastExtra, 'message'>>,
    options?: Partial<ToastOptions>
  ) => void) &
  ((
    type: TToastType.TRONLINK_FAILED,
    extraData?: Partial<Pick<IToastExtra, 'message'>>,
    options?: Partial<ToastOptions>
  ) => void) &
  ((
    type: TToastType.TX_INFO,
    extraData?: Partial<Pick<IToastExtra, 'message' | 'toastId' | 'customLink' | 'textLink'>>,
    options?: Partial<ToastOptions>
  ) => void) &
  ((
    type: TToastType.WALLET_FAILED,
    extraData?: Partial<Pick<IToastExtra, 'message' | 'customLink' | 'textLink'>>,
    options?: Partial<ToastOptions>
  ) => void);

export interface DisplayToast {
  displayToast: DisplayToastFn;
  theme: 'dark' | 'light';
}

export const displayToast: DisplayToastFn = (
  type: TToastType,
  extraData?: Partial<IToastExtra> | Partial<ToastOptions>,
  options?: Partial<ToastOptions>
) => {
  const refinedOptions = type === TToastType.TX_BROADCASTING ? extraData ?? {} : options ?? {};
  const refinedExtraData = extraData ? extraData : {};
  const inputExtraData = {
    ...defaultExtraData,
    ...refinedExtraData
  } as IToastExtra;
  const inputOptions = {
    ...defaultOptions,
    ...refinedOptions,
    toastId: extraData?.toastId,
    closeOnClick: true
  } as ToastOptions;
  switch (type) {
    case TToastType.TX_INFO:
      return toast(
        <ToastInfo
          message={inputExtraData.message}
          link={inputExtraData.customLink}
          textLink={inputExtraData.textLink}
        />,
        inputOptions
      );
    case TToastType.TX_BROADCASTING:
      return toast(<ToastTxBroadcasting />, inputOptions);
    case TToastType.TX_SUCCESSFUL:
      return toast(
        <ToastTxSuccess
          link={inputExtraData.customLink}
          linkCw20Token={inputExtraData.linkCw20Token}
          cw20Address={inputExtraData.cw20Address}
          linkLpAddress={inputExtraData.linkLpAddress}
          linkPairAddress={inputExtraData.linkPairAddress}
        />,
        inputOptions
      );
    case TToastType.TX_FAILED:
      return toast(<ToastTxFailed message={inputExtraData.message} />, inputOptions);
    case TToastType.KEPLR_FAILED:
      return toast(<ToastKeplrFailed message={inputExtraData.message} />, inputOptions);
    case TToastType.METAMASK_FAILED:
      return toast(<ToastMetamaskFailed message={inputExtraData.message} />, inputOptions);
    case TToastType.TRONLINK_FAILED:
      return toast(<ToastTronLinkFailed message={inputExtraData.message} />, inputOptions);
    case TToastType.WALLET_FAILED:
      return toast(<ToastWalletFailed message={inputExtraData.message} />, inputOptions);
    default:
      return console.error(`Undefined toast type - ${type}`);
  }
};

const ToastTxBroadcasting: FunctionComponent = () => (
  <div className={styles.toast_content}>
    <Loader width={40} height={40} />
    <section className={styles.toast_section}>
      <h6>Transaction Broadcasting</h6>
      <p>Waiting for transaction to be included in the block</p>
    </section>
  </div>
);

const ToastInfo: FunctionComponent<{
  message: string;
  link: string;
  textLink: string;
}> = ({ message, link, textLink }) => (
  <div className={styles.toast_content}>
    {getIconToastTx(<InfoIcon />, configTheme?.toast?.txInfoImg)}
    <section className={styles.toast_section}>
      <p>{message}</p>
      {link && (
        <a target="__blank" href={link}>
          {textLink ?? 'View on Instructions'} <LinkIcon />
        </a>
      )}
    </section>
  </div>
);

const getIconToastTx = (txIcon, txImg) => {
  if (!txImg) return txIcon;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginLeft: '-12px'
      }}
    >
      <img width={60} src={txImg} alt="" />
      {txIcon}
    </div>
  );
};

const ToastTxFailed: FunctionComponent<{ message: string }> = ({ message }) => (
  <div className={styles.toast_content}>
    {getIconToastTx(<FailedIcon />, configTheme?.toast?.txFailImg)}
    <section className={styles.toast_section}>
      <h6>Transaction Failed</h6>
      <p>{message}</p>
    </section>
  </div>
);

const ToastKeplrFailed: FunctionComponent<{ message: string }> = ({ message }) => (
  <div className={styles.toast_content}>
    {getIconToastTx(<FailedIcon />, configTheme?.toast?.txFailImg)}
    <section className={styles.toast_section}>
      <h6>Keplr failed</h6>
      <p>{message}</p>
    </section>
  </div>
);

const ToastMetamaskFailed: FunctionComponent<{ message: string }> = ({ message }) => (
  <div className={styles.toast_content}>
    {getIconToastTx(<FailedIcon />, configTheme?.toast?.txFailImg)}
    <section className={styles.toast_section}>
      <h6>Metamask failed</h6>
      <p>{message}</p>
    </section>
  </div>
);

const ToastTronLinkFailed: FunctionComponent<{ message: string }> = ({ message }) => (
  <div className={styles.toast_content}>
    {getIconToastTx(<FailedIcon />, configTheme?.toast?.txFailImg)}
    <section className={styles.toast_section}>
      <h6>Tronlink failed</h6>
      <p>{message}</p>
    </section>
  </div>
);

const ToastWalletFailed: FunctionComponent<{ message: string }> = ({ message }) => (
  <div className={styles.toast_content}>
    {getIconToastTx(<FailedIcon />, configTheme?.toast?.txFailImg)}
    <section className={styles.toast_section}>
      <h6>Wallet failed</h6>
      <p>{message}</p>
    </section>
  </div>
);

const ToastTxSuccess: FunctionComponent<{
  link: string;
  linkCw20Token?: string;
  cw20Address?: string;
  linkLpAddress?: string;
  linkPairAddress?: string;
}> = ({ link, linkCw20Token, cw20Address, linkLpAddress, linkPairAddress }) => (
  <div className={styles.toast_content}>
    {getIconToastTx(<SuccessIcon />, configTheme?.toast?.txSuccessImg)}
    <section className={styles.toast_section}>
      <h6>Transaction Successful</h6>
      {cw20Address && (
        <div className={styles.cw20_section} onClick={() => window.open(linkCw20Token)}>
          <span className={styles.cw20_section_label}>CW20 Token</span>:{' '}
          <span className={styles.cw20_section_value}>{reduceString(cw20Address, 6, 6)}</span>
          <LinkIcon />
        </div>
      )}
      {linkLpAddress && (
        <div className={styles.cw20_section} onClick={() => window.open(linkLpAddress)}>
          <span className={styles.cw20_section_label}>LP Token</span>: <LinkIcon />
        </div>
      )}
      {linkPairAddress && (
        <div className={styles.cw20_section} onClick={() => window.open(linkPairAddress)}>
          <span className={styles.cw20_section_label}>Pair contract</span>: <LinkIcon />
        </div>
      )}
      <a target="__blank" href={link}>
        View on Explorer <LinkIcon width={15} height={15} />
      </a>
    </section>
  </div>
);
