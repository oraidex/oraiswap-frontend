import { EVM_CHAIN_ID_COMMON, WalletType } from '@oraichain/oraidex-common';
import { btcTokens, cosmosTokens, flattenTokens, solTokens } from 'initCommon';
import { useDispatch } from 'react-redux';
import { updateAmounts } from 'reducer/token';

export type Wallet = WalletType | 'metamask' | 'tron' | 'bitcoin' | 'ton' | 'phantom';
export const useResetBalance = () => {
  const dispatch = useDispatch();

  const handleResetBalance = (wallets: Wallet[]) => {
    let amounts: AmountDetails = {};
    for (const wallet of wallets) {
      amounts = {
        ...amounts,
        ...getResetedBalanceByWallet(wallet)
      };
    }
    dispatch(updateAmounts(amounts));
  };

  const getResetedBalanceByWallet = (walletType: Wallet) => {
    let updatedAmounts: AmountDetails = {};
    switch (walletType) {
      case 'keplr':
        updatedAmounts = resetBalanceCosmos();
        break;
      case 'owallet':
        updatedAmounts = resetBalanceCosmos();
        break;
      case 'metamask':
        updatedAmounts = resetBalanceMetamask();
        break;
      case 'bitcoin':
        updatedAmounts = resetBalanceBtc();
        break;
      case 'tron':
        updatedAmounts = resetBalanceTron();
        break;
      case 'phantom':
        updatedAmounts = resetBalanceSol();
        break;
      case 'ton':
        updatedAmounts = resetBalanceTon();
        break;
      default:
        break;
    }
    return updatedAmounts;
  };

  const resetBalanceCosmos = () => {
    return Object.fromEntries(cosmosTokens.map((t) => [t.denom, '0']));
  };
  const resetBalanceBtc = () => {
    return Object.fromEntries(btcTokens.map((t) => [t.denom, '0']));
  };

  const resetBalanceMetamask = () => {
    const metamaskToken = flattenTokens.filter(
      (token) =>
        token.chainId !== EVM_CHAIN_ID_COMMON.TRON_CHAIN_ID &&
        Object.values(EVM_CHAIN_ID_COMMON).includes(token.chainId as EVM_CHAIN_ID_COMMON)
    );
    return Object.fromEntries(metamaskToken.map((t) => [t.denom, '0']));
  };

  const resetBalanceTron = () => {
    const tronTokens = flattenTokens.filter((token) => token.chainId === EVM_CHAIN_ID_COMMON.TRON_CHAIN_ID);
    return Object.fromEntries(tronTokens.map((t) => [t.denom, '0']));
  };

  const resetBalanceSol = () => {
    return Object.fromEntries(solTokens.map((t) => [t.denom, '0']));
  };

  const resetBalanceTon = () => {
    const tronTokens = flattenTokens.filter((token) => token.chainId === 'ton');
    return Object.fromEntries(tronTokens.map((t) => [t.denom, '0']));
  };

  return { handleResetBalance };
};
