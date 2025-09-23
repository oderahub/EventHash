import { Client } from '@hashgraph/sdk';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatGroq } from '@langchain/groq';
import { AgentMode, HederaLangchainToolkit } from 'hedera-agent-kit';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { BufferMemory } from 'langchain/memory';

export async function initializeAgent(userAccountId: string) {
  if (!userAccountId) throw new Error('userAccountId must be set');

  // Use Groq for production (fast and cost-effective)
  const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY!,
    model: 'llama-3.1-8b-instant',
    temperature: 0.1,
    maxTokens: 2048,
    timeout: 30000,
  });

  const agentClient = Client.forTestnet();

  // Prepare Hedera toolkit (load all tools by default)
  const hederaAgentToolkit = new HederaLangchainToolkit({
    client: agentClient,
    configuration: {
      tools: [], // use an empty array if you want to load all tools
      context: {
        mode: AgentMode.RETURN_BYTES,
        accountId: userAccountId,
      },
    },
  });

  // Fetch tools from toolkit
  const tools = hederaAgentToolkit.getTools();

  // Enhanced prompt for event management using available tools
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are an intelligent Hedera blockchain assistant for an EVENT MANAGEMENT platform.

      AVAILABLE TOOLS: ${tools.map((tool) => tool.name).join(', ')}

      EVENT MANAGEMENT CAPABILITIES:
      🎫 CREATE EVENTS: Use 'create_topic_tool' to create event channels
      📝 EVENT UPDATES: Use 'submit_topic_message_tool' to post event details, updates, announcements
      🎟️ EVENT TICKETS: Use 'create_non_fungible_token_tool' to create unique event tickets/NFTs
      💰 PAYMENTS: Use 'transfer_hbar_tool' for event payments, refunds, deposits
      🎁 REWARDS: Use 'create_fungible_token_tool' for event reward tokens
      📊 QUERIES: Use query tools to check balances, event messages, participant info

      HOW TO HANDLE EVENT REQUESTS:
      - "Create an event" → create_topic_tool (event becomes a topic)
      - "Add event details" → submit_topic_message_tool (post event info)
      - "Create tickets" → create_non_fungible_token_tool (NFT tickets)
      - "Event payment" → transfer_hbar_tool (handle payments)
      - "Event tokens/rewards" → create_fungible_token_tool
      - "Check event messages" → get_topic_messages_query_tool
      - "Check balances" → get_hbar_balance_query_tool

      Always explain how you're using blockchain tools to manage events.
      Be creative in mapping user requests to available Hedera tools.`,
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
    maxIterations: 3,
    earlyStoppingMethod: 'generate',
    handleParsingErrors: true,
  });

  return agentExecutor;
}
// import { Client } from '@hashgraph/sdk';
// import { ChatPromptTemplate } from '@langchain/core/prompts';
// import { ChatOpenAI } from '@langchain/openai';
// import { AgentMode, HederaLangchainToolkit } from 'hedera-agent-kit';
// import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
// import { BufferMemory } from 'langchain/memory';

// export async function initializeAgent(userAccountId: string) {
//   if (!userAccountId)
//     throw new Error('userAccountId must be set');

//   // Initialise OpenAI LLM
//   const llm = new ChatOpenAI({
//     model: 'gpt-4o-mini',
//   });

//   const agentClient = Client.forTestnet();

//     // Prepare Hedera toolkit (load all tools by default)
//     const hederaAgentToolkit = new HederaLangchainToolkit({
//       client: agentClient,
//       configuration: {
//         tools: [], // use an empty array if you wantto load all tools
//         context: {
//           mode: AgentMode.RETURN_BYTES,
//           accountId: userAccountId,
//         },
//       },
//     });

//     // Load the structured chat prompt template
//     const prompt = ChatPromptTemplate.fromMessages([
//       ['system', 'You are a helpful assistant'],
//       ['placeholder', '{chat_history}'],
//       ['human', '{input}'],
//       ['placeholder', '{agent_scratchpad}'],
//     ]);

//   // Fetch tools from toolkit
//   // cast to any to avoid excessively deep type instantiation caused by zod@3.25
//   const tools = hederaAgentToolkit.getTools();

//   // Create the underlying agent
//   const agent = createToolCallingAgent({
//     llm,
//     tools,
//     prompt,
//   });

//   // In-memory conversation history
//   const memory = new BufferMemory({
//     memoryKey: 'chat_history',
//     inputKey: 'input',
//     outputKey: 'output',
//     returnMessages: true,
//   });

//   // Wrap everything in an executor that will maintain memory
//   const agentExecutor = new AgentExecutor({
//     agent,
//     tools,
//     memory,
//     returnIntermediateSteps: true,
//   });

//   return agentExecutor;
// }
