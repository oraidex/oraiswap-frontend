import { toAmount } from '@oraichain/oraidex-common';
import { oraichainTokensWithIcon } from 'initCommon';
import { ALL_FEE_TIERS_DATA } from 'libs/contractSingleton';
import { useParams } from 'react-router-dom';

const useFillToken = () => {
  const {
    item1: tokenFromDenom,
    item2: tokenToDenom,
    item3: fee
  } = useParams<{
    item1: string;
    item2: string;
    item3: string;
  }>();

  const initFromToken = () => {
    if (!tokenFromDenom) return;

    const tokenFrom = oraichainTokensWithIcon.find((tk) => tk.denom === tokenFromDenom);
    return tokenFrom;
  };

  const initToToken = () => {
    if (!tokenToDenom) return;

    const tokenTo = oraichainTokensWithIcon.find((tk) => tk.denom === tokenToDenom);
    return tokenTo;
  };

  const initFee = () => {
    if (!fee) return;

    const feeTier = ALL_FEE_TIERS_DATA.find((e) => e.fee.toString() === toAmount(fee, 10).toString());
    return feeTier;
  };

  return {
    initFromToken,
    initToToken,
    initFee,
    defaultValue: {
      tokenFromDenom,
      tokenToDenom,
      fee
    }
  };
};

export default useFillToken;
