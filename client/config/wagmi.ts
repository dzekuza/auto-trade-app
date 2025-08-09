import { configureChains, createConfig } from 'wagmi'
import { mainnet, base } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

/**
 * wagmi configuration for the client.
 *
 * Chains can be extended by importing additional networks from `wagmi/chains`.
 * For walletConnect to work on mobile devices, set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
 * in your `.env` file.
 */
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, base],
  [publicProvider()]
)

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({ chains }),
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({ chains, options: { projectId } })
  ],
  publicClient,
  webSocketPublicClient
})