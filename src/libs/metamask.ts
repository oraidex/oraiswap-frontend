import { displayInstallWallet } from 'helper';
import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { EvmWallet } from '@oraichain/oraidex-common';

export default class Metamask extends EvmWallet {
  private provider: Web3Provider;

  public checkEthereum() {
    if (window.ethereumDapp) {
      return true;
    }

    displayInstallWallet('Metamask');
    return false;
  }

  public getSigner() {
    // used 'any' to fix the following bug: https://github.com/ethers-io/ethers.js/issues/1107 -> https://github.com/Geo-Web-Project/cadastre/pull/220/files
    if (!this.provider) this.provider = new ethers.providers.Web3Provider(window.ethereumDapp, 'any');
    return this.provider.getSigner();
  }

  public isWindowEthereum() {
    return !!window.ethereumDapp;
  }

  public isTron(chainId: string | number) {
    return Number(chainId) == Networks.tron;
  }

  public checkTron() {
    if (window.tronWebDapp && window.tronLinkDapp) {
      return true;
    }

    displayInstallWallet('TronLink');
    return false;
  }

  public async switchNetwork(chainId: string | number) {
    if (this.checkEthereum()) {
      await window.ethereumDapp.request!({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + Number(chainId).toString(16) }]
      });
    }
  }

  public async getEthAddress() {
    if (this.checkEthereum()) {
      const [address] = await window.ethereumDapp.request({
        method: 'eth_requestAccounts',
        params: []
      });
      if (address === 'undefined') return '';
      return address;
    }
  }
}
