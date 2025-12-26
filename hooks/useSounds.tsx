'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { haptic, isNative } from '@/lib/native';

// ========================================
// SOUND TYPES
// ========================================
export type SoundType =
  | 'click'
  | 'success'
  | 'error'
  | 'warning'
  | 'notification'
  | 'train_start'
  | 'train_stop'
  | 'train_horn'
  | 'junction'
  | 'crossing'
  | 'emergency'
  | 'coin'
  | 'unlock'
  | 'achievement'
  | 'game_start'
  | 'game_over'
  | 'score'
  | 'camera';

// ========================================
// AUDIO CONTEXT SINGLETON
// ========================================
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      return null;
    }
  }

  // Resume if suspended (required for autoplay policies)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
}

// ========================================
// SOUND GENERATORS (Synthesized arcade sounds)
// ========================================
function playClick(ctx: AudioContext, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
}

function playSuccess(ctx: AudioContext, volume: number) {
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);

    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
    gain.gain.linearRampToValueAtTime(volume * 0.2, ctx.currentTime + i * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.15);

    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.15);
  });
}

function playError(ctx: AudioContext, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);

  gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
}

function playWarning(ctx: AudioContext, volume: number) {
  [0, 0.15].forEach(delay => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime + delay);

    gain.gain.setValueAtTime(volume * 0.2, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.1);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.1);
  });
}

function playNotification(ctx: AudioContext, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
}

function playTrainStart(ctx: AudioContext, volume: number) {
  // Chug-chug sound
  [0, 0.15, 0.3].forEach((delay, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80 + i * 10, ctx.currentTime + delay);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, ctx.currentTime + delay);

    gain.gain.setValueAtTime(volume * 0.2, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.1);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.1);
  });
}

function playTrainStop(ctx: AudioContext, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

  gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

function playTrainHorn(ctx: AudioContext, volume: number) {
  const frequencies = [277.18, 349.23]; // C#4, F4 (train horn chord)

  frequencies.forEach(freq => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume * 0.15, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  });
}

function playJunction(ctx: AudioContext, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'square';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.setValueAtTime(800, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

function playCrossing(ctx: AudioContext, volume: number) {
  // Bell-like sound
  [0, 0.2].forEach(delay => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime + delay);

    gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.15);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.15);
  });
}

function playEmergency(ctx: AudioContext, volume: number) {
  // Alarm sound
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();

  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(800, ctx.currentTime);

  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(8, ctx.currentTime);
  lfoGain.gain.setValueAtTime(200, ctx.currentTime);

  gain.gain.setValueAtTime(volume * 0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

  lfo.start(ctx.currentTime);
  osc.start(ctx.currentTime);
  lfo.stop(ctx.currentTime + 0.5);
  osc.stop(ctx.currentTime + 0.5);
}

function playCoin(ctx: AudioContext, volume: number) {
  const notes = [987.77, 1318.51]; // B5, E6 (coin sound)

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

    gain.gain.setValueAtTime(volume * 0.2, ctx.currentTime + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.2);

    osc.start(ctx.currentTime + i * 0.08);
    osc.stop(ctx.currentTime + i * 0.08 + 0.2);
  });
}

function playUnlock(ctx: AudioContext, volume: number) {
  const notes = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

    gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.2);

    osc.start(ctx.currentTime + i * 0.08);
    osc.stop(ctx.currentTime + i * 0.08 + 0.2);
  });
}

function playAchievement(ctx: AudioContext, volume: number) {
  // Fanfare
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);

    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
    gain.gain.linearRampToValueAtTime(volume * 0.12, ctx.currentTime + i * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.25);

    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.25);
  });
}

function playGameStart(ctx: AudioContext, volume: number) {
  // Ascending arpeggio
  const notes = [261.63, 329.63, 392, 523.25, 659.25]; // C4, E4, G4, C5, E5

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);

    gain.gain.setValueAtTime(volume * 0.1, ctx.currentTime + i * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.06 + 0.15);

    osc.start(ctx.currentTime + i * 0.06);
    osc.stop(ctx.currentTime + i * 0.06 + 0.15);
  });
}

function playGameOver(ctx: AudioContext, volume: number) {
  // Descending
  const notes = [392, 349.23, 329.63, 261.63]; // G4, F4, E4, C4

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.2);

    gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime + i * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.25);

    osc.start(ctx.currentTime + i * 0.2);
    osc.stop(ctx.currentTime + i * 0.2 + 0.25);
  });
}

function playScore(ctx: AudioContext, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

function playCamera(ctx: AudioContext, volume: number) {
  // Camera shutter click sound
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  // White noise-like effect for shutter
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(2000, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(volume * 0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.08);

  // Second click for mechanical feel
  setTimeout(() => {
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1500, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.02);

    gain2.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);

    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.03);
  }, 30);
}

// ========================================
// SOUND PLAYER
// ========================================
const soundPlayers: Record<SoundType, (ctx: AudioContext, volume: number) => void> = {
  click: playClick,
  success: playSuccess,
  error: playError,
  warning: playWarning,
  notification: playNotification,
  train_start: playTrainStart,
  train_stop: playTrainStop,
  train_horn: playTrainHorn,
  junction: playJunction,
  crossing: playCrossing,
  emergency: playEmergency,
  coin: playCoin,
  unlock: playUnlock,
  achievement: playAchievement,
  game_start: playGameStart,
  game_over: playGameOver,
  score: playScore,
  camera: playCamera,
};

// ========================================
// HAPTIC FEEDBACK MAPPING
// ========================================
// Maps sound types to appropriate haptic feedback
type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' | 'none';

const hapticMapping: Record<SoundType, HapticType> = {
  click: 'light',
  success: 'success',
  error: 'error',
  warning: 'warning',
  notification: 'light',
  train_start: 'medium',
  train_stop: 'medium',
  train_horn: 'heavy',
  junction: 'light',
  crossing: 'medium',
  emergency: 'heavy',
  coin: 'light',
  unlock: 'success',
  achievement: 'success',
  game_start: 'medium',
  game_over: 'heavy',
  score: 'light',
  camera: 'light',
};

// Play haptic feedback based on sound type
async function playHaptic(sound: SoundType): Promise<void> {
  if (!isNative) return;

  const hapticType = hapticMapping[sound];

  switch (hapticType) {
    case 'light':
      await haptic.light();
      break;
    case 'medium':
      await haptic.medium();
      break;
    case 'heavy':
      await haptic.heavy();
      break;
    case 'success':
      await haptic.success();
      break;
    case 'warning':
      await haptic.warning();
      break;
    case 'error':
      await haptic.error();
      break;
    case 'selection':
      await haptic.selection();
      break;
    case 'none':
    default:
      // No haptic feedback
      break;
  }
}

// ========================================
// SOUND CONTEXT
// ========================================
interface SoundContextType {
  enabled: boolean;
  volume: number;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  play: (sound: SoundType) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function useSounds() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSounds must be used within a SoundProvider');
  }
  return context;
}

// ========================================
// SOUND PROVIDER
// ========================================
interface SoundProviderProps {
  children: ReactNode;
}

export function SoundProvider({ children }: SoundProviderProps) {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEnabled = localStorage.getItem('sound_enabled');
      const savedVolume = localStorage.getItem('sound_volume');

      if (savedEnabled !== null) setEnabled(savedEnabled === 'true');
      if (savedVolume !== null) setVolume(parseFloat(savedVolume));
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sound_enabled', String(enabled));
      localStorage.setItem('sound_volume', String(volume));
    }
  }, [enabled, volume]);

  const play = useCallback((sound: SoundType) => {
    if (!enabled) return;

    // Play haptic feedback (runs in parallel, doesn't block)
    playHaptic(sound).catch(() => {
      // Haptic feedback is optional, ignore errors
    });

    const ctx = getAudioContext();
    if (!ctx) return;

    const player = soundPlayers[sound];
    if (player) {
      try {
        player(ctx, volume);
      } catch (e) {
        console.warn('Failed to play sound:', e);
      }
    }
  }, [enabled, volume]);

  return (
    <SoundContext.Provider value={{ enabled, volume, setEnabled, setVolume, play }}>
      {children}
    </SoundContext.Provider>
  );
}
