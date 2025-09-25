import { z } from 'zod';
import { DynamicStructuredTool } from 'langchain/tools';
import { HederaEventService, EventMetadata } from '@/lib/hedera-event-service';

// Input schemas for each tool
const createEventSchema = z.object({
  name: z.string().describe('Event name'),
  description: z.string().describe('Event description'),
  date: z.string().describe('Event date (ISO string or timestamp)'),
  location: z.string().describe('Event location'),
  ticketPrice: z.number().describe('Ticket price in HBAR'),
  maxTickets: z.number().describe('Maximum number of tickets'),
  eventAdmin: z.string().describe('Event administrator account ID'),
});

const createTicketsSchema = z.object({
  eventId: z.string().describe('Event ID (topic ID)'),
  maxTickets: z.number().describe('Maximum number of tickets to create'),
  ticketPrice: z.number().describe('Price per ticket in HBAR'),
});

const purchaseTicketSchema = z.object({
  eventId: z.string().describe('Event ID (topic ID)'),
  ticketTokenId: z.string().describe('Ticket token ID'),
  buyerAccountId: z.string().describe('Buyer account ID'),
  buyerPrivateKey: z.string().describe('Buyer private key'),
  ticketPrice: z.number().describe('Ticket price in HBAR'),
});

const getDappBalanceSchema = z.object({
  requestorAccountId: z.string().describe('Account ID requesting balance check'),
});

export function createEventServiceTools(): DynamicStructuredTool[] {
  const eventService = new HederaEventService();

  return [
    // Create Event Tool
    new DynamicStructuredTool({
      name: 'create_event_service',
      description: 'Create a new event using HederaEventService with complete workflow including topic creation and metadata storage',
      schema: createEventSchema,
      func: async (input: z.infer<typeof createEventSchema>): Promise<string> => {
        try {
          const eventData: Omit<EventMetadata, 'eventId' | 'createdAt' | 'eventStatus'> = {
            name: input.name,
            description: input.description,
            date: new Date(input.date).getTime(),
            location: input.location,
            ticketPrice: input.ticketPrice,
            maxTickets: input.maxTickets,
            eventAdmin: input.eventAdmin,
          };

          const result = await eventService.createEvent(eventData);
          
          return JSON.stringify({
            success: true,
            message: `Event "${input.name}" created successfully!`,
            eventId: result.eventId,
            topicId: result.topicId.toString(),
            transactionId: result.transactionId,
            eventMetadata: result.eventMetadata,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create event',
          });
        }
      },
    }),

    // Create Event with Fee Tool
    new DynamicStructuredTool({
      name: 'create_event_with_fee_service',
      description: 'Create a new event with vendor fee collection using HederaEventService',
      schema: createEventSchema.extend({
        vendorAccountId: z.string().describe('Vendor account ID for fee payment'),
        vendorPrivateKey: z.string().describe('Vendor private key'),
        feeAmount: z.number().describe('Fee amount in HBAR'),
      }),
      func: async (input: z.infer<typeof createEventSchema> & { vendorAccountId: string; vendorPrivateKey: string; feeAmount: number }): Promise<string> => {
        try {
          const eventData: Omit<EventMetadata, 'eventId' | 'createdAt' | 'eventStatus'> = {
            name: input.name,
            description: input.description,
            date: new Date(input.date).getTime(),
            location: input.location,
            ticketPrice: input.ticketPrice,
            maxTickets: input.maxTickets,
            eventAdmin: input.eventAdmin,
          };

          const result = await eventService.createEventWithFee(
            eventData,
            input.vendorAccountId,
            input.vendorPrivateKey,
            input.feeAmount
          );
          
          return JSON.stringify({
            success: true,
            message: `Event "${input.name}" created with fee collection!`,
            eventId: result.eventId,
            topicId: result.topicId.toString(),
            transactionId: result.transactionId,
            eventMetadata: result.eventMetadata,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create event with fee',
          });
        }
      },
    }),

    // Create Event Tickets Tool
    new DynamicStructuredTool({
      name: 'create_event_tickets_service',
      description: 'Create NFT tickets for an event using HederaEventService',
      schema: createTicketsSchema,
      func: async (input: z.infer<typeof createTicketsSchema>): Promise<string> => {
        try {
          const result = await eventService.createEventTickets(
            input.eventId,
            input.maxTickets,
            input.ticketPrice
          );
          
          return JSON.stringify({
            success: true,
            message: `Created ${input.maxTickets} NFT tickets for event ${input.eventId}`,
            ticketTokenId: result.ticketTokenId.toString(),
            transactionId: result.transactionId,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create event tickets',
          });
        }
      },
    }),

    // Purchase Ticket Tool
    new DynamicStructuredTool({
      name: 'purchase_ticket_service',
      description: 'Purchase a ticket for an event using HederaEventService with complete workflow',
      schema: purchaseTicketSchema,
      func: async (input: z.infer<typeof purchaseTicketSchema>): Promise<string> => {
        try {
          const result = await eventService.purchaseTicket(
            input.eventId,
            input.ticketTokenId,
            input.buyerAccountId,
            input.buyerPrivateKey,
            input.ticketPrice
          );
          
          return JSON.stringify({
            success: true,
            message: `Ticket purchased successfully! Serial number: ${result.ticketSerialNumber}`,
            ticketSerialNumber: result.ticketSerialNumber,
            transactionId: result.transactionId,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to purchase ticket',
          });
        }
      },
    }),

    // Get DApp Balance Tool
    new DynamicStructuredTool({
      name: 'get_dapp_balance_service',
      description: 'Get the dApp balance (admin only) using HederaEventService',
      schema: getDappBalanceSchema,
      func: async (input: z.infer<typeof getDappBalanceSchema>): Promise<string> => {
        try {
          const result = await eventService.getDappBalance(input.requestorAccountId);
          
          return JSON.stringify({
            success: true,
            message: 'DApp balance retrieved successfully',
            balance: result,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get dApp balance',
          });
        }
      },
    }),
  ];
}

// Cleanup function to close the event service
export function closeEventService(): void {
  // This will be called when the agent session ends
  const eventService = new HederaEventService();
  eventService.close();
}
