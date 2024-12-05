//@ts-nocheck

import { Tendermint37Client } from '@cosmjs/tendermint-rpc';
import _BigInt from 'big-integer';
import { getWalletByNetworkFromStorage } from 'helper';
import Keplr from 'libs/keplr';
import Metamask from 'libs/metamask';
import TronWeb from 'tronweb';
import Bitcoin from 'libs/bitcoin';
import { Networks } from '@oraichain/ethereum-multicall';
import { chainInfos } from 'initCommon';

// polyfill
Tendermint37Client.detectVersion = () => {};
Tendermint37Client.prototype.status = function () {
  const chainInfo = chainInfos.find((chain) => chain.networkType === 'cosmos' && chain.rpc === this.client.url);
  return {
    nodeInfo: {
      network: chainInfo.chainId,
      version: ''
    }
  };
};

// inject global
window.TronWeb = TronWeb;
window.Networks = Networks;
// enable Keplr
const walletType = getWalletByNetworkFromStorage();
window.Keplr = new Keplr(walletType?.cosmos);

window.ethereumDapp = window.ethereum;

window.Bitcoin = new Bitcoin();
window.Metamask = new Metamask(window.tronWeb);

// window.process = require('process/browser');

// extend formatToJson
Intl.DateTimeFormat.prototype.formatToJson = function (date: Date) {
  const _this = this as Intl.DateTimeFormat;
  return Object.fromEntries(
    _this
      .formatToParts(date)
      .filter((item) => item.type !== 'literal')
      .map((item) => [item.type, item.value])
  ) as Record<Intl.DateTimeFormatPartTypes, string>;
};

if (typeof BigInt === 'undefined') {
  (window as any)._BigInt = _BigInt;

  class MyBigInt {
    value: bigint;
    constructor(value: MyBigInt | number | string) {
      if (value instanceof MyBigInt) {
        return value;
      } else {
        if (typeof value === 'string' && value.startsWith('0x')) {
          this.value = _BigInt(value.substring(2), 16);
        } else {
          this.value = _BigInt(value);
        }
      }
      // Proxy method calls to _BigInt if possible
      return new Proxy(this, {
        get(obj, field) {
          if (field in obj) return obj[field];
          if (typeof obj.value !== 'bigint' && field in obj.value) return obj.value[field].bind(obj.value);
          return undefined;
        }
      });
    }

    valueOf() {
      return this.value.valueOf();
    }

    equals(b) {
      if (typeof this.value === 'bigint') {
        return this.value === b.value;
      } else if (b instanceof MyBigInt) {
        return this.value.equals(_BigInt(b.value));
      } else {
        return this.value.equals(_BigInt(b));
      }
    }

    toString() {
      return this.value.toString();
    }

    _toUint8ArrayNative(littleEndian = false, elements = 8) {
      const arr = new ArrayBuffer(elements);
      const view = new DataView(arr);
      view.setBigUint64(0, this.value, littleEndian);
      return new Uint8Array(arr);
    }

    _toUint8Array(littleEndian = false, elements = 8) {
      const arr = new ArrayBuffer(elements);
      const uint8arr = new Uint8Array(arr);
      const intarr = this.value.toArray(2 ** 8).value;
      if (littleEndian) uint8arr.set(intarr.reverse(), 0);
      else uint8arr.set(intarr, elements - intarr.length);
      return uint8arr;
    }

    toUint8Array(littleEndian = false, elements = 8) {
      if (typeof this.value === 'bigint') {
        return this._toUint8ArrayNative(littleEndian, elements);
      } else {
        return this._toUint8Array(littleEndian, elements);
      }
    }

    /**
     * Get MyBigInt from a uint8 array in specified endianess.
     * Uses native MyBigInt if the environment supports it and detectSupport is true.
     *
     * @param {Uint8Array} uint8arr
     * @param {boolean} littleEndian use little endian byte order, default is false
     * @param {boolean} detectSupport auto-detect support for native MyBigInt, default is true
     */
    static fromUint8Array(uint8arr: Uint8Array, littleEndian: boolean = false, detectSupport: boolean = true) {
      if (supportsNative && detectSupport) {
        const view = new DataView(uint8arr.buffer);
        return new MyBigInt(view.getBigUint64(0, littleEndian));
      }
      let array;
      if (littleEndian) {
        array = Array.from(uint8arr).reverse();
      } else {
        array = Array.from(uint8arr);
      }
      return new MyBigInt(_BigInt.fromArray(array, 2 ** 8));
    }
  }

  const _old = MyBigInt;
  MyBigInt = function (...args) {
    return new _old(...args);
  };

  (window as any).BigInt = MyBigInt;
}

// polyfill abort timeout for some old browser not support.
if (!('timeout' in AbortSignal)) {
  AbortSignal.timeout = function (delay: number) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), delay);
    // Allow Node.js processes to exit early if only the timeout is running
    timeoutId?.unref?.();
    return controller.signal;
  };
}