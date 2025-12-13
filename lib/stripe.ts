import Stripe from 'stripe';

// Lazy-initialize Stripe server-side client
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return stripeInstance;
}

// For backwards compatibility
export const stripe = {
  get checkout() {
    return getStripe().checkout;
  },
  get webhooks() {
    return getStripe().webhooks;
  },
  get billingPortal() {
    return getStripe().billingPortal;
  },
};

// Token packages for purchase
export const TOKEN_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    tokens: 50,
    bonus: 0,
    price: 99, // cents
    popular: false,
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    tokens: 150,
    bonus: 15,
    price: 249,
    popular: true,
  },
  {
    id: 'value',
    name: 'Value Pack',
    tokens: 500,
    bonus: 75,
    price: 699,
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    tokens: 1000,
    bonus: 200,
    price: 1199,
    popular: false,
  },
];

export function getPackageById(id: string) {
  return TOKEN_PACKAGES.find((pkg) => pkg.id === id);
}

// Create Stripe checkout session
export async function createCheckoutSession({
  userId,
  userEmail,
  packageId,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  userEmail: string;
  packageId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const pkg = getPackageById(packageId);
  if (!pkg) {
    throw new Error('Invalid package');
  }

  const totalTokens = pkg.tokens + pkg.bonus;

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: userEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: pkg.name,
            description: `${totalTokens} tokens (${pkg.tokens} + ${pkg.bonus} bonus)`,
            images: [], // Add token icon URL if available
          },
          unit_amount: pkg.price,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      packageId,
      tokens: totalTokens.toString(),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

// Verify Stripe webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string
): Stripe.Event {
  return getStripe().webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

// Get customer portal URL
export async function getCustomerPortalUrl(
  customerId: string,
  returnUrl: string
) {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}
