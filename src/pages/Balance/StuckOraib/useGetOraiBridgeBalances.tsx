import { Coin } from '@cosmjs/stargate';
import { ORAI_BRIDGE_UDENOM, TokenItemType } from '@oraichain/oraidex-common';
import { toDisplay } from '@oraichain/oraidex-common';
import uniqBy from 'lodash/uniqBy';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store/configure';
import { cosmosTokens, otherChainTokens } from 'initCommon';

export type RemainingOraibTokenItem = TokenItemType & { amount: string };
export default function useGetOraiBridgeBalances(moveOraib2OraiLoading: boolean) {
  const amounts = useSelector((state: RootState) => state.token.amounts);
  const [remainingOraib, setRemainingOraib] = useState<RemainingOraibTokenItem[]>([]);

  const getBalanceOraibridge = async () => {
    try {
      const oraiBridgeAddress = await window.Keplr.getKeplrAddr('oraibridge-subnet-2');
      if (!oraiBridgeAddress) {
        setRemainingOraib([]);
        return;
      }

      const data: readonly Coin[] = uniqBy(
        cosmosTokens.filter((token) => !token.contractAddress && token.chainId === 'oraibridge-subnet-2'),
        (c) => c.denom
      )
        .map((token) => ({ denom: token.denom, amount: amounts[token.denom] }))
        .filter((coin) => Number(coin.amount) > 0);

      const remainingOraib = data
        .reduce((acc, item) => {
          // denom: "uoraib" not use => filter out
          if (item.denom !== ORAI_BRIDGE_UDENOM) {
            const oraibFound = otherChainTokens.find(
              (token: TokenItemType) => token.denom.toLowerCase() === item.denom.toLowerCase()
            );
            if (oraibFound) {
              acc.push({
                ...oraibFound,
                amount: item.amount
              });
            }
          }
          return acc;
        }, [] as RemainingOraibTokenItem[])
        .filter((token: RemainingOraibTokenItem) => toDisplay(token.amount, token.decimals) > 0);

      setRemainingOraib(remainingOraib);
    } catch (error) {
      console.log('error in getBalanceOraibridge: ', error);
    }
  };

  // refetch balance
  useEffect(() => {
    !moveOraib2OraiLoading && getBalanceOraibridge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveOraib2OraiLoading]);

  return { remainingOraib };
}
