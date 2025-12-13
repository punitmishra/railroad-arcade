'use client';

import { useState, useEffect } from 'react';
import {
  CameraIcon, DownloadIcon, TrashIcon, HeartIcon, ShareIcon,
  GridIcon, LayersIcon, CloseIcon, ZoomInIcon, FilterIcon,
  CalendarIcon, TrainIcon, SparklesIcon, ImageIcon
} from './icons';

interface Snapshot {
  id: string;
  timestamp: Date;
  thumbnail: string;
  fullUrl: string;
  camera: string;
  trainId?: string;
  trainName?: string;
  level: 1 | 2;
  liked: boolean;
  tags: string[];
  description?: string;
}

interface SnapshotGalleryProps {
  onCapture?: () => void;
}

export function SnapshotGallery({ onCapture }: SnapshotGalleryProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [filter, setFilter] = useState<'all' | 'liked' | 'level1' | 'level2'>('all');
  const [isCapturing, setIsCapturing] = useState(false);

  // Sample snapshots data
  const [snapshots, setSnapshots] = useState<Snapshot[]>([
    {
      id: 'snap-1',
      timestamp: new Date(Date.now() - 3600000),
      thumbnail: '/api/placeholder/300/200',
      fullUrl: '/api/placeholder/1920/1080',
      camera: 'Overhead Cam',
      trainId: 'T1',
      trainName: 'Valley Runner',
      level: 2,
      liked: true,
      tags: ['station', 'arrival'],
      description: 'Valley Runner arriving at Grand Central'
    },
    {
      id: 'snap-2',
      timestamp: new Date(Date.now() - 7200000),
      thumbnail: '/api/placeholder/300/200',
      fullUrl: '/api/placeholder/1920/1080',
      camera: 'Platform Cam',
      trainId: 'T3',
      trainName: 'Mountain Express',
      level: 1,
      liked: false,
      tags: ['tunnel', 'scenic'],
      description: 'Mountain Express entering Tunnel A'
    },
    {
      id: 'snap-3',
      timestamp: new Date(Date.now() - 14400000),
      thumbnail: '/api/placeholder/300/200',
      fullUrl: '/api/placeholder/1920/1080',
      camera: 'Scenic Cam',
      level: 2,
      liked: true,
      tags: ['crossing', 'night'],
      description: 'Night scene at Pine Road crossing'
    },
    {
      id: 'snap-4',
      timestamp: new Date(Date.now() - 28800000),
      thumbnail: '/api/placeholder/300/200',
      fullUrl: '/api/placeholder/1920/1080',
      camera: 'Overhead Cam',
      trainId: 'T2',
      trainName: 'City Limited',
      level: 2,
      liked: false,
      tags: ['junction', 'switch'],
      description: 'City Limited at East Switch junction'
    },
  ]);

  const handleCapture = async () => {
    setIsCapturing(true);
    // Simulate capture delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newSnapshot: Snapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date(),
      thumbnail: '/api/placeholder/300/200',
      fullUrl: '/api/placeholder/1920/1080',
      camera: 'Overhead Cam',
      level: Math.random() > 0.5 ? 1 : 2,
      liked: false,
      tags: ['new'],
      description: 'New capture'
    };
    
    setSnapshots(prev => [newSnapshot, ...prev]);
    setIsCapturing(false);
    onCapture?.();
  };

  const toggleLike = (id: string) => {
    setSnapshots(prev => prev.map(s => 
      s.id === id ? { ...s, liked: !s.liked } : s
    ));
  };

  const deleteSnapshot = (id: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
    if (selectedSnapshot?.id === id) {
      setSelectedSnapshot(null);
    }
  };

  const filteredSnapshots = snapshots.filter(s => {
    if (filter === 'liked') return s.liked;
    if (filter === 'level1') return s.level === 1;
    if (filter === 'level2') return s.level === 2;
    return true;
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 24) return date.toLocaleDateString();
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="bg-[#0c0c14] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-pink-500/[0.08] to-purple-500/[0.08] border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center border border-pink-500/20">
            <CameraIcon size={22} className="text-pink-400" />
          </div>
          <div>
            <h3 
              className="font-semibold text-[15px] tracking-wide"
              style={{ fontFamily: 'Orbitron, system-ui, sans-serif' }}
            >
              Snapshot Gallery
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{snapshots.length} captures • {snapshots.filter(s => s.liked).length} liked</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Capture Button */}
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all
              ${isCapturing 
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90'
              }
            `}
          >
            {isCapturing ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Capturing...
              </>
            ) : (
              <>
                <CameraIcon size={16} />
                Capture
              </>
            )}
          </button>

          {/* View Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button
              onClick={() => setView('grid')}
              className={`p-2 ${view === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5'}`}
            >
              <GridIcon size={16} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 ${view === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5'}`}
            >
              <LayersIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-5 py-3 bg-black/20 border-b border-white/[0.04] overflow-x-auto">
        {[
          { id: 'all', label: 'All', count: snapshots.length },
          { id: 'liked', label: '❤️ Liked', count: snapshots.filter(s => s.liked).length },
          { id: 'level1', label: 'Level 1', count: snapshots.filter(s => s.level === 1).length },
          { id: 'level2', label: 'Level 2', count: snapshots.filter(s => s.level === 2).length },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as typeof filter)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
              ${filter === f.id 
                ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30' 
                : 'text-gray-400 hover:bg-white/5 border border-transparent'
              }
            `}
          >
            {f.label}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Gallery Content */}
      <div className="p-4">
        {filteredSnapshots.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No snapshots yet</p>
            <p className="text-xs text-gray-600">Capture your first moment!</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredSnapshots.map(snapshot => (
              <div
                key={snapshot.id}
                className="group relative aspect-video rounded-xl overflow-hidden bg-gray-800 cursor-pointer"
                onClick={() => setSelectedSnapshot(snapshot)}
              >
                {/* Placeholder Image */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                  <TrainIcon size={32} className="text-gray-600" />
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                  <div className="text-xs font-medium truncate">{snapshot.description || 'Untitled'}</div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-2">
                    <span>{formatTime(snapshot.timestamp)}</span>
                    <span>•</span>
                    <span>L{snapshot.level}</span>
                  </div>
                </div>

                {/* Like Badge */}
                {snapshot.liked && (
                  <div className="absolute top-2 right-2">
                    <HeartIcon size={16} className="text-pink-500 fill-pink-500" />
                  </div>
                )}

                {/* Level Badge */}
                <div 
                  className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold"
                  style={{
                    backgroundColor: snapshot.level === 1 ? 'rgba(168,85,247,0.8)' : 'rgba(14,165,233,0.8)'
                  }}
                >
                  L{snapshot.level}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSnapshots.map(snapshot => (
              <div
                key={snapshot.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all cursor-pointer"
                onClick={() => setSelectedSnapshot(snapshot)}
              >
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 flex items-center justify-center">
                  <TrainIcon size={20} className="text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{snapshot.description || 'Untitled'}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>{snapshot.camera}</span>
                    {snapshot.trainName && (
                      <>
                        <span>•</span>
                        <span className="text-cyan-400">{snapshot.trainName}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{formatTime(snapshot.timestamp)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLike(snapshot.id); }}
                    className={`p-2 rounded-lg transition-all ${snapshot.liked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-400'}`}
                  >
                    <HeartIcon size={16} className={snapshot.liked ? 'fill-current' : ''} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSnapshot(snapshot.id); }}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-400 transition-all"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedSnapshot && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedSnapshot(null)}
        >
          <div 
            className="relative max-w-5xl w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedSnapshot(null)}
              className="absolute -top-12 right-0 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <CloseIcon size={20} />
            </button>

            {/* Image */}
            <div className="aspect-video rounded-2xl overflow-hidden bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <TrainIcon size={80} className="text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500">Image Preview</p>
              </div>
            </div>

            {/* Info Bar */}
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{selectedSnapshot.description || 'Untitled'}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                  <span>{selectedSnapshot.camera}</span>
                  {selectedSnapshot.trainName && (
                    <span className="text-cyan-400">🚂 {selectedSnapshot.trainName}</span>
                  )}
                  <span>{selectedSnapshot.timestamp.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleLike(selectedSnapshot.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl border transition-all
                    ${selectedSnapshot.liked 
                      ? 'bg-pink-500/20 border-pink-500/30 text-pink-400' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-pink-400'
                    }
                  `}
                >
                  <HeartIcon size={18} className={selectedSnapshot.liked ? 'fill-current' : ''} />
                  {selectedSnapshot.liked ? 'Liked' : 'Like'}
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
                  <DownloadIcon size={18} />
                  Download
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
                  <ShareIcon size={18} />
                  Share
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="flex gap-2 mt-4">
              {selectedSnapshot.tags.map(tag => (
                <span key={tag} className="px-2 py-1 rounded-lg bg-white/5 text-xs text-gray-400">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
