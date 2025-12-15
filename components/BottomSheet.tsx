'use client';

// ============================================
// Bottom Sheet Component
// ============================================
// Mobile-native bottom sheet with drag gestures,
// snap points, and smooth animations.

import { useState, useRef, useEffect, ReactNode, useCallback } from 'react';

// ============================================
// Types
// ============================================

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  snapPoints?: number[]; // percentages of viewport height (e.g., [25, 50, 90])
  defaultSnapPoint?: number; // index of default snap point
  showHandle?: boolean;
  showBackdrop?: boolean;
  closeOnBackdropClick?: boolean;
  className?: string;
}

// ============================================
// Hook for drag gestures
// ============================================

function useDrag(onDrag: (deltaY: number) => void, onDragEnd: (velocity: number) => void) {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);

  const handleStart = useCallback((clientY: number) => {
    setIsDragging(true);
    startY.current = clientY;
    lastY.current = clientY;
    lastTime.current = Date.now();
    velocity.current = 0;
  }, []);

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return;

    const deltaY = clientY - lastY.current;
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime.current;

    if (deltaTime > 0) {
      velocity.current = deltaY / deltaTime;
    }

    lastY.current = clientY;
    lastTime.current = currentTime;

    onDrag(clientY - startY.current);
  }, [isDragging, onDrag]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    onDragEnd(velocity.current);
  }, [isDragging, onDragEnd]);

  return { isDragging, handleStart, handleMove, handleEnd };
}

// ============================================
// Main Component
// ============================================

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [50, 90],
  defaultSnapPoint = 0,
  showHandle = true,
  showBackdrop = true,
  closeOnBackdropClick = true,
  className = '',
}: BottomSheetProps) {
  const [currentSnapIndex, setCurrentSnapIndex] = useState(defaultSnapPoint);
  const [translateY, setTranslateY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Get the current height based on snap point
  const currentHeight = snapPoints[currentSnapIndex];

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentSnapIndex(defaultSnapPoint);
      setTranslateY(0);
    }
  }, [isOpen, defaultSnapPoint]);

  // Handle drag
  const handleDrag = useCallback((deltaY: number) => {
    // Only allow dragging down (positive deltaY) or up to a limit
    const maxUp = (100 - currentHeight) * window.innerHeight / 100;
    const clampedDelta = Math.max(-maxUp * 0.3, deltaY); // Allow some overscroll up
    setTranslateY(clampedDelta);
  }, [currentHeight]);

  // Handle drag end
  const handleDragEnd = useCallback((velocity: number) => {
    setIsAnimating(true);

    const threshold = window.innerHeight * 0.1; // 10% of screen
    const velocityThreshold = 0.5;

    // Determine if we should close or snap
    if (translateY > threshold || velocity > velocityThreshold) {
      // Close the sheet
      onClose();
    } else if (translateY < -threshold || velocity < -velocityThreshold) {
      // Snap to next higher point
      const nextIndex = Math.min(currentSnapIndex + 1, snapPoints.length - 1);
      setCurrentSnapIndex(nextIndex);
    }

    setTranslateY(0);
    setTimeout(() => setIsAnimating(false), 300);
  }, [translateY, currentSnapIndex, snapPoints.length, onClose]);

  const { isDragging, handleStart, handleMove, handleEnd } = useDrag(handleDrag, handleDragEnd);

  // Touch event handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleStart(e.touches[0].clientY);
  }, [handleStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleMove(e.touches[0].clientY);
  }, [handleMove]);

  const onTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Mouse event handlers (for desktop testing)
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientY);
  }, [handleStart]);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const onMouseUp = () => handleEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handleMove, handleEnd]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      {showBackdrop && (
        <div
          className="absolute inset-0 bg-black/60 animate-backdrop"
          onClick={closeOnBackdropClick ? onClose : undefined}
          aria-hidden="true"
        />
      )}

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`
          absolute bottom-0 left-0 right-0
          bg-[#12121c] border-t border-white/10
          rounded-t-2xl shadow-2xl
          ${isAnimating ? 'transition-transform duration-300 ease-out' : ''}
          ${className}
        `}
        style={{
          height: `${currentHeight}vh`,
          transform: `translateY(${Math.max(0, translateY)}px)`,
          maxHeight: '95vh',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      >
        {/* Handle */}
        {showHandle && (
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
          >
            <div className="w-10 h-1 rounded-full bg-white/30" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h2 id="bottom-sheet-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ maxHeight: title ? `calc(${currentHeight}vh - 100px)` : `calc(${currentHeight}vh - 40px)` }}
        >
          {children}
        </div>

        {/* Safe area padding for mobile */}
        <div className="safe-area-inset" />
      </div>
    </div>
  );
}

// ============================================
// Preset Bottom Sheet Variants
// ============================================

interface ControlSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function ControlSheet({ isOpen, onClose, children }: ControlSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Train Controls"
      snapPoints={[40, 75]}
      defaultSnapPoint={0}
    >
      <div className="p-4">
        {children}
      </div>
    </BottomSheet>
  );
}

export function CameraSheet({ isOpen, onClose, children }: ControlSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Camera Views"
      snapPoints={[50, 85]}
      defaultSnapPoint={0}
    >
      <div className="p-4">
        {children}
      </div>
    </BottomSheet>
  );
}

export function SettingsSheet({ isOpen, onClose, children }: ControlSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      snapPoints={[60, 90]}
      defaultSnapPoint={0}
    >
      <div className="p-4">
        {children}
      </div>
    </BottomSheet>
  );
}

// ============================================
// Exports
// ============================================

export default BottomSheet;
