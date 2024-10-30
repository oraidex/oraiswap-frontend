import ORAIX from 'assets/icons/oraix.svg?react';
import cn from 'classnames/bind';
import React from 'react';
import styles from './index.module.scss';
const cx = cn.bind(styles);

const BlocLoaderDex: React.FC<{
  open: boolean;
  borderRadius?: boolean;
  classNameLoading?: string;
  classNameLogoLoading?: string;
  theme?: string;
}> = ({ open, borderRadius = false, classNameLoading, classNameLogoLoading, theme }) => {
  return (
    <div
      className={cx(
        open
          ? ['loaderRoot', 'loaderRootDisplayed', classNameLoading]
          : ['loaderRoot', theme, { loaderRootBorderRadius: borderRadius }]
      )}
    >
      <div className={cx('osmosisContainer')}>
        <ORAIX className={cx('svgLogo', classNameLogoLoading)} />
        <p className={cx('loading')}>
          <span className={cx('letter1')}>L</span>
          <span className={cx('letter2')}>o</span>
          <span className={cx('letter3')}>a</span>
          <span className={cx('letter4')}>d</span>
          <span className={cx('letter5')}>i</span>
          <span className={cx('letter6')}>n</span>
          <span className={cx('letter7')}>g</span>
          <span className={cx('letter8')}> </span>
          <span className={cx('letter9')}>.</span>
          <span className={cx('letter10')}>.</span>
          <span className={cx('letter11')}>.</span>
        </p>
      </div>
    </div>
  );
};

export default BlocLoaderDex;
