'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getCameraById, getStreamInfo, StreamType } from '@/lib/camera-config';

// ============================================
// Camera Feed Component
// ============================================

interface CameraFeedProps {
  cameraId: string;
  onSnapshot?: () => void;
  showControls?: boolean;
  className?: string;
}

type StreamStatus = 'connecting' | 'connected' | 'error' | 'placeholder';

export function CameraFeed({ cameraId, onSnapshot, showControls = true, className = '' }: CameraFeedProps) {
  const camera = getCameraById(cameraId);
  const streamInfo = getStreamInfo(cameraId);
  const [status, setStatus] = useState<StreamStatus>('connecting');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const maxRetries = 3;

  // Handle stream connection
  useEffect(() => {
    setStatus('connecting');
    setRetryCount(0);

    if (streamInfo.isPlaceholder) {
      // Simulate loading for placeholder mode
      const timer = setTimeout(() => setStatus('placeholder'), 800);
      return () => clearTimeout(timer);
    }

    // For real streams, we'll try to connect
    const timer = setTimeout(() => {
      // Give the image time to load
      if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
        setStatus('connected');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [cameraId, streamInfo.isPlaceholder]);

  // Handle image load/error for MJPEG streams
  const handleImageLoad = useCallback(() => {
    setStatus('connected');
    setRetryCount(0);
  }, []);

  const handleImageError = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1);
      // Retry after a delay
      setTimeout(() => {
        if (imgRef.current) {
          imgRef.current.src = `${streamInfo.url}?retry=${retryCount + 1}&t=${Date.now()}`;
        }
      }, 2000);
    } else {
      setStatus('error');
    }
  }, [retryCount, streamInfo.url]);

  const isLoading = status === 'connecting';
  const hasError = status === 'error';

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  if (!camera) {
    return (
      <div className={`bg-[#0a0a0f] rounded-lg flex items-center justify-center ${className}`}>
        <span className="text-gray-500">Camera not found</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-[#0a0a0f] rounded-lg overflow-hidden group ${className}`}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Connecting to {camera.name}...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]">
          <div className="text-center">
            <div className="text-red-400 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span className="text-sm text-gray-500">Camera offline</span>
            <button
              onClick={() => {
                setRetryCount(0);
                setStatus('connecting');
              }}
              className="mt-2 px-3 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Real MJPEG Stream (when API is configured) */}
      {!isLoading && !hasError && !streamInfo.isPlaceholder && (
        <div className="aspect-video bg-black relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={streamInfo.url}
            alt={`${camera?.name || 'Camera'} live feed`}
            className="w-full h-full object-contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {/* Status indicator */}
          {status === 'connected' && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </div>
          )}
        </div>
      )}

      {/* Placeholder/Demo Mode */}
      {!isLoading && !hasError && streamInfo.isPlaceholder && (
        <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          {/* Simulated camera feed pattern */}
          <div className="relative w-full h-full">
            {/* Noise overlay */}
            <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOCIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiLz48L3N2Zz4=')]" />

            {/* Camera info overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center opacity-30">
                <svg className="w-16 h-16 mx-auto mb-2 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <div className="text-lg text-gray-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {camera?.name || 'Camera'}
                </div>
                <div className="text-xs text-gray-600 mt-1">Demo Mode</div>
              </div>
            </div>

            {/* Scan lines effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />
          </div>
        </div>
      )}

      {/* Camera Label */}
      <div className="absolute top-2 left-2 flex items-center gap-2">
        <span className="px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-xs text-white">
          {camera.name}
        </span>
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Live" />
      </div>

      {/* Controls - always visible on mobile, hover on desktop */}
      {showControls && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {onSnapshot && (
            <button
              onClick={onSnapshot}
              className="p-2.5 sm:p-2 rounded-lg bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 active:bg-black/90 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              title="Take Snapshot"
              aria-label="Take snapshot"
            >
              <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 sm:p-2 rounded-lg bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 active:bg-black/90 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Camera Thumbnail Component
// ============================================

interface CameraThumbnailProps {
  cameraId: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function CameraThumbnail({ cameraId, isSelected, onClick }: CameraThumbnailProps) {
  const camera = getCameraById(cameraId);

  if (!camera) return null;

  return (
    <button
      onClick={onClick}
      className={`
        relative aspect-video rounded-lg overflow-hidden border-2 transition-all
        ${isSelected
          ? 'border-cyan-500 ring-2 ring-cyan-500/30'
          : 'border-white/10 hover:border-white/30'
        }
      `}
    >
      {/* Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>

      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/80 to-transparent">
        <span className="text-[10px] text-white truncate block">{camera.name}</span>
      </div>
    </button>
  );
}
