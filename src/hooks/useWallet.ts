import { useState, useEffect, useCallback } from 'react'
import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { SUPPORTED_NETWORKS, NetworkConfig } from '../constants/networks'

interface WalletState {
  address: string | null
  isConnected: boolean
  chainId: number | null
  network: NetworkConfig | null
  isMetaMaskInstalled: boolean
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    chainId: null,
    network: null,
    isMetaMaskInstalled: false
  })

  const [publicClient, setPublicClient] = useState<any>(null)
  const [walletClient, setWalletClient] = useState<any>(null)

  // Check if MetaMask is installed
  const checkIfMetaMaskIsInstalled = useCallback(() => {
    return typeof window !== 'undefined' && 
           typeof window.ethereum !== 'undefined' && 
           window.ethereum.isMetaMask;
  }, []);

  // Initialize wallet connection
  useEffect(() => {
    const isMetaMaskInstalled = checkIfMetaMaskIsInstalled();
    setState(prev => ({ ...prev, isMetaMaskInstalled }));
    
    if (!isMetaMaskInstalled) {
      console.warn('MetaMask is not installed');
      return;
    }

    const initializeWallet = async () => {
      try {
        // Check if already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const isConnected = accounts && accounts.length > 0;
        
        // Get current chainId
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const networkId = parseInt(chainId, 16);
        const network = SUPPORTED_NETWORKS.find(n => n.id === networkId);

        // Create public client for reading from the blockchain
        if (network) {
          const public_client = createPublicClient({
            transport: http(network.rpcUrl),
          });
          setPublicClient(public_client);
        }

        // Create wallet client for sending transactions
        if (isConnected) {
          const wallet_client = createWalletClient({
            transport: custom(window.ethereum),
          });
          setWalletClient(wallet_client);
        }

        // Update state
        setState(prev => ({
          ...prev,
          address: isConnected ? accounts[0] : null,
          isConnected,
          chainId: networkId,
          network: network || null,
        }));
      } catch (error) {
        console.error('Failed to initialize wallet:', error);
      }
    };

    initializeWallet();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('connect', handleConnect);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('connect', handleConnect);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      };
    }
  }, [checkIfMetaMaskIsInstalled]);

  const handleConnect = (connectInfo: { chainId: string }) => {
    console.log('MetaMask connected:', connectInfo);
  };

  const handleDisconnect = (error: { code: number; message: string }) => {
    console.log('MetaMask disconnected:', error);
    setState(prev => ({
      ...prev,
      isConnected: false,
      address: null
    }));
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected
      setState(prev => ({
        ...prev,
        address: null,
        isConnected: false,
      }));
    } else {
      // User switched accounts
      setState(prev => ({
        ...prev,
        address: accounts[0],
        isConnected: true,
      }));
    }
  };

  const handleChainChanged = (chainId: string) => {
    const networkId = parseInt(chainId, 16);
    const network = SUPPORTED_NETWORKS.find(n => n.id === networkId);
    
    setState(prev => ({
      ...prev,
      chainId: networkId,
      network: network || null,
    }));

    // Update public client with new RPC URL
    if (network) {
      const public_client = createPublicClient({
        transport: http(network.rpcUrl),
      });
      setPublicClient(public_client);
    }
    
    // Reload the page to avoid any inconsistent state
    window.location.reload();
  };

  const connectWallet = async () => {
    if (!checkIfMetaMaskIsInstalled()) {
      throw new Error('MetaMask is not installed');
    }
    
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Get current chainId after connection
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const networkId = parseInt(chainId, 16);
      const network = SUPPORTED_NETWORKS.find(n => n.id === networkId);
      
      // Create wallet client
      const wallet_client = createWalletClient({
        transport: custom(window.ethereum),
      });
      setWalletClient(wallet_client);

      setState(prev => ({
        ...prev,
        address: accounts[0],
        isConnected: true,
        chainId: networkId,
        network: network || null,
      }));

      return true;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const switchNetwork = async (networkId: number) => {
    if (!checkIfMetaMaskIsInstalled()) {
      throw new Error('MetaMask is not installed');
    }
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${networkId.toString(16)}` }],
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added to MetaMask
        const network = SUPPORTED_NETWORKS.find(n => n.id === networkId);
        if (network) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${networkId.toString(16)}`,
                chainName: network.name,
                nativeCurrency: network.nativeCurrency,
                rpcUrls: [network.rpcUrl],
              }],
            });
            return true;
          } catch (addError) {
            console.error('Failed to add network:', addError);
            throw addError;
          }
        }
      }
      console.error('Failed to switch network:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    // Note: MetaMask doesn't support programmatic disconnection
    // This just clears the local state
    setState(prev => ({
      ...prev,
      address: null,
      isConnected: false,
    }));
  };

  return {
    ...state,
    publicClient,
    walletClient,
    connectWallet,
    switchNetwork,
    disconnectWallet,
    isMetaMaskInstalled: checkIfMetaMaskIsInstalled(),
  };
}