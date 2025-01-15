import React, { forwardRef } from 'react';
import classNames from 'classnames';
import styles from './Input.module.scss';
import debounce from 'lodash/debounce';

export type InputProps = Input & {
  onSearch?: (text: string) => void;
  isBorder?: boolean;
  theme?: string;
  ref?: React.Ref<HTMLInputElement>;
};

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, onSearch, ...props }, ref) => (
  <input
    ref={ref}
    className={classNames(styles.input, className)}
    onChange={debounce((e) => {
      onSearch?.(e.target.value);
    }, 500)}
    {...props}
  />
));

export default Input;
