import { Html, Head, Main, NextScript } from 'next/document'
import { Metadata } from 'next'
import { Suspense } from 'react'
import { Loading } from '@/layouts/Loading/loading'

export const metadata: Metadata = {
  title: {
    default: "Golden eventos",
    template: "%s | Golden eventos"
  }
}

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/images/star.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <body>
        <Suspense fallback={<Loading />}>
          <Main />
        </Suspense>
        <NextScript />
      </body>
    </Html>
  )
}
