import {
  COSMOS_CHAIN_ID_COMMON,
  TokenItemType,
  getSubAmountDetails,
  toAmount,
  toDisplay
} from '@oraichain/oraidex-common';
import { isMobile } from '@walletconnect/browser-utils';
import WalletConnectProvider from '@walletconnect/ethereum-provider';
import bech32 from 'bech32';
import { CoinGeckoPrices } from 'hooks/useCoingecko';
import { chainInfos, cosmosTokens, flattenTokens, network, oraichainTokens, tokenMap } from 'initCommon';
import { getCosmWasmClient } from 'libs/cosmjs';
import { NetworkChainId } from '@oraichain/common';
import { store } from 'store/configure';

export const checkRegex = (str: string, regex?: RegExp) => {
  const re = regex ?? /^[a-zA-Z\-]{3,12}$/;
  return re.test(str);
};

export const validateAddressCosmos = (bech32Address: string, prefix?: string): boolean => {
  try {
    const { prefix: decodedPrefix } = bech32.decode(bech32Address);
    return prefix && prefix === decodedPrefix;
  } catch (error) {
    return false;
  }
};

export const getUsd = (
  amount: string | bigint,
  tokenInfo: TokenItemType,
  prices: CoinGeckoPrices<string>,
  pricesAmount?: number
): number => {
  if (!tokenInfo?.decimals) return 0;
  if (pricesAmount) {
    return toDisplay(amount, tokenInfo.decimals) * pricesAmount;
  }
  return toDisplay(amount, tokenInfo.decimals) * (prices[tokenInfo.coinGeckoId] ?? 0);
};

export const getTotalUsd = (amounts: AmountDetails, prices: CoinGeckoPrices<string>): number => {
  let usd = 0;
  for (const denom in amounts) {
    const tokenInfo = tokenMap[denom];
    if (!tokenInfo) continue;
    const amount = toDisplay(amounts[denom], tokenInfo.decimals);
    usd += amount * (prices[tokenInfo.coinGeckoId] ?? 0);
  }
  return usd;
};

export const toSubDisplay = (amounts: AmountDetails, tokenInfo: TokenItemType): number => {
  const subAmounts = getSubAmountDetails(amounts, tokenInfo);
  return toSumDisplay(subAmounts);
};

export const toTotalDisplay = (amounts: AmountDetails, tokenInfo: TokenItemType): number => {
  return toDisplay(amounts[tokenInfo.denom], tokenInfo.decimals) + toSubDisplay(amounts, tokenInfo);
};

export const toSubAmount = (amounts: AmountDetails, tokenInfo: TokenItemType): bigint => {
  const displayAmount = toSubDisplay(amounts, tokenInfo);
  if (tokenInfo.decimals === 0) return BigInt(0);
  return toAmount(displayAmount, tokenInfo.decimals);
};

export const toSumDisplay = (amounts: AmountDetails): number => {
  // get all native balances that are from oraibridge (ibc/...)
  let amount = 0;

  for (const denom in amounts) {
    // update later
    const balance = amounts[denom];
    if (!balance) continue;

    amount += toDisplay(balance, flattenTokens.find((t) => t.contractAddress === denom || t.denom === denom)?.decimals);
  }
  return amount;
};

/**
 * Returns a shortened string by replacing characters in between with '...'.
 * @param str The input string.
 * @param from The position of the character to be kept as-is in the resulting string.
 * @param end The number of characters to be kept as-is at the end of the resulting string.
 * @returns The shortened string, or '-' if the input string is null or undefined.
 */
export const reduceString = (str: string, from: number, end: number) => {
  return str ? str.substring(0, from) + '...' + str.substring(str.length - end) : '-';
};

export const formateNumberDecimals = (price, decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: decimals
  }).format(price);
};

export const detectBestDecimalsDisplay = (price, minDecimal = 2, minPrice = 1, maxDecimal) => {
  if (price && price > minPrice) return minDecimal;
  let decimals = minDecimal;
  if (price !== undefined) {
    // Find out the number of leading floating zeros via regex
    const priceSplit = price?.toString().split('.');
    if (priceSplit?.length === 2 && priceSplit[0] === '0') {
      const leadingZeros = priceSplit[1].match(/^0+/);
      decimals += leadingZeros ? leadingZeros[0]?.length + 1 : 1;
    }
  }
  if (maxDecimal && decimals > maxDecimal) decimals = maxDecimal;
  return decimals;
};

interface FormatNumberDecimal {
  price: number;
  maxDecimal?: number;
  unit?: string;
  minDecimal?: number;
  minPrice?: number;
  unitPosition?: 'prefix' | 'suffix';
}

export const formateNumberDecimalsAuto = ({
  price,
  maxDecimal,
  unit,
  minDecimal,
  minPrice,
  unitPosition
}: FormatNumberDecimal) => {
  minDecimal = minDecimal ? minDecimal : 2;
  minPrice = minPrice ? minPrice : 1;
  unit = unit ? unit : '';
  const priceFormat = formateNumberDecimals(price, detectBestDecimalsDisplay(price, minDecimal, minPrice, maxDecimal));
  const res = unitPosition === 'prefix' ? unit + priceFormat : priceFormat + unit;
  return res;
};

export const buildWebsocketSendMessage = (message: string, id = 1) => {
  return {
    jsonrpc: '2.0',
    method: 'subscribe',
    params: [`tm.event='Tx' AND ${message}`],
    id
  };
};

export const buildUnsubscribeMessage = () => {
  return {
    jsonrpc: '2.0',
    method: 'unsubscribe_all',
    params: [],
    id: 99
  };
};

export const processWsResponseMsg = (message: any): string => {
  try {
    if (message === null || message.result === null) {
      return null;
    }
    const { result } = message;
    if (
      result && // 👈 null and undefined check
      (Object.keys(result).length !== 0 || result.constructor !== Object)
    ) {
      if (!result.events) return null;
      const events = result.events;
      const packets = events['recv_packet.packet_data'];
      if (!packets) return null;
      let tokens = '';
      for (let packetRaw of packets) {
        const packet = JSON.parse(packetRaw);
        // we look for the true denom information with decimals to process
        // format: {"amount":"100000000000000","denom":"oraib0xA325Ad6D9c92B55A3Fc5aD7e412B1518F96441C0","receiver":"orai...","sender":"oraib..."}
        const receivedToken = cosmosTokens.find((token) => token.denom === packet.denom);
        //TODO: Not show socket received amount with usat token;
        if (receivedToken.denom === 'usat') {
          return null;
        }
        const displayAmount = toDisplay(packet?.amount, receivedToken?.decimals);

        tokens = tokens.concat(`${displayAmount} ${receivedToken?.name}, `);
      }
      return tokens.substring(0, tokens.length - 2); // remove , due to concat
    }
    return null;
  } catch (error) {
    console.error({ errorProcessWsResponseMsg: error });
  }
};

export const generateError = (message: string) => {
  return { ex: { message } };
};

export const initEthereum = async () => {
  // support only https
  if (isMobile() && !window.ethereumDapp && window.location.protocol === 'https:') {
    const bscChain = chainInfos.find((c) => c.chainId === '0x38');
    const provider = new WalletConnectProvider({
      chainId: Networks.bsc,
      storageId: 'metamask',
      qrcode: true,
      rpc: { [Networks.bsc]: bscChain.rpc },
      qrcodeModalOptions: {
        mobileLinks: ['metamask']
      }
    });
    await provider.enable();
    (window.ethereumDapp as any) = provider;
  }
};

export const initClient = async () => {
  try {
    // suggest our chain
    const arrChainIds = [
      network.chainId,
      COSMOS_CHAIN_ID_COMMON.ORAIBRIDGE_CHAIN_ID,
      COSMOS_CHAIN_ID_COMMON.INJECTVE_CHAIN_ID
    ] as NetworkChainId[];
    for (const chainId of arrChainIds) {
      await window.Keplr.suggestChain(chainId);
    }
    const { client } = await getCosmWasmClient({ chainId: network.chainId });
    window.client = client;
  } catch (ex) {
    console.log({ errorInitClient: ex });
    throw new Error(ex?.message ?? 'Error when suggestChain');
  }
};

export const timeSince = (date: number): string => {
  const seconds = Math.floor((Date.now() - date) / 1000);
  let interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + ' years';
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + ' months';
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + ' days';
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + ' hours';
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + ' minutes';
  }
  return Math.floor(seconds) + ' seconds';
};
