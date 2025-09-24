import { initializeAgent } from '@/server/initialize-agent';
import { HederaEventService } from '@/lib/hedera-event-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userAccountId, input, history } = await request.json();

    if (!userAccountId) {
      return NextResponse.json({ error: 'User account ID is required' }, { status: 400 });
    }

    console.log('Processing chat request:', { userAccountId, input });

    // Initialize the AI agent
    const agent = await initializeAgent(userAccountId);

    // Initialize event service for fallback operations if needed
    const eventService = new HederaEventService();

    try {
      // Let AI agent handle the request using Hedera tools
      const result = await agent.invoke({
        input,
        chat_history: history || [],
      });

      console.log('Agent result:', result);

      // Check if result contains transaction bytes that need user signing
      const requiresSignature = result.intermediateSteps?.some(
        (step: any) =>
          step.observation?.includes('Sign transaction bytes') ||
          step.observation?.includes('transaction') ||
          step.action?.tool?.includes('create') ||
          step.action?.tool?.includes('transfer'),
      );

      const transactionBytes = requiresSignature
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          result.intermediateSteps?.find((step: any) =>
            step.observation?.includes('Sign transaction bytes'),
          )?.observation
        : undefined;

      return NextResponse.json({
        message: result.output,
        transactionBytes: transactionBytes,
        requiresSignature: !!requiresSignature,
        intermediateSteps: result.intermediateSteps, // For debugging
      });
    } finally {
      // Always close the event service
      eventService.close();
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

// Handle GET requests for testing
export async function GET() {
  return NextResponse.json({
    message: 'Event DApp Chat API is running',
    availableTools: [
      'create_topic_tool',
      'submit_topic_message_tool',
      'create_non_fungible_token_tool',
      'transfer_hbar_tool',
      'get_account_token_balances_query_tool',
      'get_topic_messages_query_tool',
    ],
  });
}
