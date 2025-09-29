import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ReactNode } from 'react';
import { ClientProviders } from '@/components/client-providers';
import { Header } from '@/components/header';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'EventHash - AI-Powered Blockchain Events',
  description:
    'Create and discover events with AI assistance and secure NFT tickets on Hedera blockchain.',
  keywords: 'blockchain events, NFT tickets, Hedera, AI assistant, HashBot',
  themeColor: '#f97316',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientProviders>
          <Header />
          <main>{children}</main>
        </ClientProviders>
      </body>
    </html>
  );
}
