import { validateNumber } from '@oraichain/oraidex-common';

export const formatNumberKMB = (num: number, isUsd: boolean = true) => {
  const prefixShow = isUsd ? '$' : '';

  if (num >= 1e9) {
    return prefixShow + (num / 1e9).toFixed(2) + 'B';
  }

  if (num >= 1e6) {
    return prefixShow + (num / 1e6).toFixed(2) + 'M';
  }

  if (num >= 1e3) {
    return prefixShow + (num / 1e3).toFixed(2) + 'K';
  }
  return isUsd ? formatDisplayUsdt(num, 2) : numberWithCommas(num, undefined, { maximumFractionDigits: 2 });
};

// TODO: need to seperate format funcs to format module later.
export const formatDisplayUsdt = (amount: number | string, dp = 2, dpMin = 4): string => {
  if (Number.isNaN(amount)) return '$--'; 
  const validatedAmount = validateNumber(amount);
  if (validatedAmount < 1) return `$${toFixedIfNecessary(amount.toString(), dpMin).toString()}`;

  return `$${numberWithCommas(toFixedIfNecessary(amount.toString(), dp), undefined, { maximumFractionDigits: 6 })}`;
  // return `$${numberWithCommas(toFixedIfNecessary(amount.toString(), dp))}`;
};

export const toFixedIfNecessary = (value: string, dp: number): number => {
  return +parseFloat(value).toFixed(dp);
};

// add `,` when split thounsand value.
export const numberWithCommas = (
  x: number,
  locales: Intl.LocalesArgument = undefined,
  options: Intl.NumberFormatOptions = {}
) => {
  if (isNegative(x)) return '0';
  return x.toLocaleString(locales, options);
};

export const isNegative = (number) => number <= 0;
