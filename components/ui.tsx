'use client';

import { ReactNode, ButtonHTMLAttributes, useState, useEffect, createContext, useContext, useCallback } from 'react';
import { ClockIcon, PlusIcon, LockIcon, CloseIcon, KeyboardIcon } from './icons';

// ========================================
// ARCADE BUTTON
// ========================================
interface ArcadeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

export function ArcadeButton({
  variant = 'primary',
  size = 'md',
  children,
  loading,
  className = '',
  disabled,
  ...props
}: ArcadeButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2.5
    font-semibold tracking-wide
    rounded-xl border
    transition-all duration-200 ease-out
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.97]
  `;
  
  const variants = {
    primary: `
      bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600 
      text-gray-900 
      border-cyan-400/30
      shadow-lg shadow-cyan-500/25
      hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-0.5
    `,
    secondary: `
      bg-gradient-to-br from-purple-500 to-indigo-600 
      text-white 
      border-purple-400/30
      shadow-lg shadow-purple-500/25
      hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5
    `,
    danger: `
      bg-gradient-to-br from-red-500 to-red-700 
      text-white 
      border-red-400/30
      shadow-lg shadow-red-500/25
      hover:shadow-xl hover:shadow-red-500/40
    `,
    ghost: `
      bg-white/5 backdrop-blur-sm
      text-gray-300 
      border-white/10
      hover:bg-white/10 hover:text-white hover:border-white/20
    `,
    success: `
      bg-gradient-to-br from-emerald-500 to-green-600 
      text-gray-900 
      border-emerald-400/30
      shadow-lg shadow-emerald-500/25
      hover:shadow-xl hover:shadow-emerald-500/40
    `,
  };
  
  const sizes = {
    sm: 'px-3.5 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  );
}

// ========================================
// MODULE PANEL
// ========================================
interface ModulePanelProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  themeColor: string;
  children: ReactNode;
  locked?: boolean;
  onUnlock?: () => void;
  actions?: ReactNode;
}

export function ModulePanel({
  title,
  subtitle,
  icon,
  themeColor,
  children,
  locked = false,
  onUnlock,
  actions,
}: ModulePanelProps) {
  return (
    <div 
      className={`
        relative rounded-2xl overflow-hidden transition-all duration-300 ease-out
        bg-[#12121c] border
        ${locked 
          ? 'opacity-70 border-white/5' 
          : 'border-white/10 hover:border-white/20 hover:shadow-xl hover:-translate-y-1'
        }
      `}
      style={{ 
        boxShadow: locked ? 'none' : `0 8px 32px -8px ${themeColor}20`
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]"
        style={{ 
          background: `linear-gradient(135deg, ${themeColor}08 0%, transparent 100%)`
        }}
      >
        <div className="flex items-center gap-3.5">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ 
              backgroundColor: `${themeColor}15`,
              color: themeColor
            }}
          >
            {icon}
          </div>
          <div>
            <h3 
              className="font-semibold text-[15px] tracking-wide leading-tight"
              style={{ fontFamily: 'Orbitron, system-ui, sans-serif' }}
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      
      {/* Body */}
      <div className="p-5">
        {children}
      </div>
      
      {/* Lock overlay */}
      {locked && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] cursor-pointer z-10"
          onClick={onUnlock}
        >
          <div className="flex flex-col items-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <LockIcon size={24} className="text-amber-400" />
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">Unlock Module</div>
              <div className="text-xs text-amber-400 mt-0.5">Click to unlock</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// CONTROL BUTTON
// ========================================
interface ControlButtonProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  color?: 'yellow' | 'green' | 'red' | 'blue' | 'purple' | 'cyan' | 'default';
  onClick?: () => void;
  disabled?: boolean;
}

export function ControlButton({
  icon,
  label,
  active = false,
  color = 'default',
  onClick,
  disabled = false,
}: ControlButtonProps) {
  const colorConfig = {
    default: { active: 'bg-white/15 border-white/30 text-white', glow: '#ffffff' },
    yellow: { active: 'bg-amber-500/20 border-amber-500/40 text-amber-400', glow: '#f59e0b' },
    green: { active: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400', glow: '#22c55e' },
    red: { active: 'bg-red-500/20 border-red-500/40 text-red-400', glow: '#ef4444' },
    blue: { active: 'bg-blue-500/20 border-blue-500/40 text-blue-400', glow: '#3b82f6' },
    purple: { active: 'bg-purple-500/20 border-purple-500/40 text-purple-400', glow: '#a855f7' },
    cyan: { active: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400', glow: '#00f0ff' },
  };

  const style = colorConfig[color];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center gap-1.5
        min-w-[72px] px-3 py-3
        rounded-xl border
        transition-all duration-200 ease-out
        disabled:opacity-40 disabled:cursor-not-allowed
        active:scale-95
        ${active 
          ? style.active 
          : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-gray-300'
        }
      `}
      style={{
        boxShadow: active ? `0 0 20px ${style.glow}25` : 'none'
      }}
    >
      <span className="transition-transform duration-200">{icon}</span>
      <span className="text-[10px] font-medium tracking-wide uppercase leading-tight">{label}</span>
    </button>
  );
}

// ========================================
// TOKEN DISPLAY
// ========================================
interface TokenDisplayProps {
  amount: number;
  onAddTokens?: () => void;
}

export function TokenDisplay({ amount, onAddTokens }: TokenDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/25">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <span className="text-[10px] font-bold text-black">$</span>
        </div>
        <span 
          className="font-semibold text-amber-400 text-sm"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {amount.toLocaleString()}
        </span>
      </div>
      {onAddTokens && (
        <button
          onClick={onAddTokens}
          className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 hover:border-emerald-500/50 transition-all"
        >
          <PlusIcon size={14} />
        </button>
      )}
    </div>
  );
}

// ========================================
// SESSION TIMER
// ========================================
interface SessionTimerProps {
  seconds: number;
  maxSeconds?: number;
}

export function SessionTimer({ seconds }: SessionTimerProps) {
  const isWarning = seconds <= 30 && seconds > 0;
  const isExpired = seconds <= 0;
  
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`
        flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all duration-300
        ${isExpired 
          ? 'bg-red-500/10 border-red-500/30' 
          : isWarning 
            ? 'bg-orange-500/10 border-orange-500/30 animate-pulse' 
            : 'bg-cyan-500/10 border-cyan-500/30'
        }
      `}
    >
      <ClockIcon 
        size={16} 
        className={isExpired ? 'text-red-400' : isWarning ? 'text-orange-400' : 'text-cyan-400'} 
      />
      <span 
        className={`
          font-semibold text-base tracking-wider
          ${isExpired ? 'text-red-400' : isWarning ? 'text-orange-400' : 'text-cyan-400'}
        `}
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        {isExpired ? 'EXPIRED' : formatTime(seconds)}
      </span>
    </div>
  );
}

// ========================================
// TRACK SECTION INDICATOR
// ========================================
interface TrackSectionProps {
  id: string;
  occupied?: boolean;
  junction?: boolean;
  trainName?: string;
  speed?: number;
}

export function TrackSection({ id, occupied, junction, trainName, speed }: TrackSectionProps) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => occupied && setShowPopup(true)}
      onMouseLeave={() => setShowPopup(false)}
    >
      <div 
        className={`
          px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-default
          ${occupied 
            ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400' 
            : junction 
              ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400'
              : 'bg-white/[0.03] border-white/[0.08] text-gray-500'
          }
        `}
      >
        {id}
      </div>
      
      {/* Train popup */}
      {showPopup && trainName && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a24] border border-white/15 rounded-xl shadow-xl z-50 whitespace-nowrap">
          <div className="font-semibold text-sm">{trainName}</div>
          <div className="text-xs text-gray-400 mt-0.5">{speed} km/h</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1a1a24]" />
        </div>
      )}
    </div>
  );
}

// ========================================
// VEHICLE CARD
// ========================================
interface VehicleCardProps {
  name: string;
  icon: ReactNode;
  status: 'idle' | 'active' | 'deployed' | 'charging';
  themeColor?: string;
  onToggle?: () => void;
  onLights?: () => void;
  lightsOn?: boolean;
}

export function VehicleCard({ 
  name, 
  icon, 
  status, 
  themeColor = '#3b82f6',
  onToggle,
  onLights,
  lightsOn = false
}: VehicleCardProps) {
  const statusStyles = {
    idle: { label: 'Idle', dot: 'bg-gray-400', bg: 'bg-gray-500/10 text-gray-400' },
    active: { label: 'Active', dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 text-emerald-400' },
    deployed: { label: 'Deployed', dot: 'bg-amber-400 animate-pulse', bg: 'bg-amber-500/10 text-amber-400' },
    charging: { label: 'Charging', dot: 'bg-blue-400', bg: 'bg-blue-500/10 text-blue-400' },
  };

  const s = statusStyles[status];

  return (
    <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${themeColor}15`, color: themeColor }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate leading-tight">{name}</div>
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase mt-1 ${s.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={onToggle}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
            status === 'active' || status === 'deployed'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-white/5 text-gray-400 border border-white/[0.08] hover:bg-white/10'
          }`}
        >
          {status === 'active' || status === 'deployed' ? 'Stop' : 'Deploy'}
        </button>
        <button 
          onClick={onLights}
          className={`px-3 py-2 rounded-lg text-xs transition-all ${
            lightsOn 
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
              : 'bg-white/5 text-gray-500 border border-white/[0.08] hover:bg-white/10'
          }`}
        >
          💡
        </button>
      </div>
    </div>
  );
}

// ========================================
// STAT CARD
// ========================================
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({ label, value, icon, color = '#00f0ff' }: StatCardProps) {
  return (
    <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">{label}</span>
        {icon && <span style={{ color }}>{icon}</span>}
      </div>
      <div
        className="text-2xl font-semibold"
        style={{ fontFamily: 'JetBrains Mono, monospace', color }}
      >
        {value}
      </div>
    </div>
  );
}

// ========================================
// SKELETON LOADERS
// ========================================
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-white/10 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-xl bg-[#0c0c14] border border-white/10 p-4 ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function SkeletonRow({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-xl bg-[#0c0c14] border border-white/10 p-4 flex items-center gap-4 ${className}`}
      aria-hidden="true"
    >
      <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-5 w-16 ml-auto" />
        <Skeleton className="h-3 w-10 ml-auto" />
      </div>
    </div>
  );
}

export function SkeletonTrackLayout({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-xl bg-[#0c0c14] border border-white/10 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Track Area Skeleton */}
      <div className="aspect-[700/450] relative bg-gradient-to-b from-[#0a0a12] to-[#12121c] p-4">
        <svg viewBox="0 0 700 450" className="w-full h-full opacity-20">
          {/* Level 2 Track */}
          <ellipse
            cx="350" cy="130" rx="260" ry="80"
            stroke="currentColor"
            strokeWidth="20"
            fill="none"
            className="text-cyan-500/30 animate-pulse"
          />
          {/* Level 1 Track */}
          <ellipse
            cx="350" cy="340" rx="240" ry="70"
            stroke="currentColor"
            strokeWidth="20"
            fill="none"
            className="text-purple-500/30 animate-pulse"
          />
        </svg>
        {/* Loading Indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading track...</span>
          </div>
        </div>
      </div>
      {/* Control Panel Skeleton */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-2 w-full rounded-full mb-3" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonTelemetry({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-xl bg-[#0c0c14] border border-white/10 p-4 ${className}`}
      aria-hidden="true"
    >
      <Skeleton className="h-5 w-24 mb-4" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-lg bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Skeleton className="h-3 w-10 mb-1" />
                <Skeleton className="h-5 w-14" />
              </div>
              <div>
                <Skeleton className="h-3 w-10 mb-1" />
                <Skeleton className="h-5 w-14" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCameraFeed({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-xl bg-[#0c0c14] border border-white/10 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="aspect-video relative bg-gradient-to-br from-gray-900 to-black">
        {/* Scan Lines Effect */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />
        {/* Loading Indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-cyan-400/50 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500">Connecting...</span>
          </div>
        </div>
        {/* Camera Label */}
        <div className="absolute top-2 left-2">
          <Skeleton className="h-5 w-20 rounded" />
        </div>
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonControlPanel({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-xl bg-[#0c0c14] border border-white/10 p-4 ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <div className="space-y-4">
        {/* Speed Slider */}
        <div>
          <div className="flex justify-between mb-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        {/* Control Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
        {/* Stats Row */}
        <div className="flex justify-between pt-2 border-t border-white/10">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

// ========================================
// TOAST NOTIFICATION SYSTEM
// ========================================
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none" aria-live="polite">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(onClose, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  const styles = {
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    warning: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    info: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg animate-slide-in-right ${styles[toast.type]}`}
      role="alert"
    >
      <span className="text-lg">{icons[toast.type]}</span>
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Dismiss"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
}

// ========================================
// KEYBOARD SHORTCUTS MODAL
// ========================================
interface ShortcutGroup {
  title: string;
  shortcuts: { key: string; description: string }[];
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Train 1 (WASD)',
    shortcuts: [
      { key: 'W', description: 'Throttle up' },
      { key: 'S', description: 'Throttle down' },
      { key: 'A', description: 'Reverse' },
      { key: 'D', description: 'Stop' },
    ],
  },
  {
    title: 'Train 2 (Arrows)',
    shortcuts: [
      { key: '↑', description: 'Throttle up' },
      { key: '↓', description: 'Throttle down' },
      { key: '←', description: 'Reverse' },
      { key: '→', description: 'Stop' },
    ],
  },
  {
    title: 'Track Controls',
    shortcuts: [
      { key: '1-3', description: 'Toggle junctions' },
      { key: 'C', description: 'Toggle crossing' },
      { key: 'Space', description: 'Emergency stop' },
    ],
  },
  {
    title: 'Camera',
    shortcuts: [
      { key: '[ ]', description: 'Prev/Next camera' },
      { key: 'F1-F4', description: 'Camera 1-4' },
    ],
  },
  {
    title: 'Game',
    shortcuts: [
      { key: 'Enter', description: 'Start game' },
      { key: 'P', description: 'Pause' },
      { key: 'Tab', description: 'Select mode' },
      { key: '?', description: 'Show help' },
    ],
  },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#0c0c14] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <KeyboardIcon size={22} className="text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Close"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.shortcuts.map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between py-1">
                    <span className="text-xs text-gray-400">{shortcut.description}</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-white">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-gray-500 text-center">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-400 font-mono">?</kbd> anytime to toggle this help
        </p>
      </div>
    </div>
  );
}

// ========================================
// LOADING SPINNER
// ========================================
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div
      className={`${sizes[size]} border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

// ========================================
// CONFIRM DIALOG (Replaces browser confirm)
// ========================================
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-black',
    info: 'bg-cyan-500 hover:bg-cyan-600 text-black',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#0c0c14] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <h2 id="confirm-title" className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          {title}
        </h2>
        <p id="confirm-message" className="text-sm text-gray-400 mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors text-sm font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl transition-colors text-sm font-medium ${variantStyles[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
