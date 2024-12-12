import { useSelector } from 'react-redux';
import { OnchainTokensState } from 'reducer/onchainTokens';
import { RootState } from 'store/configure';

// help typescript realize return type from key of OnchainTokensState
export default function useOnchainTokensReducer<StateKey extends keyof OnchainTokensState>(
  key: StateKey
): OnchainTokensState[StateKey] {
  const value = useSelector((state: RootState) => state.onchainTokens[key]);
  return value;
}
