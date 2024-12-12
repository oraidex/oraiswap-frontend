import { Inspector } from "@oraichain/orai-token-inspector";

export const tokenInspector = await Inspector.create({
    oraiRpcUrl: "https://rpc.orai.io",
    bscRpcUrl: "https://bsc-dataseed.binance.org",
    ethRpcUrl: "https://eth.llamarpc.com",
    tronRpcUrl: "https://api.trongrid.io/"
});