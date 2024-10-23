export interface CheckpointQueueInterface {
  confirmed_index: number;
  first_unhandled_confirmed_cp_index: number;
  index: number;
}

export interface TotalValueLockedInterface {
  value: number;
}

export interface BitcoinConfigInterface {
  capacity_limit: number;
  fee_pool_reward_split: number[];
  fee_pool_target_balance: number;
  max_deposit_age: number;
  max_offline_checkpoints: number;
  max_withdrawal_amount: number;
  max_withdrawal_script_length: number;
  min_checkpoint_confirmations: number;
  min_confirmations: number;
  min_deposit_amount: number;
  min_withdrawal_amount: number;
  min_withdrawal_checkpoints: number;
  transfer_fee: number;
  units_per_sat: number;
}

export interface DepositFeeInterface {
  deposit_fees: number;
}

export interface WithdrawalFeeInterface {
  withdrawal_fees: number;
}

export enum CheckpointStatus {
  Building = 'Building',
  Signing = 'Signing',
  Complete = 'Complete'
}

export interface SigsetInterface {
  create_time: number;
  index: number;
  possible_vp: number;
  present_vp: number;
  signatories: any[]; // we will not use this, so i put any here
}

export interface TransactionInput {
  previous_output: string;
  script_sig: string;
  sequence: number;
  witness: string[];
}

export interface TransactionParsedInput {
  txid: string;
  vout: number;
}

export interface TransactionOutput {
  script_pubkey: string;
  value: number;
}

export interface TransactionParsedOutput {
  txid: string;
  address: string;
  value: number;
}

export interface TransactionData {
  input: TransactionInput[];
  lock_time: number;
  output: TransactionOutput[];
}

export interface TransactionParsedData {
  input: TransactionParsedInput[];
  lock_time: number;
  output: TransactionParsedOutput[];
}

export interface CheckpointData {
  fee_rate: number;
  fee_collected: number;
  signed_at_btc_height: number;
  sigset: SigsetInterface;
  status: CheckpointStatus;
  transaction: {
    hash: string;
    data: TransactionData;
  };
}

export interface CheckpointParsedData {
  fee_rate: number;
  fee_collected: number;
  signed_at_btc_height: number;
  sigset: SigsetInterface;
  status: CheckpointStatus;
  transaction: {
    hash: string;
    data: TransactionParsedData;
  };
}

export interface CheckpointFeeInfoInterface {
  fees_collected: number;
  miner_fee: number;
}

export interface EscrowBalanceInterface {
  escrow_balance: number;
}
