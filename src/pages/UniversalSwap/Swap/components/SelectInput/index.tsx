import DownIcon from 'assets/icons/down-arrow-v2.svg?react';
import CloseIcon from 'assets/icons/close.svg?react';
import TooltipIcon from 'assets/icons/icon_tooltip.svg?react';
import SelectIcon from 'assets/icons/select_token.svg?react';
import useOnClickOutside from 'hooks/useOnClickOutside';
import { isEqual } from 'lodash';
import { ReactNode, memo, useRef, useState } from 'react';
import styles from './index.module.scss';
import useTheme from 'hooks/useTheme';

export type SelectInputType<T extends object> = {
  title: string;
  onChange: (item: T) => void;
  value?: T;
  label?: ReactNode;

  listItem: T[];
  listTitle?: string;

  warningText: string;
  renderItem: (item: T) => ReactNode;

  prefix?: ReactNode;
  suffix?: ReactNode;
};

const SelectInput = <T extends object>({
  title,
  onChange,
  suffix,
  value,
  prefix,
  label,
  listItem,
  listTitle,
  warningText,
  renderItem
}: SelectInputType<T>) => {
  const theme = useTheme();
  const [active, setActive] = useState(false);

  const ref = useRef();

  useOnClickOutside(ref, () => {
    setActive(false);
  });

  return (
    <div className={styles.selectInput}>
      <div
        className={styles.prefix}
        onClick={(e) => {
          setActive(true);
        }}
      >
        {prefix}
        <div className={styles.value}>
          <p>{title}</p>
          {label && <div className={styles.label}>{label}</div>}
        </div>
      </div>
      {suffix ? (
        <div
          className={styles.suffix}
          onClick={(e) => {
            setActive(true);
          }}
        >
          {suffix}
        </div>
      ) : (
        <div
          className={styles.suffix}
          onClick={(e) => {
            setActive(true);
          }}
        >
          <DownIcon />
        </div>
      )}

      <div className={`${styles.overlay} ${active ? styles.activeOverlay : ''}`} onClick={() => setActive(false)}></div>
      {/* ref={ref} */}
      <div className={`${styles.listWrapper} ${active ? styles.active : ''}`}>
        <span className={styles.title}>{listTitle || title}</span>
        <div
          className={styles.close}
          onClick={() => {
            setActive(false);
          }}
        >
          <CloseIcon />
        </div>
        <div className={`${styles.warning} ${styles[theme]}`}>
          <div>
            <TooltipIcon width={20} height={20} />
          </div>
          <span>{warningText}</span>
        </div>
        <div className={styles.list}>
          {listItem?.map((item, key) => {
            return (
              <div
                className={`${styles.item} ${isEqual(value, item) ? styles.activeItem : ''}`}
                key={key}
                onClick={() => {
                  onChange(item);
                  setActive(false);
                }}
              >
                {renderItem(item)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default memo(SelectInput);
