import { useSelector } from 'react-redux';
import { PoolDetailV3State } from 'reducer/poolDetailV3';
import { RootState } from 'store/configure';

// help typescript realize return type from key of PoolDetailV3State
export default function usePoolDetailV3Reducer<StateKey extends keyof PoolDetailV3State>(
  key: StateKey
): PoolDetailV3State[StateKey] {
  const value = useSelector((state: RootState) => state.poolDetailV3[key]);
  return value;
}
