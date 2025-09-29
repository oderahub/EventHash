'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { WalletButton } from '@/components/wallet-button';

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  const headerClass = isHome
    ? 'w-full absolute top-0 left-0 border-b border-transparent z-50'
    : 'w-full bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-50';

  const linkBase = isHome ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900';

  return (
    <header className={headerClass}>
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="Go to home">
            <Image
              src="/eventhash-icon.svg"
              alt="EventHash Logo"
              width={32}
              height={32}
              priority
              className="h-8 w-8"
            />
            <span className={`font-bold text-lg ${isHome ? 'text-white' : 'text-gray-900'}`}>
              Event<span className="text-neon-accent">Hash</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm">
            <Link href="/events" className={linkBase}>
              Discover events
            </Link>
            <Link href="/how-it-works" className={linkBase}>
              How it works
            </Link>
            <Link href="/about" className={linkBase}>
              About
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
