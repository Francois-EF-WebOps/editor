import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useCallback } from 'react';
import type { SearchResult } from '@/src/types';

interface SearchPanelProps {
  searchQuery: string;
  searchResults: SearchResult[];
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  onResultClick: (result: SearchResult) => void;
}

export default function SearchPanel({
  searchQuery,
  searchResults,
  onQueryChange,
  onSearch,
  onResultClick,
}: SearchPanelProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: searchResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70,
    overscan: 5,
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') onSearch();
    },
    [onSearch],
  );

  return (
    <div className="bg-white border border-theme-line">
      <div className="font-serif italic text-[11px] px-2 py-1 border-b border-theme-line bg-[#f0f0f0] uppercase opacity-50">
        Search Index
      </div>
      <div className="p-2">
        <div className="flex space-x-2">
          <Input
            placeholder="e.g. 'basketball'"
            value={searchQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-theme-bg border-theme-line text-theme-ink font-mono text-xs rounded-none h-8"
          />
          <Button
            onClick={onSearch}
            variant="secondary"
            className="bg-theme-ink hover:bg-black text-white rounded-none h-8 px-3"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {searchResults.length > 0 && (
          <ScrollArea className="h-[300px] mt-2">
            <div ref={parentRef} style={{ height: '300px', overflow: 'auto' }}>
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const result = searchResults[virtualRow.index];
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
                      className="p-2 bg-white border-l-2 border-transparent hover:border-theme-accent hover:bg-[#fffcf0] cursor-pointer transition-colors"
                      onClick={() => onResultClick(result)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge
                          variant="outline"
                          className="text-[9px] text-theme-ink border-theme-line font-mono rounded-none px-1 py-0 uppercase"
                        >
                          {result.type}
                        </Badge>
                        <span className="text-[9px] font-mono opacity-40">
                          [{result.start}s - {result.end}s]
                        </span>
                      </div>
                      <p className="text-[11px] text-theme-ink leading-tight">
                        &quot;{result.match}&quot;
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
