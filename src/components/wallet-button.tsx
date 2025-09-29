'use client';

import { useDAppConnector } from './client-providers';

export function WalletButton() {
  const { dAppConnector, userAccountId, disconnect, refresh } = useDAppConnector() ?? {};

  const handleLogin = async () => {
    if (dAppConnector) {
      await dAppConnector.openModal();
      if (refresh) refresh();
    }
  };

  const handleDisconnect = () => {
    if (disconnect) {
      void disconnect();
    }
  };

  if (!userAccountId) {
    return (
      <button
        className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors disabled:opacity-60"
        onClick={handleLogin}
        disabled={!dAppConnector}
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm border border-orange-200">
        {`${userAccountId.slice(0, 6)}...${userAccountId.slice(-4)}`}
      </div>
      <button
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-full transition-colors text-sm"
        onClick={handleDisconnect}
        disabled={!dAppConnector}
      >
        Disconnect
      </button>
    </div>
  );
}