// ============================================
// Token Guard - Verify and Deduct Tokens for Actions
// ============================================
// This module handles token enforcement for live mode actions.
// It verifies balance, shows confirmation, and handles deduction.

import { getActionCost, ACTION_PRICING } from './pricing';

// ============================================
// Types
// ============================================

export type ActionType = keyof typeof ACTION_PRICING;

export interface TokenCheckResult {
  allowed: boolean;
  cost: number;
  currentBalance: number;
  error?: string;
}

export interface TokenDeductResult {
  success: boolean;
  newBalance: number;
  cost: number;
  transactionId?: string;
  error?: string;
}

export interface TokenGuardOptions {
  skipConfirmation?: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================
// Server-side Token Operations
// ============================================

/**
 * Check if user has enough tokens for an action
 */
export async function checkTokenBalance(
  action: string,
  sessionToken?: string
): Promise<TokenCheckResult> {
  const cost = getActionCost(action);

  // Free actions always allowed
  if (cost === 0) {
    return {
      allowed: true,
      cost: 0,
      currentBalance: 0, // Not needed for free actions
    };
  }

  // Must have session for paid actions
  if (!sessionToken) {
    return {
      allowed: false,
      cost,
      currentBalance: 0,
      error: 'Authentication required for this action',
    };
  }

  try {
    const response = await fetch('/api/user', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        allowed: false,
        cost,
        currentBalance: 0,
        error: 'Failed to check token balance',
      };
    }

    const data = await response.json();
    const balance = data.user?.tokenBalance ?? 0;

    return {
      allowed: balance >= cost,
      cost,
      currentBalance: balance,
      error: balance < cost ? `Insufficient tokens. Need ${cost}, have ${balance}` : undefined,
    };
  } catch (error) {
    return {
      allowed: false,
      cost,
      currentBalance: 0,
      error: 'Failed to verify token balance',
    };
  }
}

/**
 * Deduct tokens for an action (call after successful action)
 */
export async function deductTokens(
  action: string,
  sessionId?: string,
  metadata?: Record<string, unknown>
): Promise<TokenDeductResult> {
  const cost = getActionCost(action);

  // Free actions - no deduction needed
  if (cost === 0) {
    return {
      success: true,
      newBalance: 0,
      cost: 0,
    };
  }

  try {
    const response = await fetch('/api/user/tokens/deduct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        cost,
        sessionId,
        metadata,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        newBalance: 0,
        cost,
        error: errorData.error || 'Failed to deduct tokens',
      };
    }

    const data = await response.json();
    return {
      success: true,
      newBalance: data.newBalance,
      cost,
      transactionId: data.transactionId,
    };
  } catch (error) {
    return {
      success: false,
      newBalance: 0,
      cost,
      error: 'Failed to process token deduction',
    };
  }
}

/**
 * Refund tokens (for failed actions)
 */
export async function refundTokens(
  transactionId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/user/tokens/refund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId,
        reason,
      }),
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to process refund' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to process refund' };
  }
}

// ============================================
// Token Guard Class - Client-side Coordinator
// ============================================

export class TokenGuard {
  private isLiveMode: boolean;
  private onBalanceChange?: (balance: number) => void;
  private onError?: (error: string) => void;

  constructor(options: {
    isLiveMode: boolean;
    onBalanceChange?: (balance: number) => void;
    onError?: (error: string) => void;
  }) {
    this.isLiveMode = options.isLiveMode;
    this.onBalanceChange = options.onBalanceChange;
    this.onError = options.onError;
  }

  setLiveMode(isLive: boolean) {
    this.isLiveMode = isLive;
  }

  /**
   * Check if an action is allowed
   */
  async canPerformAction(action: string): Promise<TokenCheckResult> {
    // Demo mode - always allowed, no cost
    if (!this.isLiveMode) {
      return {
        allowed: true,
        cost: 0,
        currentBalance: 0,
      };
    }

    return checkTokenBalance(action);
  }

  /**
   * Execute an action with token enforcement
   */
  async executeAction<T>(
    action: string,
    executor: () => Promise<T>,
    options: TokenGuardOptions = {}
  ): Promise<{ success: boolean; result?: T; error?: string }> {
    // Demo mode - just execute
    if (!this.isLiveMode) {
      try {
        const result = await executor();
        return { success: true, result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Action failed';
        this.onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    }

    // Live mode - check tokens first
    const check = await this.canPerformAction(action);

    if (!check.allowed) {
      this.onError?.(check.error || 'Action not allowed');
      return { success: false, error: check.error };
    }

    // Free action - just execute
    if (check.cost === 0) {
      try {
        const result = await executor();
        return { success: true, result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Action failed';
        this.onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    }

    // Deduct tokens first
    const deduction = await deductTokens(action, undefined, options.metadata);
    if (!deduction.success) {
      this.onError?.(deduction.error || 'Failed to deduct tokens');
      return { success: false, error: deduction.error };
    }

    // Update balance
    this.onBalanceChange?.(deduction.newBalance);

    // Execute action
    try {
      const result = await executor();
      return { success: true, result };
    } catch (error) {
      // Action failed - refund tokens
      if (deduction.transactionId) {
        await refundTokens(deduction.transactionId, 'Action execution failed');
        // Restore balance (approximate)
        this.onBalanceChange?.(deduction.newBalance + deduction.cost);
      }

      const errorMessage = error instanceof Error ? error.message : 'Action failed';
      this.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get cost for an action (0 in demo mode)
   */
  getActionCost(action: string): number {
    if (!this.isLiveMode) {
      return 0;
    }
    return getActionCost(action);
  }
}

// ============================================
// Action Cost Helpers
// ============================================

export function formatActionCost(action: string, isLiveMode: boolean): string {
  if (!isLiveMode) {
    return 'Free';
  }

  const cost = getActionCost(action);
  if (cost === 0) {
    return 'Free';
  }

  return `${cost} token${cost !== 1 ? 's' : ''}`;
}

export function getActionDescription(action: string): string {
  const descriptions: Record<string, string> = {
    TRAIN_START: 'Start train',
    TRAIN_STOP: 'Stop train',
    JUNCTION_SWITCH: 'Switch junction',
    CROSSING_TOGGLE: 'Toggle crossing gate',
    EMERGENCY_STOP: 'Emergency stop all trains',
    SCENERY_CHANGE: 'Change scenery settings',
    CAMERA_SWITCH: 'Switch camera view',
    TIME_EXTEND: 'Extend session time',
  };

  return descriptions[action] || action;
}
