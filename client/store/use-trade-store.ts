import { create } from 'zustand'

export type SupportedChain = 'mainnet' | 'base' | 'arbitrum' | 'bsc' | 'polygon'

type TradeState = {
  selectedChain: SupportedChain
  setSelectedChain: (chain: SupportedChain) => void
}

export const useTradeStore = create<TradeState>((set) => ({
  selectedChain: 'mainnet',
  setSelectedChain: (chain) => set({ selectedChain: chain })
}))



