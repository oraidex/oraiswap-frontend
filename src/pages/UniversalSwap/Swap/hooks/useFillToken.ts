import { tokenMap } from 'initCommon';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const FROM_QUERY_KEY = 'from';
export const TO_QUERY_KEY = 'to';
export const TYPE_QUERY_TYPE = 'type';

export const initPairSwap = (): [string, string] => {
  const queryString = window.location?.search;

  const params = new URLSearchParams(queryString || '');

  const currentFromDenom = params.get(FROM_QUERY_KEY);
  const currentToDenom = params.get(TO_QUERY_KEY);

  const originalFromToken = tokenMap[currentFromDenom];
  const originalToToken = tokenMap[currentToDenom];

  const fromDenom = originalFromToken?.denom;
  const toDenom = originalToToken?.denom;

  if (!fromDenom || !toDenom || fromDenom === toDenom) {
    return ['usdt', 'orai'];
  }

  return [fromDenom || 'usdt', toDenom || 'orai'];
};

// URL: /universalswap?from=orai&to=usdt
export const useFillToken = (setSwapTokens: (denoms: [string, string]) => void) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleUpdateQueryURL = ([fromDenom, toDenom]: [string, string]) => {
    const queryString = location.search;
    const path = location.pathname;

    if (!fromDenom || !toDenom) {
      return;
    }
    const params = new URLSearchParams(queryString || '');

    const currentFromDenom = params.get(FROM_QUERY_KEY);
    const currentToDenom = params.get(TO_QUERY_KEY);

    const originalFromToken = tokenMap[fromDenom];
    const originalToToken = tokenMap[toDenom];

    if (originalFromToken && originalToToken && (currentFromDenom !== fromDenom || currentToDenom !== toDenom)) {
      currentFromDenom !== fromDenom && params.set(FROM_QUERY_KEY, fromDenom);
      currentToDenom !== toDenom && params.set(TO_QUERY_KEY, toDenom);

      const newUrl = `${path}?${params.toString()}`;

      navigate(newUrl);
    }
  };

  useEffect(() => {
    const queryString = location.search;
    const params = new URLSearchParams(queryString || '');
    const fromDenom = params.get(FROM_QUERY_KEY);
    const toDenom = params.get(TO_QUERY_KEY);
    const tab = params.get(TYPE_QUERY_TYPE);

    let pathname = location.pathname;
    if (tab) pathname += `?type=${tab}`;
    if (!queryString || !fromDenom || !toDenom) return navigate(pathname);

    const originalFromToken = tokenMap[fromDenom];
    const originalToToken = tokenMap[toDenom];

    if (originalFromToken && originalToToken && fromDenom !== toDenom) {
      setSwapTokens([fromDenom, toDenom]);
    } else {
      navigate(pathname);
    }
  }, [location.search, location.pathname]);

  return {
    handleUpdateQueryURL
  };
};
