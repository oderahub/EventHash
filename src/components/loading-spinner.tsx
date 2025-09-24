export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative">
          {/* Outer ring */}
          <div className="w-16 h-16 border-4 border-secondary/20 rounded-full animate-spin border-t-neon-accent"></div>
          {/* Inner ring */}
          <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent rounded-full animate-spin border-t-hedera-purple" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <p className="mt-4 text-secondary">Loading EventHash...</p>
      </div>
    </div>
  );
}
