import { BigDecimal, solChainId, toAmount, toDisplay, TokenItemType } from '@oraichain/oraidex-common';
import axios from 'axios';
import { SOL_NATIVE_DENOM, USDC_SOL_DENOM } from 'helper/constants';
import { useDebounce } from 'hooks/useDebounce';
import { flattenTokens, solTokens } from 'initCommon';
import { useEffect, useState } from 'react';

export enum Direction {
  SOLANA_TO_ORAI = 'solana_to_orai',
  ORAI_TO_SOLANA = 'orai_to_solana'
}

const useGetFeeSol = ({
  originalFromToken,
  amountToken,
  toToken,
  toChainId
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
  const [solWallet, setSolWallet] = useState('');
  const [maxBalance, setMaxBalance] = useState('');
  const [message, setMessage] = useState('');

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
        const baseURL = `https://sol-bridge-3-staging.agents.land`;

        let denom = originalFromToken?.contractAddress ?? originalFromToken.denom;
        if (originalFromToken.coinGeckoId === 'solana' && toChainId === 'Oraichain') denom = SOL_NATIVE_DENOM;
        if (originalFromToken.coinGeckoId === 'usd-coin' && toChainId === solChainId) denom = USDC_SOL_DENOM;

        const url: string = `${baseURL}/account/bridge?direction=${direction}&amount=${amount}&denom=${encodeURIComponent(
          denom
        )}`;

        const { data } = await axios.get(url);
        let originalToToken = toToken;

        if (!originalToToken) {
          originalToToken = flattenTokens.find(
            (flat) => flat.coinGeckoId === originalFromToken.coinGeckoId && flat.chainId === toChainId
          );
        }

        if (data?.tokenFeeAmount) {
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
          setSolWallet(data.wallet);
        }

        if (data?.message) {
          setMaxBalance(data.maxBalance);
          setMessage(data.message);
        }
      } catch (error) {
        console.log({ error });
      }
    })();
  }, [originalFromToken, toChainId, debouncedAmountToken]);

  return {
    message,
    maxBalance,
    solBridgeWallet: solWallet,
    solFee,
    isSolToOraichain,
    isOraichainToSol
  };
};

export default useGetFeeSol;
