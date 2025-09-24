import {
  Client,
  AccountId,
  PrivateKey,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TransferTransaction,
  Hbar,
  TopicId,
  TokenId,
  TokenAssociateTransaction,
  AccountBalanceQuery,
  Status,
} from '@hashgraph/sdk';

export interface EventMetadata {
  eventId: string;
  name: string;
  description: string;
  date: number;
  location: string;
  ticketPrice: number;
  maxTickets: number;
  eventAdmin: string;
  eventStatus: 'active' | 'cancelled' | 'completed';
  createdAt: number;
}

export interface TicketInfo {
  ticketId: string;
  eventId: string;
  owner: string;
  checkedIn: boolean;
  purchaseDate: number;
}

export class HederaEventService {
  private client: Client;
  private operatorAccountId: AccountId;
  private operatorPrivateKey: PrivateKey;

  constructor() {
    const operatorId = process.env.HEDERA_ACCOUNT_ID;
    const operatorKey = process.env.HEDERA_PRIVATE_KEY;
    if (!operatorId || !operatorKey) {
      throw new Error('Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in environment variables.');
    }
    this.client = Client.forTestnet();
    this.operatorAccountId = AccountId.fromString(operatorId);
    this.operatorPrivateKey = PrivateKey.fromString(operatorKey);
    this.client.setOperator(this.operatorAccountId, this.operatorPrivateKey);
  }

  /**
   * Collect a vendor fee in HBAR before event creation.
   * The vendor must sign this transaction.
   */
  async collectVendorFee(vendorAccountId: string, vendorPrivateKeyStr: string, feeAmount: number) {
    try {
      const vendorAccount = AccountId.fromString(vendorAccountId);
      const vendorPrivateKey = PrivateKey.fromString(vendorPrivateKeyStr);

      const transferTx = await new TransferTransaction()
        .addHbarTransfer(vendorAccount, new Hbar(-feeAmount))
        .addHbarTransfer(this.operatorAccountId, new Hbar(feeAmount))
        .freezeWith(this.client)
        .sign(vendorPrivateKey);

      const transferSubmit = await transferTx.execute(this.client);
      const transferReceipt = await transferSubmit.getReceipt(this.client);

      if (!transferReceipt.status || transferReceipt.status !== Status.Success) {
        throw new Error('Vendor fee payment failed');
      }
      return transferReceipt;
    } catch (error) {
      // Return a user-friendly error message
      throw new Error(
        `Vendor fee payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Create a new event after collecting the vendor fee.
   */
  async createEventWithFee(
    eventData: Omit<EventMetadata, 'eventId' | 'createdAt' | 'eventStatus'>,
    vendorAccountId: string,
    vendorPrivateKeyStr: string,
    feeAmount: number,
  ) {
    try {
      await this.collectVendorFee(vendorAccountId, vendorPrivateKeyStr, feeAmount);
      return await this.createEvent(eventData);
    } catch (error) {
      throw new Error(
        `Failed to create event (fee step): ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Create a new event using Hedera Consensus Service
   */
  async createEvent(eventData: Omit<EventMetadata, 'eventId' | 'createdAt' | 'eventStatus'>) {
    try {
      const topicCreateTx = new TopicCreateTransaction()
        .setAdminKey(this.operatorPrivateKey.publicKey)
        .setSubmitKey(this.operatorPrivateKey.publicKey)
        .setTopicMemo(`Event: ${eventData.name}`)
        .setMaxTransactionFee(new Hbar(5));

      const topicCreateResponse = await topicCreateTx.execute(this.client);
      const topicCreateReceipt = await topicCreateResponse.getReceipt(this.client);
      const topicId = topicCreateReceipt.topicId!;
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const eventMetadata: EventMetadata = {
        ...eventData,
        eventId: topicId.toString(),
        eventStatus: 'active',
        createdAt: Date.now(),
      };

      const metadataMessage = JSON.stringify({
        type: 'EVENT_CREATED',
        data: eventMetadata,
        timestamp: Date.now(),
      });

      const messageSubmitTx = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(metadataMessage)
        .setMaxTransactionFee(new Hbar(2));

      await messageSubmitTx.execute(this.client);

      return {
        eventId: topicId.toString(),
        topicId,
        transactionId: topicCreateResponse.transactionId.toString(),
        eventMetadata,
      };
    } catch (error) {
      throw new Error(
        `Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Create NFT tickets for an event
   */
  async createEventTickets(eventId: string, maxTickets: number, ticketPrice: number) {
    try {
      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName(`Event Ticket - ${eventId}`)
        .setTokenSymbol(`ETIX-${eventId.slice(-4)}`)
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(maxTickets)
        .setTreasuryAccountId(this.operatorAccountId)
        .setAdminKey(this.operatorPrivateKey.publicKey)
        .setSupplyKey(this.operatorPrivateKey.publicKey)
        .setInitialSupply(0)
        .setDecimals(0)
        .setMaxTransactionFee(new Hbar(20));

      const tokenCreateResponse = await tokenCreateTx.execute(this.client);
      const tokenCreateReceipt = await tokenCreateResponse.getReceipt(this.client);
      const tokenId = tokenCreateReceipt.tokenId!;
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const ticketCreationMessage = JSON.stringify({
        type: 'TICKETS_CREATED',
        data: {
          eventId,
          ticketTokenId: tokenId.toString(),
          maxTickets,
          ticketPrice,
        },
        timestamp: Date.now(),
      });

      const messageSubmitTx = new TopicMessageSubmitTransaction()
        .setTopicId(TopicId.fromString(eventId))
        .setMessage(ticketCreationMessage)
        .setMaxTransactionFee(new Hbar(2));

      await messageSubmitTx.execute(this.client);

      return {
        ticketTokenId: tokenId,
        transactionId: tokenCreateResponse.transactionId.toString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to create event tickets: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Purchase a ticket for an event
   */
  async purchaseTicket(
    eventId: string,
    ticketTokenId: string,
    buyerAccountId: string,
    buyerPrivateKeyStr: string,
    ticketPrice: number,
  ) {
    try {
      const tokenId = TokenId.fromString(ticketTokenId);
      const buyerAccount = AccountId.fromString(buyerAccountId);
      const buyerPrivateKey = PrivateKey.fromString(buyerPrivateKeyStr);

      // 1. Associate the buyer with the NFT token (if not already associated)
      const associateTx = await new TokenAssociateTransaction()
        .setAccountId(buyerAccount)
        .setTokenIds([tokenId])
        .freezeWith(this.client)
        .sign(buyerPrivateKey);

      await associateTx.execute(this.client);

      // 2. Mint new NFT ticket
      const mintTx = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([
          Buffer.from(
            JSON.stringify({
              eventId,
              ticketType: 'standard',
              mintedAt: Date.now(),
            }),
          ),
        ])
        .setMaxTransactionFee(new Hbar(10));

      const mintResponse = await mintTx.execute(this.client);
      const mintReceipt = await mintResponse.getReceipt(this.client);
      const serialNumber = mintReceipt.serials[0].toNumber();

      // 3. Transfer NFT to buyer
      const transferTx = await new TransferTransaction()
        .addNftTransfer(tokenId, serialNumber, this.operatorAccountId, buyerAccount)
        .freezeWith(this.client)
        .sign(this.operatorPrivateKey);

      await transferTx.execute(this.client);

      // 4. Log purchase to event topic
      const purchaseMessage = JSON.stringify({
        type: 'TICKET_PURCHASED',
        data: {
          eventId,
          ticketTokenId,
          ticketSerialNumber: serialNumber,
          buyer: buyerAccountId,
          price: ticketPrice,
          purchaseDate: Date.now(),
        },
        timestamp: Date.now(),
      });

      const messageSubmitTx = new TopicMessageSubmitTransaction()
        .setTopicId(TopicId.fromString(eventId))
        .setMessage(purchaseMessage)
        .setMaxTransactionFee(new Hbar(2));

      await messageSubmitTx.execute(this.client);

      return {
        ticketSerialNumber: serialNumber,
        transactionId: mintResponse.transactionId.toString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to purchase ticket: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Allow only the admin/operator to check the dApp's HBAR and token balances.
   */
  async getDappBalance(requestorAccountId: string) {
    try {
      if (requestorAccountId !== this.operatorAccountId.toString()) {
        // Access denied, return a clear error message
        throw new Error('Access denied: Only admin can check dApp balance');
      }
      const balance = await new AccountBalanceQuery()
        .setAccountId(this.operatorAccountId)
        .execute(this.client);

      return {
        hbars: balance.hbars.toString(),
        tokens: balance.tokens ? Array.from(balance.tokens._map.entries()) : [],
      };
    } catch (error) {
      throw new Error(
        `Failed to get dApp balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  close() {
    this.client.close();
  }
}
