import classNames from 'classnames';
import useTheme from 'hooks/useTheme';
import { FC, ReactElement } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './index.module.scss';

export type TabRender = {
  id: string;
  value: string;
  content: ReactElement;
};

const Tabs: FC<{ tabKey: string; listTabs: TabRender[]; defaultTab?: string }> = ({ tabKey, listTabs, defaultTab }) => {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams({ [tabKey]: defaultTab || listTabs[0].id });
  const type = searchParams.get(tabKey);
  const Content = listTabs.find((tab) => tab.id === type)?.content ?? null;

  return (
    <div className={styles.tabsWrapper}>
      <div className={styles.headerTab}>
        {listTabs.map((e, idx) => {
          return (
            <div
              onClick={() => {
                const params = new URLSearchParams({
                  ...searchParams,
                  [tabKey]: e.id
                });

                setSearchParams(params);
              }}
              key={`tab-${e.id}-${idx}-${tabKey}`}
              className={classNames(styles.item, { [styles.active]: type === e.id })}
            >
              {e.value}
            </div>
          );
        })}
      </div>
      <div className={classNames(styles.content, styles[theme], styles[type])}>{Content && Content}</div>
    </div>
  );
};

export default Tabs;
