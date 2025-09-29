'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

export function ModalShell({
  children,
  title,
  backHref = '/events',
}: {
  children: ReactNode;
  title?: string;
  backHref?: string;
}) {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
      <div className="fixed inset-0 pointer-events-none">
        {/* Subtle overlay for modal feel */}
        <div className="absolute inset-0 bg-black/5" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-orange-700 hover:text-orange-800"
          >
            <span aria-hidden>←</span> Back
          </Link>
          {title && (
            <div className="text-sm text-gray-500">
              {title}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white shadow-lg ring-1 ring-black/5 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}