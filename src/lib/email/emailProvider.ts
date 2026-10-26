export interface EmailEnvelope {
  id: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  kind: string;
}

export interface EmailReceipt {
  messageId: string;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailEnvelope): Promise<EmailReceipt>;
}

export class EmailDeliveryError extends Error {
  constructor(
    public readonly code: 'retry' | 'quota' | 'configuration' | 'permanent' | 'unknown',
    public readonly retryAfterSeconds = 60,
  ) {
    super(`Email delivery: ${code}`);
  }
}

export class MockEmailProvider implements EmailProvider {
  readonly name = 'mock';
  async send(message: EmailEnvelope): Promise<EmailReceipt> {
    return { messageId: `mock:${message.id}` };
  }
}