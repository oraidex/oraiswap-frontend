import { Dest } from '@oraichain/bitcoin-bridge-contracts-sdk/build/CwBitcoin.types';
import { DepositSuccess } from '@oraichain/orai-bitcoin';

export abstract class CwBitcoinClientInterface {
  readonly modifier = BigInt(1e6);
  readonly nbtcModifier = BigInt(1e14);
  depositAddress: DepositSuccess | null = null;

  generateAddress: (dest: Dest) => Promise<void>;
}
