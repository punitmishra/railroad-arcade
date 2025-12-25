// ============================================
// Camera Configuration for Railroad Arcade
// ============================================
// Defines camera positions, stream URLs, and
// multi-view layouts.

// ============================================
// Camera Definitions
// ============================================

export type StreamType = 'mjpeg' | 'hls' | 'webrtc' | 'placeholder';

export interface CameraConfig {
  id: string;
  name: string;
  description: string;
  streamUrl: string;
  thumbnailUrl?: string;
  position: CameraPosition;
  level: number;
  isPrimary?: boolean;
  streamType?: StreamType;
}

export type CameraPosition = 'overhead' | 'station' | 'tunnel' | 'junction' | 'scenic';

export const CAMERAS: CameraConfig[] = [
  {
    id: 'overhead',
    name: 'Overhead',
    description: 'Full layout view from above',
    streamUrl: '/api/stream/overhead',
    position: 'overhead',
    level: 0,
    isPrimary: true,
    streamType: 'mjpeg',
  },
  {
    id: 'grand-central',
    name: 'Grand Central',
    description: 'Level 2 main station',
    streamUrl: '/api/stream/station-gc',
    position: 'station',
    level: 2,
    streamType: 'mjpeg',
  },
  {
    id: 'valley-station',
    name: 'Valley Station',
    description: 'Level 1 station platform',
    streamUrl: '/api/stream/station-vs',
    position: 'station',
    level: 1,
    streamType: 'mjpeg',
  },
  {
    id: 'tunnel-east',
    name: 'Tunnel View',
    description: 'Mountain tunnel entrance',
    streamUrl: '/api/stream/tunnel',
    position: 'tunnel',
    level: 1,
    streamType: 'mjpeg',
  },
  {
    id: 'junction',
    name: 'Junction Cam',
    description: 'Main track junction',
    streamUrl: '/api/stream/junction',
    position: 'junction',
    level: 2,
    streamType: 'mjpeg',
  },
  {
    id: 'scenic',
    name: 'Scenic View',
    description: 'Town and scenery',
    streamUrl: '/api/stream/scenic',
    position: 'scenic',
    level: 0,
    streamType: 'mjpeg',
  },
];

// ============================================
// Camera Layouts
// ============================================

export type LayoutId = 'single' | 'dual-h' | 'dual-v' | 'quad' | 'pip';

export interface CameraLayout {
  id: LayoutId;
  name: string;
  slots: number;
  gridClass: string;
  description: string;
}

export const CAMERA_LAYOUTS: CameraLayout[] = [
  {
    id: 'single',
    name: 'Single',
    slots: 1,
    gridClass: 'grid-cols-1',
    description: 'Full screen single camera',
  },
  {
    id: 'dual-h',
    name: 'Side by Side',
    slots: 2,
    gridClass: 'grid-cols-2',
    description: 'Two cameras horizontal',
  },
  {
    id: 'dual-v',
    name: 'Stacked',
    slots: 2,
    gridClass: 'grid-cols-1 grid-rows-2',
    description: 'Two cameras vertical',
  },
  {
    id: 'quad',
    name: 'Quad View',
    slots: 4,
    gridClass: 'grid-cols-2 grid-rows-2',
    description: 'Four camera grid',
  },
  {
    id: 'pip',
    name: 'Picture in Picture',
    slots: 2,
    gridClass: 'relative',
    description: 'Main view with small overlay',
  },
];

// ============================================
// Helper Functions
// ============================================

export function getCameraById(id: string): CameraConfig | undefined {
  return CAMERAS.find((cam) => cam.id === id);
}

export function getCamerasByLevel(level: number): CameraConfig[] {
  return CAMERAS.filter((cam) => cam.level === level || cam.level === 0);
}

export function getPrimaryCamera(): CameraConfig {
  return CAMERAS.find((cam) => cam.isPrimary) ?? CAMERAS[0];
}

export function getLayoutById(id: LayoutId): CameraLayout | undefined {
  return CAMERA_LAYOUTS.find((layout) => layout.id === id);
}

// ============================================
// Stream URL Builder
// ============================================

export interface StreamInfo {
  url: string;
  type: StreamType;
  isPlaceholder: boolean;
}

/**
 * Build the stream URL for a camera
 * Returns placeholder URL if no API URL is configured or in demo mode
 */
export function buildStreamUrl(cameraId: string): string {
  const info = getStreamInfo(cameraId);
  return info.url;
}

/**
 * Get complete stream information including type and placeholder status
 */
export function getStreamInfo(cameraId: string): StreamInfo {
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const camera = getCameraById(cameraId);

  if (!camera) {
    return { url: '', type: 'placeholder', isPlaceholder: true };
  }

  // Use placeholder if no API URL is configured
  if (!apiBase) {
    return {
      url: `/api/camera/placeholder?id=${cameraId}`,
      type: 'placeholder',
      isPlaceholder: true,
    };
  }

  return {
    url: `${apiBase}${camera.streamUrl}`,
    type: camera.streamType || 'mjpeg',
    isPlaceholder: false,
  };
}

/**
 * Check if live camera streams are available
 */
export function isLiveStreamAvailable(): boolean {
  return !!process.env.NEXT_PUBLIC_API_URL;
}

// ============================================
// Default Layout Configuration
// ============================================

export interface ViewConfig {
  layout: LayoutId;
  cameras: string[]; // Camera IDs for each slot
}

export const DEFAULT_VIEW_CONFIG: ViewConfig = {
  layout: 'single',
  cameras: ['overhead'],
};

export const PRESET_VIEWS: Record<string, ViewConfig> = {
  overview: {
    layout: 'single',
    cameras: ['overhead'],
  },
  stations: {
    layout: 'dual-h',
    cameras: ['grand-central', 'valley-station'],
  },
  action: {
    layout: 'pip',
    cameras: ['overhead', 'junction'],
  },
  all: {
    layout: 'quad',
    cameras: ['overhead', 'grand-central', 'valley-station', 'tunnel-east'],
  },
};
