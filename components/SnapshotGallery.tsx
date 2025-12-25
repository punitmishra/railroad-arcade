'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  CameraIcon, DownloadIcon, TrashIcon, HeartIcon, ShareIcon,
  GridIcon, LayersIcon, CloseIcon, ImageIcon, TrainIcon
} from './icons';
import { useSnapshots, Snapshot, SnapshotFilter } from '@/hooks/useSnapshots';
import { useToast, SkeletonRow } from './ui';
import { useSounds } from '@/hooks/useSounds';

interface SnapshotGalleryProps {
  onCapture?: () => void;
  currentCamera?: string;
  currentTrainId?: string;
  currentTrainName?: string;
  currentLevel?: 1 | 2;
}

export function SnapshotGallery({
  onCapture,
  currentCamera = 'Overhead Cam',
  currentTrainId,
  currentTrainName,
  currentLevel = 1,
}: SnapshotGalleryProps) {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const { play: playSound } = useSounds();

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<SnapshotFilter>('all');
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const {
    snapshots,
    stats,
    isLoading,
    error,
    refresh,
    createSnapshot,
    toggleLike,
    deleteSnapshot,
  } = useSnapshots({ filter });

  // Capture new snapshot
  const handleCapture = useCallback(async () => {
    if (!session?.user) {
      addToast('error', 'Please sign in to capture snapshots');
      return;
    }

    setIsCapturing(true);
    playSound('camera');

    try {
      // In a real implementation, this would call the camera API to capture
      // For now, we create a placeholder snapshot
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      const snapshotUrl = apiBase
        ? `${apiBase}/api/camera/snapshot?camera=${encodeURIComponent(currentCamera)}&t=${Date.now()}`
        : `/api/camera/placeholder?camera=${encodeURIComponent(currentCamera)}`;

      const snapshot = await createSnapshot({
        url: snapshotUrl,
        camera: currentCamera,
        trainId: currentTrainId,
        trainName: currentTrainName,
        level: currentLevel,
        description: `Captured from ${currentCamera}`,
        tags: ['capture', `level${currentLevel}`],
      });

      if (snapshot) {
        playSound('success');
        addToast('success', 'Snapshot captured!');
        onCapture?.();
      } else {
        throw new Error('Failed to save snapshot');
      }
    } catch (err) {
      console.error('Capture failed:', err);
      playSound('error');
      addToast('error', 'Failed to capture snapshot');
    } finally {
      setIsCapturing(false);
    }
  }, [session, currentCamera, currentTrainId, currentTrainName, currentLevel, createSnapshot, playSound, addToast, onCapture]);

  // Handle like toggle
  const handleToggleLike = useCallback(async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const success = await toggleLike(id);
    if (success) {
      playSound('click');
      // Update selected snapshot if it's the one being liked
      if (selectedSnapshot?.id === id) {
        setSelectedSnapshot(prev => prev ? { ...prev, liked: !prev.liked } : null);
      }
    }
  }, [toggleLike, playSound, selectedSnapshot]);

  // Handle delete
  const handleDelete = useCallback(async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const success = await deleteSnapshot(id);
    if (success) {
      playSound('click');
      addToast('success', 'Snapshot deleted');
      if (selectedSnapshot?.id === id) {
        setSelectedSnapshot(null);
      }
    } else {
      addToast('error', 'Failed to delete snapshot');
    }
  }, [deleteSnapshot, playSound, addToast, selectedSnapshot]);

  // Handle download
  const handleDownload = useCallback(async (snapshot: Snapshot) => {
    try {
      const response = await fetch(snapshot.fullUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `railroad-snapshot-${snapshot.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      playSound('success');
      addToast('success', 'Snapshot downloaded!');
    } catch (err) {
      console.error('Download failed:', err);
      addToast('error', 'Failed to download snapshot');
    }
  }, [playSound, addToast]);

  // Handle share
  const handleShare = useCallback(async (snapshot: Snapshot) => {
    const shareText = `Check out this Railroad Arcade snapshot${snapshot.description ? `: ${snapshot.description}` : ''}`;
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Railroad Arcade Snapshot',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      addToast('success', 'Link copied to clipboard!');
    } catch {
      addToast('error', 'Failed to share');
    }
  }, [addToast]);

  // Format relative time
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

  // Filter counts for tabs
  const filterTabs = [
    { id: 'all' as const, label: 'All', count: stats.total },
    { id: 'liked' as const, label: 'Liked', count: stats.liked },
    { id: 'level1' as const, label: 'Level 1', count: stats.level1 },
    { id: 'level2' as const, label: 'Level 2', count: stats.level2 },
  ];

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
            <p className="text-xs text-gray-500 mt-0.5">
              {stats.total} captures {stats.liked > 0 && `• ${stats.liked} liked`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Capture Button */}
          <button
            onClick={handleCapture}
            disabled={isCapturing || !session}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all min-h-[44px]
              ${isCapturing
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                : !session
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90'
              }
            `}
            aria-label={!session ? 'Sign in to capture' : 'Capture snapshot'}
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
              className={`p-2 min-h-[36px] min-w-[36px] ${view === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5'}`}
              aria-label="Grid view"
              aria-pressed={view === 'grid'}
            >
              <GridIcon size={16} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 min-h-[36px] min-w-[36px] ${view === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5'}`}
              aria-label="List view"
              aria-pressed={view === 'list'}
            >
              <LayersIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-5 py-3 bg-black/20 border-b border-white/[0.04] overflow-x-auto">
        {filterTabs.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-h-[32px]
              ${filter === f.id
                ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                : 'text-gray-400 hover:bg-white/5 border border-transparent'
              }
            `}
          >
            {f.id === 'liked' && '❤️ '}{f.label}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Gallery Content */}
      <div className="p-4">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3" aria-label="Loading snapshots">
            {[1, 2, 3].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-3">Failed to load snapshots</p>
            <button
              onClick={() => refresh()}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && snapshots.length === 0 && (
          <div className="text-center py-16">
            <ImageIcon size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No snapshots yet</p>
            <p className="text-xs text-gray-600">
              {session ? 'Capture your first moment!' : 'Sign in to start capturing'}
            </p>
          </div>
        )}

        {/* Grid View */}
        {!isLoading && !error && snapshots.length > 0 && view === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="group relative aspect-video rounded-xl overflow-hidden bg-gray-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                onClick={() => setSelectedSnapshot(snapshot)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedSnapshot(snapshot)}
                tabIndex={0}
                role="button"
                aria-label={`View ${snapshot.description || 'snapshot'}`}
              >
                {/* Thumbnail or Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                  {snapshot.thumbnail && !snapshot.thumbnail.includes('placeholder') ? (
                    <img
                      src={snapshot.thumbnail}
                      alt={snapshot.description || 'Snapshot'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <TrainIcon size={32} className="text-gray-600" />
                  )}
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
                    backgroundColor: snapshot.level === 1 ? 'rgba(168,85,247,0.8)' : 'rgba(14,165,233,0.8)',
                  }}
                >
                  L{snapshot.level}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!isLoading && !error && snapshots.length > 0 && view === 'list' && (
          <div className="space-y-2">
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                onClick={() => setSelectedSnapshot(snapshot)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedSnapshot(snapshot)}
                tabIndex={0}
                role="button"
              >
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 flex items-center justify-center">
                  {snapshot.thumbnail && !snapshot.thumbnail.includes('placeholder') ? (
                    <img
                      src={snapshot.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <TrainIcon size={20} className="text-gray-600" />
                  )}
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
                    onClick={(e) => handleToggleLike(snapshot.id, e)}
                    className={`p-2 rounded-lg transition-all min-h-[36px] min-w-[36px] ${snapshot.liked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-400'}`}
                    aria-label={snapshot.liked ? 'Unlike' : 'Like'}
                  >
                    <HeartIcon size={16} className={snapshot.liked ? 'fill-current' : ''} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(snapshot.id, e)}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-400 transition-all min-h-[36px] min-w-[36px]"
                    aria-label="Delete snapshot"
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
          role="dialog"
          aria-modal="true"
          aria-label="Snapshot preview"
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedSnapshot(null)}
              className="absolute -top-12 right-0 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all min-h-[44px] min-w-[44px]"
              aria-label="Close preview"
            >
              <CloseIcon size={20} />
            </button>

            {/* Image */}
            <div className="aspect-video rounded-2xl overflow-hidden bg-gray-900 flex items-center justify-center">
              {selectedSnapshot.fullUrl && !selectedSnapshot.fullUrl.includes('placeholder') ? (
                <img
                  src={selectedSnapshot.fullUrl}
                  alt={selectedSnapshot.description || 'Snapshot'}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-center">
                  <TrainIcon size={80} className="text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">Image Preview</p>
                </div>
              )}
            </div>

            {/* Info Bar */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedSnapshot.description || 'Untitled'}</h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mt-1">
                  <span>{selectedSnapshot.camera}</span>
                  {selectedSnapshot.trainName && (
                    <span className="text-cyan-400">🚂 {selectedSnapshot.trainName}</span>
                  )}
                  <span>{selectedSnapshot.timestamp.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleLike(selectedSnapshot.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl border transition-all min-h-[44px]
                    ${selectedSnapshot.liked
                      ? 'bg-pink-500/20 border-pink-500/30 text-pink-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-pink-400'
                    }
                  `}
                  aria-pressed={selectedSnapshot.liked}
                >
                  <HeartIcon size={18} className={selectedSnapshot.liked ? 'fill-current' : ''} />
                  {selectedSnapshot.liked ? 'Liked' : 'Like'}
                </button>
                <button
                  onClick={() => handleDownload(selectedSnapshot)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all min-h-[44px]"
                >
                  <DownloadIcon size={18} />
                  Download
                </button>
                <button
                  onClick={() => handleShare(selectedSnapshot)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all min-h-[44px]"
                >
                  <ShareIcon size={18} />
                  Share
                </button>
              </div>
            </div>

            {/* Tags */}
            {selectedSnapshot.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedSnapshot.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-lg bg-white/5 text-xs text-gray-400">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
