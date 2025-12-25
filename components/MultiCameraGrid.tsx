'use client';

import { useState, useCallback } from 'react';
import { CameraFeed, CameraThumbnail } from './CameraFeed';
import {
  CAMERAS,
  CAMERA_LAYOUTS,
  LayoutId,
  getLayoutById,
  ViewConfig,
  DEFAULT_VIEW_CONFIG,
  PRESET_VIEWS,
} from '@/lib/camera-config';

// ============================================
// Multi Camera Grid Component
// ============================================

interface MultiCameraGridProps {
  initialConfig?: ViewConfig;
  onSnapshot?: (cameraId: string) => void;
}

export function MultiCameraGrid({ initialConfig, onSnapshot }: MultiCameraGridProps) {
  const [config, setConfig] = useState<ViewConfig>(initialConfig ?? DEFAULT_VIEW_CONFIG);
  const [showCameraSelector, setShowCameraSelector] = useState<number | null>(null);
  const [swapMode, setSwapMode] = useState<number | null>(null);

  const layout = getLayoutById(config.layout);

  const handleLayoutChange = (layoutId: LayoutId) => {
    const newLayout = getLayoutById(layoutId);
    if (!newLayout) return;

    // Adjust cameras array to match new slot count
    let newCameras = [...config.cameras];
    if (newLayout.slots > newCameras.length) {
      // Add more cameras
      const availableCameras = CAMERAS.filter((c) => !newCameras.includes(c.id));
      while (newCameras.length < newLayout.slots && availableCameras.length > 0) {
        newCameras.push(availableCameras.shift()!.id);
      }
    } else if (newLayout.slots < newCameras.length) {
      // Remove extra cameras
      newCameras = newCameras.slice(0, newLayout.slots);
    }

    setConfig({ layout: layoutId, cameras: newCameras });
  };

  const handleCameraChange = (slotIndex: number, cameraId: string) => {
    const newCameras = [...config.cameras];
    newCameras[slotIndex] = cameraId;
    setConfig({ ...config, cameras: newCameras });
    setShowCameraSelector(null);
  };

  // Swap cameras between two slots
  const handleSwapCameras = useCallback((slotIndex: number) => {
    if (swapMode === null) {
      // First click - enter swap mode
      setSwapMode(slotIndex);
    } else if (swapMode === slotIndex) {
      // Clicked same slot - cancel swap
      setSwapMode(null);
    } else {
      // Second click - perform swap
      const newCameras = [...config.cameras];
      const temp = newCameras[swapMode];
      newCameras[swapMode] = newCameras[slotIndex];
      newCameras[slotIndex] = temp;
      setConfig({ ...config, cameras: newCameras });
      setSwapMode(null);
    }
  }, [swapMode, config]);

  // Swap PiP with main camera
  const handlePipSwap = useCallback(() => {
    if (config.cameras.length >= 2) {
      const newCameras = [...config.cameras];
      [newCameras[0], newCameras[1]] = [newCameras[1], newCameras[0]];
      setConfig({ ...config, cameras: newCameras });
    }
  }, [config]);

  const handlePresetChange = (presetKey: string) => {
    const preset = PRESET_VIEWS[presetKey];
    if (preset) {
      setConfig(preset);
    }
  };

  if (!layout) return null;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Layout Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Layout:</span>
          <div className="flex gap-1">
            {CAMERA_LAYOUTS.map((l) => (
              <button
                key={l.id}
                onClick={() => handleLayoutChange(l.id)}
                className={`
                  p-2 rounded-lg transition-colors
                  ${config.layout === l.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }
                `}
                title={l.name}
              >
                <LayoutIcon layout={l.id} />
              </button>
            ))}
          </div>
        </div>

        {/* Preset Views */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Presets:</span>
          <div className="flex gap-1">
            {Object.entries(PRESET_VIEWS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handlePresetChange(key)}
                className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 transition-colors capitalize"
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Swap Mode Indicator */}
        {swapMode !== null && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Click another camera to swap
            <button
              onClick={() => setSwapMode(null)}
              className="ml-1 hover:text-amber-200"
              aria-label="Cancel swap"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Camera Grid */}
      <div className={`grid gap-2 ${layout.gridClass}`}>
        {config.layout === 'pip' ? (
          // Picture-in-Picture Layout
          <div className="relative aspect-video group">
            <CameraFeed
              cameraId={config.cameras[0] ?? 'overhead'}
              showControls={true}
              onSnapshot={() => onSnapshot?.(config.cameras[0])}
              className="w-full h-full"
            />
            {/* PiP overlay */}
            <div className="absolute bottom-4 right-4 w-1/4 aspect-video">
              <div
                className="relative w-full h-full rounded-lg overflow-hidden border-2 border-white/20 shadow-xl cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setShowCameraSelector(1)}
              >
                <CameraFeed
                  cameraId={config.cameras[1] ?? 'junction'}
                  showControls={false}
                />
              </div>
              {/* PiP Swap Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePipSwap();
                }}
                className="absolute -top-2 -left-2 p-1.5 rounded-full bg-amber-500/80 text-white hover:bg-amber-500 transition-colors shadow-lg z-10"
                title="Swap with main view"
                aria-label="Swap picture-in-picture with main view"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          // Grid Layouts
          config.cameras.map((cameraId, index) => (
            <div
              key={`slot-${index}`}
              className={`relative aspect-video group ${
                swapMode === index ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-[#0c0c14]' : ''
              } ${swapMode !== null && swapMode !== index ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (swapMode !== null && swapMode !== index) {
                  handleSwapCameras(index);
                }
              }}
            >
              <CameraFeed
                cameraId={cameraId}
                showControls={true}
                onSnapshot={() => onSnapshot?.(cameraId)}
                className="w-full h-full"
              />
              {/* Control buttons - visible on hover */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Swap button */}
                {config.cameras.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwapCameras(index);
                    }}
                    className={`p-1.5 rounded text-white transition-colors ${
                      swapMode === index
                        ? 'bg-amber-500'
                        : 'bg-black/60 hover:bg-amber-500/80'
                    }`}
                    title={swapMode === index ? 'Cancel swap' : 'Swap with another camera'}
                    aria-label={swapMode === index ? 'Cancel swap' : 'Swap with another camera'}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                )}
                {/* Change camera button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCameraSelector(index);
                  }}
                  className="p-1.5 rounded bg-black/60 text-white hover:bg-cyan-500/80 transition-colors"
                  title="Change camera"
                  aria-label="Change camera for this slot"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              {/* Swap target indicator */}
              {swapMode !== null && swapMode !== index && (
                <div className="absolute inset-0 bg-amber-500/10 border-2 border-dashed border-amber-500/50 rounded-lg flex items-center justify-center">
                  <span className="px-3 py-1.5 rounded-full bg-amber-500/80 text-white text-xs font-medium">
                    Click to swap
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Camera Selector Modal */}
      {showCameraSelector !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12121c] rounded-xl border border-white/10 p-4 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Select Camera</h3>
              <button
                onClick={() => setShowCameraSelector(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CAMERAS.map((camera) => (
                <CameraThumbnail
                  key={camera.id}
                  cameraId={camera.id}
                  isSelected={config.cameras[showCameraSelector] === camera.id}
                  onClick={() => handleCameraChange(showCameraSelector, camera.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Layout Icons
// ============================================

function LayoutIcon({ layout }: { layout: LayoutId }) {
  switch (layout) {
    case 'single':
      return (
        <div className="w-4 h-3 border border-current rounded-sm" />
      );
    case 'dual-h':
      return (
        <div className="w-4 h-3 flex gap-0.5">
          <div className="flex-1 border border-current rounded-sm" />
          <div className="flex-1 border border-current rounded-sm" />
        </div>
      );
    case 'dual-v':
      return (
        <div className="w-4 h-3 flex flex-col gap-0.5">
          <div className="flex-1 border border-current rounded-sm" />
          <div className="flex-1 border border-current rounded-sm" />
        </div>
      );
    case 'quad':
      return (
        <div className="w-4 h-3 grid grid-cols-2 gap-0.5">
          <div className="border border-current rounded-sm" />
          <div className="border border-current rounded-sm" />
          <div className="border border-current rounded-sm" />
          <div className="border border-current rounded-sm" />
        </div>
      );
    case 'pip':
      return (
        <div className="w-4 h-3 border border-current rounded-sm relative">
          <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1 border border-current rounded-sm bg-current opacity-50" />
        </div>
      );
    default:
      return null;
  }
}
