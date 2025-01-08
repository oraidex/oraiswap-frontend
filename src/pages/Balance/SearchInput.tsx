import SearchLightSvg from 'assets/images/search-light-svg.svg';
import SearchSvg from 'assets/images/search-svg.svg';
import classNames from 'classnames';
import { forwardRef } from 'react';
import Input, { InputProps } from 'components/Input';
import styles from './SearchInput.module.scss';

const Search = forwardRef<HTMLInputElement, InputProps>(({ className, isBorder, theme, style, ...props }, ref) => {
  const bgUrl = theme === 'light' ? SearchLightSvg : SearchSvg;

  return (
    <Input
      ref={ref}
      className={classNames(className, isBorder ? styles.universalSearch : styles.search)}
      placeholder="Search by pools or tokens name"
      style={{
        paddingLeft: 40,
        paddingRight: 45,
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        backgroundImage: `url(${bgUrl})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '10px center',
        ...style
      }}
      {...props}
    />
  );
});

export default Search;
