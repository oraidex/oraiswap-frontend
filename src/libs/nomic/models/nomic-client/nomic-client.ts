import { config as Config } from '../../config';

import { NomicClientInterface, ResConfigOraiBTC } from './nomic-client-interface';
import { OraiBtcSubnetChain } from '../ibc-chain';
import { DepositSuccess, generateDepositAddress, DepositOptions } from '@oraichain/orai-bitcoin';
import { btcNetwork } from 'helper/constants';

export class NomicClient implements NomicClientInterface {
  readonly modifier = BigInt(1e6);
  readonly nbtcModifier = BigInt(1e14);

  initialized = false;

  public depositAddress: DepositSuccess | null = null;

  public async getRecoveryAddress() {
    const isKeplrActive = await window.Keplr.getKeplr();
    if (isKeplrActive) {
      // @ts-ignore-check
      const address = await window.Keplr.getKeplrAddr(Config.chainId);
      if (!address) {
        return;
      }
      return await this.getRecoveredAddress(address);
    }
    return null;
  }

  public async getAccountInfo(accAddress: string) {
    return await fetch(`${Config.restUrl}/cosmos/auth/v1beta1/accounts/${accAddress}`, { method: 'GET' }).then((data) =>
      data.json()
    );
  }
  public async getRecoveredAddress(accAddress: string) {
    return await fetch(`${Config.restUrl}/bitcoin/recovery_address/${accAddress}?network=${btcNetwork}`, {
      method: 'GET'
    }).then((data) => data.json());
  }
  public async getConfig(): Promise<ResConfigOraiBTC> {
    return null;
    return await fetch(`${Config.restUrl}/bitcoin/config`, {
      method: 'GET'
    }).then((data) => data.json());
  }
  public async getDepositsPending(oraiAddress: string): Promise<any> {
    if (!oraiAddress) throw Error('Not found orai address!');
    return await fetch(`${Config.relayerUrl}/pending_deposits?receiver=${oraiAddress}`, {
      method: 'GET'
    }).then((data) => data.json());
  }

  public async generateAddress() {
    return null;
    const isKeplrActive = await window.Keplr.getKeplr();
    if (isKeplrActive) {
      // @ts-ignore-check
      await window.Keplr.suggestChain(Config.chainId);
      const sender = await window.Keplr.getKeplrAddr(Config.chainId as any);
      const receiver = await window.Keplr.getKeplrAddr();
      if (!sender || !receiver) {
        return;
      }
      const config = {
        relayers: [Config.relayerUrl],
        channel: OraiBtcSubnetChain.source.channelId, // ibc between oraibtc and orai chain
        network: btcNetwork,
        receiver: receiver, // bech32 address of the depositing user,
        sender: sender
      } as DepositOptions;
      // console.log('🚀 ~ NomicClient ~ generateAddress ~ config:', config);

      const btcAddressToDeposit = (await generateDepositAddress(config, false)) as DepositSuccess;

      this.depositAddress = btcAddressToDeposit;
    }
  }
}
