'use client';

import { useState } from 'react';
import { useCameraControls } from '@/hooks/useArcadeInput';
import { CAMERAS, CAMERA_LAYOUTS, LayoutId, getCameraById } from '@/lib/camera-config';

// ============================================
// Kiosk Camera View Component
// ============================================
// Touch-optimized camera viewing for arcade cabinet

interface KioskCameraViewProps {
  initialCamera?: string;
  initialLayout?: LayoutId;
  showControls?: boolean;
}

export function KioskCameraView({
  initialCamera = 'overhead',
  initialLayout = 'single',
  showControls = true,
}: KioskCameraViewProps) {
  const [layout, setLayout] = useState<LayoutId>(initialLayout);
  const [cameras, setCameras] = useState<string[]>([initialCamera]);
  const cameraIds = CAMERAS.map((c) => c.id);

  // Arcade input for camera switching
  const currentCamera = useCameraControls(cameraIds, (cameraId) => {
    if (layout === 'single') {
      setCameras([cameraId]);
    }
  });

  const handleCameraSelect = (index: number, cameraId: string) => {
    const newCameras = [...cameras];
    newCameras[index] = cameraId;
    setCameras(newCameras);
  };

  const handleLayoutChange = (newLayout: LayoutId) => {
    setLayout(newLayout);
    const layoutConfig = CAMERA_LAYOUTS.find((l) => l.id === newLayout);
    if (!layoutConfig) return;

    // Adjust cameras array to match layout slots
    let newCameras = [...cameras];
    while (newCameras.length < layoutConfig.slots) {
      const availableCamera = CAMERAS.find((c) => !newCameras.includes(c.id));
      newCameras.push(availableCamera?.id ?? CAMERAS[0].id);
    }
    newCameras = newCameras.slice(0, layoutConfig.slots);
    setCameras(newCameras);
  };

  const layoutConfig = CAMERA_LAYOUTS.find((l) => l.id === layout);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Camera Feed Area */}
      <div className="flex-1 relative">
        {layout === 'pip' ? (
          // Picture-in-Picture Layout
          <div className="absolute inset-0">
            <CameraFeedKiosk cameraId={cameras[0]} />
            {cameras[1] && (
              <div className="absolute bottom-4 right-4 w-1/4 aspect-video rounded-lg overflow-hidden border-2 border-white/20 shadow-xl">
                <CameraFeedKiosk cameraId={cameras[1]} />
              </div>
            )}
          </div>
        ) : (
          // Grid Layouts
          <div className={`absolute inset-0 grid gap-1 ${layoutConfig?.gridClass}`}>
            {cameras.map((cameraId, index) => (
              <div key={`feed-${index}`} className="relative">
                <CameraFeedKiosk cameraId={cameraId} />
                {showControls && (
                  <CameraSelector
                    currentCamera={cameraId}
                    onSelect={(id) => handleCameraSelect(index, id)}
                    position={index}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Layout Controls */}
      {showControls && (
        <div className="p-4 bg-[#0a0a0f]/95 border-t border-white/10">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-gray-500 mr-2">Layout:</span>
            {CAMERA_LAYOUTS.map((l) => (
              <button
                key={l.id}
                onClick={() => handleLayoutChange(l.id)}
                className={`p-3 rounded-lg transition-all ${
                  layout === l.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
                title={l.name}
              >
                <KioskLayoutIcon layout={l.id} />
              </button>
            ))}
          </div>
          <div className="text-center mt-2 text-xs text-gray-600">
            [ / ]: Switch Camera • F1-F4: Direct Camera Select
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Kiosk Camera Feed Component
// ============================================

interface CameraFeedKioskProps {
  cameraId: string;
}

function CameraFeedKiosk({ cameraId }: CameraFeedKioskProps) {
  const camera = getCameraById(cameraId);

  if (!camera) {
    return (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <span className="text-gray-500">Camera not found</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      {/* Simulated feed */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center opacity-40">
          <svg className="w-20 h-20 mx-auto mb-3 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <div className="text-2xl text-gray-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {camera.name}
          </div>
          <div className="text-sm text-gray-600 mt-1">Live Feed</div>
        </div>
      </div>

      {/* Scan lines effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />

      {/* Camera Label */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <span className="px-3 py-1.5 rounded bg-black/60 backdrop-blur-sm text-sm text-white font-medium">
          {camera.name}
        </span>
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
      </div>

      {/* Camera info */}
      <div className="absolute bottom-3 left-3 text-xs text-gray-400 bg-black/40 px-2 py-1 rounded">
        Level {camera.level} • {camera.position}
      </div>
    </div>
  );
}

// ============================================
// Camera Selector Overlay
// ============================================

interface CameraSelectorProps {
  currentCamera: string;
  onSelect: (cameraId: string) => void;
  position: number;
}

function CameraSelector({ currentCamera, onSelect, position }: CameraSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 text-white opacity-50 hover:opacity-100 transition-opacity"
        title="Change Camera"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* Camera selection overlay */}
      {isOpen && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="p-4 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-medium">Select Camera</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CAMERAS.map((camera) => (
                <button
                  key={camera.id}
                  onClick={() => {
                    onSelect(camera.id);
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-lg text-left transition-all ${
                    currentCamera === camera.id
                      ? 'bg-cyan-500/20 border-2 border-cyan-500/50'
                      : 'bg-white/5 border-2 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="font-medium text-white text-sm">{camera.name}</div>
                  <div className="text-xs text-gray-500">{camera.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// Layout Icons
// ============================================

function KioskLayoutIcon({ layout }: { layout: LayoutId }) {
  const size = 'w-6 h-5';

  switch (layout) {
    case 'single':
      return <div className={`${size} border-2 border-current rounded`} />;
    case 'dual-h':
      return (
        <div className={`${size} flex gap-0.5`}>
          <div className="flex-1 border-2 border-current rounded" />
          <div className="flex-1 border-2 border-current rounded" />
        </div>
      );
    case 'dual-v':
      return (
        <div className={`${size} flex flex-col gap-0.5`}>
          <div className="flex-1 border-2 border-current rounded" />
          <div className="flex-1 border-2 border-current rounded" />
        </div>
      );
    case 'quad':
      return (
        <div className={`${size} grid grid-cols-2 gap-0.5`}>
          <div className="border border-current rounded" />
          <div className="border border-current rounded" />
          <div className="border border-current rounded" />
          <div className="border border-current rounded" />
        </div>
      );
    case 'pip':
      return (
        <div className={`${size} border-2 border-current rounded relative`}>
          <div className="absolute bottom-0.5 right-0.5 w-2 h-1.5 border border-current rounded bg-current opacity-50" />
        </div>
      );
    default:
      return null;
  }
}
