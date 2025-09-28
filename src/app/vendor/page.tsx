'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

type Draft = {
  name: string;
  description: string;
  date: string; // ISO string
  location: string;
  price: number;
  capacity?: number;
  category: string;
  bannerUrl?: string;
};

export default function VendorPage() {
  const [draft, setDraft] = useState<Draft>({
    name: '',
    description: '',
    date: '',
    location: '',
    price: 0,
    capacity: 100,
    category: 'General',
  });
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState(
    'Create a music concert in Lagos next Friday under 50 HBAR, capacity 500',
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Fix: Remove unused deployInfo variable or use it
  const [deployInfo, setDeployInfo] = useState<{
    eventId: string;
    topicId: string;
    transactionId: string;
  } | null>(null);

  // helper
  const showToast = (type: 'success' | 'error', text: string, ms = 3000) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), ms);
  };

  const onPickBanner = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setMessage(null);
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'events/banners');

      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Upload failed');

      setDraft((d) => ({ ...d, bannerUrl: data.url as string }));
      showToast('success', 'Banner uploaded successfully.');
    } catch (err: unknown) {
      // Fix: Replace any with unknown
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      showToast('error', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const extractWithAI = async () => {
    try {
      setExtracting(true);
      setMessage(null);
      const res = await fetch('/api/events/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success)
        throw new Error(json?.error ? JSON.stringify(json.error) : 'Extraction failed');

      const data = json.data as Partial<Draft>;
      setDraft((d) => ({
        ...d,
        name: data.name ?? d.name,
        description: data.description ?? d.description,
        date: data.date ?? d.date,
        location: data.location ?? d.location,
        price: typeof data.price === 'number' ? data.price : d.price,
        category: data.category ?? d.category,
      }));
      showToast('success', 'Draft auto-filled from AI extraction. Review and adjust if needed.');
    } catch (err: unknown) {
      // Fix: Replace any with unknown
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract draft';
      showToast('error', errorMessage);
    } finally {
      setExtracting(false);
    }
  };

  const createEvent = async () => {
    if (!draft.name || !draft.description || !draft.date || !draft.location) {
      showToast('error', 'Please fill in name, description, date, and location.');
      return;
    }
    if (Number.isNaN(draft.price) || draft.price < 0) {
      showToast('error', 'Price must be a non-negative number.');
      return;
    }

    try {
      setCreating(true);
      const payload = {
        name: draft.name,
        description: draft.description,
        date: draft.date, // API will normalize to timestamp
        location: draft.location,
        price: Number(draft.price),
        category: draft.category || 'General',
        bannerUrl: draft.bannerUrl,
      };

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.error ? JSON.stringify(data.error) : 'Failed to create event');

      showToast(
        'success',
        'Draft saved! Event will appear in marketplace once we wire the marketplace view.',
      );
    } catch (err: unknown) {
      // Fix: Replace any with unknown
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      showToast('error', errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const deployOnChain = async () => {
    if (!draft.name || !draft.description || !draft.date || !draft.location) {
      showToast('error', 'Please fill in name, description, date, and location.');
      return;
    }
    if (Number.isNaN(draft.price) || draft.price < 0) {
      showToast('error', 'Price must be a non-negative number.');
      return;
    }
    if (!draft.capacity || draft.capacity <= 0) {
      showToast('error', 'Capacity must be a positive integer.');
      return;
    }
    try {
      setCreating(true);
      setDeployInfo(null);

      // Pre-deploy env guard
      const health = await fetch('/api/events/deploy', { method: 'GET' });
      if (!health.ok) {
        const j = await health.json().catch(() => ({}));
        showToast(
          'error',
          j?.error ||
            'Deploy API not ready. Please set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in .env and restart.',
        );
        return;
      }

      const payload = {
        name: draft.name,
        description: draft.description,
        date: draft.date,
        location: draft.location,
        ticketPrice: Number(draft.price),
        maxTickets: Number(draft.capacity),
        category: draft.category || 'General',
        bannerUrl: draft.bannerUrl,
        // server defaults eventAdmin to env operator if not provided
      };
      const res = await fetch('/api/events/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.error ? JSON.stringify(data.error) : 'Deploy failed');
      }

      // Save onchain IDs to show in confirmation panel
      const onchain = data.onchain ?? {};
      setDeployInfo({
        eventId: onchain.eventId,
        topicId: onchain.topicId,
        transactionId: onchain.transactionId,
      });

      showToast('success', 'Event deployed on-chain and saved! Hedera IDs attached.');
    } catch (err: unknown) {
      // Fix: Replace any with unknown
      const errorMessage = err instanceof Error ? err.message : 'Failed to deploy event';
      showToast('error', errorMessage);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.text}
        </div>
      )}
      <h1 className="text-2xl font-semibold mb-6">Vendor Dashboard</h1>

      {/* Layout: AI assistant on the left, draft form on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Assistant */}
        <div className="glass rounded-xl p-4">
          <h2 className="text-lg font-medium mb-3">AI Assistant</h2>
          <p className="text-sm text-gray-600 mb-3">
            Describe your event in natural language. We will auto-fill the draft form.
          </p>
          <textarea
            className="w-full glass rounded-lg px-3 py-2 min-h-28"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={extractWithAI}
              disabled={extracting}
              className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-60"
            >
              {extracting ? 'Extracting…' : 'Extract with AI'}
            </button>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="px-4 py-2 glass rounded-lg"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
        </div>

        {/* Draft Form */}
        <div className="glass rounded-xl p-4">
          <h2 className="text-lg font-medium mb-4">Event Draft</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Event Name</label>
              <input
                className="w-full glass rounded-lg px-3 py-2"
                placeholder="e.g., Neon Nights Festival"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full glass rounded-lg px-3 py-2 min-h-28"
                placeholder="Describe your event..."
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full glass rounded-lg px-3 py-2"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  className="w-full glass rounded-lg px-3 py-2"
                  placeholder="Venue or City"
                  value={draft.location}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ticket Price (HBAR)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full glass rounded-lg px-3 py-2"
                  placeholder="e.g., 50"
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Capacity (max tickets)</label>
                <input
                  type="number"
                  min={1}
                  className="w-full glass rounded-lg px-3 py-2"
                  placeholder="e.g., 500"
                  value={draft.capacity ?? 100}
                  onChange={(e) => setDraft({ ...draft, capacity: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  className="w-full glass rounded-lg px-3 py-2"
                  placeholder="e.g., Music, Technology, Art"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                />
              </div>
            </div>

            {/* Banner upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Event Banner</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onPickBanner}
                  disabled={uploading}
                  className="px-4 py-2 glass rounded-lg disabled:opacity-60"
                >
                  {uploading ? 'Uploading…' : 'Choose Banner'}
                </button>
                {draft.bannerUrl && (
                  <span className="text-sm text-green-600">✓ Banner uploaded</span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={onFileChange}
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={createEvent}
                disabled={creating}
                className="px-4 py-2 bg-warm-accent text-white rounded-lg disabled:opacity-60"
              >
                {creating ? 'Creating…' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={deployOnChain}
                disabled={creating}
                className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-60"
              >
                {creating ? 'Deploying…' : 'Deploy On-Chain'}
              </button>
            </div>

            {message && <div className="mt-2 text-sm text-gray-700">{message}</div>}
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="mt-8 glass rounded-xl p-4">
          <h3 className="text-lg font-medium mb-4">Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              {draft.bannerUrl ? (
                <Image
                  src={draft.bannerUrl}
                  alt="banner"
                  width={400}
                  height={192}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-48 rounded-lg bg-gray-200 flex items-center justify-center text-gray-600">
                  No banner
                </div>
              )}
            </div>
            <div className="md:col-span-2 space-y-2">
              <div>
                <span className="font-medium">Name:</span> {draft.name || '—'}
              </div>
              <div>
                <span className="font-medium">Date:</span> {draft.date || '—'}
              </div>
              <div>
                <span className="font-medium">Location:</span> {draft.location || '—'}
              </div>
              <div>
                <span className="font-medium">Price:</span> {Number(draft.price) || 0} HBAR
              </div>
              <div>
                <span className="font-medium">Capacity:</span> {draft.capacity ?? 100} tickets
              </div>
              <div>
                <span className="font-medium">Category:</span> {draft.category || '—'}
              </div>
              <div>
                <div className="font-medium">Description:</div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {draft.description || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deploy Info Panel - show if deployment successful */}
      {deployInfo && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-3">✅ Deployment Successful!</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-green-800">Event ID</div>
              <code className="text-green-700 bg-green-100 px-2 py-1 rounded text-xs">
                {deployInfo.eventId}
              </code>
            </div>
            <div>
              <div className="font-medium text-green-800">Topic ID</div>
              <code className="text-green-700 bg-green-100 px-2 py-1 rounded text-xs">
                {deployInfo.topicId}
              </code>
            </div>
            <div>
              <div className="font-medium text-green-800">Transaction ID</div>
              <code className="text-green-700 bg-green-100 px-2 py-1 rounded text-xs">
                {deployInfo.transactionId}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
