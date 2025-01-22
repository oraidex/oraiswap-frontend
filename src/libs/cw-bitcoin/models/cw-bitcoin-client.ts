import { DepositSuccess } from '@oraichain/orai-bitcoin';
import { bitcoinLcdV2, btcNetwork } from 'helper/constants';
import { CwBitcoinClientInterface } from './cw-bitcoin-client-interface';
import { Dest } from '@oraichain/bitcoin-bridge-contracts-sdk/build/CwBitcoin.types';
// import { generateDepositAddress } from '..';
import { generateDepositAddress } from '@oraichain/bitcoin-bridge-lib-js';

export class CwBitcoinClient implements CwBitcoinClientInterface {
  readonly modifier = BigInt(1e6);
  readonly nbtcModifier = BigInt(1e14);
  initialized = false;

  public depositAddress: DepositSuccess | null = null;

  public async generateAddress(dest: Dest) {
    try {
      // @ts-ignore-check
      const config = {
        relayers: [bitcoinLcdV2],
        network: btcNetwork,
        dest
      } as any;

      let btcAddressToDeposit;
      while (true) {
        try {
          btcAddressToDeposit = (await generateDepositAddress(config)) as DepositSuccess;
          break;
        } catch (err) {
          continue;
        }
      }

      this.depositAddress = btcAddressToDeposit;
    } catch (err) {
      console.log(err);
    }
  }
}
