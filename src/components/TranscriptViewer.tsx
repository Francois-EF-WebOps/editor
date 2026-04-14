import React, { useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { VideoRecord } from '@/src/types';

interface TranscriptViewerProps {
  activeVideo: string | null;
  videos: VideoRecord[];
  onTimestampClick: (time: number) => void;
}

export default function TranscriptViewer({
  activeVideo,
  videos,
  onTimestampClick,
}: TranscriptViewerProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const transcripts = videos.find((v) => v.id === activeVideo)?.indexData?.transcripts || [];
  const objects = videos.find((v) => v.id === activeVideo)?.indexData?.objects || [];
  const hasIndexData = videos.some((v) => v.id === activeVideo && v.indexData);

  const transcriptVirtualizer = useVirtualizer({
    count: transcripts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 30,
    overscan: 5,
  });

  return (
    <>
      {/* Transcript */}
      <div className="bg-white border border-theme-line">
        <div className="font-serif italic text-[11px] px-2 py-1 border-b border-theme-line bg-[#f0f0f0] uppercase opacity-50">
          Transcript
        </div>
        <ScrollArea className="h-[300px]">
          <div ref={parentRef} style={{ height: '300px', overflow: 'auto' }}>
            <div
              style={{
                height: `${transcriptVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {transcriptVirtualizer.getVirtualItems().map((virtualRow) => {
                const t = transcripts[virtualRow.index];
                return (
                  <div
                    key={virtualRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="text-[11px] leading-tight border-l-2 border-transparent hover:border-theme-accent pl-1.5 cursor-pointer py-1 hover:bg-[#fffcf0]"
                    onClick={() => onTimestampClick(t.start)}
                  >
                    <span className="font-mono text-theme-accent mr-2">[{t.start}s]</span>
                    {t.text}
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
        {!hasIndexData && activeVideo && (
          <p className="text-[10px] opacity-50 text-center py-4 uppercase font-mono">
            No index data available
          </p>
        )}
      </div>

      {/* Detected Objects */}
      <div className="bg-white border border-theme-line">
        <div className="font-serif italic text-[11px] px-2 py-1 border-b border-theme-line bg-[#f0f0f0] uppercase opacity-50">
          Detected Objects
        </div>
        <ScrollArea className="h-[200px]">
          <div className="p-2 flex flex-wrap gap-1">
            {objects.map((o, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="text-[9px] font-mono rounded-none border-theme-line cursor-pointer hover:border-theme-accent hover:text-theme-accent"
                onClick={() => onTimestampClick(o.start)}
              >
                {o.label} ({o.start}s)
              </Badge>
            ))}
            {!hasIndexData && activeVideo && (
              <p className="text-[10px] opacity-50 text-center py-4 uppercase font-mono w-full">
                No objects detected
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
