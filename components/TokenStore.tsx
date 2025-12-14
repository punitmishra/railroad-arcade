'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import {
  BitcoinIcon, EthereumIcon, CryptoWalletIcon, CreditCardIcon,
  CoinsIcon, ReceiptIcon, QRCodeIcon, CloseIcon, CheckCircleIcon,
  ShieldIcon, ZapIcon, SparklesIcon, GiftIcon, ArrowRightIcon,
  UserIcon
} from './icons';
import {
  TOKEN_PACKAGES,
  CRYPTO_PACKAGES,
  formatPrice,
  getTotalTokens,
  type TokenPackage
} from '@/lib/pricing';

interface Transaction {
  id: string;
  type: 'PURCHASE' | 'SPEND' | 'BONUS';
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  metadata?: {
    reason?: string;
    moduleId?: string;
    packageId?: string;
  };
}

interface TokenStoreProps {
  currentTokens: number;
  onPurchaseComplete?: (tokens: number) => void;
  onClose?: () => void;
}

export function TokenStore({ currentTokens, onPurchaseComplete, onClose }: TokenStoreProps) {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'packages' | 'crypto' | 'history'>('packages');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto' | 'paypal'>('card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const isAuthenticated = status === 'authenticated' && !!session?.user;

  // Fetch transaction history when history tab is active
  useEffect(() => {
    if (activeTab === 'history' && isAuthenticated) {
      fetchTransactions();
    }
  }, [activeTab, isAuthenticated]);

  const fetchTransactions = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/user/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleStripePayment = async (pkg: TokenPackage) => {
    setSelectedPackage(pkg.id);
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setProcessing(false);
      setSelectedPackage(null);
    }
  };

  const handlePayPalPayment = async (pkg: TokenPackage) => {
    setSelectedPackage(pkg.id);
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create PayPal order');
      }

      // Redirect to PayPal approval
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setProcessing(false);
      setSelectedPackage(null);
    }
  };

  const handleCryptoPayment = async (pkg: TokenPackage) => {
    setSelectedPackage(pkg.id);
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/coinbase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create crypto payment');
      }

      // Redirect to Coinbase Commerce
      if (data.hostedUrl) {
        window.location.href = data.hostedUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setProcessing(false);
      setSelectedPackage(null);
    }
  };

  const handlePurchase = async (pkg: TokenPackage) => {
    if (!isAuthenticated) {
      // Show login prompt
      return;
    }

    switch (paymentMethod) {
      case 'card':
        await handleStripePayment(pkg);
        break;
      case 'paypal':
        await handlePayPalPayment(pkg);
        break;
      case 'crypto':
        await handleCryptoPayment(pkg);
        break;
    }
  };

  const tabs = [
    { id: 'packages' as const, label: 'Token Packs', icon: <CoinsIcon size={18} /> },
    { id: 'crypto' as const, label: 'Pay with Crypto', icon: <BitcoinIcon size={18} /> },
    { id: 'history' as const, label: 'History', icon: <ReceiptIcon size={18} /> },
  ];

  // Login required prompt
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative w-full max-w-md rounded-3xl bg-[#0c0c14] border border-white/10 shadow-2xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <UserIcon size={40} className="text-amber-400" />
          </div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: 'Orbitron, system-ui, sans-serif' }}
          >
            Sign In Required
          </h2>
          <p className="text-gray-400 mb-6">
            Please sign in to purchase tokens and unlock features.
          </p>
          <button
            onClick={() => signIn()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all"
          >
            Sign In
          </button>
          <button
            onClick={onClose}
            className="w-full mt-3 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-medium hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-[#0c0c14] border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <CoinsIcon size={28} className="text-black" />
            </div>
            <div>
              <h2
                className="text-xl font-bold tracking-wide"
                style={{ fontFamily: 'Orbitron, system-ui, sans-serif' }}
              >
                Token Store
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">Purchase tokens to unlock features</p>
            </div>
          </div>

          {/* Current Balance */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wider">Your Balance</div>
              <div
                className="text-2xl font-bold text-amber-400"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                {currentTokens.toLocaleString()}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all"
            >
              <CloseIcon size={20} />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <div className="flex items-center gap-2">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-3 bg-black/20 border-b border-white/5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${activeTab === tab.id
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Token Packages */}
          {activeTab === 'packages' && (
            <div className="space-y-6">
              {/* Featured Banner */}
              <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-orange-600/20 border border-white/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/30 to-transparent rounded-full blur-3xl" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <SparklesIcon size={20} className="text-pink-400" />
                      <span className="text-sm font-semibold text-pink-400">WELCOME OFFER</span>
                    </div>
                    <h3 className="text-lg font-bold mb-1">Get Bonus Tokens!</h3>
                    <p className="text-sm text-gray-400">All packages include bonus tokens</p>
                  </div>
                  <div className="text-4xl">🎁</div>
                </div>
              </div>

              {/* Packages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {TOKEN_PACKAGES.map(pkg => (
                  <div
                    key={pkg.id}
                    className={`
                      relative p-5 rounded-2xl border transition-all cursor-pointer
                      ${selectedPackage === pkg.id
                        ? 'bg-amber-500/10 border-amber-500/50 scale-[1.02]'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20'
                      }
                      ${pkg.popular ? 'ring-2 ring-purple-500/50' : ''}
                    `}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    {/* Badge */}
                    {pkg.popular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500 text-white">
                        Most Popular
                      </div>
                    )}

                    {/* Token Amount */}
                    <div className="text-center mb-4 mt-2">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <CoinsIcon size={20} className="text-amber-400" />
                        <span
                          className="text-2xl font-bold text-amber-400"
                          style={{ fontFamily: 'JetBrains Mono, monospace' }}
                        >
                          {pkg.tokens.toLocaleString()}
                        </span>
                      </div>
                      {pkg.bonus > 0 && (
                        <div className="mt-2 text-sm text-emerald-400">
                          <span className="font-semibold">+{pkg.bonus}</span> bonus tokens
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="text-center">
                      <div className="text-3xl font-bold">{formatPrice(pkg.price)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getTotalTokens(pkg)} tokens total
                      </div>
                    </div>

                    {/* Buy Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(pkg);
                      }}
                      disabled={processing && selectedPackage === pkg.id}
                      className={`
                        w-full mt-4 py-3 rounded-xl font-semibold transition-all
                        ${pkg.popular
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-amber-500 text-black hover:bg-amber-400'
                        }
                        disabled:opacity-50
                      `}
                    >
                      {processing && selectedPackage === pkg.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : 'Buy Now'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Payment Methods */}
              <div className="mt-8 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Payment Method</h4>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'card' as const, label: 'Credit Card', icon: <CreditCardIcon size={20} />, provider: 'Stripe' },
                    { id: 'paypal' as const, label: 'PayPal', icon: <CryptoWalletIcon size={20} />, provider: 'PayPal' },
                    { id: 'crypto' as const, label: 'Cryptocurrency', icon: <BitcoinIcon size={20} />, provider: 'Coinbase' },
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all
                        ${paymentMethod === method.id
                          ? 'bg-white/10 border-white/30 text-white'
                          : 'bg-white/[0.02] border-white/10 text-gray-400 hover:bg-white/5'
                        }
                      `}
                    >
                      {method.icon}
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                  <ShieldIcon size={14} />
                  <span>Secure payment • 256-bit SSL encryption</span>
                </div>
              </div>
            </div>
          )}

          {/* Crypto Payments */}
          {activeTab === 'crypto' && (
            <div className="space-y-6">
              {/* Crypto Info */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-purple-500 flex items-center justify-center">
                    <BitcoinIcon size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Pay with Cryptocurrency</h4>
                    <p className="text-xs text-gray-400">Bitcoin, Ethereum, and more via Coinbase Commerce</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Select a token package below and choose crypto payment to be redirected to Coinbase Commerce
                  where you can pay with your preferred cryptocurrency.
                </p>
              </div>

              {/* Crypto Packages */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CRYPTO_PACKAGES.map(pkg => (
                  <div
                    key={pkg.id}
                    className={`
                      relative p-5 rounded-2xl border transition-all cursor-pointer
                      ${selectedPackage === pkg.id
                        ? 'bg-purple-500/10 border-purple-500/50 scale-[1.02]'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20'
                      }
                      ${pkg.popular ? 'ring-2 ring-purple-500/50' : ''}
                    `}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500 text-white">
                        Best Value
                      </div>
                    )}

                    <div className="text-center mb-4 mt-2">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <CoinsIcon size={20} className="text-amber-400" />
                        <span
                          className="text-2xl font-bold text-amber-400"
                          style={{ fontFamily: 'JetBrains Mono, monospace' }}
                        >
                          {pkg.tokens.toLocaleString()}
                        </span>
                      </div>
                      {pkg.bonus > 0 && (
                        <div className="mt-2 text-sm text-emerald-400">
                          <span className="font-semibold">+{pkg.bonus}</span> bonus tokens
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      <div className="text-3xl font-bold">{formatPrice(pkg.price)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getTotalTokens(pkg)} tokens total
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCryptoPayment(pkg);
                      }}
                      disabled={processing && selectedPackage === pkg.id}
                      className="w-full mt-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-purple-500 text-white hover:from-orange-400 hover:to-purple-400 transition-all disabled:opacity-50"
                    >
                      {processing && selectedPackage === pkg.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : 'Pay with Crypto'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Supported Cryptos */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                <h4 className="font-semibold mb-4">Supported Cryptocurrencies</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: 'Bitcoin', icon: <BitcoinIcon size={20} />, color: 'from-orange-500/30' },
                    { name: 'Ethereum', icon: <EthereumIcon size={20} />, color: 'from-purple-500/30' },
                    { name: 'USDC', icon: <CoinsIcon size={20} />, color: 'from-blue-500/30' },
                    { name: 'More...', icon: <CryptoWalletIcon size={20} />, color: 'from-green-500/30' },
                  ].map(crypto => (
                    <div
                      key={crypto.name}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center"
                    >
                      <div className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br ${crypto.color} to-transparent flex items-center justify-center`}>
                        {crypto.icon}
                      </div>
                      <div className="text-sm font-medium">{crypto.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <ZapIcon size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-200">
                    <strong>Fast & Secure</strong> – Crypto payments are processed via Coinbase Commerce with instant confirmation.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Transaction History</h3>
              </div>

              {loadingHistory ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <ReceiptIcon size={48} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">No transactions yet</p>
                  <p className="text-sm text-gray-500 mt-1">Your purchase and spending history will appear here</p>
                </div>
              ) : (
                transactions.map(tx => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center
                        ${tx.type === 'PURCHASE' ? 'bg-emerald-500/20 text-emerald-400' :
                          tx.type === 'SPEND' ? 'bg-red-500/20 text-red-400' :
                          'bg-purple-500/20 text-purple-400'
                        }
                      `}>
                        {tx.type === 'PURCHASE' ? <CoinsIcon size={20} /> :
                         tx.type === 'SPEND' ? <ArrowRightIcon size={20} /> :
                         <GiftIcon size={20} />}
                      </div>
                      <div>
                        <div className="font-medium">
                          {tx.type === 'PURCHASE' ? 'Token Purchase' :
                           tx.type === 'SPEND' ? (tx.metadata?.reason === 'module_unlock' ? `Unlocked ${tx.metadata.moduleId}` : 'Tokens Spent') :
                           'Bonus Tokens'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`
                        font-semibold
                        ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}
                      `}
                        style={{ fontFamily: 'JetBrains Mono, monospace' }}
                      >
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                      {tx.status === 'COMPLETED' && <CheckCircleIcon size={16} className="text-emerald-400" />}
                      {tx.status === 'PENDING' && <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />}
                      {tx.status === 'FAILED' && <span className="text-xs text-red-400">Failed</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
