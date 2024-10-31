import Tippy, { TippyProps } from '@tippyjs/react';
import TooltipIconImg from 'assets/icons/icon_tooltip.svg?react';
import classNames from 'classnames';
import React, { FC, ReactElement } from 'react';

import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';
import styles from './index.module.scss';

export const DefaultTippyProps: TippyProps = {
  animation: false,
  interactive: true,
  appendTo: document.body
};

const TooltipTippyProps: TippyProps = {
  ...DefaultTippyProps,
  placement: 'top',
  theme: 'dark-border',
  className: styles.tooltip
};

interface Props extends TippyProps {
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  visible: boolean;
  icon?: ReactElement;
}

export const TooltipInfo: FC<Props> = ({ className, children, setVisible, visible, ...props }) => {
  const hide = () => setVisible(false);

  const button = (
    <span className={classNames(styles.button, className)} onClick={() => setVisible(!visible)}>
      {children}
    </span>
  );

  return props.content ? (
    <Tippy
      visible={visible}
      onClickOutside={hide}
      popperOptions={{
        modifiers: [
          {
            name: 'arrow',
            options: {
              element: null
            }
          }
        ]
      }}
      {...TooltipTippyProps}
      {...props}
    >
      {button}
    </Tippy>
  ) : (
    button
  );
};

export const TooltipIconBtn: FC<Props> = ({ children, ...props }) => {
  return (
    <div className={styles.flex}>
      {children}
      <div className={styles.icon}>
        <TooltipInfo {...props} visible={props.visible} setVisible={props.setVisible}>
          {props.icon ? props.icon : <TooltipIconImg />}
        </TooltipInfo>
      </div>
    </div>
  );
};
