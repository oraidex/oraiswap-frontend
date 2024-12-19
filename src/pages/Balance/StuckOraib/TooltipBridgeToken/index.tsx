import { FC } from 'react';
import Tippy, { TippyProps } from '@tippyjs/react';
import classNames from 'classnames';
import InfoIcon from 'assets/icons/info.svg?react';

import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';
import styles from './TooltipBridgeToken.module.scss';

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
  onClick?: () => void;
}

const Tooltip: FC<Props> = ({ className, onClick, children, ...props }) => {
  const button = (
    <span className={classNames(styles.button, className)} onClick={onClick}>
      {children}
    </span>
  );

  return props.content ? (
    <Tippy
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
      hideOnClick={props.visible}
    >
      {button}
    </Tippy>
  ) : (
    button
  );
};

export const TooltipIcon: FC<Props> = ({ children, ...props }) => (
  <div className={styles.flex}>
    {children}
    <div className={styles.icon}>
      <Tooltip {...props}>
        <InfoIcon name="info" />
      </Tooltip>
    </div>
  </div>
);

export default Tooltip;
