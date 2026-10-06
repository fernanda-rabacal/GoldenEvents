import '@/styles/tailwind.css'
import '@/styles/globals.scss'
import { useState } from 'react'
import type { AppProps } from 'next/app'
import { AuthContextProvider } from '@/contexts/AuthContext'
import { EventContextProvider } from '@/contexts/EventContext'
import { CartContextProvider } from '@/contexts/CartContext'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function App({ Component, pageProps: { session, ...pageProps} }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());
  
  return (
    <QueryClientProvider client={queryClient}>
      <EventContextProvider>
        <AuthContextProvider>
          <CartContextProvider>
            <Component {...pageProps} />
            <ReactQueryDevtools initialIsOpen={false} />
          </CartContextProvider>
        </AuthContextProvider>
      </EventContextProvider>
    </QueryClientProvider>
  )
}
