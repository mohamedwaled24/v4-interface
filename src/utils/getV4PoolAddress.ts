import { ethers } from "ethers";

const POOL_MANAGER_ABI = [
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "currency0", "type": "address" },
          { "internalType": "address", "name": "currency1", "type": "address" },
          { "internalType": "uint24", "name": "fee", "type": "uint24" },
          { "internalType": "int24", "name": "tickSpacing", "type": "int24" },
          { "internalType": "address", "name": "hooks", "type": "address" }
        ],
        "internalType": "struct PoolKey",
        "name": "key",
        "type": "tuple"
      }
    ],
    "name": "getPool",
    "outputs": [{ "internalType": "address", "name": "pool", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

export async function getV4PoolAddress(
  poolManagerAddress: string,
  poolKey: {
    currency0: string,
    currency1: string,
    fee: number,
    tickSpacing: number,
    hooks: string
  },
  rpcUrl: string
) {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const poolManager = new ethers.Contract(poolManagerAddress, POOL_MANAGER_ABI, provider);
  return await poolManager.getPool(poolKey);
}