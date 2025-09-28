import Link from 'next/link';
import { WalletButton } from '@/components/wallet-button';

export function Header() {
  return (
    <header className="w-full bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold hover:opacity-80">
            EventHash
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm text-gray-600">
            <Link href="/vendor" className="hover:text-black">
              Vendor
            </Link>
            <Link href="/marketplace" className="hover:text-black">
              Marketplace
            </Link>
            <Link href="/account" className="hover:text-black">
              Account
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
