import '@/styles/globals.scss'
import type { AppProps } from 'next/app'
import { AuthContextProvider } from '@/contexts/AuthContext'
import { EventContextProvider } from '@/contexts/EventContext'

export default function App({ Component, pageProps: { session, ...pageProps} }: AppProps) {
  return (
    <EventContextProvider>
      <AuthContextProvider>
        <Component {...pageProps} />
      </AuthContextProvider>
    </EventContextProvider>
  )
}
