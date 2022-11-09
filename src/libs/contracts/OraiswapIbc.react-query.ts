/**
* This file was automatically generated by @cosmwasm/ts-codegen@0.20.0.
* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
* and run the @cosmwasm/ts-codegen generate command to regenerate this file.
*/

import { UseQueryOptions, useQuery, useMutation, UseMutationOptions } from "@tanstack/react-query";
import { ExecuteResult } from "@cosmjs/cosmwasm-stargate";
import { StdFee } from "@cosmjs/amino";
import {AllowMsg, Uint128, Binary, Uint64, Cw20ReceiveMsg, TransferMsg, SwapMsg, JoinPoolMsg, ExitPoolMsg, CreateLockupMsg, LockTokensMsg, ClaimTokensMsg, UnlockTokensMsg, ExternalTokenMsg, Amount, Coin, Cw20Coin, ChannelInfo, IbcEndpoint, AllowedInfo, AllowedTokenInfo} from "./types";
import {InstantiateMsg, ExecuteMsg, QueryMsg, AdminResponse, AllowedResponse, ChannelResponse, ConfigResponse, AllowedTokenResponse, ListAllowedResponse, ListChannelsResponse, ListExternalTokensResponse, LockupResponse} from "./OraiswapIbc.types";
import { OraiswapIbcQueryClient, OraiswapIbcClient } from "./OraiswapIbc.client";
export interface OraiswapIbcReactQuery<TResponse, TData = TResponse> {
  client: OraiswapIbcQueryClient | undefined;
  options?: Omit<UseQueryOptions<TResponse, Error, TData>, "'queryKey' | 'queryFn' | 'initialData'"> & {
    initialData?: undefined;
  };
}
export interface OraiswapIbcLockupQuery<TData> extends OraiswapIbcReactQuery<LockupResponse, TData> {
  args: {
    channel: string;
    owner: string;
  };
}
export function useOraiswapIbcLockupQuery<TData = LockupResponse>({
  client,
  args,
  options
}: OraiswapIbcLockupQuery<TData>) {
  return useQuery<LockupResponse, Error, TData>(["oraiswapIbcLockup", client?.contractAddress, JSON.stringify(args)], () => client ? client.lockup({
    channel: args.channel,
    owner: args.owner
  }) : Promise.reject(new Error("Invalid client")), { ...options,
    enabled: !!client && (options?.enabled != undefined ? options.enabled : true)
  });
}
export interface OraiswapIbcListExternalTokensQuery<TData> extends OraiswapIbcReactQuery<ListExternalTokensResponse, TData> {
  args: {
    limit?: number;
    startAfter?: string;
  };
}
export function useOraiswapIbcListExternalTokensQuery<TData = ListExternalTokensResponse>({
  client,
  args,
  options
}: OraiswapIbcListExternalTokensQuery<TData>) {
  return useQuery<ListExternalTokensResponse, Error, TData>(["oraiswapIbcListExternalTokens", client?.contractAddress, JSON.stringify(args)], () => client ? client.listExternalTokens({
    limit: args.limit,
    startAfter: args.startAfter
  }) : Promise.reject(new Error("Invalid client")), { ...options,
    enabled: !!client && (options?.enabled != undefined ? options.enabled : true)
  });
}
export interface OraiswapIbcListAllowedQuery<TData> extends OraiswapIbcReactQuery<ListAllowedResponse, TData> {
  args: {
    limit?: number;
    startAfter?: string;
  };
}
export function useOraiswapIbcListAllowedQuery<TData = ListAllowedResponse>({
  client,
  args,
  options
}: OraiswapIbcListAllowedQuery<TData>) {
  return useQuery<ListAllowedResponse, Error, TData>(["oraiswapIbcListAllowed", client?.contractAddress, JSON.stringify(args)], () => client ? client.listAllowed({
    limit: args.limit,
    startAfter: args.startAfter
  }) : Promise.reject(new Error("Invalid client")), { ...options,
    enabled: !!client && (options?.enabled != undefined ? options.enabled : true)
  });
}
export interface OraiswapIbcExternalTokenQuery<TData> extends OraiswapIbcReactQuery<AllowedTokenResponse, TData> {
  args: {
    denom: string;
  };
}
export function useOraiswapIbcExternalTokenQuery<TData = AllowedTokenResponse>({
  client,
  args,
  options
}: OraiswapIbcExternalTokenQuery<TData>) {
  return useQuery<AllowedTokenResponse, Error, TData>(["oraiswapIbcExternalToken", client?.contractAddress, JSON.stringify(args)], () => client ? client.externalToken({
    denom: args.denom
  }) : Promise.reject(new Error("Invalid client")), { ...options,
    enabled: !!client && (options?.enabled != undefined ? options.enabled : true)
  });
}
export interface OraiswapIbcAllowedQuery<TData> extends OraiswapIbcReactQuery<AllowedResponse, TData> {
  args: {
    contract: string;
  };
}
export function useOraiswapIbcAllowedQuery<TData = AllowedResponse>({
  client,
  args,
  options
}: OraiswapIbcAllowedQuery<TData>) {
  return useQuery<AllowedResponse, Error, TData>(["oraiswapIbcAllowed", client?.contractAddress, JSON.stringify(args)], () => client ? client.allowed({
    contract: args.contract
  }) : Promise.reject(new Error("Invalid client")), { ...options,
    enabled: !!client && (options?.enabled != undefined ? options.enabled : true)
  });
}
export interface OraiswapIbcAdminQuery<TData> extends OraiswapIbcReactQuery<AdminResponse, TData> {}
export function useOraiswapIbcAdminQuery<TData = AdminResponse>({
  client,
  options
}: OraiswapIbcAdminQuery<TData>) {
  return useQuery<AdminResponse, Error, TData>(["oraiswapIbcAdmin", client?.contractAddress], () => client ? client.admin() : Promise.reject(new Error("Invalid client")), { ...options,
    enabled: !!client && (options?.enabled != undefined ? options.enabled : true)
  });
}
export interface OraiswapIbcConfigQuery<TData> extends OraiswapIbcReactQuery<ConfigResponse, TData> {}
export function useOraiswapIbcConfigQuery<TData = ConfigResponse>({
  client,
  options
}: OraiswapIbcConfigQuery<TData>) {
  return useQuery<ConfigResponse, Error, TData>(["oraiswapIbcConfig", client?.contractAddress], () => client ? client.config() : Promise.reject(new Error("Invalid client")), { ...options,
    enabled: !!client && (options?.enabled != undefined ? options.enabled : true)
  });
}
export interface OraiswapIbcChannelQuery<TData> extends OraiswapIbcReactQuery<ChannelResponse, TData> {
  args: {
    id: string;
  };
}
export function useOraiswapIbcChannelQuery<TData = ChannelResponse>({
  client,
  args,
  options
}: OraiswapIbcChannelQuery<TData>) {
  return useQuery<ChannelResponse, Error, TData>(["oraiswapIbcChannel", client?.contractAddress, JSON.stringify(args)], () => client ? client.channel({
    id: args.id
  }) : Promise.reject(new Error("Invalid client")), { ...options,
    enabled: !!client && (options?.enabled != undefined ? options.enabled : true)
  });
}
export interface OraiswapIbcListChannelsQuery<TData> extends OraiswapIbcReactQuery<ListChannelsResponse, TData> {}
export function useOraiswapIbcListChannelsQuery<TData = ListChannelsResponse>({
  client,
  options
}: OraiswapIbcListChannelsQuery<TData>) {
  return useQuery<ListChannelsResponse, Error, TData>(["oraiswapIbcListChannels", client?.contractAddress], () => client ? client.listChannels() : Promise.reject(new Error("Invalid client")), { ...options,
    enabled: !!client && (options?.enabled != undefined ? options.enabled : true)
  });
}
export interface OraiswapIbcUpdateAdminMutation {
  client: OraiswapIbcClient;
  msg: {
    admin: string;
  };
  args?: {
    fee?: number | StdFee | "auto";
    memo?: string;
    funds?: Coin[];
  };
}
export function useOraiswapIbcUpdateAdminMutation(options?: Omit<UseMutationOptions<ExecuteResult, Error, OraiswapIbcUpdateAdminMutation>, "mutationFn">) {
  return useMutation<ExecuteResult, Error, OraiswapIbcUpdateAdminMutation>(({
    client,
    msg,
    args: {
      fee,
      memo,
      funds
    } = {}
  }) => client.updateAdmin(msg, fee, memo, funds), options);
}
export interface OraiswapIbcAllowExternalTokenMutation {
  client: OraiswapIbcClient;
  msg: ExternalTokenMsg;
  args?: {
    fee?: number | StdFee | "auto";
    memo?: string;
    funds?: Coin[];
  };
}
export function useOraiswapIbcAllowExternalTokenMutation(options?: Omit<UseMutationOptions<ExecuteResult, Error, OraiswapIbcAllowExternalTokenMutation>, "mutationFn">) {
  return useMutation<ExecuteResult, Error, OraiswapIbcAllowExternalTokenMutation>(({
    client,
    msg,
    args: {
      fee,
      memo,
      funds
    } = {}
  }) => client.allowExternalToken(msg, fee, memo, funds), options);
}
export interface OraiswapIbcAllowMutation {
  client: OraiswapIbcClient;
  msg: AllowMsg;
  args?: {
    fee?: number | StdFee | "auto";
    memo?: string;
    funds?: Coin[];
  };
}
export function useOraiswapIbcAllowMutation(options?: Omit<UseMutationOptions<ExecuteResult, Error, OraiswapIbcAllowMutation>, "mutationFn">) {
  return useMutation<ExecuteResult, Error, OraiswapIbcAllowMutation>(({
    client,
    msg,
    args: {
      fee,
      memo,
      funds
    } = {}
  }) => client.allow(msg, fee, memo, funds), options);
}
export interface OraiswapIbcUnlockTokensMutation {
  client: OraiswapIbcClient;
  msg: UnlockTokensMsg;
  args?: {
    fee?: number | StdFee | "auto";
    memo?: string;
    funds?: Coin[];
  };
}
export function useOraiswapIbcUnlockTokensMutation(options?: Omit<UseMutationOptions<ExecuteResult, Error, OraiswapIbcUnlockTokensMutation>, "mutationFn">) {
  return useMutation<ExecuteResult, Error, OraiswapIbcUnlockTokensMutation>(({
    client,
    msg,
    args: {
      fee,
      memo,
      funds
    } = {}
  }) => client.unlockTokens(msg, fee, memo, funds), options);
}
export interface OraiswapIbcClaimTokensMutation {
  client: OraiswapIbcClient;
  msg: ClaimTokensMsg;
  args?: {
    fee?: number | StdFee | "auto";
    memo?: string;
    funds?: Coin[];
  };
}
export function useOraiswapIbcClaimTokensMutation(options?: Omit<UseMutationOptions<ExecuteResult, Error, OraiswapIbcClaimTokensMutation>, "mutationFn">) {
  return useMutation<ExecuteResult, Error, OraiswapIbcClaimTokensMutation>(({
    client,
    msg,
    args: {
      fee,
      memo,
      funds
    } = {}
  }) => client.claimTokens(msg, fee, memo, funds), options);
}
export interface OraiswapIbcLockTokensMutation {
  client: OraiswapIbcClient;
  msg: LockTokensMsg;
  args?: {
    fee?: number | StdFee | "auto";
    memo?: string;
    funds?: Coin[];
  };
}
export function useOraiswapIbcLockTokensMutation(options?: Omit<UseMutationOptions<ExecuteResult, Error, OraiswapIbcLockTokensMutation>, "mutationFn">) {
  return useMutation<ExecuteResult, Error, OraiswapIbcLockTokensMutation>(({
    client,
    msg,
    args: {
      fee,
      memo,
      funds
    } = {}
  }) => client.lockTokens(msg, fee, memo, funds), options);
}
export interface OraiswapIbcCreateLockupMutation {
  client: OraiswapIbcClient;
  msg: CreateLockupMsg;
  args?: {
    fee?: number | StdFee | "auto";
    memo?: string;
    funds?: Coin[];
  };
}
export function useOraiswapIbcCreateLockupMutation(options?: Omit<UseMutationOptions<ExecuteResult, Error, OraiswapIbcCreateLockupMutation>, "mutationFn">) {
  return useMutation<ExecuteResult, Error, OraiswapIbcCreateLockupMutation>(({
    client,
    msg,
    args: {
      fee,
      memo,
      funds
    } = {}
  }) => client.createLockup(msg, fee, memo, funds), options);
}
export interface OraiswapIbcExitPoolMutation {
  client: OraiswapIbcClient;
  msg: ExitPoolMsg;
  args?: {
    fee?: number | StdFee | "auto";
    memo?: string;
    funds?: Coin[];
  };
}
export function useOraiswapIbcExitPoolMutation(options?: Omit<UseMutationOptions<ExecuteResult, Error, OraiswapIbcExitPoolMutation>, "mutationFn">) {
  return useMutation<ExecuteResult, Error, OraiswapIbcExitPoolMutation>(({
    client,
    msg,
    args: {
      fee,
      memo,
      funds
    } = {}
  }) => client.exitPool(msg, fee, memo, funds), options);
}
export interface OraiswapIbcJoinPoolMutation {
  client: OraiswapIbcClient;
  msg: JoinPoolMsg;
  args?: {
    fee?: number | StdFee | "auto";
    memo?: string;
    funds?: Coin[];
  };
}
export function useOraiswapIbcJoinPoolMutation(options?: Omit<UseMutationOptions<ExecuteResult, Error, OraiswapIbcJoinPoolMutation>, "mutationFn">) {
  return useMutation<ExecuteResult, Error, OraiswapIbcJoinPoolMutation>(({
    client,
    msg,
    args: {
      fee,
      memo,
      funds
    } = {}
  }) => client.joinPool(msg, fee, memo, funds), options);
}
export interface OraiswapIbcSwapMutation {
  client: OraiswapIbcClient;
  msg: SwapMsg;
  args?: {
    fee?: number | StdFee | "auto";
    memo?: string;
    funds?: Coin[];
  };
}
export function useOraiswapIbcSwapMutation(options?: Omit<UseMutationOptions<ExecuteResult, Error, OraiswapIbcSwapMutation>, "mutationFn">) {
  return useMutation<ExecuteResult, Error, OraiswapIbcSwapMutation>(({
    client,
    msg,
    args: {
      fee,
      memo,
      funds
    } = {}
  }) => client.swap(msg, fee, memo, funds), options);
}
export interface OraiswapIbcTransferMutation {
  client: OraiswapIbcClient;
  msg: TransferMsg;
  args?: {
    fee?: number | StdFee | "auto";
    memo?: string;
    funds?: Coin[];
  };
}
export function useOraiswapIbcTransferMutation(options?: Omit<UseMutationOptions<ExecuteResult, Error, OraiswapIbcTransferMutation>, "mutationFn">) {
  return useMutation<ExecuteResult, Error, OraiswapIbcTransferMutation>(({
    client,
    msg,
    args: {
      fee,
      memo,
      funds
    } = {}
  }) => client.transfer(msg, fee, memo, funds), options);
}
export interface OraiswapIbcReceiveMutation {
  client: OraiswapIbcClient;
  msg: Cw20ReceiveMsg;
  args?: {
    fee?: number | StdFee | "auto";
    memo?: string;
    funds?: Coin[];
  };
}
export function useOraiswapIbcReceiveMutation(options?: Omit<UseMutationOptions<ExecuteResult, Error, OraiswapIbcReceiveMutation>, "mutationFn">) {
  return useMutation<ExecuteResult, Error, OraiswapIbcReceiveMutation>(({
    client,
    msg,
    args: {
      fee,
      memo,
      funds
    } = {}
  }) => client.receive(msg, fee, memo, funds), options);
}