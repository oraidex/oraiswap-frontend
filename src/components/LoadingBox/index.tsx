import cn from 'classnames/bind';
import BlocLoaderDex from 'components/BlocLoaderDex';
import React, { CSSProperties } from 'react';
import styles from './index.module.scss';
const cx = cn.bind(styles);

const LoadingBox: React.FC<{
  loading: boolean;
  children: React.ReactElement | React.ReactNode;
  styles?: CSSProperties;
  theme?: string;
  className?: string;
}> = ({ loading, children, styles, theme, className }) => {
  return (
    <>
      {loading ? (
        <div style={styles} className={cx('loading-wrap')}>
          <BlocLoaderDex open={true} theme={theme} classNameLoading={className} />
          {children}
        </div>
      ) : (
        children
      )}
    </>
  );
};

export default LoadingBox;
