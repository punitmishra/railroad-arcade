// ============================================
// Pricing Configuration for Railroad Arcade
// ============================================
// Defines token costs for live mode actions and
// time-based queue access.

// ============================================
// Time-Based Queue Pricing
// ============================================

export interface TimePricing {
  id: string;
  name: string;
  tokens: number;
  duration: number; // seconds
  popular?: boolean;
}

export const QUEUE_TIME_PACKAGES: TimePricing[] = [
  {
    id: 'quick',
    name: 'Quick Turn',
    tokens: 5,
    duration: 120, // 2 minutes
  },
  {
    id: 'standard',
    name: 'Standard Session',
    tokens: 10,
    duration: 300, // 5 minutes
    popular: true,
  },
  {
    id: 'extended',
    name: 'Extended Session',
    tokens: 18,
    duration: 600, // 10 minutes
  },
  {
    id: 'marathon',
    name: 'Marathon Session',
    tokens: 25,
    duration: 900, // 15 minutes
  },
];

export const EXTEND_TIME_PACKAGES: TimePricing[] = [
  {
    id: 'extend_2',
    name: '+2 Minutes',
    tokens: 6,
    duration: 120,
  },
  {
    id: 'extend_5',
    name: '+5 Minutes',
    tokens: 12,
    duration: 300,
  },
];

// ============================================
// Per-Action Pricing
// ============================================

export interface ActionPricing {
  action: string;
  name: string;
  tokens: number;
  description: string;
}

export const ACTION_PRICING: Record<string, number> = {
  // Train Control
  TRAIN_START: 2,
  TRAIN_STOP: 0, // Free to stop (safety)
  TRAIN_SPEED_CHANGE: 0, // Free once started
  TRAIN_DIRECTION: 1,
  TRAIN_HORN: 0, // Free fun!

  // Track Control
  JUNCTION_SWITCH: 1,
  CROSSING_TOGGLE: 1,

  // Scenery
  SCENERY_CHANGE: 1,
  LIGHTS_TOGGLE: 0, // Free

  // Camera
  CAMERA_SWITCH: 0, // Free to switch views
  CAMERA_SNAPSHOT: 1,

  // Special
  EMERGENCY_STOP: 0, // Always free (safety)
  TIME_EXTEND: 0, // Handled separately
};

export const ACTION_DESCRIPTIONS: ActionPricing[] = [
  { action: 'TRAIN_START', name: 'Start Train', tokens: 2, description: 'Power up a locomotive' },
  { action: 'TRAIN_STOP', name: 'Stop Train', tokens: 0, description: 'Brake to a stop (free)' },
  { action: 'TRAIN_DIRECTION', name: 'Change Direction', tokens: 1, description: 'Switch forward/reverse' },
  { action: 'JUNCTION_SWITCH', name: 'Switch Junction', tokens: 1, description: 'Toggle track switch' },
  { action: 'CROSSING_TOGGLE', name: 'Toggle Crossing', tokens: 1, description: 'Raise/lower crossing gate' },
  { action: 'SCENERY_CHANGE', name: 'Change Scenery', tokens: 1, description: 'Modify time/weather' },
  { action: 'CAMERA_SNAPSHOT', name: 'Take Snapshot', tokens: 1, description: 'Capture camera view' },
  { action: 'EMERGENCY_STOP', name: 'Emergency Stop', tokens: 0, description: 'Stop all trains (free)' },
];

// ============================================
// Game Mode Costs
// ============================================

export interface GameModePricing {
  mode: string;
  name: string;
  tokens: number;
  description: string;
  isLiveOnly?: boolean;
}

export const GAME_MODE_PRICING: GameModePricing[] = [
  {
    mode: 'FREE_PLAY',
    name: 'Free Play',
    tokens: 0,
    description: 'Sandbox mode - no objectives',
  },
  {
    mode: 'SPEED_RUN',
    name: 'Speed Run',
    tokens: 5,
    description: 'Complete a circuit as fast as possible',
  },
  {
    mode: 'DELIVERY_MISSION',
    name: 'Delivery Mission',
    tokens: 8,
    description: 'Transport cargo between stations',
  },
  {
    mode: 'SURVIVAL',
    name: 'Survival',
    tokens: 10,
    description: 'Avoid collisions as long as possible',
    isLiveOnly: true,
  },
  {
    mode: 'TIME_ATTACK',
    name: 'Time Attack',
    tokens: 8,
    description: 'Complete as many laps as possible',
  },
];

// ============================================
// Helper Functions
// ============================================

export function getTimePricingById(id: string): TimePricing | undefined {
  return [...QUEUE_TIME_PACKAGES, ...EXTEND_TIME_PACKAGES].find((p) => p.id === id);
}

export function getActionCost(action: string): number {
  return ACTION_PRICING[action] ?? 0;
}

export function getGameModeCost(mode: string): number {
  const pricing = GAME_MODE_PRICING.find((p) => p.mode === mode);
  return pricing?.tokens ?? 0;
}

export function calculateSessionCost(
  durationMinutes: number,
  actionsPerformed: string[]
): { timeCost: number; actionCost: number; total: number } {
  // Find the best time package
  const durationSeconds = durationMinutes * 60;
  const timePackage = QUEUE_TIME_PACKAGES.find((p) => p.duration >= durationSeconds);
  const timeCost = timePackage?.tokens ?? 25;

  // Sum action costs
  const actionCost = actionsPerformed.reduce((sum, action) => sum + getActionCost(action), 0);

  return {
    timeCost,
    actionCost,
    total: timeCost + actionCost,
  };
}

// ============================================
// Token Store Packages (for purchase)
// ============================================

export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  bonus: number;
  price: number; // in cents
  popular?: boolean;
  description?: string;
}

export const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    tokens: 50,
    bonus: 0,
    price: 99,
    description: 'Quick top-up for a few sessions',
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    tokens: 150,
    bonus: 15,
    price: 249,
    popular: true,
    description: 'Great value for regular players',
  },
  {
    id: 'value',
    name: 'Value Pack',
    tokens: 500,
    bonus: 75,
    price: 699,
    description: 'Best value for frequent players',
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    tokens: 1000,
    bonus: 200,
    price: 1199,
    description: 'Maximum tokens with huge bonus',
  },
];

// Crypto-specific packages
export const CRYPTO_PACKAGES: TokenPackage[] = [
  {
    id: 'crypto-starter',
    name: 'Crypto Starter',
    tokens: 100,
    bonus: 10,
    price: 199,
    description: 'Pay with Bitcoin or Ethereum',
  },
  {
    id: 'crypto-value',
    name: 'Crypto Value',
    tokens: 500,
    bonus: 100,
    price: 799,
    popular: true,
    description: 'Best crypto value',
  },
  {
    id: 'crypto-premium',
    name: 'Crypto Premium',
    tokens: 1000,
    bonus: 250,
    price: 1499,
    description: 'Maximum crypto purchase',
  },
];

// ============================================
// Module Unlock Costs
// ============================================

export const MODULE_COSTS: Record<string, number> = {
  trains: 0,        // Free - included by default
  scenery: 0,       // Free - included by default
  police: 25,       // Police Station
  fire: 25,         // Fire Station
  cafe: 15,         // Café
  home: 20,         // Smart Home
  construction: 30, // Construction Zone
  crossing: 20,     // Diamond Crossing
};

export const DEFAULT_UNLOCKED_MODULES = ['trains', 'scenery'];

// ============================================
// Package Helper Functions
// ============================================

export function getTokenPackageById(id: string): TokenPackage | undefined {
  return [...TOKEN_PACKAGES, ...CRYPTO_PACKAGES].find((pkg) => pkg.id === id);
}

export function getTotalTokens(pkg: TokenPackage): number {
  return pkg.tokens + pkg.bonus;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function getModuleCost(moduleId: string): number {
  return MODULE_COSTS[moduleId] ?? 0;
}

export function isModuleFree(moduleId: string): boolean {
  return getModuleCost(moduleId) === 0;
}

// Welcome bonus for new users
export const WELCOME_BONUS_TOKENS = 100;
