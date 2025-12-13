// Coinbase Commerce API Client

const COINBASE_API_URL = 'https://api.commerce.coinbase.com';

interface CoinbaseCharge {
  id: string;
  code: string;
  name: string;
  description: string;
  hosted_url: string;
  pricing: {
    local: { amount: string; currency: string };
    bitcoin?: { amount: string; currency: string };
    ethereum?: { amount: string; currency: string };
  };
  metadata: Record<string, string>;
  timeline: Array<{
    status: string;
    time: string;
  }>;
}

// Create a charge for crypto payment
export async function createCoinbaseCharge({
  name,
  description,
  amount,
  currency = 'USD',
  metadata,
  redirectUrl,
  cancelUrl,
}: {
  name: string;
  description: string;
  amount: number;
  currency?: string;
  metadata: Record<string, string>;
  redirectUrl: string;
  cancelUrl: string;
}): Promise<CoinbaseCharge> {
  const response = await fetch(`${COINBASE_API_URL}/charges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY!,
      'X-CC-Version': '2018-03-22',
    },
    body: JSON.stringify({
      name,
      description,
      pricing_type: 'fixed_price',
      local_price: {
        amount: amount.toFixed(2),
        currency,
      },
      metadata,
      redirect_url: redirectUrl,
      cancel_url: cancelUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Coinbase charge creation failed:', error);
    throw new Error('Failed to create Coinbase charge');
  }

  const data = await response.json();
  return data.data;
}

// Get charge details
export async function getCoinbaseCharge(chargeId: string): Promise<CoinbaseCharge> {
  const response = await fetch(`${COINBASE_API_URL}/charges/${chargeId}`, {
    headers: {
      'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY!,
      'X-CC-Version': '2018-03-22',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get Coinbase charge');
  }

  const data = await response.json();
  return data.data;
}

// Verify webhook signature
export function verifyCoinbaseWebhook(
  payload: string,
  signature: string
): boolean {
  const crypto = require('crypto');
  const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET!;

  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(payload);
  const computedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}

// Webhook event types
export type CoinbaseEventType =
  | 'charge:created'
  | 'charge:confirmed'
  | 'charge:failed'
  | 'charge:delayed'
  | 'charge:pending'
  | 'charge:resolved';

export interface CoinbaseWebhookEvent {
  id: string;
  type: CoinbaseEventType;
  api_version: string;
  created_at: string;
  data: CoinbaseCharge;
}
