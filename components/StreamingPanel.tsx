'use client';

import { useState, useEffect, useRef } from 'react';
import {
  CameraIcon, UsersIcon, HeartIcon, MessageIcon, ShareIcon,
  SettingsIcon, PlayIcon, PauseIcon, MaximizeIcon, VolumeIcon,
  GiftIcon, SparklesIcon, ZapIcon, SendIcon, CloseIcon,
  WifiIcon, ActivityIcon, CoinsIcon
} from './icons';

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  message: string;
  timestamp: Date;
  isGift?: boolean;
  giftAmount?: number;
  isModerator?: boolean;
  isStreamer?: boolean;
}

interface Viewer {
  id: string;
  name: string;
  avatar: string;
  watching: boolean;
}

export function StreamingPanel() {
  const [isLive, setIsLive] = useState(true);
  const [viewerCount, setViewerCount] = useState(127);
  const [likeCount, setLikeCount] = useState(1432);
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [streamQuality, setStreamQuality] = useState<'1080p' | '720p' | '480p'>('1080p');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'TrainFan2024', avatar: '🚂', message: 'Wow the Valley Runner looks amazing!', timestamp: new Date(Date.now() - 120000) },
    { id: '2', user: 'ModelRailroads', avatar: '🛤️', message: 'Can we see level 1?', timestamp: new Date(Date.now() - 90000), isModerator: true },
    { id: '3', user: 'HobbyCentral', avatar: '🎮', message: 'Nice junction switch!', timestamp: new Date(Date.now() - 60000) },
    { id: '4', user: 'TunnelKing', avatar: '🕳️', message: 'Donated 50 tokens', timestamp: new Date(Date.now() - 45000), isGift: true, giftAmount: 50 },
    { id: '5', user: 'RailwayExpert', avatar: '🚃', message: 'Great scenery work', timestamp: new Date(Date.now() - 30000) },
    { id: '6', user: 'Conductor_Jim', avatar: '👷', message: 'How fast is the Mountain Express?', timestamp: new Date(Date.now() - 15000) },
  ]);

  const recentDonations = [
    { user: 'TunnelKing', amount: 50, message: 'Love the layout!' },
    { user: 'TrainMaster99', amount: 100, message: 'Keep up the great work!' },
    { user: 'HoScale_Pro', amount: 25, message: '' },
  ];

  // Simulate viewer count fluctuation
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(100, prev + change);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate incoming messages
  useEffect(() => {
    if (!isLive) return;

    const botMessages = [
      'The crossing lights are so realistic!',
      'Can you zoom in on the station?',
      'What scale is this?',
      'Those tunnels are awesome',
      'Switch to level 2 please!',
      'How long did this take to build?',
      'Love the night mode!',
      'Great camera work!',
    ];

    const botUsers = [
      { name: 'TrainLover88', avatar: '🚂' },
      { name: 'ModelMaker', avatar: '🔧' },
      { name: 'HoScaleHero', avatar: '🦸' },
      { name: 'RailroadFan', avatar: '🛤️' },
      { name: 'Choo_Choo', avatar: '💨' },
    ];

    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const user = botUsers[Math.floor(Math.random() * botUsers.length)];
        const msg = botMessages[Math.floor(Math.random() * botMessages.length)];
        
        setMessages(prev => [...prev.slice(-50), {
          id: Date.now().toString(),
          user: user.name,
          avatar: user.avatar,
          message: msg,
          timestamp: new Date(),
        }]);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isLive]);

  const sendMessage = () => {
    if (!chatMessage.trim()) return;
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: 'You',
      avatar: '👤',
      message: chatMessage,
      timestamp: new Date(),
      isStreamer: true,
    }]);
    setChatMessage('');
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-[#0c0c14] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-red-500/[0.08] to-pink-500/[0.08] border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center border border-red-500/20">
              <CameraIcon size={22} className="text-red-400" />
            </div>
            {isLive && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
            )}
          </div>
          <div>
            <h3 
              className="font-semibold text-[15px] tracking-wide flex items-center gap-2"
              style={{ fontFamily: 'Orbitron, system-ui, sans-serif' }}
            >
              Railroad Arcade Live
              {isLive && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                  LIVE
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">HO Scale Model Railroad Stream</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Viewer Count */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
            <UsersIcon size={14} className="text-red-400" />
            <span className="text-sm font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {viewerCount.toLocaleString()}
            </span>
          </div>

          {/* Like Count */}
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              isLiked ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-gray-400 hover:text-pink-400'
            }`}
          >
            <HeartIcon size={14} className={isLiked ? 'fill-current' : ''} />
            <span className="text-sm font-medium">{(likeCount / 1000).toFixed(1)}k</span>
          </button>

          {/* Share */}
          <button className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-all">
            <ShareIcon size={18} />
          </button>

          {/* Toggle Chat */}
          <button 
            onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-lg transition-all ${showChat ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400'}`}
          >
            <MessageIcon size={18} />
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Video Player */}
        <div className={`flex-1 ${showChat ? '' : 'w-full'}`}>
          {/* Video Area */}
          <div className="relative aspect-video bg-black">
            {/* Placeholder Video */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <div className="text-center">
                <CameraIcon size={64} className="text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Live Stream</p>
                <p className="text-xs text-gray-600 mt-1">Camera feed will appear when streaming</p>
              </div>
            </div>

            {/* Live Indicator */}
            {isLive && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/90 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-bold text-white">LIVE</span>
              </div>
            )}

            {/* Quality Badge */}
            <div className="absolute top-4 right-4 px-2 py-1 rounded bg-black/60 text-[10px] font-mono text-white">
              {streamQuality}
            </div>

            {/* Recent Donation Animation */}
            <div className="absolute bottom-20 left-4 right-4">
              {recentDonations.slice(0, 1).map((donation, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 backdrop-blur-sm animate-pulse"
                >
                  <GiftIcon size={20} className="text-amber-400" />
                  <div>
                    <span className="font-semibold text-amber-400">{donation.user}</span>
                    <span className="text-white mx-2">donated</span>
                    <span className="font-bold text-amber-400">{donation.amount} tokens</span>
                  </div>
                  {donation.message && (
                    <span className="text-sm text-gray-300 ml-2">"{donation.message}"</span>
                  )}
                </div>
              ))}
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsLive(!isLive)}
                    className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                  >
                    {isLive ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
                  </button>
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2 rounded-lg transition-all ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    <VolumeIcon size={18} />
                  </button>
                  <div className="text-xs text-white/80 font-mono">
                    {isLive ? 'LIVE' : 'PAUSED'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Quality Selector */}
                  <select
                    value={streamQuality}
                    onChange={(e) => setStreamQuality(e.target.value as typeof streamQuality)}
                    className="px-2 py-1 rounded bg-white/10 text-xs text-white outline-none"
                  >
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                    <option value="480p">480p</option>
                  </select>
                  <button className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all">
                    <MaximizeIcon size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stream Info */}
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">🚂 Live Model Railroad Session - All 3 Trains Running!</h4>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <WifiIcon size={12} className="text-emerald-400" />
                    Connected
                  </span>
                  <span>Streaming for 2h 34m</span>
                  <span>{viewerCount} watching now</span>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold text-sm hover:opacity-90 transition-all">
                <GiftIcon size={16} />
                Donate
              </button>
            </div>
          </div>

          {/* Donation Tiers */}
          <div className="p-4">
            <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Support the Stream</h5>
            <div className="grid grid-cols-4 gap-2">
              {[
                { amount: 10, icon: '☕', label: 'Coffee' },
                { amount: 25, icon: '🎫', label: 'Ticket' },
                { amount: 50, icon: '🚂', label: 'Train' },
                { amount: 100, icon: '⭐', label: 'VIP' },
              ].map((tier) => (
                <button
                  key={tier.amount}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-amber-500/10 hover:border-amber-500/30 transition-all text-center group"
                >
                  <div className="text-2xl mb-1">{tier.icon}</div>
                  <div className="text-amber-400 font-semibold text-sm">{tier.amount}</div>
                  <div className="text-[10px] text-gray-500 group-hover:text-gray-400">{tier.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 border-l border-white/[0.06] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Live Chat</h4>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <ActivityIcon size={12} className="text-emerald-400" />
                  {messages.length} messages
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[400px]">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`
                    flex gap-2 text-sm
                    ${msg.isGift ? 'p-2 rounded-lg bg-amber-500/10 border border-amber-500/20' : ''}
                  `}
                >
                  <span className="text-lg flex-shrink-0">{msg.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium truncate ${
                        msg.isStreamer ? 'text-red-400' : 
                        msg.isModerator ? 'text-emerald-400' : 
                        msg.isGift ? 'text-amber-400' : 
                        'text-cyan-400'
                      }`}>
                        {msg.user}
                      </span>
                      {msg.isModerator && <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400">MOD</span>}
                      {msg.isStreamer && <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/20 text-red-400">HOST</span>}
                      <span className="text-[10px] text-gray-600">{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className={`text-gray-300 break-words ${msg.isGift ? 'text-amber-200' : ''}`}>
                      {msg.isGift ? (
                        <span className="flex items-center gap-1">
                          <GiftIcon size={12} className="text-amber-400" />
                          Donated {msg.giftAmount} tokens! 🎉
                        </span>
                      ) : msg.message}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-white/[0.06]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Send a message..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/50"
                />
                <button 
                  onClick={sendMessage}
                  disabled={!chatMessage.trim()}
                  className="p-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-400 transition-all disabled:opacity-50 disabled:hover:bg-cyan-500"
                >
                  <SendIcon size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button className="text-lg hover:scale-110 transition-transform">😊</button>
                <button className="text-lg hover:scale-110 transition-transform">🚂</button>
                <button className="text-lg hover:scale-110 transition-transform">❤️</button>
                <button className="text-lg hover:scale-110 transition-transform">🎉</button>
                <button className="text-lg hover:scale-110 transition-transform">👏</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
