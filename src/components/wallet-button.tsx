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
        className="px-6 py-2 bg-hedera-purple hover:bg-opacity-90 text-white font-semibold rounded-full transition-all duration-300 hover-scale border-2 border-hedera-purple hover:border-neon-accent"
        onClick={handleLogin}
        disabled={!dAppConnector}
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="px-3 py-1 bg-neon-accent/10 text-neon-accent rounded-full text-sm border border-neon-accent/30">
        {`${userAccountId.slice(0, 6)}...${userAccountId.slice(-4)}`}
      </div>
      <button
        className="px-4 py-2 bg-secondary/20 hover:bg-error/20 text-secondary hover:text-error font-medium rounded-full transition-all duration-300 text-sm"
        onClick={handleDisconnect}
        disabled={!dAppConnector}
      >
        Disconnect
      </button>
    </div>
  );
}
