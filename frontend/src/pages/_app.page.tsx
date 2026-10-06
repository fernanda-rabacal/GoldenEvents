import '@/styles/tailwind.css'
import '@/styles/globals.scss'
import { useState } from 'react'
import Head from 'next/head'
import type { AppProps } from 'next/app'
import type { EmotionCache } from '@emotion/react'
import { AppCacheProvider, createEmotionCache } from '@mui/material-nextjs/v16-pagesRouter'
import { AuthContextProvider } from '@/contexts/AuthContext'
import { EventContextProvider } from '@/contexts/EventContext'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Estilos da MUI (ícones) na layer `mui`, abaixo das utilities do Tailwind
const clientSideEmotionCache = createEmotionCache({ key: 'mui', enableCssLayer: true });

type GoldenAppProps = AppProps & { emotionCache?: EmotionCache };

export default function App({ Component, emotionCache = clientSideEmotionCache, pageProps: { session, ...pageProps} }: GoldenAppProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <AppCacheProvider emotionCache={emotionCache}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <EventContextProvider>
          <AuthContextProvider>
            <Component {...pageProps} />
            <ReactQueryDevtools initialIsOpen={false} />
          </AuthContextProvider>
        </EventContextProvider>
      </QueryClientProvider>
    </AppCacheProvider>
  )
}
