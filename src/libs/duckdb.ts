import { NetworkChainId } from '@oraichain/oraidex-common';
import * as duckdb from '@duckdb/duckdb-wasm';
import { get, set } from 'idb-keyval';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';

export type TransactionHistory = {
  initialTxHash: string;
  fromCoingeckoId: string;
  toCoingeckoId: string;
  fromChainId: NetworkChainId;
  toChainId: NetworkChainId;
  fromAmount: string;
  toAmount: string;
  fromAmountInUsdt: string;
  toAmountInUsdt: string;
  status: string;
  type: 'Swap' | 'Bridge' | 'Universal Swap';
  timestamp: number;
  userAddress: string;
};

export const toSql = (tableName: string, obj: Object) => {
  const keys = Object.keys(obj);
  const values = Object.values(obj).map((value) => {
    if (typeof value === 'number') return value;
    return `'${value}'`;
  });
  return `insert into ${tableName} (${keys.join(', ')}) values (${values.join(', ')})`;
};

const compress = async (buf: Uint8Array) => {
  try {
    return new Uint8Array(
      await new Response(new Blob([buf]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()
    );
  } catch {
    return buf;
  }
};

const decompress = async (buf: Uint8Array) => {
  try {
    return new Uint8Array(
      await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()
    );
  } catch {
    return buf;
  }
};

export class DuckDb {
  static instance: DuckDb;

  protected constructor(public readonly conn: duckdb.AsyncDuckDBConnection, public readonly db: duckdb.AsyncDuckDB) {}

  static async create() {
    if (!DuckDb.instance) {
      // Select a bundle based on browser checks
      // Instantiate the asynchronus version of DuckDB-Wasm
      const db = new duckdb.AsyncDuckDB(
        import.meta.env.NODE_ENV === 'development' ? new duckdb.ConsoleLogger() : new duckdb.VoidLogger(),
        new Worker(new URL('@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js', import.meta.url).toString())
      );
      await db.instantiate(eh_worker);
      const conn = await db.connect();
      DuckDb.instance = new DuckDb(conn, db);
    }
    return DuckDb.instance;
  }

  async createTableTransHistory(userAddress: string): Promise<boolean> {
    // Import Parquet
    const buf: Uint8Array = await get(`trans_history_${userAddress}`);
    if (buf) {
      await this.db.registerFileBuffer(`trans_history_${userAddress}.parquet`, await decompress(buf));
      await this.conn.send(
        `create table trans_history_${userAddress} as select * from 'trans_history_${userAddress}.parquet'`
      );
    } else {
      await this.conn.send(`create table trans_history_${userAddress}
      (
        initialTxHash varchar primary key, 
        fromCoingeckoId varchar, 
        toCoingeckoId varchar, 
        fromChainId varchar, 
        toChainId varchar, 
        fromAmount varchar, 
        toAmount varchar, 
        fromAmountInUsdt varchar,
        toAmountInUsdt varchar,
        status varchar,
        type varchar,
        timestamp ubigint,
        userAddress varchar
      )
      `);
    }
    return Boolean(buf);
  }

  async save(userAddress: string) {
    // Export Parquet
    await this.conn.send(`copy (select * from trans_history_${userAddress}) to 'trans_history_${userAddress}.parquet'`);
    const buf = await compress(await this.conn.bindings.copyFileToBuffer(`trans_history_${userAddress}.parquet`));
    await set(`trans_history_${userAddress}`, buf);
  }

  async addTransHistory(transHistory: TransactionHistory) {
    await this.conn.send(toSql(`trans_history_${transHistory.userAddress}`, transHistory));
    await this.save(transHistory.userAddress);
  }

  async getTransHistory(userAddress: string): Promise<TransactionHistory[]> {
    if (!userAddress) return [];

    const isTableExistOrHasData = await this.createTableTransHistory(userAddress);
    if (!isTableExistOrHasData) return [];

    // TODO: need to update limit later for pagination
    const DEFAULT_LIMIT = 20;
    const histories = await this.conn.query(
      `SELECT * FROM trans_history_${userAddress} ORDER BY timestamp DESC LIMIT ${DEFAULT_LIMIT}`
    );
    return histories.toArray();
  }
}
