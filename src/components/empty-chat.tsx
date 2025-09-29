type EmptyChatProps = {
  isChatEmpty: boolean;
};

export function EmptyChat({ isChatEmpty }: EmptyChatProps) {
  return (
    <div>
      {isChatEmpty && (
       <div className="flex items-center justify-center h-full">
          <p className="text-gray-600">No messages yet — try asking about your HBAR balance or creating an event</p>
       </div>
      )}
    </div>
  );
}
