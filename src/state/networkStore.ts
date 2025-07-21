import { create } from 'zustand';

interface NetworkState {
  chainId: number | null;
  setChainId: (chainId: number) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  chainId: null,
  setChainId: (chainId) => set({ chainId }),
})); 