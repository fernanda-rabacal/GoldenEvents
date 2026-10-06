import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'Golden — Descubra seu próximo momento',
    template: '%s | Golden Eventos',
  },
  description:
    'Encontre eventos, conecte-se e viva histórias que merecem ser lembradas.',
  icons: {
    icon: '/images/star.png',
  },
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#fffaf0',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='pt-BR' className={dmSans.variable}>
      <body className='antialiased'>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
