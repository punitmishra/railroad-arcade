'use client';

import { useState } from 'react';
import {
  CameraIcon, ShareIcon, MaximizeIcon, VolumeIcon,
  SettingsIcon, WifiIcon
} from './icons';

export function StreamingPanel() {
  const [isMuted, setIsMuted] = useState(false);
  const [streamQuality, setStreamQuality] = useState<'1080p' | '720p' | '480p'>('720p');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    const videoContainer = document.getElementById('stream-container');
    if (videoContainer) {
      if (!document.fullscreenElement) {
        videoContainer.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Railroad Arcade Live',
      text: 'Watch the HO Scale Model Railroad live!',
      url: window.location.href,
    };

    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="bg-[#0c0c14] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-cyan-500/[0.08] to-purple-500/[0.08] border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/20">
            <CameraIcon size={22} className="text-cyan-400" />
          </div>
          <div>
            <h3
              className="font-semibold text-[15px] tracking-wide"
              style={{ fontFamily: 'Orbitron, system-ui, sans-serif' }}
            >
              Camera Stream
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">HO Scale Model Railroad</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Share */}
          <button
            onClick={handleShare}
            className="p-2.5 sm:p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white active:bg-white/10 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Share stream"
          >
            <ShareIcon size={18} />
          </button>

          {/* Settings */}
          <button
            className="p-2.5 sm:p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white active:bg-white/10 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Stream settings"
          >
            <SettingsIcon size={18} />
          </button>
        </div>
      </div>

      {/* Video Player */}
      <div id="stream-container" className="relative aspect-video bg-black">
        {/* Placeholder - will be replaced with actual camera feed */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <CameraIcon size={64} className="text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Camera Feed</p>
            <p className="text-xs text-gray-600 mt-1">Connect to Raspberry Pi to view live stream</p>
          </div>
        </div>

        {/* Quality Badge */}
        <div className="absolute top-4 right-4 px-2 py-1 rounded bg-black/60 text-[10px] font-mono text-white">
          {streamQuality}
        </div>

        {/* Video Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2.5 sm:p-2 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20 active:bg-white/30'}`}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                aria-pressed={isMuted}
              >
                <VolumeIcon size={20} />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs text-white/80">
                <WifiIcon size={14} className="text-gray-400" />
                <span>Waiting for connection...</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quality Selector */}
              <select
                value={streamQuality}
                onChange={(e) => setStreamQuality(e.target.value as typeof streamQuality)}
                className="px-2 sm:px-3 py-2 rounded-lg bg-white/10 text-xs text-white outline-none min-h-[44px]"
                aria-label="Stream quality"
              >
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
              </select>
              <button
                onClick={handleFullscreen}
                className="p-2.5 sm:p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 active:bg-white/30 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Toggle fullscreen"
              >
                <MaximizeIcon size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stream Info */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm">Railroad Camera Feed</h4>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-500" />
                Offline
              </span>
              <span>Connect Pi to start streaming</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
