'use client';

import { useState, useEffect } from 'react';
import { getActionDescription } from '@/lib/token-guard';

// ============================================
// Types
// ============================================

interface TokenConfirmDialogProps {
  isOpen: boolean;
  action: string;
  cost: number;
  currentBalance?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

// ============================================
// Component
// ============================================

export function TokenConfirmDialog({
  isOpen,
  action,
  cost,
  currentBalance,
  onConfirm,
  onCancel,
}: TokenConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsConfirming(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasEnoughTokens = currentBalance === undefined || currentBalance >= cost;
  const description = getActionDescription(action);

  const handleConfirm = async () => {
    setIsConfirming(true);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-[#0c0c14] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        {/* Token icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
            <span className="text-3xl">🪙</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-center text-white mb-2">
          Confirm Action
        </h3>

        {/* Description */}
        <p className="text-center text-gray-400 text-sm mb-4">
          {description}
        </p>

        {/* Cost breakdown */}
        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Action Cost</span>
            <span className="font-mono font-bold text-amber-400">
              {cost} token{cost !== 1 ? 's' : ''}
            </span>
          </div>

          {currentBalance !== undefined && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Current Balance</span>
                <span className="font-mono text-white">{currentBalance}</span>
              </div>
              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">After Action</span>
                  <span
                    className={`font-mono font-bold ${
                      hasEnoughTokens ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {currentBalance - cost}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Insufficient balance warning */}
        {!hasEnoughTokens && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm text-center">
              Insufficient tokens. You need {cost - (currentBalance || 0)} more.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isConfirming}
            className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-medium hover:bg-white/10 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!hasEnoughTokens || isConfirming}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
              hasEnoughTokens
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            {isConfirming ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing
              </span>
            ) : (
              `Spend ${cost} Token${cost !== 1 ? 's' : ''}`
            )}
          </button>
        </div>

        {/* Live mode indicator */}
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Mode
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Hook for Token Confirmation
// ============================================

interface PendingConfirmation {
  action: string;
  cost: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function useTokenConfirmation(currentBalance?: number) {
  const [pending, setPending] = useState<PendingConfirmation | null>(null);

  const requestConfirmation = (
    action: string,
    cost: number,
    onConfirm: () => void,
    onCancel: () => void
  ) => {
    setPending({ action, cost, onConfirm, onCancel });
  };

  const handleConfirm = () => {
    pending?.onConfirm();
    setPending(null);
  };

  const handleCancel = () => {
    pending?.onCancel();
    setPending(null);
  };

  const dialogProps = pending
    ? {
        isOpen: true,
        action: pending.action,
        cost: pending.cost,
        currentBalance,
        onConfirm: handleConfirm,
        onCancel: handleCancel,
      }
    : {
        isOpen: false,
        action: '',
        cost: 0,
        currentBalance,
        onConfirm: () => {},
        onCancel: () => {},
      };

  return {
    requestConfirmation,
    dialogProps,
    Dialog: TokenConfirmDialog,
  };
}
