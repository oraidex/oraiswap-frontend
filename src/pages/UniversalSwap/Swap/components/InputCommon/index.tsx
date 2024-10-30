import useOnClickOutside from 'hooks/useOnClickOutside';
import styles from './index.module.scss';
import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { reduceString } from 'libs/utils';
import ErrorIcon from 'assets/icons/icon_error.svg?react';
import CloseIcon from 'assets/icons/close.svg?react';
import { isMobile } from '@walletconnect/browser-utils';
import classNames from 'classnames';

const REDUCE_STRING_ADDRESS = 8;
const REDUCE_STRING_ADDRESS_MOBILE = 6;

const InputCommon: FC<{
  defaultValue?: string;
  title: string;
  onChange: (value: string) => void;
  value?: string;

  prefix?: ReactNode;
  suffix?: ReactNode;

  extraButton?: ReactNode;
  showPreviewOnBlur?: boolean;

  isOnViewPort?: boolean;

  error?: string;
  hidePrefixOnActive?: boolean;
}> = ({
  title,
  onChange,
  value,
  prefix,
  suffix,
  extraButton,
  showPreviewOnBlur,
  isOnViewPort = true,
  error,
  defaultValue = '',
  hidePrefixOnActive = true
}) => {
  const [active, setActive] = useState(false);
  const [showError, setShowError] = useState(false);
  const mobileMode = isMobile();

  const inputRef = useRef<HTMLInputElement>();
  const ref = useRef();

  useOnClickOutside(ref, () => {
    if ((!value || showPreviewOnBlur) && isOnViewPort) {
      setActive(false);
    }

    if (!value && defaultValue) {
      onChange(defaultValue);
    }

    setShowError(true);
    inputRef.current?.blur();
  });

  useEffect(() => {
    // check case clear all text
    if (!showPreviewOnBlur && value !== '') {
      setActive(!!value);
    }
  }, [value, showPreviewOnBlur]);

  return (
    <div ref={ref} className={`${styles.inputCommonWrapper} ${showError && error ? styles.error : ''}`}>
      <div
        className={`${styles.inputCommon}`}
        onClick={() => {
          setActive(true);
          inputRef.current?.focus();
          // setShowError(false);
        }}
      >
        <div className={styles.prefix}>
          <span className={styles.title}>
            {((active && !hidePrefixOnActive) || !active) && prefix}
            <p>{title}</p>
          </span>
          <input
            className={`${styles.input} ${active ? styles.activeInput : ''} ${
              value === defaultValue ? styles.isDefault : ''
            }`}
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e?.target?.value)}
          />
        </div>
        {!active && value && showPreviewOnBlur && (
          <div className={styles.prev}>
            {reduceString(
              value,
              mobileMode ? REDUCE_STRING_ADDRESS_MOBILE : REDUCE_STRING_ADDRESS,
              mobileMode ? REDUCE_STRING_ADDRESS_MOBILE : REDUCE_STRING_ADDRESS
            )}
          </div>
        )}
        {suffix && (
          <div
            className={classNames(styles.suffix, {
              [styles.activeSuffix]: active
            })}
          >
            {value && active && (
              <div className={styles.clear} onClick={() => onChange('')}>
                <CloseIcon />
              </div>
            )}
            <div className={styles.paste}>{suffix}</div>
          </div>
        )}
      </div>

      {extraButton && active && (
        <div className={`${styles.extraBtn} ${active ? styles.activeExtra : ''}`}>{extraButton}</div>
      )}

      {showError && error && (
        <div className={styles.errorTxt}>
          <ErrorIcon />
          {error}
        </div>
      )}
    </div>
  );
};

export default InputCommon;
