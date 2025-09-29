'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Send,
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  HelpCircle,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useDAppConnector } from '@/components/client-providers';
import { useHandleChat } from '@/lib/handle-chat';
import { ChatMessage } from '@/shared/types';

export interface ChatInterfaceRef {
  openChat: () => void;
}

export const ChatInterface = forwardRef<ChatInterfaceRef>((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { mutateAsync, isPending } = useHandleChat();
  const dAppConnectorContext = useDAppConnector();
  const dAppConnector = dAppConnectorContext?.dAppConnector;
  const userAccountId = dAppConnectorContext?.userAccountId;

  // Expose openChat method to parent components
  useImperativeHandle(ref, () => ({
    openChat: () => {
      setIsOpen(true);
      setIsMinimized(false);
    },
  }));

  // Hide pulse effect after user interacts
  useEffect(() => {
    if (isOpen) {
      setShowPulse(false);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const quickActions = [
    { label: 'Create Event', command: '/create event', icon: '🎪' },
    { label: 'Buy Ticket', command: '/buy ticket', icon: '🎫' },
    { label: 'Check In', command: '/check in', icon: '✅' },
    { label: 'Help', command: '/help', icon: '❓' },
  ];

  const handleQuickAction = (command: string) => {
    setPrompt(command);
    if (command === '/help') {
      handleSendMessage(command);
    }
  };

  const handleSendMessage = async (message?: string) => {
    const currentPrompt = message || prompt;
    if (!currentPrompt.trim()) return;

    setPrompt('');

    // Add user message to chat
    setChatHistory((prev) => [
      ...prev,
      {
        type: 'human',
        content: currentPrompt,
      },
    ]);

    try {
      // Check if wallet is connected for any request
      if (!userAccountId) {
        setChatHistory((prev) => [
          ...prev,
          {
            type: 'ai',
            content:
              'Please connect your wallet to use HashBot. Click the "Connect Wallet" button in the top navigation to get started.',
          },
        ]);
        return;
      }

      const agentResponse = await mutateAsync({
        userAccountId: userAccountId,
        input: currentPrompt,
        history: chatHistory,
      });

      setChatHistory((prev) => [
        ...prev,
        {
          type: 'ai',
          content: agentResponse.message,
        },
      ]);

      // Handle transaction signing if needed
      if (agentResponse.transactionBytes && dAppConnector) {
        try {
          const result = await dAppConnector.signAndExecuteTransaction({
            signerAccountId: userAccountId,
            transactionList: agentResponse.transactionBytes,
          });

          const transactionId = 'transactionId' in result ? result.transactionId : null;

          setChatHistory((prev) => [
            ...prev,
            {
              type: 'ai',
              content: `✅ Transaction signed and executed successfully! Transaction ID: ${transactionId}`,
            },
          ]);
        } catch (txError) {
          setChatHistory((prev) => [
            ...prev,
            {
              type: 'ai',
              content: `❌ Transaction failed: ${txError instanceof Error ? txError.message : 'Unknown transaction error'}`,
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory((prev) => [
        ...prev,
        {
          type: 'ai',
          content: `❌ Error: ${error instanceof Error ? error.message : 'Something went wrong. Please try again.'}`,
        },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Enhanced floating chat button when closed
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {/* Animated background rings */}
        {showPulse && (
          <>
            <div className="absolute inset-0 w-14 h-14 bg-orange-500/30 rounded-full animate-ping" />
            <div
              className="absolute inset-0 w-14 h-14 bg-orange-500/20 rounded-full animate-ping"
              style={{ animationDelay: '1s' }}
            />
          </>
        )}

        {/* Floating sparkles */}
        <div className="absolute -top-2 -right-2 text-orange-400 animate-bounce">
          <Sparkles className="w-4 h-4" />
        </div>
        <div
          className="absolute -bottom-2 -left-2 text-orange-500 animate-bounce"
          style={{ animationDelay: '0.5s' }}
        >
          <Zap className="w-3 h-3" />
        </div>

        {/* Main button */}
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full shadow-2xl hover:shadow-orange-500/25 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
          aria-label="Open HashBot Chat"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Chat with HashBot AI
            <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        </button>

        {/* Welcome badge */}
        {showPulse && (
          <div className="absolute -top-12 -left-20 bg-white rounded-full px-3 py-1 shadow-lg border border-orange-200 text-xs font-medium text-gray-700 animate-bounce">
            👋 Try HashBot!
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}
    >
      <div className="bg-white rounded-2xl h-full flex flex-col overflow-hidden shadow-2xl border border-orange-200 ring-1 ring-orange-100">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-orange-100">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 bg-orange-400 rounded-full animate-ping opacity-75" />
            </div>
            <h3 className="font-bold text-gray-900 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-orange-500" />
              HashBot AI
            </h3>
            {userAccountId && (
              <span className="text-xs text-orange-700 bg-orange-200 px-2 py-1 rounded-full font-medium">
                {userAccountId.slice(0, 8)}...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-orange-200 rounded transition-colors text-gray-600 hover:text-gray-800"
              aria-label={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-orange-200 rounded transition-colors text-gray-600 hover:text-gray-800"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-orange-25">
              {chatHistory.length === 0 && (
                <div className="text-center text-gray-600 py-8">
                  <div className="relative inline-block mb-4">
                    <MessageCircle className="w-12 h-12 mx-auto text-orange-500" />
                    <Sparkles className="w-4 h-4 text-orange-400 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <p className="mb-2 text-gray-800 font-semibold">Welcome to HashBot AI!</p>
                  <p className="text-sm">
                    Your intelligent event assistant powered by AI. Try the quick actions below or
                    ask anything!
                  </p>
                </div>
              )}

              {chatHistory.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.type === 'human' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                      message.type === 'human'
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                        : 'bg-white text-gray-900 border border-orange-100 shadow-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isPending && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl border border-orange-100 shadow-md">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                      <div
                        className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <div
                        className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"
                        style={{ animationDelay: '0.4s' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Quick Actions */}
            <div className="px-4 pb-2 bg-white">
              <div className="flex gap-2 overflow-x-auto">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.command)}
                    className="px-3 py-2 text-xs bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 rounded-full whitespace-nowrap hover:from-orange-100 hover:to-orange-200 transition-all duration-200 flex items-center gap-1 font-medium border border-orange-200 hover:border-orange-300 hover:shadow-sm"
                  >
                    <span>{action.icon}</span>
                    {action.label}
                    {action.label === 'Help' && <HelpCircle className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Enhanced Input */}
            <div className="p-4 border-t border-orange-100 bg-white">
              <div className="flex gap-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask HashBot anything about events, tickets, or blockchain..."
                  className="flex-1 bg-orange-25 border border-orange-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:outline-none resize-none hover:border-orange-300 transition-colors"
                  rows={1}
                  disabled={isPending}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isPending || !prompt.trim()}
                  className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';
