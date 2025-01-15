import styles from './index.module.scss';

export type ChartColumnType = {
    percent: number | string;
    volume: number | string;
    interest: number | string;
};

const ChartColumn = ({ data }: { data: ChartColumnType }) => {
    const { percent, volume, interest } = data;
    return (
        <div className={styles.chartColumn}>
            <div className={styles.volume}>{volume}</div>
            <div className={styles.percentWrapper}>
                <div className={styles.percent} style={{ height: `${percent}%` }}></div>
            </div>

            <div className={styles.interest}>{interest}%</div>
        </div>
    );
};

export default ChartColumn;
