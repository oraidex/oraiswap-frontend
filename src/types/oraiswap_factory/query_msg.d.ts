/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export type QueryMsg =
  | {
      config: {
        [k: string]: unknown;
      };
      [k: string]: unknown;
    }
  | {
      pair: {
        asset_infos: [AssetInfo, AssetInfo];
        [k: string]: unknown;
      };
      [k: string]: unknown;
    }
  | {
      pairs: {
        limit?: number | null;
        start_after?: [AssetInfo, AssetInfo] | null;
        [k: string]: unknown;
      };
      [k: string]: unknown;
    };
/**
 * AssetInfo contract_addr is usually passed from the cw20 hook so we can trust the contract_addr is properly validated.
 */
export type AssetInfo =
  | {
      token: {
        contract_addr: HumanAddr;
        [k: string]: unknown;
      };
      [k: string]: unknown;
    }
  | {
      native_token: {
        denom: string;
        [k: string]: unknown;
      };
      [k: string]: unknown;
    };
export type HumanAddr = string;
