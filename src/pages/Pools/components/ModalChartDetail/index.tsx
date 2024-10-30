import CloseIcon from 'assets/icons/ic_close_modal.svg?react';
import useOnClickOutside from 'hooks/useOnClickOutside';
import { useRef } from 'react';
import ChartDetail from '../ChartDetailContent';
import styles from './index.module.scss';
import { FILTER_DAY, TAB_CHART } from 'reducer/type';

const ModalChart = ({
  title,
  pair,
  open = false,
  onClose
}: {
  title: string;
  pair: string;
  open: boolean;
  onClose: () => void;
}) => {
  const chartRef = useRef();

  useOnClickOutside(chartRef, () => {
    onClose();
  });

  return (
    <div ref={chartRef} className={`${styles.chartModal} ${open ? styles.active : ''}`}>
      <div className={styles.overlay} onClick={() => onClose()}></div>
      <div className={styles.chart}>
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <div>
            <CloseIcon onClick={() => onClose()} />
          </div>
        </div>

        <ChartDetail pair={pair} showOverlay={false} />
      </div>
    </div>
  );
};

export default ModalChart;
