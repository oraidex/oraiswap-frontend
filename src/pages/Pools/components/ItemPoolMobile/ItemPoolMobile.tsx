import { TokenItemType, toDisplay } from '@oraichain/oraidex-common';
import BoostIconDark from 'assets/icons/boost-icon-dark.svg?react';
import BoostIconLight from 'assets/icons/boost-icon.svg?react';
import { Button } from 'components/Button';
import useConfigReducer from 'hooks/useConfigReducer';
import { PoolTableData } from 'pages/Pools';
import { formatDisplayUsdt, parseAssetOnlyDenom } from 'pages/Pools/helpers';
import { useNavigate } from 'react-router-dom';
import styles from './ItemPoolMobile.module.scss';

type PoolMobileItemProps = {
  pool: PoolTableData;
  setPairDenomsDeposit: React.Dispatch<React.SetStateAction<string>>;
  generateIcon: (baseToken: TokenItemType, quoteToken: TokenItemType) => JSX.Element;
};
export const PoolMobileItem: React.FC<PoolMobileItemProps> = ({ pool, setPairDenomsDeposit, generateIcon }) => {
  const navigate = useNavigate();
  const [theme] = useConfigReducer('theme');

  const handleClickRow = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.stopPropagation();
    const [firstAssetInfo, secondAssetInfo] = [JSON.parse(pool.firstAssetInfo), JSON.parse(pool.secondAssetInfo)];

    navigate(
      `/pools/v2/${encodeURIComponent(parseAssetOnlyDenom(firstAssetInfo))}_${encodeURIComponent(
        parseAssetOnlyDenom(secondAssetInfo)
      )}`
    );
  };

  return (
    <article className={styles.pool} onClick={(e) => handleClickRow(e)}>
      <div className={styles.poolHead}>
        <div className={styles.symbols}>
          <div>{generateIcon(pool.baseToken, pool.quoteToken)}</div>
          <span className={styles.symbols_name}>{pool.symbols}</span>
        </div>
        <div className={styles.apr}>
          <div className={styles.title}>APR</div>
          <div className={styles.apr}>
            <div className={styles.value}>
              <span>{`${(pool.apr || 0).toFixed(2)}%`}</span>&nbsp;
              <div>{theme === 'light' ? <BoostIconLight /> : <BoostIconDark />}</div>
            </div>
            <div className={styles.aprReward}>
              {pool.reward.map((asset) => (
                <span key={asset}>+{asset}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.poolInfo}>
        <div>
          <div className={styles.title}>My Staked LP</div>
          <span className={styles.value}>{formatDisplayUsdt(pool.myStakedLP)}</span>
        </div>
        <div>
          <div className={styles.title}>Earned</div>
          <span className={styles.value}>{formatDisplayUsdt(pool.earned)}</span>
        </div>
        <div>
          <div className={styles.title}>Volume (24h)</div>
          <span className={styles.value}>{formatDisplayUsdt(toDisplay(pool.volume24Hour))}</span>
        </div>
        <div>
          <div className={styles.title}>Liquidity</div>
          <span className={styles.value}>
            {formatDisplayUsdt(toDisplay(parseInt(pool.totalLiquidity.toString()).toString()))}
          </span>
        </div>
      </div>
      <div className={styles.btnAddLp}>
        <Button
          type="third-sm"
          onClick={(event) => {
            event.stopPropagation();
            setPairDenomsDeposit(
              `${parseAssetOnlyDenom(JSON.parse(pool.firstAssetInfo))}_${parseAssetOnlyDenom(
                JSON.parse(pool.secondAssetInfo)
              )}`
            );
          }}
        >
          Add
        </Button>
      </div>
    </article>
  );
};
