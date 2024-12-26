import { useEffect, useState } from 'react';
import { getIconPoolData } from 'pages/Pool-V3/helpers/format';

export const usePoolIcons = (tokenX: string, tokenY: string, isLight: boolean) => {
  const [icons, setIcons] = useState({
    FromTokenIcon: null,
    ToTokenIcon: null,
    tokenXinfo: null,
    tokenYinfo: null
  });

  useEffect(() => {
    (async () => {
      const data = await getIconPoolData(tokenX, tokenY, isLight);
      setIcons(data);
    })();
  }, [tokenX, tokenY, isLight]);

  return icons;
};
