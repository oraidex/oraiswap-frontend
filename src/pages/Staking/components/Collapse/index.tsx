import { ReactElement, useState } from 'react';

import MinusIcon from 'assets/icons/minus.svg?react';
import PlusIcon from 'assets/icons/plusIcon.svg?react';
import styles from './index.module.scss';

export type CollapseType = { label: string; content: string | ReactElement; key?: React.Key };

const CollapseButton = ({ label, content, key }: CollapseType) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.collapse}>
      <div
        className={styles.header}
        onClick={() => {
          setOpen((open) => !open);
        }}
      >
        <span>{label}</span>
        <div
          className={styles.btn}
          onClick={() => {
            setOpen((open) => !open);
          }}
        >
          {open ? (
            <MinusIcon
              onClick={() => {
                setOpen((open) => !open);
              }}
            />
          ) : (
            <PlusIcon
              onClick={() => {
                setOpen((open) => !open);
              }}
            />
          )}
        </div>
      </div>

      <div className={`${styles.content} ${open ? styles.active : ''}`}>{content}</div>
    </div>
  );
};

export default CollapseButton;
