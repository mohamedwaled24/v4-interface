export const ERC20_ABI = [
    {
      name: 'approve',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      outputs: [{ name: '', type: 'bool' }]
    },
    {
      name: 'allowance',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' }
      ],
      outputs: [{ name: '', type: 'uint256' }]
    },
      {
    "constant":true,
    "inputs":[],
    "name":"decimals",
    "outputs":[{"name":"","type":"uint8"}],
    "type":"function",
    "stateMutability": "view"
  },
  {
    "constant":true,
    "inputs":[{"name":"owner","type":"address"}],
    "name":"balanceOf",
    "outputs":[{"name":"balance","type":"uint256"}],
    "type":"function",
    "stateMutability": "view"
  }
  ] as const;