import { toNetwork } from '@oraichain/orai-bitcoin';
import * as bitcoin from 'bitcoinjs-lib';
import { btcNetwork } from 'helper/constants';

export const convertScriptPubkeyToBtcAddress = (scriptPubkey: String): String => {
  try {
    const scriptPubKeyBuffer = Buffer.from(scriptPubkey, 'hex');
    const address = bitcoin.address.fromOutputScript(scriptPubKeyBuffer, toNetwork(btcNetwork));
    return address;
  } catch (err) {
    const scriptPubKeyBuffer = Buffer.from(scriptPubkey, 'hex');
    const script = bitcoin.script.decompile(scriptPubKeyBuffer);
    if (script[0] == 106) {
      return 'OP_RETURN';
    }
    return 'UNKNOWN_OPCODES';
  }
};

export function sortAddress(address: String, prefixLength: number = 3, suffixLength: number = 8): String {
  if (address.length <= prefixLength + suffixLength) {
    return address;
  }
  const prefix = address.substring(0, prefixLength);
  const suffix = address.substring(address.length - suffixLength);
  const middleDots = '...';
  const sortedAddress = `${prefix}${middleDots}${suffix}`;
  return sortedAddress;
}
