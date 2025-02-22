import { BigDecimal, solChainId, toAmount, toDisplay, TokenItemType } from '@oraichain/oraidex-common';
import axios from 'axios';
import { useDebounce } from 'hooks/useDebounce';
import { flattenTokens, solTokens } from 'initCommon';
import { useEffect, useState } from 'react';

export enum Direction {
  SOLANA_TO_ORAI = 'solana_to_orai',
  ORAI_TO_SOLANA = 'orai_to_solana'
}

export enum SUPPORT_TOKEN {
  ORAI = 'orai',
  MAX = 'max',
  RACKS = 'rack',
  GNRT = 'gnrt',
  LEE = 'lee',
  MOOBS = 'moobs',
  CRISIS = 'crisis'
}

const useGetFeeSol = ({
  originalFromToken,
  toChainId,
  amountToken,
  toToken,
  isMemeBridge
}: {
  amountToken: string;
  originalFromToken: TokenItemType;
  toChainId: string;
  toToken: TokenItemType;
  isMemeBridge: boolean;
}) => {
  const isSolToOraichain = originalFromToken.chainId === solChainId;
  const isOraichainToSol = toChainId === solChainId;

  const debouncedAmountToken = useDebounce(amountToken, 800);
  const defaultSolFee = {
    sendAmount: 0,
    tokenFeeAmount: 0,
    relayerFee: 0,
    totalFee: 0
  };

  const [solFee, setSolFee] = useState(defaultSolFee);

  const getSupportToken = (denom) => {
    if (denom === 'RACKS') return SUPPORT_TOKEN.RACKS;
    return denom?.toLowerCase();
  };

  useEffect(() => {
    (async () => {
      try {
        if (!debouncedAmountToken || (!isSolToOraichain && !isOraichainToSol)) {
          if (solFee.sendAmount) {
            setSolFee(defaultSolFee);
          }
          return;
        }

        const amount: string = toAmount(debouncedAmountToken, originalFromToken.decimals).toString();
        const direction: Direction = toChainId === solChainId ? Direction.ORAI_TO_SOLANA : Direction.SOLANA_TO_ORAI;
        // const supportedToken: SUPPORT_TOKEN =
        // originalFromToken.coinGeckoId === 'oraichain-token' ? SUPPORT_TOKEN.ORAI : SUPPORT_TOKEN.MAX;
        let supportedToken: SUPPORT_TOKEN | string = getSupportToken(originalFromToken.name);
        let baseURL = `https://solana-relayer.orai.io`;

        if (isMemeBridge) {
          const splitDenomInOraichain = originalFromToken.denom.split('/');
          supportedToken =
            originalFromToken?.contractAddress || splitDenomInOraichain[splitDenomInOraichain.length - 1];
          baseURL = 'https://sol-meme-bridge.agents.land';
        }

        const url: string = `${baseURL}/fee?direction=${direction}&amount=${amount}&supportedToken=${supportedToken}`;
        const { data } = await axios.get(url);
        const originalToToken =
          toToken ??
          flattenTokens.find(
            (flat) => flat.coinGeckoId === originalFromToken.coinGeckoId && flat.chainId === toChainId
          );
        const totalFeeSol = new BigDecimal(data?.oraichainFee ?? data?.solanaFee)
          .add(data.tokenFeeAmount)
          .div(10 ** originalToToken.decimals)
          .toNumber();

        setSolFee({
          sendAmount: toDisplay(data.sendAmount, originalToToken.decimals),
          tokenFeeAmount: toDisplay(data.tokenFeeAmount, originalToToken.decimals),
          relayerFee: toDisplay(data?.oraichainFee ?? data?.solanaFee, originalToToken.decimals),
          totalFee: totalFeeSol
        });
      } catch (error) {
        console.log({ error });
      }
    })();
  }, [originalFromToken, toChainId, debouncedAmountToken]);

  return {
    solFee,
    isSolToOraichain,
    isOraichainToSol
  };
};

export default useGetFeeSol;
