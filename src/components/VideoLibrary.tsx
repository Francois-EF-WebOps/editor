import React from 'react';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { VideoRecord } from '@/src/types';

interface VideoLibraryProps {
  videos: VideoRecord[];
  statusFilter: 'all' | 'uploaded' | 'indexing' | 'indexed';
  activeVideo: string | null;
  onFilterChange: (filter: 'all' | 'uploaded' | 'indexing' | 'indexed') => void;
  onVideoSelect: (video: VideoRecord) => void;
}

export default function VideoLibrary({
  videos,
  statusFilter,
  activeVideo,
  onFilterChange,
  onVideoSelect,
}: VideoLibraryProps) {
  const filtered = videos.filter((v) => statusFilter === 'all' || v.status === statusFilter);

  return (
    <div className="bg-white border border-theme-line">
      <div className="flex items-center justify-between px-2 py-1 border-b border-theme-line bg-[#f0f0f0]">
        <div className="font-serif italic text-[11px] uppercase opacity-50">Library</div>
        <select
          value={statusFilter}
          onChange={(e) =>
            onFilterChange(e.target.value as 'all' | 'uploaded' | 'indexing' | 'indexed')
          }
          className="text-[9px] font-mono bg-transparent border-none outline-none uppercase cursor-pointer text-theme-ink"
        >
          <option value="all">All</option>
          <option value="uploaded">Uploaded</option>
          <option value="indexing">Indexing</option>
          <option value="indexed">Indexed</option>
        </select>
      </div>
      <div className="p-2">
        <ScrollArea className="h-[200px]">
          <div className="space-y-1">
            {filtered.map((video) => (
              <div
                key={video.id}
                className={`flex items-center justify-between p-1.5 hover:bg-theme-ink hover:text-white cursor-pointer text-[13px] font-medium transition-colors ${
                  activeVideo === video.id ? 'bg-theme-ink text-white' : ''
                }`}
                onClick={() => onVideoSelect(video)}
              >
                <span className="truncate max-w-[120px]" title={video.original_name}>
                  {video.original_name}
                </span>
                {video.status === 'uploaded' && (
                  <span className="text-[9px] font-mono uppercase opacity-50">Uploaded</span>
                )}
                {video.status === 'indexing' && (
                  <span className="text-[9px] font-mono uppercase text-theme-accent">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> Indexing
                  </span>
                )}
                {video.status === 'indexed' && (
                  <span className="text-[9px] font-mono uppercase text-green-600">Indexed</span>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-[11px] opacity-50 text-center py-4">
                {videos.length === 0
                  ? 'No videos uploaded yet.'
                  : 'No videos match the selected filter.'}
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
