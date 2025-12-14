// ============================================
// Kiosk Configuration for Arcade Cabinet
// ============================================
// Settings for physical arcade cabinet deployment
// including display, input, and coin acceptor config.

// ============================================
// Display Settings
// ============================================

export interface DisplayConfig {
  fullscreen: boolean;
  orientation: 'landscape' | 'portrait';
  resolution: { width: number; height: number };
  refreshRate: number;
  cursorHidden: boolean;
  screensaverTimeout: number; // seconds, 0 = disabled
}

export const DEFAULT_DISPLAY_CONFIG: DisplayConfig = {
  fullscreen: true,
  orientation: 'landscape',
  resolution: { width: 1920, height: 1080 },
  refreshRate: 60,
  cursorHidden: true,
  screensaverTimeout: 300, // 5 minutes
};

// ============================================
// Input Mapping
// ============================================

export type InputAction =
  | 'TRAIN_1_THROTTLE_UP'
  | 'TRAIN_1_THROTTLE_DOWN'
  | 'TRAIN_1_REVERSE'
  | 'TRAIN_1_STOP'
  | 'TRAIN_2_THROTTLE_UP'
  | 'TRAIN_2_THROTTLE_DOWN'
  | 'TRAIN_2_REVERSE'
  | 'TRAIN_2_STOP'
  | 'JUNCTION_1_TOGGLE'
  | 'JUNCTION_2_TOGGLE'
  | 'JUNCTION_3_TOGGLE'
  | 'CROSSING_TOGGLE'
  | 'EMERGENCY_STOP'
  | 'CAMERA_NEXT'
  | 'CAMERA_PREV'
  | 'CAMERA_1'
  | 'CAMERA_2'
  | 'CAMERA_3'
  | 'CAMERA_4'
  | 'START_GAME'
  | 'PAUSE_GAME'
  | 'SELECT_MODE'
  | 'CONFIRM'
  | 'CANCEL'
  | 'COIN_INSERT';

export interface InputMapping {
  keyboard: Record<string, InputAction>;
  gamepad: {
    buttons: Record<number, InputAction>;
    axes: Array<{ action: InputAction; threshold: number; direction: 'positive' | 'negative' }>;
  };
}

// Default keyboard mapping for development/testing
export const DEFAULT_KEYBOARD_MAPPING: Record<string, InputAction> = {
  // Train 1 controls (WASD)
  'KeyW': 'TRAIN_1_THROTTLE_UP',
  'KeyS': 'TRAIN_1_THROTTLE_DOWN',
  'KeyA': 'TRAIN_1_REVERSE',
  'KeyD': 'TRAIN_1_STOP',

  // Train 2 controls (Arrow keys)
  'ArrowUp': 'TRAIN_2_THROTTLE_UP',
  'ArrowDown': 'TRAIN_2_THROTTLE_DOWN',
  'ArrowLeft': 'TRAIN_2_REVERSE',
  'ArrowRight': 'TRAIN_2_STOP',

  // Junction controls (number keys)
  'Digit1': 'JUNCTION_1_TOGGLE',
  'Digit2': 'JUNCTION_2_TOGGLE',
  'Digit3': 'JUNCTION_3_TOGGLE',

  // Crossing
  'KeyC': 'CROSSING_TOGGLE',

  // Emergency stop (spacebar)
  'Space': 'EMERGENCY_STOP',

  // Camera controls
  'BracketRight': 'CAMERA_NEXT',
  'BracketLeft': 'CAMERA_PREV',
  'F1': 'CAMERA_1',
  'F2': 'CAMERA_2',
  'F3': 'CAMERA_3',
  'F4': 'CAMERA_4',

  // Game controls
  'Enter': 'START_GAME',
  'KeyP': 'PAUSE_GAME',
  'Tab': 'SELECT_MODE',
  'KeyY': 'CONFIRM',
  'KeyN': 'CANCEL',

  // Coin (for testing)
  'F12': 'COIN_INSERT',
};

// Standard arcade gamepad mapping (MAME-style)
export const DEFAULT_GAMEPAD_MAPPING: InputMapping['gamepad'] = {
  buttons: {
    0: 'CONFIRM',           // A / Cross
    1: 'CANCEL',            // B / Circle
    2: 'JUNCTION_1_TOGGLE', // X / Square
    3: 'JUNCTION_2_TOGGLE', // Y / Triangle
    4: 'CAMERA_PREV',       // LB
    5: 'CAMERA_NEXT',       // RB
    6: 'SELECT_MODE',       // Back/Select
    7: 'START_GAME',        // Start
    8: 'PAUSE_GAME',        // Xbox/Guide
    9: 'EMERGENCY_STOP',    // Left Stick Click
    10: 'CROSSING_TOGGLE',  // Right Stick Click
  },
  axes: [
    // Left stick Y-axis for Train 1
    { action: 'TRAIN_1_THROTTLE_UP', threshold: 0.5, direction: 'negative' },
    { action: 'TRAIN_1_THROTTLE_DOWN', threshold: 0.5, direction: 'positive' },
    // Right stick Y-axis for Train 2
    { action: 'TRAIN_2_THROTTLE_UP', threshold: 0.5, direction: 'negative' },
    { action: 'TRAIN_2_THROTTLE_DOWN', threshold: 0.5, direction: 'positive' },
  ],
};

// ============================================
// Coin Acceptor Configuration
// ============================================

export interface CoinConfig {
  enabled: boolean;
  endpoint: string;
  tokensPer: Record<string, number>; // coin type -> tokens
  pulseInputPin?: number; // GPIO pin for pulse counter
}

export const DEFAULT_COIN_CONFIG: CoinConfig = {
  enabled: false,
  endpoint: '/api/kiosk/coin',
  tokensPer: {
    quarter: 1,    // $0.25 = 1 token
    dollar: 5,     // $1.00 = 5 tokens
    token: 1,      // Arcade token = 1 token
  },
  pulseInputPin: 17, // Default GPIO pin
};

// ============================================
// Kiosk Session Settings
// ============================================

export interface KioskSessionConfig {
  idleTimeout: number;        // seconds before returning to attract mode
  attractMode: boolean;       // show demo when idle
  autoStartDemo: boolean;     // auto-start demo after idle
  maxSessionTime: number;     // max time per session in seconds (0 = unlimited)
  requireCoins: boolean;      // require coin insert to start
  freePlayMode: boolean;      // free play (demo) always available
  showLeaderboard: boolean;   // show leaderboard on attract screen
  leaderboardRotate: number;  // seconds between leaderboard pages
}

export const DEFAULT_SESSION_CONFIG: KioskSessionConfig = {
  idleTimeout: 60,
  attractMode: true,
  autoStartDemo: true,
  maxSessionTime: 0,
  requireCoins: true,
  freePlayMode: true,
  showLeaderboard: true,
  leaderboardRotate: 10,
};

// ============================================
// Audio Configuration
// ============================================

export interface AudioConfig {
  enabled: boolean;
  masterVolume: number;       // 0-1
  sfxVolume: number;          // 0-1
  musicVolume: number;        // 0-1
  coinSound: string;          // URL or path
  startSound: string;
  gameOverSound: string;
}

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  enabled: true,
  masterVolume: 0.8,
  sfxVolume: 1.0,
  musicVolume: 0.6,
  coinSound: '/sounds/coin.mp3',
  startSound: '/sounds/start.mp3',
  gameOverSound: '/sounds/gameover.mp3',
};

// ============================================
// Complete Kiosk Configuration
// ============================================

export interface KioskConfig {
  display: DisplayConfig;
  input: InputMapping;
  coin: CoinConfig;
  session: KioskSessionConfig;
  audio: AudioConfig;
  cabinetId?: string;         // Unique identifier for this cabinet
  locationId?: string;        // Physical location identifier
}

export const DEFAULT_KIOSK_CONFIG: KioskConfig = {
  display: DEFAULT_DISPLAY_CONFIG,
  input: {
    keyboard: DEFAULT_KEYBOARD_MAPPING,
    gamepad: DEFAULT_GAMEPAD_MAPPING,
  },
  coin: DEFAULT_COIN_CONFIG,
  session: DEFAULT_SESSION_CONFIG,
  audio: DEFAULT_AUDIO_CONFIG,
};

// ============================================
// Helper Functions
// ============================================

export function getActionForKey(code: string, mapping: Record<string, InputAction>): InputAction | null {
  return mapping[code] ?? null;
}

export function getActionForButton(buttonIndex: number, mapping: InputMapping['gamepad']): InputAction | null {
  return mapping.buttons[buttonIndex] ?? null;
}

export function loadKioskConfig(): KioskConfig {
  // In production, this would load from localStorage or a config file
  if (typeof window === 'undefined') return DEFAULT_KIOSK_CONFIG;

  const stored = localStorage.getItem('kioskConfig');
  if (stored) {
    try {
      return { ...DEFAULT_KIOSK_CONFIG, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_KIOSK_CONFIG;
    }
  }
  return DEFAULT_KIOSK_CONFIG;
}

export function saveKioskConfig(config: Partial<KioskConfig>): void {
  if (typeof window === 'undefined') return;
  const current = loadKioskConfig();
  localStorage.setItem('kioskConfig', JSON.stringify({ ...current, ...config }));
}
