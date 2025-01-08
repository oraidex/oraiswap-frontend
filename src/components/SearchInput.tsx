import React, { useRef, useState } from 'react';
import classNames from 'classnames';
import styles from './SearchInput.module.scss';
import SearchSvg from 'assets/images/search-svg.svg';
import SearchLightSvg from 'assets/images/search-light-svg.svg';
import Input, { InputProps } from './Input';

const Search: React.FC<InputProps> = ({ className, isBorder, theme, style, ...props }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const bgUrl = theme === 'light' ? SearchLightSvg : SearchSvg;

  const handleReset = () => {
    console.log('currnetValue:', inputRef.current.value);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div>
      <Input
        ref={inputRef}
        className={classNames(className, isBorder ? styles.universalSearch : styles.search)}
        placeholder="Search by pools or tokens name"
        style={{
          paddingLeft: 40,
          backgroundImage: `url(${bgUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '10px center',
          ...style
        }}
        // value={value}
        // onChange={(e) => setValue(e.target.value)}
        {...props}
      />
      <button onClick={handleReset}>Reset</button>
    </div>
  );
};

export default Search;
