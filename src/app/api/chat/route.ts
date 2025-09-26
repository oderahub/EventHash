import { initializeAgent } from '@/server/initialize-agent';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Add type definitions for better type safety
interface IntermediateStep {
  observation?: string;
  action?: {
    tool?: string;
  };
}

// Update AgentResult to match what the agent actually returns
interface AgentResult {
  output?: string; // Make output optional since it might not exist
  result?: string; // Alternative property name that might be used
  intermediateSteps?: IntermediateStep[];
  [key: string]: unknown; // Allow other properties from ChainValues
}

// Schema for chat request validation - match the actual format from chat interface
const chatRequestSchema = z.object({
  userAccountId: z.string().min(1, 'User account ID is required'),
  input: z.string().min(1, 'Input message is required'),
  history: z
    .array(
      z.object({
        type: z.enum(['human', 'ai']),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAccountId, input, history } = chatRequestSchema.parse(body);

    console.log('Processing chat request:', { userAccountId, input });

    // Initialize the AI agent with integrated event service tools
    const agent = await initializeAgent(userAccountId);

    try {
      // Convert chat history to the format expected by LangChain
      const formattedHistory = history.map((msg) => ({
        role: msg.type === 'human' ? 'user' : 'assistant',
        content: msg.content,
      }));

      // Let AI agent handle the request using both Hedera tools and Event Service tools
      const result = (await agent.invoke({
        input,
        chat_history: formattedHistory,
      })) as AgentResult;

      console.log('Agent result:', result);

      // Enhanced transaction detection for Event Service operations
      const requiresSignature = result.intermediateSteps?.some(
        (step: IntermediateStep) =>
          step.observation?.includes('Sign transaction bytes') ||
          step.observation?.includes('transaction') ||
          step.action?.tool?.includes('create') ||
          step.action?.tool?.includes('transfer') ||
          step.action?.tool?.includes('purchase') ||
          step.action?.tool?.includes('service'), // Event service operations
      );

      // Extract transaction bytes from various sources
      let transactionBytes = undefined;
      if (requiresSignature && result.intermediateSteps) {
        // Look for transaction bytes in observations
        for (const step of result.intermediateSteps) {
          if (step.observation?.includes('Sign transaction bytes')) {
            transactionBytes = step.observation;
            break;
          }
          // Also check for Event Service specific transaction patterns
          if (step.observation?.includes('"transactionBytes"')) {
            try {
              const parsed = JSON.parse(step.observation);
              if (parsed.transactionBytes) {
                transactionBytes = parsed.transactionBytes;
                break;
              }
            } catch {
              // Continue looking
            }
          }
        }
      }

      // Enhanced response with Event Service context
      const response = {
        message: result.output || result.result || 'No response generated', // Handle different property names
        transactionBytes: transactionBytes,
        requiresSignature: !!requiresSignature,
        // Include additional context for Event Service operations
        eventServiceUsed: result.intermediateSteps?.some((step: IntermediateStep) =>
          step.action?.tool?.includes('_service'),
        ),
        intermediateSteps: result.intermediateSteps, // For debugging
      };

      return NextResponse.json(response);
    } catch (agentError) {
      console.error('Agent execution error:', agentError);

      // Provide more helpful error messages for Event Service failures
      let errorMessage = 'Failed to process request';
      if (agentError instanceof Error) {
        if (agentError.message.includes('HederaEventService')) {
          errorMessage = 'Event service error: ' + agentError.message;
        } else if (agentError.message.includes('transaction')) {
          errorMessage = 'Transaction error: ' + agentError.message;
        } else {
          errorMessage = agentError.message;
        }
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: agentError instanceof Error ? agentError.message : 'Unknown error',
          suggestion:
            'Please check your wallet connection and try again, or contact support if the issue persists.',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', '),
          suggestion:
            'Please ensure you have connected your wallet and are sending a valid message.',
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
