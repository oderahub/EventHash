'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { ModalShell } from '@/components/modal-shell';
type EventItem = {
  id: string;
  name: string;
  description: string;
  date: number;
  location: string;
  price: number;
  category?: string;
  bannerUrl?: string;
  hederaEventId?: string;
  hederaTopicId?: string;
  hederaTicketTokenId?: string;
};

type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: unknown;
};

type PurchaseData = {
  ticketSerialNumber: number;
  transactionId: string;
};

const NETWORK = (process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet').toLowerCase();
const hashscanBase = `https://hashscan.io/${NETWORK}`;
const topicUrl = (id: string) => `${hashscanBase}/topic/${id}`;
const tokenUrl = (id: string) => `${hashscanBase}/token/${id}`;
const txUrl = (id: string) => `${hashscanBase}/transaction/${encodeURIComponent(id)}`;

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventKey = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [evt, setEvt] = useState<EventItem | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [buying, setBuying] = useState(false);

  const [buyerAccountId, setBuyerAccountId] = useState('');
  const [paymentTxId, setPaymentTxId] = useState('');
  const [lastPurchase, setLastPurchase] = useState<{ serial: number; txId: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string, ms = 3500) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), ms);
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/events', { cache: 'no-store' });
        const json: ApiResponse<EventItem[]> = await res.json();
        if (!res.ok || !json.success || !Array.isArray(json.data)) {
          throw new Error('Failed to load events');
        }
        const all = json.data;
        const found = all.find(
          (e) => e.id === eventKey || e.hederaEventId === eventKey || e.hederaTopicId === eventKey,
        );
        if (!found) throw new Error('Event not found');
        if (mounted) setEvt(found);
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to load event';
        showToast('error', errorMessage);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [eventKey]);

  const resolvedEventId = useMemo(() => {
    return evt?.hederaEventId || evt?.hederaTopicId || '';
  }, [evt]);

  const onBuy = async () => {
    if (!evt) return;
    if (!resolvedEventId) {
      showToast('error', 'This event is not deployed on-chain yet.');
      return;
    }
    if (!evt.hederaTicketTokenId) {
      showToast('error', 'Tickets have not been created for this event yet.');
      return;
    }
    if (!buyerAccountId) {
      showToast('error', 'Enter your Hedera Account ID.');
      return;
    }
    if (!paymentTxId) {
      showToast('error', 'Enter your payment transaction ID (HBAR transfer to vendor).');
      return;
    }

    try {
      setBuying(true);
      const res = await fetch('/api/events/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: resolvedEventId,
          buyerAccountId,
          paymentTxId,
          ticketTokenId: evt.hederaTicketTokenId,
        }),
      });
      const json: ApiResponse<PurchaseData> = await res.json();
      if (!res.ok || !json.success) {
        throw new Error((json.error as string) || 'Purchase failed');
      }
      if (json.data) {
        setLastPurchase({ serial: json.data.ticketSerialNumber, txId: json.data.transactionId });
        showToast('success', `Ticket minted! Serial #${json.data.ticketSerialNumber}.`);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to buy ticket';
      showToast('error', errorMessage);
    } finally {
      setBuying(false);
    }
  };

  return (
    <ModalShell title="Event Details" backHref="/events">
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

        {loading ? (
          <div className="text-gray-600 text-center py-20">Loading event details...</div>
        ) : !evt ? (
          <div className="text-red-600 text-center py-12 bg-white rounded-2xl shadow-sm">
            <div className="text-lg font-medium">Event not found</div>
            <div className="text-sm text-gray-600 mt-2">
              The event you&apos;re looking for doesn&apos;t exist or has been removed.
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top section */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <div className="aspect-video w-full rounded-xl bg-gray-100 overflow-hidden">
                    {evt.bannerUrl ? (
                      <Image
                        src={evt.bannerUrl}
                        alt={evt.name}
                        width={400}
                        height={225}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <div className="text-2xl mb-2">🎫</div>
                          <div className="text-sm">No banner</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                        {evt.name}
                      </h1>
                      {evt.category && (
                        <span className="inline-block px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full mt-2">
                          {evt.category}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{evt.price} HBAR</div>
                      <div className="text-sm text-gray-600">per ticket</div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center text-gray-600">
                      <div className="w-5 h-5 mr-3">📅</div>
                      <div>{new Date(evt.date).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <div className="w-5 h-5 mr-3">📍</div>
                      <div>{evt.location}</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {evt.description}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chain details */}
            {(resolvedEventId || evt.hederaTicketTokenId) && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Blockchain Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {resolvedEventId && (
                    <div>
                      <div className="font-medium text-gray-700">Event Topic ID</div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="px-2 py-1 bg-gray-100 rounded text-xs">{resolvedEventId}</code>
                        <a
                          href={topicUrl(resolvedEventId)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-orange-600 hover:text-orange-700 underline text-xs"
                        >
                          View on HashScan
                        </a>
                      </div>
                    </div>
                  )}
                  {evt.hederaTicketTokenId && (
                    <div>
                      <div className="font-medium text-gray-700">Ticket Token ID</div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {evt.hederaTicketTokenId}
                        </code>
                        <a
                          href={tokenUrl(evt.hederaTicketTokenId)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-orange-600 hover:text-orange-700 underline text-xs"
                        >
                          View on HashScan
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {resolvedEventId && evt.hederaTicketTokenId && (
                  <div className="mt-4">
                    <a
                      href={`/checkin?eventId=${encodeURIComponent(resolvedEventId)}&tokenId=${encodeURIComponent(
                        evt.hederaTicketTokenId,
                      )}`}
                      className="inline-block px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm"
                    >
                      Check-In
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Buy ticket */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Buy Ticket</h2>

              {!evt.hederaTicketTokenId ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-yellow-600 mr-3">⚠️</div>
                    <div>
                      <div className="font-medium text-yellow-800">Tickets Not Available</div>
                      <div className="text-sm text-yellow-700 mt-1">
                        Tickets have not been created for this event yet. Check back later.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <div className="text-orange-600 mr-3 mt-0.5">ℹ️</div>
                      <div className="text-sm text-orange-800">
                        <div className="font-medium mb-2">Demo Purchase Process:</div>
                        <ol className="list-decimal list-inside space-y-1 text-orange-700">
                          <li>Ensure your wallet is associated with the ticket token</li>
                          <li>Send {evt.price} HBAR to the event vendor</li>
                          <li>Enter your Account ID and the payment transaction ID below</li>
                          <li>Your NFT ticket will be minted and transferred to your wallet</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Your Hedera Account ID
                      </label>
                      <input
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0.0.xxxx"
                        value={buyerAccountId}
                        onChange={(e) => setBuyerAccountId(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Payment Transaction ID
                      </label>
                      <input
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0.0.xxxx@timestamp or full tx id"
                        value={paymentTxId}
                        onChange={(e) => setPaymentTxId(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onBuy}
                    disabled={buying}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {buying ? 'Minting Ticket...' : 'Mint My Ticket'}
                  </button>

                  {lastPurchase && (
                    <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <div className="text-green-600 mr-3">✅</div>
                        <div className="font-semibold text-green-800">Purchase Successful!</div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-green-800">Ticket Serial Number</div>
                          <div className="text-green-700 mt-1">#{lastPurchase.serial}</div>
                        </div>
                        <div>
                          <div className="font-medium text-green-800">Mint Transaction</div>
                          <div className="mt-1">
                            <a
                              className="text-orange-600 hover:text-orange-700 underline"
                              href={txUrl(lastPurchase.txId)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View on HashScan
                            </a>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-green-800">Token Contract</div>
                          <div className="mt-1">
                            <a
                              className="text-orange-600 hover:text-orange-700 underline"
                              href={tokenUrl(evt.hederaTicketTokenId!)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {evt.hederaTicketTokenId}
                            </a>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-green-800">Event Topic</div>
                          <div className="mt-1">
                            <a
                              className="text-orange-600 hover:text-orange-700 underline"
                              href={topicUrl(resolvedEventId)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {resolvedEventId}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
