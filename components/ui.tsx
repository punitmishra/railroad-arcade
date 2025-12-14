'use client';

import { ReactNode, ButtonHTMLAttributes, useState } from 'react';
import { ClockIcon, PlusIcon, LockIcon } from './icons';

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
