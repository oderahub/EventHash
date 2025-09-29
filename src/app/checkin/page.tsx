'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ModalShell } from '@/components/modal-shell';


const NETWORK = (process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet').toLowerCase();
const hashscanBase = `https://hashscan.io/${NETWORK}`;
const topicUrl = (id: string) => `${hashscanBase}/topic/${id}`;
const txUrl = (id: string) => `${hashscanBase}/transaction/${encodeURIComponent(id)}`;

export default function CheckInPage() {
  const search = useSearchParams();
  const [eventId, setEventId] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [serialNumber, setSerialNumber] = useState<number | ''>('');
  const [ownerAccountId, setOwnerAccountId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [result, setResult] = useState<{
    txId: string;
    eventId: string;
    tokenId: string;
    serial: number;
  } | null>(null);

  useEffect(() => {
    const ev = search.get('eventId');
    const tk = search.get('tokenId');
    if (ev) setEventId(ev);
    if (tk) setTokenId(tk);
  }, [search]);

  const showToast = (type: 'success' | 'error', text: string, ms = 3000) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), ms);
  };

  const onSubmit = async () => {
    if (!eventId || !tokenId || serialNumber === '' || Number(serialNumber) < 0) {
      showToast('error', 'Fill in all fields correctly.');
      return;
    }
    try {
      setSubmitting(true);
      setResult(null);
      const res = await fetch('/api/events/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          tokenId,
          serialNumber: Number(serialNumber),
          ownerAccountId: ownerAccountId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success)
        throw new Error(json?.error ? JSON.stringify(json.error) : 'Check-in failed');
      setResult({
        txId: json.data.transactionId,
        eventId: json.data.eventId,
        tokenId: json.data.tokenId,
        serial: json.data.serialNumber ?? Number(serialNumber),
      });
      showToast('success', 'Ticket checked in and recorded on-chain.');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to check in';
      showToast('error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Check-In" backHref="/events">
      <div className="p-6">
        {toast && (
          <div
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.text}
          </div>
        )}

        <h1 className="text-2xl font-semibold mb-6 text-gray-800">Event Check-In</h1>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Event Topic ID</label>
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0.0.xxxxx"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Ticket Token ID</label>
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0.0.xxxxx"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Ticket Serial Number</label>
              <input
                type="number"
                min={0}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., 1"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Owner Account ID (optional)
              </label>
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0.0.xxxxx"
                value={ownerAccountId}
                onChange={(e) => setOwnerAccountId(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="mt-4 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-60"
          >
            {submitting ? 'Checking In…' : 'Check In Ticket'}
          </button>

          {result && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
              <div className="font-medium text-green-800 mb-2">Check-In Recorded</div>
              <div className="space-y-1">
                <div>
                  <span className="text-green-800 font-medium">Transaction:</span>{' '}
                  <a className="text-orange-600 hover:text-orange-700 underline" href={txUrl(result.txId)} target="_blank" rel="noreferrer">
                    View on HashScan
                  </a>
                </div>
                <div>
                  <span className="text-green-800 font-medium">Event Topic:</span>{' '}
                  <a className="text-orange-600 hover:text-orange-700 underline" href={topicUrl(result.eventId)} target="_blank" rel="noreferrer">
                    {result.eventId}
                  </a>
                </div>
                <div>
                  <span className="text-green-800 font-medium">Token:</span> {result.tokenId}
                </div>
                <div>
                  <span className="text-green-800 font-medium">Serial:</span> #{result.serial}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
