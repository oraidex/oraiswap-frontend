import NoDataSvg from 'assets/images/NoDataPool.svg';
import NoDataLightSvg from 'assets/images/NoDataPoolLight.svg';
import useTheme from 'hooks/useTheme';
import styles from './FallbackEmptyData.module.scss';

export const FallbackEmptyData = () => {
  const theme = useTheme();

  return (
    <div className={styles.no_data}>
      <img src={theme === 'light' ? NoDataLightSvg : NoDataSvg} alt="nodata" />
      <span>No data</span>
    </div>
  );
};
