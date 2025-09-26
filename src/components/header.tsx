import Link from 'next/link'
import { WalletButton } from '@/components/wallet-button';

export function Header() {
  return (
    <header className="w-full border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold hover:opacity-80">
            Hedera Event DApp
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm text-gray-600">
            <Link href="/vendor" className="hover:text-black">Vendor</Link>
            <Link href="/marketplace" className="hover:text-black">Marketplace</Link>
            <Link href="/account" className="hover:text-black">Account</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
