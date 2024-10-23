import { CwBitcoinClient } from 'libs/cw-bitcoin/models/cw-bitcoin-client';
import { createContext } from 'react';

const client = new CwBitcoinClient();

export const CwBitcoinContext = createContext(client);
