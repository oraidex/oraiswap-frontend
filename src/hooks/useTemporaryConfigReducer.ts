import { TemporaryConfigState, updateConfig } from 'reducer/temporaryConfig';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'store/configure';

// help typescript realize return type from key of TemporaryConfigState
export default function useTemporaryConfigReducer<StateKey extends keyof TemporaryConfigState>(
  key: StateKey
): readonly [TemporaryConfigState[StateKey], (value: TemporaryConfigState[StateKey]) => void] {
  const value = useSelector((state: RootState) => state.temporaryConfig[key]);
  const dispatch = useDispatch();
  const setValue = (newValue: TemporaryConfigState[StateKey]) => {
    dispatch(updateConfig(key, newValue));
  };
  return [value, setValue];
}
