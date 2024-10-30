import ObridgeDarkImg from 'assets/icons/obridge_full_dark.svg?react';
import ObridgeLightImg from 'assets/icons/obridge_full_light.svg?react';
import cn from 'classnames/bind';
import { ConfigTheme, EVENT_CONFIG_THEME } from 'config/eventConfig';
import useTemporaryConfigReducer from 'hooks/useTemporaryConfigReducer';
import React from 'react';
import styles from './index.module.scss';
const cx = cn.bind(styles);

const PowerByOBridge: React.FC<{ theme: string }> = ({ theme }) => {
  const [event] = useTemporaryConfigReducer('event');
  const configTheme = EVENT_CONFIG_THEME[theme][event] as ConfigTheme;

  return (
    <div className={styles.powered}>
      <div>Powered by</div>
      {theme === 'light' ? <ObridgeDarkImg /> : <ObridgeLightImg />}
    </div>
  );
};

export default PowerByOBridge;
