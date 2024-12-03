import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionExpiredTimeoutError,
  TransactionInstruction
} from '@solana/web3.js';
import {
  createAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync
} from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { BN, Program } from '@coral-xyz/anchor';
import BigNumber from 'bignumber.js';
import { toAmount, TokenItemType } from '@oraichain/oraidex-common';

export const commitmentLevel = 'confirmed';
export const TOKEN_RESERVES = 1_000_000_000_000_000;
export const LAMPORT_RESERVES = 1_000_000_000;
export const INIT_BONDING_CURVE = 95;

export const SOL_RELAYER_ADDRESS = import.meta.env.VITE_APP_SOLANA_RELAYER_ADDRESS;
export const DEFAULT_SOLANA_RPC = import.meta.env.VITE_APP_SOLANA_RPC;
export const DEFAULT_SOLANA_WEBSOCKET = import.meta.env.VITE_APP_SOLANA_WEBSOCKET;
export const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

export class Web3SolanaProgramInteraction {
  connection: Connection;

  constructor() {
    console.log(SOL_RELAYER_ADDRESS, DEFAULT_SOLANA_RPC, DEFAULT_SOLANA_WEBSOCKET);
    this.connection = new Connection(DEFAULT_SOLANA_RPC, {
      commitment: commitmentLevel,
      wsEndpoint: DEFAULT_SOLANA_WEBSOCKET
    });
  }

  bridgeSolToOrai = async (
    wallet: WalletContextState,
    token: TokenItemType,
    tokenAmountRaw: number,
    oraiReceiverAddress: string
  ) => {
    try {
      const mintPubkey = new PublicKey(token.contractAddress);
      const relayerPubkey = new PublicKey(SOL_RELAYER_ADDRESS);

      const walletTokenAccount = getAssociatedTokenAddressSync(mintPubkey, wallet.publicKey);
      const relayerTokenAccount = getAssociatedTokenAddressSync(mintPubkey, relayerPubkey);
      console.log(relayerTokenAccount.toBase58(), mintPubkey.toBase58(), relayerPubkey.toBase58());
      const accountInfo = await this.connection.getAccountInfo(relayerTokenAccount);
      console.log('----accountInfo----', accountInfo);
      const lamports = accountInfo?.lamports || 0;
      // check the connection
      if (!wallet.publicKey || !this.connection) {
        throw new Error('Warning: Wallet not connected');
      }

      const parsedAmount = toAmount(tokenAmountRaw, token.decimals);

      let transaction = new Transaction();
      if (lamports == 0) {
        transaction.add(
          createAssociatedTokenAccountInstruction(wallet.publicKey, relayerTokenAccount, relayerPubkey, mintPubkey)
        );
      }
      transaction.add(
        createTransferCheckedInstruction(
          walletTokenAccount,
          mintPubkey,
          relayerTokenAccount,
          wallet.publicKey,
          parsedAmount,
          token.decimals
        )
      );
      transaction.add(
        new TransactionInstruction({
          keys: [{ pubkey: wallet.publicKey, isSigner: true, isWritable: true }],
          data: Buffer.from(oraiReceiverAddress, 'utf-8'),
          programId: new PublicKey(MEMO_PROGRAM_ID)
        })
      );
      transaction.feePayer = wallet.publicKey;
      const blockhash = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash.blockhash;

      if (wallet.signTransaction) {
        const signedTx = await wallet.signTransaction(transaction);
        const sTx = signedTx.serialize();
        console.log('---- simulate tx', await this.connection.simulateTransaction(signedTx));
        const signature = await this.connection.sendRawTransaction(sTx, {
          preflightCommitment: 'confirmed',
          skipPreflight: false
        });
        const res = await this.connection.confirmTransaction(
          {
            signature,
            blockhash: blockhash.blockhash,
            lastValidBlockHeight: blockhash.lastValidBlockHeight
          },
          'confirmed'
        );
        console.log('Successfully initialized.\n Signature: ', signature);
        return {
          result: res,
          transaction: signature
        };
      }
    } catch (error) {
      console.log('Error in swap transaction', error, error.error);
      const { transaction = '', result } =
        (await this.handleTransactionError({
          error
        })) || {};

      if (result?.value?.confirmationStatus) {
        console.log('----confirm----', { transaction, result });
        return { transaction, result };
      }
    }
  };

  getTokenBalance = async (walletAddress: string, tokenMintAddress: string) => {
    const wallet = new PublicKey(walletAddress);
    const tokenMint = new PublicKey(tokenMintAddress);

    // Fetch the token account details
    const response = await this.connection.getTokenAccountsByOwner(wallet, {
      mint: tokenMint
    });

    if (response.value.length == 0) {
      console.log('No token account found for the specified mint address.');
      return;
    }

    // Get the balance
    const tokenAccountInfo = await this.connection.getTokenAccountBalance(response.value[0].pubkey);

    // Convert the balance from integer to decimal format

    console.log(`Token Balance: ${tokenAccountInfo.value.uiAmount}`);

    return tokenAccountInfo.value.uiAmount;
  };

  getSolanaBalance = async (publicKey: PublicKey) => {
    const balance = await this.connection.getBalance(publicKey);
    const balanceSolana = new BigNumber(balance).dividedBy(LAMPORTS_PER_SOL).toNumber();

    return balanceSolana;
  };

  getNumberOfOwnedToken = async (walletPublicKey: PublicKey) => {
    try {
      // // Convert the wallet address to PublicKey
      // const walletPublicKey = new PublicKey(walletAddress);

      // Fetch all token accounts owned by the wallet
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(walletPublicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') // SPL Token Program ID
      });

      // Process token accounts to list balances and mint addresses
      const tokens = tokenAccounts.value
        .map((tokenAccount) => {
          const info = tokenAccount.account.data.parsed.info;
          const mint = info.mint; // Mint address (unique for each token)
          const balance = info.tokenAmount.uiAmount; // Human-readable balance

          return { mint, balance };
        })
        .filter((token) => token.balance > 0); // Filter out zero-balance tokens

      // Count unique tokens and log the results
      const uniqueTokens = new Set(tokens.map((token) => token.mint));
      console.log(`You hold ${uniqueTokens.size} unique tokens:`);
      // tokens.forEach((token) => {
      //   console.log(`Token Mint: ${token.mint}, Balance: ${token.balance}`);
      // });

      return {
        uniqueTokenCount: uniqueTokens.size,
        tokenDetails: tokens
      };
    } catch (error) {
      console.error('Error fetching token balances:', error);
      return {
        uniqueTokenCount: 0,
        tokenDetails: []
      };
    }
  };

  isTransactionExpiredTimeoutError(error: any) {
    return error instanceof TransactionExpiredTimeoutError;
  }

  handleTransactionError = async ({ error }: { error: TransactionExpiredTimeoutError }) => {
    try {
      if (this.isTransactionExpiredTimeoutError(error) || error['signature']) {
        const result = await this.connection.getSignatureStatus(error.signature, {
          searchTransactionHistory: true
        });

        if (result?.value?.confirmationStatus) {
          console.log(result);

          return { transaction: error.signature, result };
        }
      }

      return null;
    } catch (e) {
      console.log(e);
      return null;
    }
  };
}
