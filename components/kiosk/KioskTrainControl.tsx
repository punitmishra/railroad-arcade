'use client';

import { useState, useEffect } from 'react';
import { useTrainControls, useEmergencyStop } from '@/hooks/useArcadeInput';

// ============================================
// Kiosk Train Control Component
// ============================================
// Large touch-friendly controls for arcade cabinet

interface KioskTrainControlProps {
  trainId: 1 | 2;
  trainName: string;
  color: string;
  onSpeedChange: (speed: number, direction: 'forward' | 'reverse') => void;
  onEmergencyStop: () => void;
  disabled?: boolean;
}

export function KioskTrainControl({
  trainId,
  trainName,
  color,
  onSpeedChange,
  onEmergencyStop,
  disabled = false,
}: KioskTrainControlProps) {
  const [localSpeed, setLocalSpeed] = useState(0);
  const [localDirection, setLocalDirection] = useState<'forward' | 'reverse'>('forward');

  // Use arcade input hook
  const trainState = useTrainControls(
    trainId,
    (state) => {
      if (!disabled) {
        setLocalSpeed(state.throttle);
        setLocalDirection(state.direction);
        onSpeedChange(state.throttle, state.direction);
      }
    },
    { enabled: !disabled }
  );

  // Touch controls for the UI
  const handleSpeedUp = () => {
    if (disabled) return;
    const newSpeed = Math.min(localSpeed + 10, 100);
    setLocalSpeed(newSpeed);
    onSpeedChange(newSpeed, localDirection);
  };

  const handleSpeedDown = () => {
    if (disabled) return;
    const newSpeed = Math.max(localSpeed - 10, 0);
    setLocalSpeed(newSpeed);
    onSpeedChange(newSpeed, localDirection);
  };

  const handleStop = () => {
    if (disabled) return;
    setLocalSpeed(0);
    onSpeedChange(0, localDirection);
  };

  const handleReverse = () => {
    if (disabled) return;
    const newDir = localDirection === 'forward' ? 'reverse' : 'forward';
    setLocalDirection(newDir);
    onSpeedChange(localSpeed, newDir);
  };

  return (
    <div
      className={`bg-[#0a0a0f]/90 rounded-2xl border-2 p-6 transition-all ${
        disabled ? 'opacity-50 border-gray-700' : `border-${color}-500/30`
      }`}
      style={{ borderColor: disabled ? undefined : color }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full animate-pulse"
            style={{ backgroundColor: localSpeed > 0 ? color : '#4b5563' }}
          />
          <span
            className="text-xl font-bold text-white"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            {trainName}
          </span>
        </div>
        <div className="text-right">
          <span className="text-3xl font-mono font-bold text-white">{localSpeed}%</span>
          <div className="text-xs text-gray-400 uppercase">{localDirection}</div>
        </div>
      </div>

      {/* Speed Bar */}
      <div className="mb-6">
        <div className="h-8 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-200 rounded-full"
            style={{
              width: `${localSpeed}%`,
              backgroundColor: color,
              boxShadow: localSpeed > 0 ? `0 0 20px ${color}40` : 'none',
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {/* Speed Down */}
        <button
          onClick={handleSpeedDown}
          disabled={disabled || localSpeed === 0}
          className="aspect-square rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center text-white text-3xl"
        >
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {/* Stop */}
        <button
          onClick={handleStop}
          disabled={disabled}
          className="aspect-square rounded-xl bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 border-2 border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center text-red-400 text-xl font-bold"
        >
          STOP
        </button>

        {/* Speed Up */}
        <button
          onClick={handleSpeedUp}
          disabled={disabled || localSpeed === 100}
          className="aspect-square rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center text-white text-3xl"
        >
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>

      {/* Direction Toggle */}
      <button
        onClick={handleReverse}
        disabled={disabled}
        className="w-full mt-3 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-gray-300"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span className="font-medium">Reverse Direction</span>
      </button>

      {/* Keyboard hints */}
      <div className="mt-4 pt-4 border-t border-gray-800 text-center text-xs text-gray-600">
        {trainId === 1 ? 'W/S: Speed • A: Reverse • D: Stop' : '↑/↓: Speed • ←: Reverse • →: Stop'}
      </div>
    </div>
  );
}

// ============================================
// Emergency Stop Button
// ============================================

interface EmergencyStopButtonProps {
  onStop: () => void;
  disabled?: boolean;
}

export function EmergencyStopButton({ onStop, disabled = false }: EmergencyStopButtonProps) {
  useEmergencyStop(onStop, { enabled: !disabled });

  return (
    <button
      onClick={onStop}
      disabled={disabled}
      className="w-full py-6 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col items-center justify-center gap-2 text-white border-4 border-red-400/50 shadow-lg shadow-red-500/20"
    >
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
      </svg>
      <span className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        EMERGENCY STOP
      </span>
      <span className="text-sm opacity-75">Press SPACE</span>
    </button>
  );
}

// ============================================
// Junction Toggle Button
// ============================================

interface JunctionToggleProps {
  junctionId: string;
  junctionName: string;
  currentState: 'left' | 'right' | 'straight';
  onToggle: () => void;
  keyHint?: string;
  disabled?: boolean;
}

export function JunctionToggle({
  junctionId,
  junctionName,
  currentState,
  onToggle,
  keyHint,
  disabled = false,
}: JunctionToggleProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="p-4 rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col items-center gap-2 text-white border border-gray-700"
    >
      <div className="flex items-center gap-2">
        <svg
          className={`w-8 h-8 transition-transform ${
            currentState === 'left' ? '-rotate-45' : currentState === 'right' ? 'rotate-45' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span className="font-medium">{junctionName}</span>
      </div>
      <span className={`text-sm px-2 py-0.5 rounded ${
        currentState === 'straight' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-amber-500/20 text-amber-400'
      }`}>
        {currentState.toUpperCase()}
      </span>
      {keyHint && <span className="text-xs text-gray-500">{keyHint}</span>}
    </button>
  );
}
