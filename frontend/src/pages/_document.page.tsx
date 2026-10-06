import { Html, Head, Main, NextScript, DocumentContext, DocumentProps } from 'next/document'
import { Metadata } from 'next'
import { Suspense } from 'react'
import {
  DocumentHeadTags,
  DocumentHeadTagsProps,
  createEmotionCache,
  documentGetInitialProps,
} from '@mui/material-nextjs/v16-pagesRouter'
import { Loading } from '@/layouts/Loading/loading'

export const metadata: Metadata = {
  title: {
    default: "Golden eventos",
    template: "%s | Golden eventos"
  }
}

export default function Document(props: DocumentProps & DocumentHeadTagsProps) {
  return (
    <Html lang="en">
      <Head>
        <DocumentHeadTags {...props} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/images/star.png" />
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

// Renderiza no servidor os estilos da MUI (Emotion), usando a mesma layer `mui` do cliente
Document.getInitialProps = async (ctx: DocumentContext) =>
  documentGetInitialProps(ctx, {
    emotionCache: createEmotionCache({ key: 'mui', enableCssLayer: true }),
  })
