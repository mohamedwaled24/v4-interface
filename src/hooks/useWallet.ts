import { useState, useEffect, useCallback } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'

interface WalletState {
  address: string | null
  isConnected: boolean
  chainId: number | null
  network: any | null // wagmi chain object
  isMetaMaskInstalled: boolean
  balance: string | null
}

let globalWalletState = {
  address: null as string | null,
  isConnected: false,
  chainId: null as number | null,
  network: null as any,
  isMetaMaskInstalled: false,
  publicClient: null as any,
  walletClient: null as any,
  balance: null as string | null,
}

const listeners: (() => void)[] = [];

function updateGlobalWalletState(updates: Partial<typeof globalWalletState>) {
  globalWalletState = { ...globalWalletState, ...updates };
  listeners.forEach(listener => listener());
}

export function useWallet() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = walletClient?.chain?.id || publicClient?.chain?.id || null;
  const network = walletClient?.chain || publicClient?.chain || null;

  const [state, setState] = useState<WalletState>({
    address: globalWalletState.address,
    isConnected: globalWalletState.isConnected,
    chainId: globalWalletState.chainId,
    network: globalWalletState.network,
    isMetaMaskInstalled: globalWalletState.isMetaMaskInstalled,
    balance: globalWalletState.balance,
  })
  const [balance, setBalance] = useState<string | null>(globalWalletState.balance)

  // Check if MetaMask is installed
  const checkIfMetaMaskIsInstalled = useCallback(() => {
    return typeof window !== 'undefined' && 
           typeof window.ethereum !== 'undefined' && 
           window.ethereum.isMetaMask;
  }, []);

  useEffect(() => {
    const handleStateChange = () => {
      setState({
        address: globalWalletState.address,
        isConnected: globalWalletState.isConnected,
        chainId: globalWalletState.chainId,
        network: globalWalletState.network,
        isMetaMaskInstalled: globalWalletState.isMetaMaskInstalled,
        balance: globalWalletState.balance,
      });
      setBalance(globalWalletState.balance);
    };
    listeners.push(handleStateChange);
    return () => {
      const index = listeners.indexOf(handleStateChange);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  // Update global state from wagmi hooks
  useEffect(() => {
    updateGlobalWalletState({
      address: address || null,
      isConnected: !!isConnected,
      chainId,
      network,
      publicClient,
      walletClient,
      isMetaMaskInstalled: checkIfMetaMaskIsInstalled(),
    });
  }, [address, isConnected, chainId, network, publicClient, walletClient, checkIfMetaMaskIsInstalled]);

  // Fetch balance when address or publicClient changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (address && publicClient) {
        try {
          const balanceBigInt = await publicClient.getBalance({ address });
          const balanceEth = (Number(balanceBigInt) / 1e18).toString();
          updateGlobalWalletState({ balance: balanceEth });
        } catch (error) {
          updateGlobalWalletState({ balance: null });
        }
      } else {
        updateGlobalWalletState({ balance: null });
      }
    };
    fetchBalance();
  }, [address, publicClient]);

  // No need for manual connect/disconnect logic; use wagmi's connectors
  const connectWallet = async () => {
    throw new Error('Use wagmi connectors for wallet connection');
  };
  const switchNetwork = async (networkId: number) => {
    throw new Error('Use wagmi connectors for network switching');
  };
  const disconnectWallet = () => {
    throw new Error('Use wagmi connectors for wallet disconnection');
  };

  return {
    ...state,
    publicClient,
    walletClient,
    connectWallet,
    switchNetwork,
    disconnectWallet,
    isMetaMaskInstalled: checkIfMetaMaskIsInstalled(),
    balance,
  };
}