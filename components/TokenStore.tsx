'use client';

import { useState } from 'react';
import { 
  BitcoinIcon, EthereumIcon, CryptoWalletIcon, CreditCardIcon, 
  CoinsIcon, ReceiptIcon, QRCodeIcon, CloseIcon, CheckCircleIcon,
  ShieldIcon, ZapIcon, SparklesIcon, GiftIcon, ArrowRightIcon
} from './icons';

interface TokenPackage {
  id: string;
  tokens: number;
  bonus: number;
  price: number;
  currency: 'usd' | 'btc' | 'eth';
  popular?: boolean;
  bestValue?: boolean;
}

interface Transaction {
  id: string;
  type: 'purchase' | 'spend' | 'bonus';
  amount: number;
  description: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

interface TokenStoreProps {
  currentTokens: number;
  onPurchase?: (tokens: number, cost: number) => void;
  onClose?: () => void;
}

export function TokenStore({ currentTokens, onPurchase, onClose }: TokenStoreProps) {
  const [activeTab, setActiveTab] = useState<'packages' | 'crypto' | 'history'>('packages');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto' | 'paypal'>('card');
  const [showQR, setShowQR] = useState(false);
  const [processing, setProcessing] = useState(false);

  const packages: TokenPackage[] = [
    { id: 'starter', tokens: 50, bonus: 0, price: 0.99, currency: 'usd' },
    { id: 'popular', tokens: 150, bonus: 15, price: 2.49, currency: 'usd', popular: true },
    { id: 'value', tokens: 350, bonus: 50, price: 4.99, currency: 'usd', bestValue: true },
    { id: 'mega', tokens: 800, bonus: 150, price: 9.99, currency: 'usd' },
    { id: 'ultimate', tokens: 2000, bonus: 500, price: 19.99, currency: 'usd' },
  ];

  const cryptoPackages: TokenPackage[] = [
    { id: 'btc-small', tokens: 200, bonus: 40, price: 0.0001, currency: 'btc' },
    { id: 'btc-medium', tokens: 500, bonus: 100, price: 0.00025, currency: 'btc' },
    { id: 'btc-large', tokens: 1200, bonus: 300, price: 0.0005, currency: 'btc' },
    { id: 'eth-small', tokens: 200, bonus: 40, price: 0.002, currency: 'eth' },
    { id: 'eth-medium', tokens: 500, bonus: 100, price: 0.005, currency: 'eth' },
    { id: 'eth-large', tokens: 1200, bonus: 300, price: 0.01, currency: 'eth' },
  ];

  const transactions: Transaction[] = [
    { id: '1', type: 'purchase', amount: 350, description: 'Value Pack Purchase', timestamp: new Date(Date.now() - 86400000), status: 'completed' },
    { id: '2', type: 'spend', amount: -25, description: 'Police Station Unlock', timestamp: new Date(Date.now() - 43200000), status: 'completed' },
    { id: '3', type: 'bonus', amount: 50, description: 'Daily Login Bonus', timestamp: new Date(Date.now() - 3600000), status: 'completed' },
    { id: '4', type: 'spend', amount: -15, description: 'Café Module Unlock', timestamp: new Date(Date.now() - 1800000), status: 'completed' },
  ];

  const handlePurchase = async (pkg: TokenPackage) => {
    setSelectedPackage(pkg.id);
    setProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onPurchase?.(pkg.tokens + pkg.bonus, pkg.price);
    setProcessing(false);
    setSelectedPackage(null);
  };

  const tabs = [
    { id: 'packages' as const, label: 'Token Packs', icon: <CoinsIcon size={18} /> },
    { id: 'crypto' as const, label: 'Pay with Crypto', icon: <BitcoinIcon size={18} /> },
    { id: 'history' as const, label: 'History', icon: <ReceiptIcon size={18} /> },
  ];

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
                      <span className="text-sm font-semibold text-pink-400">LIMITED TIME</span>
                    </div>
                    <h3 className="text-lg font-bold mb-1">Double Token Weekend!</h3>
                    <p className="text-sm text-gray-400">Get 2x bonus tokens on all purchases until Sunday</p>
                  </div>
                  <div className="text-4xl">🎉</div>
                </div>
              </div>

              {/* Packages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packages.map(pkg => (
                  <div 
                    key={pkg.id}
                    className={`
                      relative p-5 rounded-2xl border transition-all cursor-pointer
                      ${selectedPackage === pkg.id 
                        ? 'bg-amber-500/10 border-amber-500/50 scale-[1.02]' 
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20'
                      }
                      ${pkg.bestValue ? 'ring-2 ring-emerald-500/50' : ''}
                      ${pkg.popular ? 'ring-2 ring-purple-500/50' : ''}
                    `}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    {/* Badge */}
                    {(pkg.popular || pkg.bestValue) && (
                      <div className={`
                        absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${pkg.bestValue ? 'bg-emerald-500 text-black' : 'bg-purple-500 text-white'}
                      `}>
                        {pkg.bestValue ? '⭐ Best Value' : '🔥 Popular'}
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
                      <div className="text-3xl font-bold">${pkg.price}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        ${((pkg.price / (pkg.tokens + pkg.bonus)) * 100).toFixed(2)} per 100 tokens
                      </div>
                    </div>

                    {/* Buy Button */}
                    <button
                      onClick={() => handlePurchase(pkg)}
                      disabled={processing && selectedPackage === pkg.id}
                      className={`
                        w-full mt-4 py-3 rounded-xl font-semibold transition-all
                        ${pkg.bestValue 
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-black' 
                          : pkg.popular 
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
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Payment Methods</h4>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'card', label: 'Credit Card', icon: <CreditCardIcon size={20} /> },
                    { id: 'crypto', label: 'Cryptocurrency', icon: <BitcoinIcon size={20} /> },
                    { id: 'paypal', label: 'PayPal', icon: <CryptoWalletIcon size={20} /> },
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as typeof paymentMethod)}
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
                  <span>Secure payment powered by Stripe • 256-bit SSL encryption</span>
                </div>
              </div>
            </div>
          )}

          {/* Crypto Payments */}
          {activeTab === 'crypto' && (
            <div className="space-y-6">
              {/* Crypto Wallets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bitcoin */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
                      <BitcoinIcon size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Bitcoin</h4>
                      <p className="text-xs text-gray-400">Pay with BTC</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {cryptoPackages.filter(p => p.currency === 'btc').map(pkg => (
                      <button
                        key={pkg.id}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/10 hover:bg-black/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-amber-400 font-semibold">{pkg.tokens}</span>
                          <span className="text-xs text-emerald-400">+{pkg.bonus}</span>
                        </div>
                        <span className="text-sm font-mono">{pkg.price} BTC</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ethereum */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                      <EthereumIcon size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Ethereum</h4>
                      <p className="text-xs text-gray-400">Pay with ETH</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {cryptoPackages.filter(p => p.currency === 'eth').map(pkg => (
                      <button
                        key={pkg.id}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/10 hover:bg-black/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-amber-400 font-semibold">{pkg.tokens}</span>
                          <span className="text-xs text-emerald-400">+{pkg.bonus}</span>
                        </div>
                        <span className="text-sm font-mono">{pkg.price} ETH</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* QR Code Payment */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold">Scan to Pay</h4>
                    <p className="text-sm text-gray-400">Scan QR code with your wallet app</p>
                  </div>
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <QRCodeIcon size={18} />
                    <span className="text-sm">{showQR ? 'Hide' : 'Show'} QR</span>
                  </button>
                </div>
                
                {showQR && (
                  <div className="flex justify-center p-6">
                    <div className="w-48 h-48 bg-white rounded-2xl p-3 flex items-center justify-center">
                      <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                        <QRCodeIcon size={80} className="text-gray-600" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-3">
                    <ZapIcon size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-200">
                      <strong>Lightning Network Enabled</strong> – Get instant token delivery with near-zero fees using Bitcoin Lightning!
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet Connect */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                <h4 className="font-semibold mb-4">Connect Wallet</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['MetaMask', 'Coinbase', 'Trust Wallet', 'WalletConnect'].map(wallet => (
                    <button
                      key={wallet}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all text-center"
                    >
                      <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
                        <CryptoWalletIcon size={20} />
                      </div>
                      <div className="text-sm font-medium">{wallet}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transaction History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Recent Transactions</h3>
                <button className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                  Export CSV
                </button>
              </div>
              
              {transactions.map(tx => (
                <div 
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center
                      ${tx.type === 'purchase' ? 'bg-emerald-500/20 text-emerald-400' : 
                        tx.type === 'spend' ? 'bg-red-500/20 text-red-400' : 
                        'bg-purple-500/20 text-purple-400'
                      }
                    `}>
                      {tx.type === 'purchase' ? <CoinsIcon size={20} /> :
                       tx.type === 'spend' ? <ArrowRightIcon size={20} /> :
                       <GiftIcon size={20} />}
                    </div>
                    <div>
                      <div className="font-medium">{tx.description}</div>
                      <div className="text-xs text-gray-500">
                        {tx.timestamp.toLocaleDateString()} at {tx.timestamp.toLocaleTimeString()}
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
                    <CheckCircleIcon size={16} className="text-emerald-400" />
                  </div>
                </div>
              ))}

              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Showing last 30 days</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
