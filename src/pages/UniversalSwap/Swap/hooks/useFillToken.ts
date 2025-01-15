import { tokenMap } from 'initCommon';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState, store } from 'store/configure';

export const FROM_QUERY_KEY = 'from';
export const TO_QUERY_KEY = 'to';
export const TYPE_QUERY_TYPE = 'type';

export const initPairSwap = (): [string, string] => {
  const queryString = window.location?.search;

  const params = new URLSearchParams(queryString || '');

  const currentFromDenom = params.get(FROM_QUERY_KEY);
  const currentToDenom = params.get(TO_QUERY_KEY);

  const storage = store.getState();
  const allOraichainTokens = storage.token.allOraichainTokens ?? [];
  const originalFromToken = allOraichainTokens?.find(
    (token) => token.denom === currentFromDenom || token.contractAddress === currentFromDenom
  );
  const originalToToken = allOraichainTokens?.find(
    (token) => token.denom === currentToDenom || token.contractAddress === currentToDenom
  );

  const fromDenom = originalFromToken?.denom;
  const toDenom = originalToToken?.denom;

  if (!fromDenom || !toDenom || fromDenom === toDenom) {
    return ['cw20:orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh:USDT', 'orai'];
  }

  return [fromDenom || 'cw20:orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh:USDT', toDenom || 'orai'];
};

// URL: /universalswap?from=orai&to=usdt
export const useFillToken = (setSwapTokens: (denoms: [string, string]) => void) => {
  const location = useLocation();
  const navigate = useNavigate();

  const allOraichainTokens = useSelector((state: RootState) => state.token.allOraichainTokens || []);

  const handleUpdateQueryURL = ([fromDenom, toDenom]: [string, string]) => {
    const queryString = location.search;
    const path = location.pathname;

    if (!fromDenom || !toDenom) {
      return;
    }
    const params = new URLSearchParams(queryString || '');
    const currentFromDenom = params.get(FROM_QUERY_KEY);
    const currentToDenom = params.get(TO_QUERY_KEY);

    const originalFromToken = allOraichainTokens.find(
      (token) => token.denom === fromDenom || token.contractAddress === fromDenom
    );
    const originalToToken = allOraichainTokens.find(
      (token) => token.denom === toDenom || token.contractAddress === toDenom
    );

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

    const originalFromToken = allOraichainTokens.find(
      (token) => token.denom === fromDenom || token.contractAddress === fromDenom
    );
    const originalToToken = allOraichainTokens.find(
      (token) => token.denom === toDenom || token.contractAddress === toDenom
    );

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
