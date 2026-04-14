import React, { useRef } from 'react';
import { Play, Scissors, Loader2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { VideoRecord } from '@/src/types';

interface VideoPlayerProps {
  activeVideo: string | null;
  activeVideoFilename: string | null;
  videos: VideoRecord[];
  clipStart: number;
  clipEnd: number;
  clipping: boolean;
  clipJobId: string | null;
  clipJobStatus: string | null;
  clipUrl: string | null;
  onClipStartChange: (v: number) => void;
  onClipEndChange: (v: number) => void;
  onGenerateClip: () => void;
  onVideoReady: (videoEl: HTMLVideoElement) => void;
}

export default function VideoPlayer({
  activeVideo,
  activeVideoFilename,
  videos,
  clipStart,
  clipEnd,
  clipping,
  clipJobId,
  clipJobStatus,
  clipUrl,
  onClipStartChange,
  onClipEndChange,
  onGenerateClip,
  onVideoReady,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current) onVideoReady(videoRef.current);
  }, [onVideoReady]);

  return (
    <div className="bg-white border border-theme-line flex flex-col">
      <div
        className="relative bg-black flex items-center justify-center overflow-hidden"
        style={{ minHeight: '400px' }}
      >
        {activeVideoFilename ? (
          <video
            ref={videoRef}
            src={`/uploads/${activeVideoFilename}`}
            controls
            className="w-full h-full object-contain opacity-90"
          />
        ) : (
          <div className="text-white/50 flex flex-col items-center font-mono text-[10px] tracking-widest uppercase">
            <Play className="w-8 h-8 mb-2 opacity-50" />
            <p>Select a search result to preview</p>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-10 bg-black/80 flex items-center px-4 gap-4 text-white font-mono text-[10px]">
          <span>{activeVideoFilename || 'NO_VIDEO_SELECTED'}</span>
          <span className="opacity-50">|</span>
          <span>[HD]</span>
          <span className="opacity-50">|</span>
          <span>OBJ_DET: ON</span>
        </div>
      </div>

      <div className="p-4 bg-theme-bg border-t border-theme-line">
        <div className="flex items-center justify-between mb-4">
          <div className="font-serif italic text-[11px] uppercase opacity-50">Clip Editor</div>
          <Button
            onClick={onGenerateClip}
            disabled={!activeVideo || clipping}
            className="bg-theme-accent hover:bg-orange-600 text-white border border-theme-line rounded-none font-bold text-[11px] uppercase h-8"
          >
            {clipping ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Scissors className="mr-2 h-4 w-4" />
            )}
            Export Clip
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[9px] uppercase font-bold border-r border-theme-line pr-2 mr-2">
              Start Time (s)
            </label>
            <Input
              type="number"
              value={clipStart}
              onChange={(e) => onClipStartChange(Number(e.target.value))}
              className="bg-white border-theme-line text-theme-ink font-mono text-xs rounded-none h-8 inline-block w-24"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase font-bold border-r border-theme-line pr-2 mr-2">
              End Time (s)
            </label>
            <Input
              type="number"
              value={clipEnd}
              onChange={(e) => onClipEndChange(Number(e.target.value))}
              className="bg-white border-theme-line text-theme-ink font-mono text-xs rounded-none h-8 inline-block w-24"
            />
          </div>
        </div>

        {clipping && (
          <div className="p-2 bg-white border border-theme-line flex items-center justify-between mb-2">
            <span className="text-yellow-600 text-[11px] font-bold uppercase flex items-center">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
              Generating clip...
            </span>
          </div>
        )}

        {clipJobStatus === 'failed' && (
          <div className="p-2 bg-white border border-theme-line flex items-center justify-between mb-2">
            <span className="text-red-500 text-[11px] font-bold uppercase flex items-center">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
              Clip generation failed
            </span>
          </div>
        )}

        {clipUrl && (
          <div className="p-2 bg-white border border-theme-line flex items-center justify-between">
            <span className="text-green-600 text-[11px] font-bold uppercase flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span> Clip generated
            </span>
            <a
              href={clipUrl}
              download
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className:
                  'border-theme-line text-theme-ink rounded-none h-6 text-[10px] uppercase font-bold',
              })}
            >
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
