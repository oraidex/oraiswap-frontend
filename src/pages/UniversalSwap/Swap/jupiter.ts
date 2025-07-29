import axios, { AxiosInstance } from 'axios';
import { TokenItemType } from '@oraichain/oraidex-common';
import { Dec, DecUtils, RatePretty } from '@keplr-wallet/unit';
import { ethers } from 'ethers';
import { JupiterRoute, JupiterRouteParams, Transaction, UserBalance } from './types';
import {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  TransactionInstruction,
  VersionedTransaction,
  TransactionMessage
} from '@solana/web3.js';

const SOL_NATIVE_ADDRESS = 'So11111111111111111111111111111111111111112';

export class Jupiter {
  private client: AxiosInstance;
  private tokenMetadataCache: Map<string, { decimals: number; symbol?: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Add pending requests map to prevent race conditions
  private pendingMetadataRequests: Map<string, Promise<{ decimals: number; symbol?: string }>> = new Map();

  constructor() {
    this.client = axios.create({
      timeout: 10000
    });
  }

  async getTokenListFromAddress(address: string): Promise<UserBalance> {
    // we only need to check solana token here so we will use chain id solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp
    const response = await this.client.get(
      `https://multichain-balance-service.owallet.io/api/balances/chain/solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/address/${address}`
    );
    return response.data.data as UserBalance;
  }

  async getTokenList(): Promise<TokenItemType[]> {
    const response = await this.client.get('https://lite-api.jup.ag/tokens/v2/list');
    return response.data.data.map((token: any) => this.ParseTokenInfoFromOwallet(token));
  }

  async getTokenInfoByAddress(tokenAddress: string): Promise<TokenItemType | null> {
    try {
      const { data } = await this.client.get(`https://lite-api.jup.ag/tokens/v2/search?query=${tokenAddress}`);
      if (data.length === 0) {
        return null;
      }
      return this.ParseTokenInfoFromJupiter(data[0]);
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  private async ParseTokenInfoFromJupiter(token: any): Promise<TokenItemType> {
    const { id, symbol, name, icon, decimals } = token;
    return {
      name: name,
      org: 'jupiter',
      denom: id,
      contractAddress: id,
      chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      rpc: 'https://api.mainnet-beta.solana.com',
      decimals: decimals,
      icon: icon,
      coinGeckoId: symbol,
      cosmosBased: false
    };
  }

  private async ParseTokenInfoFromOwallet(token: any): Promise<TokenItemType> {
    const { _id, chainId, address, name, symbol, decimals, coingeckoId, logoURI } = token;
    return {
      name: name,
      org: 'owallet',
      denom: address,
      contractAddress: address,
      chainId: chainId,
      rpc: 'https://api.mainnet-beta.solana.com',
      decimals: decimals,
      icon: logoURI,
      coinGeckoId: coingeckoId,
      cosmosBased: false
    };
  }

  async getRoutes(params: JupiterRouteParams): Promise<JupiterRoute[]> {
    const { tokenIn, tokenOut, amount } = params;

    try {
      const tokenInAddress = tokenIn === 'native' ? SOL_NATIVE_ADDRESS : tokenIn;
      const tokenOutAddress = tokenOut === 'native' ? SOL_NATIVE_ADDRESS : tokenOut;
      // Execute Jupiter quote request
      const response = await this.client.get('https://lite-api.jup.ag/swap/v1/quote', {
        params: {
          inputMint: tokenIn,
          outputMint: tokenOut,
          amount: amount,
          swapMode: 'ExactIn'
        }
      });

      const jupiterData = response.data;

      const feeMintIds = jupiterData.routePlan.map((route: any) => route.swapInfo?.feeMint).filter(Boolean);

      const allTokenIds = [...new Set([tokenInAddress, tokenOutAddress, ...feeMintIds])];

      // Fetch all prices and token metadata in parallel
      const [allPrices, tokenMetadata] = await Promise.all([
        this.fetchPrices(allTokenIds),
        this.fetchTokenMetadataBatch(feeMintIds)
      ]);

      // Calculate USD values using params data
      const fromTokenDecimals = params.tokenInDecimals || 9;
      const toTokenDecimals = params.tokenOutDecimals || 9;

      const priceOutUsd = this.calculateUsdValue(
        jupiterData.outAmount,
        toTokenDecimals,
        allPrices[tokenOutAddress]?.price || 0
      );

      const priceInUsd = this.calculateUsdValue(
        jupiterData.inAmount,
        fromTokenDecimals,
        allPrices[tokenInAddress]?.price || 0
      );

      // Calculate fees efficiently
      const feeInUsd = this.calculateTotalFeeUsd(jupiterData.routePlan, allPrices, tokenMetadata, 0);

      // Format price impact
      const smallImpact = new Dec(jupiterData.priceImpactPct || 0);
      const formattedSmall = new RatePretty(smallImpact).maxDecimals(2).inequalitySymbol(true).toString();

      const routes = jupiterData.routePlan.map((route: any) => route.swapInfo?.label || 'Unknown');
      const slippageMultiplier = new Dec(1).sub(
        new Dec(new Dec(params.slippageTolerance).quo(new Dec(100)).toString()).quo(new Dec(100))
      );
      const minimumReceived = new Dec(jupiterData.outAmount || '0').mul(slippageMultiplier);
      const minimumReceivedFormatted = minimumReceived.quo(DecUtils.getTenExponentN(params.tokenOutDecimals || 0));
      const usdPriceMinimumReceived = new Dec(allPrices[tokenOutAddress]?.price || 0)
        .mul(minimumReceivedFormatted)
        .toString();
      const route: JupiterRoute = {
        id: jupiterData.requestId,
        provider: 'jupiter',
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: jupiterData.inAmount,
        amountOut: jupiterData.outAmount,
        amountInUsd: priceInUsd.toString(),
        amountOutUsd: priceOutUsd.toString(),
        priceImpact: formattedSmall?.replace('%', ''),
        estimatedGas: '0',
        estimatedGasUsd: feeInUsd?.toString() || '0',
        route: routes,
        routerAddress: '',
        chainId: 'solana',
        quoteResponse: jupiterData,
        extraParams: {
          slippageBps: jupiterData.slippageBps,
          feeMint: jupiterData.feeMint,
          swapMode: jupiterData.swapMode
        },
        minimumReceived: minimumReceivedFormatted?.toString() || '0',
        minimumReceivedUsd: usdPriceMinimumReceived || '0'
      };

      console.log('[logging] Jupiter adapter getRoutes completed with route:', {
        provider: route.provider,
        amountOut: route.amountOut,
        priceImpact: route.priceImpact,
        routes: route.route
      });

      return [route];
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return [];
      }

      console.error('Jupiter getRoutes error:', error);
      throw error;
    }

    return undefined;
  }

  async buildTransaction(route: JupiterRoute, userAddress: string, slippageTolerance: number) {
    const { tokenIn, tokenOut, amountIn, quoteResponse } = route;

    const { data: instructions } = await this.client.post('https://lite-api.jup.ag/swap/v1/swap-instructions', {
      userPublicKey: userAddress,
      // slippageBps is in basis points (100 = 1%)
      quoteResponse: {
        ...quoteResponse,
        slippageBps: slippageTolerance
      },
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          maxLamports: 5000000,
          priorityLevel: 'high'
        }
      },
      dynamicComputeUnitLimit: true
    });

    const {
      tokenLedgerInstruction, // If you are using `useTokenLedger = true`.
      computeBudgetInstructions, // The necessary instructions to setup the compute budget.
      setupInstructions, // Setup missing ATA for the users.
      swapInstruction: swapInstructionPayload, // The actual swap instruction.
      cleanupInstruction, // Unwrap the SOL if `wrapAndUnwrapSol = true`.
      addressLookupTableAddresses,
      otherInstructions
    } = instructions;

    const deserializeInstruction = (instruction) => {
      return new TransactionInstruction({
        programId: new PublicKey(instruction.programId),
        keys: instruction.accounts.map((key) => ({
          pubkey: new PublicKey(key.pubkey),
          isSigner: key.isSigner,
          isWritable: key.isWritable
        })),
        data: Buffer.from(instruction.data, 'base64')
      });
    };

    const instructionsData = [
      tokenLedgerInstruction ? deserializeInstruction(tokenLedgerInstruction) : null,
      ...(setupInstructions || []).map(deserializeInstruction),
      null,
      swapInstructionPayload ? deserializeInstruction(swapInstructionPayload) : null,
      cleanupInstruction ? deserializeInstruction(cleanupInstruction) : null,
      ...(otherInstructions || []).map(deserializeInstruction),
      ...(computeBudgetInstructions || []).map(deserializeInstruction),
      null
    ].filter(Boolean);

    const connection = new Connection(
      'https://solana-mainnet.phantom.app/YBPpkkN4g91xDiAnTE9r0RcMkjg0sKUIWvAfoFVJ',
      'confirmed'
    );

    const getAddressLookupTableAccounts = async (keys: string[]): Promise<AddressLookupTableAccount[]> => {
      const addressLookupTableAccountInfos = await connection.getMultipleAccountsInfo(
        keys.map((key) => new PublicKey(key))
      );

      return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
        const addressLookupTableAddress = keys[index];
        if (accountInfo) {
          const addressLookupTableAccount = new AddressLookupTableAccount({
            key: new PublicKey(addressLookupTableAddress),
            state: AddressLookupTableAccount.deserialize(accountInfo.data)
          });
          acc.push(addressLookupTableAccount);
        }

        return acc;
      }, new Array<AddressLookupTableAccount>());
    };

    const addressLookupTableAccounts: AddressLookupTableAccount[] = [];

    addressLookupTableAccounts.push(...(await getAddressLookupTableAccounts(addressLookupTableAddresses || [])));

    const blockhash = (await connection.getLatestBlockhash()).blockhash;

    const messageV0 = new TransactionMessage({
      payerKey: new PublicKey(userAddress),
      recentBlockhash: blockhash,
      instructions: instructionsData
    }).compileToV0Message(addressLookupTableAccounts);
    const versionedTx = new VersionedTransaction(messageV0);

    const transaction: Transaction = {
      to: '', // Solana transactions don't have a "to" field like EVM
      data: versionedTx.serialize(), // The serialized transaction data
      value: '0', // Solana transactions handle this differently
      gasLimit: '0', // Solana uses compute units instead
      chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      provider: 'jupiter',
      // Add additional Solana-specific fields
      serializeConfig: {
        requireAllSignatures: true,
        verifySignatures: true
      }
      // ...response.data,
    };
  }

  async signAndSendTransaction(tx: Transaction, userAddress: string): Promise<string> {
    const txDecoded = VersionedTransaction.deserialize(tx.data);
    // wallet sign and send transaction

    return '';
  }

  // Helper method to calculate USD value
  private calculateUsdValue(amount: string, decimals: number, price: number): Dec {
    return new Dec(price).mul(new Dec(ethers.utils.formatUnits(amount, decimals)));
  }

  private calculateTotalFeeUsd(
    routePlan: any[],
    prices: Record<string, { price: number }>,
    tokenMetadata: Map<string, { decimals: number }>,
    fallbackPrice: number
  ): Dec {
    let feeInUsd = new Dec(0);

    for (const route of routePlan) {
      const feeMint = route.swapInfo?.feeMint;
      const feeAmount = route.swapInfo?.feeAmount;

      if (!feeMint || !feeAmount) continue;

      const metadata = tokenMetadata.get(feeMint);
      const decimals = metadata?.decimals || 0;
      const price = prices[feeMint]?.price || fallbackPrice;

      const amount = ethers.utils.formatUnits(feeAmount, decimals);
      feeInUsd = feeInUsd.add(new Dec(price).mul(new Dec(amount)));
    }

    return feeInUsd;
  }

  private async fetchTokenMetadataBatch(
    tokenIds: string[]
  ): Promise<Map<string, { decimals: number; symbol?: string }>> {
    const result = new Map<string, { decimals: number; symbol?: string }>();
    const uncachedTokens: string[] = [];
    const now = Date.now();

    for (const tokenId of tokenIds) {
      if (!tokenId) continue;

      const cached = this.tokenMetadataCache.get(tokenId);
      if (cached && now - cached.timestamp < this.CACHE_TTL) {
        result.set(tokenId, cached);
        continue;
      } else {
        if (cached) {
          this.tokenMetadataCache.delete(tokenId);
        }
        uncachedTokens.push(tokenId);
      }
    }

    if (uncachedTokens.length > 0) {
      const fetchPromises: Promise<void>[] = [];

      for (const tokenId of uncachedTokens) {
        let pendingRequest = this.pendingMetadataRequests.get(tokenId);

        if (!pendingRequest) {
          let pendingRequest = this.fetchSingleTokenMetadata(tokenId);
          this.pendingMetadataRequests.set(tokenId, pendingRequest);
        }

        fetchPromises.push(
          pendingRequest
            .then((metadata) => {
              result.set(tokenId, metadata);
            })
            .catch((error) => {
              console.warn(`Failed to fetch metadata for token ${tokenId}:`, error);
              // Use safe fallback decimals (6 is common for Solana tokens)
              const fallbackMetadata = {
                decimals: 6,
                symbol: `TOKEN_${tokenId.slice(0, 6)}`
              };
              result.set(tokenId, fallbackMetadata);
            })
            .finally(() => {
              // Clean up pending request
              this.pendingMetadataRequests.delete(tokenId);
            })
        );
      }

      // Wait for all requests to complete
      await Promise.allSettled(fetchPromises);
    }

    return result;
  }

  private async fetchSingleTokenMetadata(tokenId: string): Promise<{ decimals: number; symbol?: string }> {
    try {
      const { data } = await this.client.get(`https://lite-api.jup.ag/tokens/v1/token/${tokenId}`, {
        timeout: 5000 // Shorter timeout for individual requests
      });

      const metadata = {
        decimals: data.decimals || 6, // Safe default for Solana
        symbol: data.symbol || `TOKEN_${tokenId.slice(0, 6)}`
      };

      // Cache the result with timestamp
      this.tokenMetadataCache.set(tokenId, {
        ...metadata,
        timestamp: Date.now()
      });

      return metadata;
    } catch (error) {
      // Don't cache errors, throw to be handled by caller
      throw error;
    }
  }

  private async fetchPrices(flattenTokensIds) {
    try {
      if (flattenTokensIds.length === 0) return;
      const { data } = await this.client.get('https://lite-api.jup.ag/price/v2', {
        params: {
          ids: flattenTokensIds.join(',')
        }
      });

      if (!data.data) return {};
      return data.data;
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  }
}

async function main() {
  const jupiter = new Jupiter();
  const userBalance = await jupiter.getTokenListFromAddress('3z28UWQtepwXbRPqzEVY1j6ZzzeykrVPYYAEF4wejLfP');
  console.dir(userBalance, { depth: null });
}

main();
