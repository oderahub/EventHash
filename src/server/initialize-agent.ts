import { Client } from '@hashgraph/sdk';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatGroq } from '@langchain/groq';
import { AgentMode, HederaLangchainToolkit } from 'hedera-agent-kit';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { BufferMemory } from 'langchain/memory';

export async function initializeAgent(userAccountId: string) {
  if (!userAccountId) throw new Error('userAccountId must be set');

  // Validate environment variable for Groq API key
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY must be set in environment variables.');
  }

  // Use Groq for production (fast and cost-effective)
  const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.1-8b-instant',
    temperature: 0.1,
    maxTokens: 2048,
    timeout: 30000,
  });

  // Use Hedera testnet client (for production, use forMainnet)
  const agentClient = Client.forTestnet();

  // Prepare Hedera toolkit (load all tools by default)
  const hederaAgentToolkit = new HederaLangchainToolkit({
    client: agentClient,
    configuration: {
      tools: [], // Loads all available tools from plugins
      context: {
        mode: AgentMode.RETURN_BYTES,
        accountId: userAccountId,
      },
    },
  });

  // Fetch tools from toolkit
  const tools = hederaAgentToolkit.getTools();

  // Confirm tool names match the latest plugin/tool documentation
  // (see: https://github.com/hashgraph/hedera-agent-kit/blob/main/docs/HEDERAPLUGINS.md)
  // Example tool names: create_topic_tool, submit_topic_message_tool, create_non_fungible_token_tool, transfer_hbar_tool, get_account_token_balances_query_tool, get_topic_messages_query_tool

  // Enhanced prompt with comprehensive event management workflows
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are a Hedera blockchain assistant for COMPREHENSIVE EVENT MANAGEMENT.

Available tools: ${tools.map((tool) => tool.name).join(', ')}

🎪 DETAILED EVENT MANAGEMENT WORKFLOWS:

1. COMPLETE EVENT CREATION FLOW:
   When user says "Create event [name]" or similar:
   
   Step 1: create_topic_tool
   - Use memo: "Event: [EventName]"
   - This creates the event's communication channel
   
   Step 2: submit_topic_message_tool  
   - Use the topicId from Step 1
   - Submit this JSON message format (replace square brackets with actual values):
   
   {
     "type": "EVENT_CREATED",
     "eventName": "[user provided name]",
     "description": "[user provided or ask for description]",
     "eventDate": "[user provided date - convert to timestamp]",
     "location": "[user provided or ask for location]", 
     "ticketPrice": "[user provided price in HBAR]",
     "maxTickets": "[user provided or ask for max tickets]",
     "eventAdmin": "${userAccountId}",
     "eventStatus": "active",
     "createdAt": "[current timestamp]"
   }

2. EVENT TICKETS CREATION:
   When user says "Create tickets" or "Create [X] tickets":
   
   Step 1: create_non_fungible_token_tool
   - tokenName: "Event Ticket - [EventTopicId]"
   - tokenSymbol: "ETIX-[last 4 digits of topicId]"
   - maxSupply: [number of tickets requested]
   - Use finite supply type
   
   Step 2: submit_topic_message_tool
   - Submit to the event's topicId
   - Message: JSON with ticket creation details

3. TICKET PURCHASE FLOW:
   When user says "Buy ticket" or "Purchase ticket for [X] HBAR":
   
   Step 1: transfer_hbar_tool
   - Transfer HBAR from buyer to event admin
   - Amount: ticket price specified in event
   
   Step 2: submit_topic_message_tool
   - Log the purchase to event topic
   - Include buyer account, ticket details, timestamp

4. EVENT CHECK-IN SYSTEM:
   When user says "Check in" or "Check-in ticket [ID]":
   
   Step 1: get_account_token_balances_query_tool
   - Verify user owns the event ticket NFT
   
   Step 2: submit_topic_message_tool
   - Log check-in to event topic
   - Include ticket ID, attendee account, check-in time

5. EVENT INFORMATION QUERIES:
   When user asks about events or tickets:
   
   - Event details: get_topic_messages_query_tool
   - User's tickets: get_account_token_balances_query_tool  
   - Event activity/history: get_topic_messages_query_tool

📋 EXAMPLE INTERACTIONS:

User: "Create a concert event called 'Rock Night' on December 25th, 50 HBAR per ticket, max 100 tickets, at Madison Square Garden"

Your response should:
1. Use create_topic_tool with memo "Event: Rock Night"
2. Use submit_topic_message_tool with proper JSON metadata
3. Explain what was created and provide topic ID

User: "Create 100 tickets for my event"

Your response should:
1. Use create_non_fungible_token_tool to create NFT collection
2. Log ticket creation to the event topic
3. Provide ticket token ID

User: "Buy a ticket for 50 HBAR"

Your response should:
1. Use transfer_hbar_tool for payment
2. Handle NFT ticket transfer
3. Log purchase details

🔧 IMPORTANT GUIDELINES:
- Always explain each step clearly
- Provide transaction IDs when operations complete
- Handle errors gracefully and suggest solutions
- Ask for missing information before proceeding
- Confirm actions before executing expensive operations
- Use proper JSON formatting for topic messages
- Include timestamps in all logged activities
- For simple greetings like "hi" or "hello", respond friendly and offer help with event management

🚨 SAFETY RULES:
- Never execute transfers without explicit user confirmation
- Always verify sufficient account balance before transfers
- Validate all input parameters before tool execution
- Provide clear error messages if operations fail`,
    ],
    ['placeholder', '{chat_history}'],
    ['human', '{input}'],
    ['placeholder', '{agent_scratchpad}'],
  ]);

  // Create the underlying agent
  const agent = createToolCallingAgent({
    llm,
    tools,
    prompt,
  });

  // In-memory conversation history
  const memory = new BufferMemory({
    memoryKey: 'chat_history',
    inputKey: 'input',
    outputKey: 'output',
    returnMessages: true,
  });

  // Wrap everything in an executor that will maintain memory
  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    memory,
    returnIntermediateSteps: true,
    maxIterations: 5, // Increased for multi-step workflows
    earlyStoppingMethod: 'generate',
    handleParsingErrors: true,
    verbose: true, // Enable for debugging
  });

  return agentExecutor;
}
