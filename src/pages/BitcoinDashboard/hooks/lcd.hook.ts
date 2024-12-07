import Axios from 'axios';
import { throttleAdapterEnhancer, retryAdapterEnhancer } from 'axios-extensions';
import { AXIOS_TIMEOUT, AXIOS_THROTTLE_THRESHOLD } from '@oraichain/oraidex-common';
import {
  BitcoinConfigInterface,
  CheckpointData,
  CheckpointFeeInfoInterface,
  CheckpointParsedData,
  CheckpointQueueInterface,
  CheckpointStatus,
  DepositFeeInterface,
  EscrowBalanceInterface,
  TotalValueLockedInterface,
  TransactionInput,
  TransactionOutput,
  TransactionParsedInput,
  TransactionParsedOutput,
  WithdrawalFeeInterface
} from '../@types';
import { useQuery } from '@tanstack/react-query';
import { convertScriptPubkeyToBtcAddress } from '../utils/bitcoin';

const axios = Axios.create({
  timeout: AXIOS_TIMEOUT,
  retryTimes: 3,
  // cache will be enabled by default in 2 seconds
  adapter: retryAdapterEnhancer(
    throttleAdapterEnhancer(Axios.defaults.adapter!, {
      threshold: AXIOS_THROTTLE_THRESHOLD
    })
  ),
  baseURL: 'https://btc.lcd.orai.io'
});

const getCheckpointQueue = async (): Promise<CheckpointQueueInterface> => {
  try {
    const res = await axios.get('/bitcoin/checkpoint_queue', {});
    return res.data;
  } catch (e) {
    console.error('getCheckpointQueue', e);
    return {
      index: 0,
      first_unhandled_confirmed_cp_index: 0,
      confirmed_index: 0
    };
  }
};

export const useGetCheckpointQueue = () => {
  const { data } = useQuery(['checkpoint_queue'], getCheckpointQueue, {
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000
  });
  return data;
};

const getTotalValueLocked = async (): Promise<TotalValueLockedInterface> => {
  try {
    const res = await axios.get('/bitcoin/value_locked', {
      params: {}
    });
    return res.data;
  } catch (e) {
    console.error('getTotalValueLocked', e);
    return {
      value: 0
    };
  }
};

export const useGetTotalValueLocked = () => {
  const { data } = useQuery(['value_locked'], () => getTotalValueLocked(), {
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000
  });
  return data;
};

const getBitcoinConfig = async (): Promise<BitcoinConfigInterface> => {
  try {
    const res = await axios.get('/bitcoin/config', {});
    return res.data;
  } catch (e) {
    console.error('getBitcoinConfig', e);
    return {
      capacity_limit: 0,
      fee_pool_reward_split: [0, 0],
      fee_pool_target_balance: 0,
      max_deposit_age: 0,
      max_offline_checkpoints: 0,
      max_withdrawal_amount: 0,
      max_withdrawal_script_length: 0,
      min_checkpoint_confirmations: 0,
      min_confirmations: 0,
      min_deposit_amount: 0,
      min_withdrawal_amount: 0,
      min_withdrawal_checkpoints: 0,
      transfer_fee: 0,
      units_per_sat: 0
    };
  }
};

export const useGetBitcoinConfig = () => {
  const { data } = useQuery(['bitcoin_config'], getBitcoinConfig, {
    refetchOnWindowFocus: true,
    staleTime: Infinity
  });
  return data;
};

const getDepositFee = async (checkpointIndex?: number): Promise<DepositFeeInterface> => {
  try {
    const res = await axios.get('/bitcoin/deposit_fees', {
      params: {
        checkpoint_index: checkpointIndex
      }
    });
    return res.data;
  } catch (e) {
    console.error('getDepositFee', e);
    return {
      deposit_fees: 0
    };
  }
};

export const useGetDepositFee = (checkpointIndex?: number) => {
  const { data } = useQuery(['deposit_fees', checkpointIndex], () => getDepositFee(checkpointIndex), {
    refetchOnWindowFocus: true,
    staleTime: 10 * 60 * 1000
  });
  return data;
};

export const useGetWithdrawalFee = (btcAddress: string, checkpointIndex?: number) => {
  const getWithdrawalFee = async (btcAddress: String, checkpointIndex?: number): Promise<WithdrawalFeeInterface> => {
    try {
      const res = await axios.get(`/bitcoin/withdrawal_fees/${btcAddress}`, {
        params: {
          checkpoint_index: checkpointIndex
        }
      });
      return res.data;
    } catch (e) {
      console.error('getDepositFee', e);
      return {
        withdrawal_fees: 0
      };
    }
  };

  const { data } = useQuery(
    ['withdrawal_fees', btcAddress, checkpointIndex],
    () => getWithdrawalFee(btcAddress, checkpointIndex),
    {
      refetchOnWindowFocus: true,
      enabled: !!btcAddress && !!checkpointIndex,
      staleTime: 10 * 60 * 1000
    }
  );
  return data;
};

const getCheckpointData = async (checkpointIndex?: number): Promise<CheckpointParsedData> => {
  try {
    const res = await axios.get(`/bitcoin/checkpoint/${checkpointIndex}`, {});
    let data = res.data.data;
    let status = data.status;
    // Slice 1 to remove the input of previous checkpoint
    data.transaction.data.input = data.transaction.data.input.slice(1).map((item: TransactionInput) => {
      let [txid, vout] = item.previous_output.split(':');
      return {
        txid,
        vout
      };
    }) as TransactionParsedInput;
    // Slice 2 to remove the two addition outputs of complete checkpoint
    data.transaction.data.output = data.transaction.data.output
      .slice(status == CheckpointStatus.Building ? 0 : 2)
      .map((item: TransactionOutput) => {
        return {
          address: convertScriptPubkeyToBtcAddress(item.script_pubkey),
          value: item.value
        };
      }) as TransactionParsedOutput;
    return data;
  } catch (e) {
    return {
      fee_collected: 0,
      fee_rate: 0,
      signed_at_btc_height: 0,
      sigset: {
        create_time: 0,
        index: 0,
        possible_vp: 0,
        present_vp: 0,
        signatories: []
      },
      status: CheckpointStatus.Building,
      transaction: {
        hash: '',
        data: {
          input: [],
          output: [],
          lock_time: 0
        }
      }
    };
  }
};

export const useGetCheckpointData = (checkpointIndex?: number) => {
  const { data } = useQuery(['bitcoin_checkpoint', checkpointIndex], () => getCheckpointData(checkpointIndex), {
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000
  });
  return data;
};

const getCheckpointFeeInfo = async (): Promise<CheckpointFeeInfoInterface> => {
  try {
    const res = await axios.get(`/bitcoin/checkpoint_fee_info`, {});
    return res.data;
  } catch (e) {
    console.error('getCheckpointFeeInfo', e);
    return {
      fees_collected: 0,
      miner_fee: 0
    };
  }
};

export const useGetCheckpointFeeInfo = () => {
  const { data } = useQuery(['checkpoint_fee_info'], getCheckpointFeeInfo, {
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000
  });
  return data;
};

const getEscrowBalance = async (address: String): Promise<EscrowBalanceInterface> => {
  try {
    const res = await axios.get(`/bitcoin/escrow_address`, {
      params: {
        address
      }
    });
    return res.data;
  } catch (e) {
    console.error('getEscrowBalance', e);
    return {
      escrow_balance: 0
    };
  }
};

export const useGetEscrowBalance = (address: String) => {
  const { data } = useQuery(['get_escrow_balance'], () => getEscrowBalance(address), {
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
    enabled: address !== undefined && address !== null
  });
  return data;
};
