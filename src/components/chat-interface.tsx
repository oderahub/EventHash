'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X, Minimize2, Maximize2, HelpCircle } from 'lucide-react';
import { useDAppConnector } from '@/components/client-providers';
import { useHandleChat } from '@/lib/handle-chat';
import { ChatMessage } from '@/shared/types';

export function ChatInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { mutateAsync, isPending } = useHandleChat();
  const dAppConnectorContext = useDAppConnector();
  const dAppConnector = dAppConnectorContext?.dAppConnector;
  const userAccountId = dAppConnectorContext?.userAccountId;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const quickActions = [
    { label: 'Create Event', command: '/create event' },
    { label: 'Buy Ticket', command: '/buy ticket' },
    { label: 'Check In', command: '/check in' },
    { label: 'Help', command: '/help' },
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

  // Floating chat button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg hover-scale transition-all duration-300 z-50 flex items-center justify-center"
        aria-label="Open HashBot Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}
    >
      <div className="rounded-2xl h-full flex flex-col overflow-hidden bg-white shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
            <h3 className="font-semibold text-gray-900">HashBot</h3>
            {userAccountId && (
              <span className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                {userAccountId.slice(0, 8)}...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
              {chatHistory.length === 0 && (
                <div className="text-center text-gray-600 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                  <p className="mb-2 text-gray-800">Welcome to HashBot!</p>
                  <p className="text-sm">
                    Your AI-powered event assistant. Ask me about events, tickets, or use quick
                    actions below.
                  </p>
                </div>
              )}

              {chatHistory.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.type === 'human' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.type === 'human'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-50 text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isPending && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
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

            {/* Quick Actions */}
            <div className="px-4 pb-2 bg-white">
              <div className="flex gap-2 overflow-x-auto">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.command)}
                    className="px-3 py-1 text-xs bg-orange-50 text-orange-700 rounded-full whitespace-nowrap hover:bg-orange-100 transition-colors flex items-center gap-1"
                  >
                    {action.label === 'Help' && <HelpCircle className="w-3 h-3" />}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask HashBot about events, tickets, or type /help..."
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:outline-none resize-none"
                  rows={1}
                  disabled={isPending}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isPending || !prompt.trim()}
                  className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
}
