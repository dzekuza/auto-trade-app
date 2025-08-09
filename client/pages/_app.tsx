import type { AppProps } from 'next/app'
import { WagmiConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '../config/wagmi'
import ToastProvider from '../components/ToastProvider'

import '../styles/globals.css'

// Create a query client instance once per app
const queryClient = new QueryClient()

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
        <ToastProvider />
      </QueryClientProvider>
    </WagmiConfig>
  )
}