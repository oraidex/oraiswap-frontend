export type JupiterRouteParams = {
  tokenIn: string;
  tokenOut: string;
  tokenInDecimals: number;
  tokenOutDecimals: number;
  amount: string;
  chainId: string;
  chainIdOut: string;
  slippageTolerance: number;
};

// Swap route information
export interface JupiterRoute {
  id: string;
  provider: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  amountInUsd: string;
  amountOutUsd: string;
  priceImpact: string;
  estimatedGas: string;
  estimatedGasUsd: string;
  route: any[]; // The detailed route path, structure varies by provider
  routerAddress: string;
  chainId: string;
  extraParams?: Record<string, any>;
  quoteResponse?: any;
  displayAmount?: string;
  routeSummary?: any;
  minimumReceived?: string;
  minimumReceivedUsd?: string;
}

export interface Transaction {
  to: string;
  data: Uint8Array;
  value: string;
  gasLimit: string;
  chainId: string;
  provider: string;
  serializeConfig?: {
    requireAllSignatures?: boolean;
    verifySignatures?: boolean;
  };
}

export interface ChainInfo {
  id: string;
  name: string;
  type: string;
}

export interface Token {
  id: string;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI: string;
  coingeckoId: string;
  isNative: boolean;
  isVerified: boolean;
  isToken2022: boolean;
}

export interface TokenBalance {
  chain: ChainInfo;
  token: Token;
  balance: number;
  balanceFormatted: number;
  usdPrice: number;
  usdValue: number;
  lastUpdated: number;
}

export interface UserBalance {
  data: TokenBalance[];
}
