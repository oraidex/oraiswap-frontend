import erc20ABI from 'config/abi/erc20.json';
import GravityABI from 'config/abi/gravity.json';
import { gravityContracts, TokenItemType } from 'config/bridgeTokens';
import { TRON_CHAIN_ID, TRON_RPC } from 'config/constants';
import { displayInstallWallet, ethToTronAddress } from 'helper';

import Web3 from 'web3';

import { AbiItem } from 'web3-utils';
import { toAmount } from './utils';

export default class Metamask {
  constructor() { }

  public isWindowEthereum() {
    return !!window.ethereum;
  }

  public isTron(chainId: string | number) {
    return Number(chainId) == TRON_CHAIN_ID;
  }

  private checkTron() {
    if (!window.tronWeb) {
      displayInstallWallet('TronLink');
      return false;
    }
    return true;
  }

  private async submitTronSmartContract(
    address: string,
    functionSelector: string,
    options: { feeLimit?: number } = { feeLimit: 40 * 1e6 }, // submitToCosmos costs about 40 TRX
    parameters = [],
    issuerAddress: string,
  ): Promise<any> {
    const tronUrl = TRON_RPC.replace('/jsonrpc', '');
    const tronWeb = new TronWeb(tronUrl, tronUrl);

    try {
      console.log("before building tx: ", issuerAddress);
      const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
        address,
        functionSelector,
        options,
        parameters,
        ethToTronAddress(issuerAddress)
      );
      console.log("transaction builder: ", transaction);

      if (!transaction.result || !transaction.result.result) {
        throw new Error('Unknown trigger error: ' + JSON.stringify(transaction.transaction));
      }
      console.log("before signing");

      // sign from inject tronWeb
      const singedTransaction = await window.tronWeb.trx.sign(transaction.transaction);
      console.log("signed tx: ", singedTransaction);
      const txHash = await tronWeb.trx.sendRawTransaction(singedTransaction);
      return { transactionHash: txHash };
    } catch (error) {
      throw new Error(error);
    }
  }

  public async switchNetwork(chainId: string | number) {
    await window.ethereum.request!({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x' + Number(chainId).toString(16) }]
    });
  }

  public async getEthAddress() {
    const [address] = await window.ethereum!.request({
      method: 'eth_requestAccounts',
      params: []
    });
    return address;
  }

  public async transferToGravity(token: TokenItemType, amountVal: number, from: string | null, to: string) {
    const gravityContractAddr = gravityContracts[token.chainId] as string;
    const balance = toAmount(amountVal, token.decimals);
    console.log("gravity tron address: ", gravityContractAddr);

    if (this.isTron(token.chainId)) {
      if (this.checkTron())
        return await this.submitTronSmartContract(
          ethToTronAddress(gravityContractAddr),
          'sendToCosmos(address,string,uint256)',
          {},
          [
            { type: 'address', value: token.contractAddress },
            { type: 'string', value: to },
            { type: 'uint256', value: balance.toString() }
          ],
          from
        );
    } else {
      await this.switchNetwork(token.chainId);
      const web3 = new Web3(window.ethereum);
      if (!gravityContractAddr || !from || !to) return;
      const gravityContract = new web3.eth.Contract(GravityABI as AbiItem[], gravityContractAddr);
      return await gravityContract.methods.sendToCosmos(token.contractAddress, to, balance).send({
        from
      });
    }
  }

  public async checkOrIncreaseAllowance(token: TokenItemType, owner: string, spender: string, amount: number) {
    const weiAmount = toAmount(amount, token.decimals);
    // using static rpc for querying both tron and evm
    const web3 = new Web3(token.rpc);
    const tokenContract = new web3.eth.Contract(erc20ABI as AbiItem[], token.contractAddress);
    const currentAllowance = BigInt(await tokenContract.methods.allowance(owner, spender).call());

    if (currentAllowance >= weiAmount) return;

    const allowance = toAmount(999999999999999, token.decimals);

    if (this.isTron(token.chainId)) {
      if (this.checkTron())
        return this.submitTronSmartContract(ethToTronAddress(token.contractAddress), 'approve(address,uint256)', {}, [
          { type: 'address', value: spender },
          { type: 'uint256', value: allowance.toString() }
        ],
          owner);
    } else {
      // using window.ethereum for signing
      await this.switchNetwork(token.chainId);
      const web3 = new Web3(window.ethereum);
      const tokenContract = new web3.eth.Contract(erc20ABI as AbiItem[], token.contractAddress);
      return tokenContract.methods.approve(spender, allowance).send({
        from: owner
      });
    }
  }
}
